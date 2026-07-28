/**
 * FrameworkApi — the ONE generic client for the Hanzo Framework DocType engine
 * (cloud `clients/framework`, live at /v1/framework/*). It is metadata-driven and
 * doctype-agnostic: the SAME `records` CRUD serves a CMS Page, an ERP Invoice, or
 * a Helpdesk Ticket — an app lane is just a `module` filter over `doctypes`.
 *
 * TRANSPORT IS INJECTED. This layer knows the framework's *shape*, never how a
 * given host reaches it: the console proxies through its own user-bearer BFF, the
 * site shells (erp/crm/cms/help.<brand>) call the API origin with the IAM bearer
 * directly. Both hand a `Transport` to `createFrameworkClient` and get the SAME
 * client, so there is exactly one definition of the wire surface.
 *
 * Names (DocType + document) are used verbatim in the URL path, so a host keeps
 * them slug-style (no spaces/`%`) and this encodes each segment. Payloads are read
 * defensively from `{ data }` (or a bare array), so a shape drift degrades a list
 * rather than throwing.
 */
import type { DocType, FrameworkDoc, ListQuery, ModuleInfo, InstallResult } from './types'

/**
 * The four verbs the framework surface needs, relative to the caller's
 * `/v1/framework` root. A host implements this over whatever credential path it
 * already owns — this layer never touches auth, cookies, or origins.
 */
export interface Transport {
  get: <T>(path: string) => Promise<T>
  post: <T>(path: string, body?: unknown) => Promise<T>
  put: <T>(path: string, body?: unknown) => Promise<T>
  del: (path: string) => Promise<void>
}

const enc = encodeURIComponent

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

/** Pull the first array under a common envelope key (the engine uses `data`). */
function rows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
  const o = asRecord(payload)
  for (const k of ['data', 'items', 'rows']) {
    if (Array.isArray(o[k])) return (o[k] as unknown[]).filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
  }
  return []
}

/** A framework document is already a flat map + envelope; keep it as-is (typed). */
const asDoc = (v: unknown): FrameworkDoc => asRecord(v) as FrameworkDoc
const asDocType = (v: unknown): DocType => {
  const r = asRecord(v)
  return { ...(r as object), name: String(r.name ?? ''), fields: Array.isArray(r.fields) ? (r.fields as DocType['fields']) : [] } as DocType
}

