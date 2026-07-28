/**
 * The `/v1/social` contract — the ONE typed client for the Hanzo Social surface,
 * shared by every host that renders it (the console's Publish product, the dedicated
 * social.hanzo.ai app, any white-label admin).
 *
 * The backend is `hanzoai/cloud` `clients/social`: a native-Go per-org accounts+posts
 * store on Base/SQLite (the in-process fold of the standalone social stack, twin of
 * clients/crm) — NOT a proxy to the retired social pods. Routes (social.go):
 *
 *   GET                 /v1/social/summary               per-org roll-up
 *   GET                 /v1/social/providers             publish-readiness per network
 *   GET/POST            /v1/social/accounts              list (?provider=) / connect
 *   GET/PUT/DELETE      /v1/social/accounts/:id          detail / update / disconnect
 *   GET/POST            /v1/social/posts                 list (?status=) / create-or-schedule
 *   GET/PUT/DELETE      /v1/social/posts/:id             detail / update / delete
 *   POST                /v1/social/posts/:id/publish     publish now
 *
 * TRANSPORT IS INJECTED. This layer never picks an origin, a credential or a fetch
 * wrapper — the host passes a `SocialRest` whose paths are relative to `/v1/social`
 * (`'summary'`, `'posts/<id>/publish'`), so the console rides its session-cookie
 * `originV1Url` and another app rides its own. Every read/write is org-scoped
 * SERVER-SIDE from the validated bearer/session owner claim; no org ever travels
 * from the browser.
 *
 * Payloads are normalized DEFENSIVELY: a field rename upstream degrades a cell
 * rather than throwing, and a list is read from whichever envelope key the backend
 * uses (`data`/`items`/`rows`, or a bare array).
 */

const enc = encodeURIComponent

// ── Coercion helpers (pure) ─────────────────────────────────────────────────
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))
const num = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return 0
}
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

const rows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload.filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
  if (payload && typeof payload === 'object') {
    for (const k of ['data', 'items', 'rows']) {
      const v = (payload as Record<string, unknown>)[k]
      if (Array.isArray(v)) return v.filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
    }
  }
  return []
}

// ── Domain types (mirror cloud clients/social/store.go JSON tags) ────────────

/** Networks — the ONE ordered vocabulary (cloud rejects an unknown provider; '' → x). */
export const PROVIDERS = ['x', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'threads'] as const
export type Provider = (typeof PROVIDERS)[number]

/** Account connection lifecycle (cloud rejects an unknown status; '' → connected). */
export const ACCOUNT_STATUSES = ['connected', 'disconnected', 'error'] as const

/** Post lifecycle (cloud rejects an unknown status; '' → draft). */
export const POST_STATUSES = ['draft', 'scheduled', 'published', 'failed'] as const

export type Account = {
  id: string
  provider: string
  handle: string
  status: string
  createdAt: number
  updatedAt: number
}

export type Post = {
  id: string
  content: string
  channel: string
  status: string
  /** Unix seconds; 0 = not scheduled / publish now. */
  scheduleAt: number
  /**
   * Attached media URLs. Cloud ALWAYS serializes an array (never null) and its PUT
   * rebuilds the row from the body — so this has to round-trip: an update that
   * omitted it would wipe the post's media.
   */
  media: string[]
  /** Server-managed publish results (empty until a publish attempt lands). */
  accountId?: string
  externalId?: string
  error?: string
  createdAt: number
  updatedAt: number
}

/** The per-org roll-up (GET /v1/social/summary) — the counts SocialSummaryBar renders. */
export type SocialSummary = { posts: number; scheduled: number; published: number; accounts: number }

/**
 * A network's publish-readiness (GET /v1/social/providers): whether this deployment
 * holds the OAuth-app credentials to publish, and — if not — exactly which env vars
 * are missing. The honest connect affordance; never a fabricated "connected".
 */
export type ProviderCapability = {
  provider: string
  credentialsConfigured: boolean
  missingCredentials: string[]
}

/** Create/update bodies — only the writable fields (server owns id/org/timestamps). */
export type NewAccount = Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>> & { provider: string }
export type NewPost = Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>> & { content: string }

// ── Normalizers (pure) ──────────────────────────────────────────────────────

