/**
 * The generic client for the Hanzo Framework DocType engine (`/v1/framework/*`).
 * It is metadata-driven and doctype-agnostic: the SAME `records` CRUD serves a CMS
 * Page, an ERP Invoice, or a Helpdesk Ticket — an app lane is just a `module`
 * filter over `doctypes`.
 *
 * THE HOST OWNS TRANSPORT. This module never picks an origin, a credential, or a
 * proxy: it takes a `FrameworkTransport` and builds paths RELATIVE to the framework
 * root (`doctypes`, `Article/hello`, `modules/cms/install`). The console maps those
 * onto its own user-bearer `/v1/framework/...` proxy; a native app or a test maps
 * them somewhere else. One client, any host.
 *
 * Names (DocType + document) go verbatim into the path, so they are
 * `encodeURIComponent`-escaped here and kept slug-style on create (`slugify`).
 * Payloads are read defensively from `{ data }` (or a bare array), so a shape drift
 * degrades a list rather than throwing.
 */
import type {
  DocType,
  FrameworkDoc,
  InstallResult,
  ListQuery,
  ModuleInfo,
} from './types'

/**
 * The ONE seam a host injects. Paths are relative to the framework root and never
 * start with a slash; the host prefixes its own base (and adds credentials).
 */
export interface FrameworkTransport {
  get: (path: string) => Promise<unknown>
  post: (path: string, body?: unknown) => Promise<unknown>
  put: (path: string, body?: unknown) => Promise<unknown>
  del: (path: string) => Promise<void>
}

/** The name 8.0.24 shipped for the same seam. One concept, one shape, two spellings. */
export type Transport = FrameworkTransport

const enc = encodeURIComponent

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

/** Pull the first array under a common envelope key (the engine uses `data`). */
export function rows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
  }
  const o = asRecord(payload)
  for (const k of ['data', 'items', 'rows']) {
    if (Array.isArray(o[k])) {
      return (o[k] as unknown[]).filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
    }
  }
  return []
}

/** A framework document is already a flat map + envelope; keep it as-is (typed). */
const asDoc = (v: unknown): FrameworkDoc => asRecord(v) as FrameworkDoc

const asDocType = (v: unknown): DocType => {
  const r = asRecord(v)
  return {
    ...(r as object),
    name: String(r.name ?? ''),
    fields: Array.isArray(r.fields) ? (r.fields as DocType['fields']) : [],
  } as DocType
}

/** Build the generic document list querystring from a typed ListQuery. Pure. */
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

/** The engine surface, as consumed by every DocType view. */
export interface FrameworkClient {
  /** The DocType registry (schemas) — the collection definitions of every app lane. */
  doctypes: {
    list: () => Promise<DocType[]>
    get: (name: string) => Promise<DocType>
    create: (dt: DocType) => Promise<DocType>
    update: (name: string, dt: DocType) => Promise<DocType>
    remove: (name: string) => Promise<void>
  }
  /** Generic, metadata-driven document CRUD — the SAME calls for ANY doctype. */
  records: {
    list: (doctype: string, q?: ListQuery) => Promise<FrameworkDoc[]>
    get: (doctype: string, name: string) => Promise<FrameworkDoc>
    create: (doctype: string, data: Record<string, unknown>) => Promise<FrameworkDoc>
    update: (doctype: string, name: string, data: Record<string, unknown>) => Promise<FrameworkDoc>
    remove: (doctype: string, name: string) => Promise<void>
    submit: (doctype: string, name: string) => Promise<FrameworkDoc>
    cancel: (doctype: string, name: string) => Promise<FrameworkDoc>
  }
  /** App-lane fixtures: list the registered lanes, inspect one, install into the org. */
  modules: {
    list: () => Promise<ModuleInfo[]>
    get: (module: string) => Promise<ModuleInfo>
    install: (module: string) => Promise<InstallResult>
  }
  /** Per-org role assignments (grant editors; the owner is seeded System Manager). */
  roles: {
    list: () => Promise<{ user: string; role: string }[]>
    assign: (user: string, role: string) => Promise<void>
    revoke: (user: string, role: string) => Promise<void>
  }
  /** Engine health/reach probe — `GET /summary`. */
  summary: () => Promise<Record<string, unknown>>
}

/** Bind the framework surface to a host's transport. */
export function createFrameworkClient(t: FrameworkTransport): FrameworkClient {
  return {
    doctypes: {
      list: () => t.get('doctypes').then((r) => rows(r).map(asDocType)),
      get: (name) => t.get(`doctypes/${enc(name)}`).then(asDocType),
      create: (dt) => t.post('doctypes', dt).then(asDocType),
      update: (name, dt) => t.put(`doctypes/${enc(name)}`, dt).then(asDocType),
      remove: (name) => t.del(`doctypes/${enc(name)}`),
    },

    records: {
      list: (doctype, q) => t.get(`${enc(doctype)}${listQuery(q)}`).then((r) => rows(r).map(asDoc)),
      get: (doctype, name) => t.get(`${enc(doctype)}/${enc(name)}`).then(asDoc),
      create: (doctype, data) => t.post(enc(doctype), data).then(asDoc),
      update: (doctype, name, data) => t.put(`${enc(doctype)}/${enc(name)}`, data).then(asDoc),
      remove: (doctype, name) => t.del(`${enc(doctype)}/${enc(name)}`),
      submit: (doctype, name) => t.post(`${enc(doctype)}/${enc(name)}/submit`).then(asDoc),
      cancel: (doctype, name) => t.post(`${enc(doctype)}/${enc(name)}/cancel`).then(asDoc),
    },

    modules: {
      list: () =>
        t.get('modules').then((r) =>
          rows(r).map((m) => ({
            module: String(m.module ?? ''),
            doctypes: Array.isArray(m.doctypes) ? (m.doctypes as string[]) : [],
          })),
        ),
      get: (module) =>
        t.get(`modules/${enc(module)}`).then((v) => {
          const r = asRecord(v)
          return {
            module: String(r.module ?? module),
            doctypes: Array.isArray(r.doctypes) ? (r.doctypes as string[]) : [],
            installed: Array.isArray(r.installed) ? (r.installed as string[]) : [],
          }
        }),
      install: (module) =>
        t.post(`modules/${enc(module)}/install`).then((v) => {
          const r = asRecord(v)
          return {
            module: String(r.module ?? module),
            created: Array.isArray(r.created) ? (r.created as string[]) : [],
            existing: Array.isArray(r.existing) ? (r.existing as string[]) : [],
          }
        }),
    },

    roles: {
      list: () =>
        t.get('roles').then((r) =>
          rows(r).map((x) => ({ user: String(x.user ?? ''), role: String(x.role ?? '') })),
        ),
      assign: (user, role) => t.post('roles', { user, role }).then(() => undefined),
      revoke: (user, role) => t.del(`roles/${enc(user)}/${enc(role)}`),
    },

    summary: () => t.get('summary').then(asRecord),
  }
}