/** Build the generic document list querystring from a typed ListQuery. */
export function listQuery(q?: ListQuery): string {
  if (!q) return ''
  const p = new URLSearchParams()
  if (q.filters && Object.keys(q.filters).length) p.set('filters', JSON.stringify(q.filters))
  if (q.fields && q.fields.length) p.set('fields', q.fields.join(','))
  if (q.orderBy) p.set('order_by', q.orderBy)
  if (q.limit) p.set('limit', String(q.limit))
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Build the framework client over a host's transport. */
export function createFrameworkClient(t: Transport) {
  return {
    /** The DocType registry (schemas) — the collection definitions of every app lane. */
    doctypes: {
      list: (): Promise<DocType[]> => t.get<unknown>('doctypes').then((r) => rows(r).map(asDocType)),
      get: (name: string): Promise<DocType> => t.get<unknown>(`doctypes/${enc(name)}`).then(asDocType),
      create: (dt: DocType): Promise<DocType> => t.post<unknown>('doctypes', dt).then(asDocType),
      update: (name: string, dt: DocType): Promise<DocType> => t.put<unknown>(`doctypes/${enc(name)}`, dt).then(asDocType),
      remove: (name: string): Promise<void> => t.del(`doctypes/${enc(name)}`),
    },

    /** Generic, metadata-driven document CRUD — the SAME calls for ANY doctype. */
    records: {
      list: (doctype: string, q?: ListQuery): Promise<FrameworkDoc[]> =>
        t.get<unknown>(`${enc(doctype)}${listQuery(q)}`).then((r) => rows(r).map(asDoc)),
      get: (doctype: string, name: string): Promise<FrameworkDoc> =>
        t.get<unknown>(`${enc(doctype)}/${enc(name)}`).then(asDoc),
      create: (doctype: string, data: Record<string, unknown>): Promise<FrameworkDoc> =>
        t.post<unknown>(enc(doctype), data).then(asDoc),
      update: (doctype: string, name: string, data: Record<string, unknown>): Promise<FrameworkDoc> =>
        t.put<unknown>(`${enc(doctype)}/${enc(name)}`, data).then(asDoc),
      remove: (doctype: string, name: string): Promise<void> => t.del(`${enc(doctype)}/${enc(name)}`),
      submit: (doctype: string, name: string): Promise<FrameworkDoc> =>
        t.post<unknown>(`${enc(doctype)}/${enc(name)}/submit`).then(asDoc),
      cancel: (doctype: string, name: string): Promise<FrameworkDoc> =>
        t.post<unknown>(`${enc(doctype)}/${enc(name)}/cancel`).then(asDoc),
    },

    /** App-lane fixtures: list the registered lanes, inspect one, install into the org. */
    modules: {
      list: (): Promise<ModuleInfo[]> =>
        t.get<unknown>('modules').then((r) =>
          rows(r).map((m) => ({
            module: String(m.module ?? ''),
            doctypes: Array.isArray(m.doctypes) ? (m.doctypes as string[]) : [],
          })),
        ),
      get: (module: string): Promise<ModuleInfo> =>
        t.get<unknown>(`modules/${enc(module)}`).then((v) => {
          const r = asRecord(v)
          return {
            module: String(r.module ?? module),
            doctypes: Array.isArray(r.doctypes) ? (r.doctypes as string[]) : [],
            installed: Array.isArray(r.installed) ? (r.installed as string[]) : [],
          }
        }),
      install: (module: string): Promise<InstallResult> =>
        t.post<unknown>(`modules/${enc(module)}/install`).then((v) => {
          const r = asRecord(v)
          return {
            module: String(r.module ?? module),
            created: Array.isArray(r.created) ? (r.created as string[]) : [],
            existing: Array.isArray(r.existing) ? (r.existing as string[]) : [],
          }
        }),
    },

    /** Per-org role assignments (grant editors; the owner is seeded System Manager). */
    roles: {
      list: (): Promise<{ user: string; role: string }[]> =>
        t.get<unknown>('roles').then((r) => rows(r).map((x) => ({ user: String(x.user ?? ''), role: String(x.role ?? '') }))),
      assign: (user: string, role: string): Promise<void> => t.post('roles', { user, role }).then(() => undefined),
      revoke: (user: string, role: string): Promise<void> => t.del(`roles/${enc(user)}/${enc(role)}`),
    },
  }
}

export type FrameworkClient = ReturnType<typeof createFrameworkClient>

/** An HTTP failure carrying the status, so `classifyBackend` can tell 401 from 403 from 404. */
export class FrameworkHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'FrameworkHttpError'
  }
}

export interface FetchTransportOptions {
  /** Absolute `/v1/framework` root, e.g. `https://api.hanzo.ai/v1/framework`. */
  baseUrl: string
  /** Called per request — a bearer token, or null when signed out. */
  token?: () => string | null | undefined
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch
}

/**
 * The bearer transport every site shell uses: the caller's IAM access token on
 * the Authorization header, straight to the API origin. No cookie, no second
 * credential path — the engine resolves the org from the token's owner claim.
 */
export function fetchTransport(opts: FetchTransportOptions): Transport {
  const base = opts.baseUrl.replace(/\/+$/, '')
  const doFetch = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))

  async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const tok = opts.token?.()
    const res = await doFetch(`${base}/${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? null : { 'Content-Type': 'application/json' }),
        ...(tok ? { Authorization: `Bearer ${tok}` } : null),
      },
      ...(body === undefined ? null : { body: JSON.stringify(body) }),
    })
    const text = await res.text()
    let payload: unknown = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = null
    }
    if (!res.ok) {
      const o = asRecord(payload)
      const said = [o.error, o.msg, o.message].find((v) => typeof v === 'string' && v.trim() !== '')
      throw new FrameworkHttpError(res.status, typeof said === 'string' ? said : `HTTP ${res.status}`)
    }
    return payload as T
  }

  return {
    get: (p) => req('GET', p),
    post: (p, b) => req('POST', p, b),
    put: (p, b) => req('PUT', p, b),
    del: (p) => req<void>('DELETE', p).then(() => undefined),
  }
}