export function normalizeAccount(raw: unknown): Account {
  const r = asRecord(raw)
  return {
    id: str(r.id),
    provider: str(r.provider) || 'x',
    handle: str(r.handle),
    status: str(r.status) || 'connected',
    createdAt: num(r.createdAt),
    updatedAt: num(r.updatedAt),
  }
}

export function normalizePost(raw: unknown): Post {
  const r = asRecord(raw)
  return {
    id: str(r.id),
    content: str(r.content),
    channel: str(r.channel) || 'x',
    status: str(r.status) || 'draft',
    scheduleAt: num(r.scheduleAt),
    media: strs(r.media),
    accountId: str(r.accountId) || undefined,
    externalId: str(r.externalId) || undefined,
    error: str(r.error) || undefined,
    createdAt: num(r.createdAt),
    updatedAt: num(r.updatedAt),
  }
}

export function normalizeSummary(raw: unknown): SocialSummary {
  const r = asRecord(raw)
  return { posts: num(r.posts), scheduled: num(r.scheduled), published: num(r.published), accounts: num(r.accounts) }
}

export function normalizeProviderCapability(raw: unknown): ProviderCapability {
  const r = asRecord(raw)
  return {
    provider: str(r.provider),
    credentialsConfigured: Boolean(r.credentialsConfigured),
    missingCredentials: strs(r.missingCredentials),
  }
}

export const normalizeAccounts = (p: unknown): Account[] => rows(p).map(normalizeAccount).filter((a) => a.id)
export const normalizePosts = (p: unknown): Post[] => rows(p).map(normalizePost).filter((x) => x.id)
export const normalizeProviders = (p: unknown): ProviderCapability[] =>
  rows(p).map(normalizeProviderCapability).filter((c) => c.provider)

// ── The transport seam ──────────────────────────────────────────────────────

/**
 * The host's REST transport. `path` is relative to `/v1/social` (no leading slash);
 * the host owns the origin, the credential and the error class. A rejected promise
 * is passed straight to `classifyBackend`, so any client's error type works.
 */
export type SocialRest = {
  get: (path: string) => Promise<unknown>
  post: (path: string, body?: unknown) => Promise<unknown>
  put: (path: string, body?: unknown) => Promise<unknown>
  del: (path: string) => Promise<void>
}

export type SocialApi = ReturnType<typeof createSocialApi>

/** Bind the `/v1/social` contract to a host transport. One method per documented route. */
export function createSocialApi(rest: SocialRest) {
  return {
    summary: (): Promise<SocialSummary> => rest.get('summary').then(normalizeSummary),

    /** Publish-readiness per network (+ the exact missing OAuth-app credentials). */
    providers: (): Promise<ProviderCapability[]> => rest.get('providers').then(normalizeProviders),

    accounts: {
      list: (provider?: string): Promise<Account[]> =>
        rest.get(`accounts${provider ? `?provider=${enc(provider)}` : ''}`).then(normalizeAccounts),
      get: (id: string): Promise<Account> => rest.get(`accounts/${enc(id)}`).then(normalizeAccount),
      create: (body: NewAccount): Promise<Account> => rest.post('accounts', body).then(normalizeAccount),
      update: (id: string, body: NewAccount): Promise<Account> =>
        rest.put(`accounts/${enc(id)}`, body).then(normalizeAccount),
      remove: (id: string): Promise<void> => rest.del(`accounts/${enc(id)}`),
    },

    posts: {
      list: (status?: string): Promise<Post[]> =>
        rest.get(`posts${status ? `?status=${enc(status)}` : ''}`).then(normalizePosts),
      get: (id: string): Promise<Post> => rest.get(`posts/${enc(id)}`).then(normalizePost),
      create: (body: NewPost): Promise<Post> => rest.post('posts', body).then(normalizePost),
      update: (id: string, body: NewPost): Promise<Post> => rest.put(`posts/${enc(id)}`, body).then(normalizePost),
      remove: (id: string): Promise<void> => rest.del(`posts/${enc(id)}`),
      /** Publish a post NOW to its channel's connected accounts. */
      publish: (id: string): Promise<Post> => rest.post(`posts/${enc(id)}/publish`).then(normalizePost),
    },
  }
}
