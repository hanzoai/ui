/**
 * The OSS App Store catalog — the shared client for the 1000+-app one-click
 * open-source catalog served as a flat JSON array at `<base>/meta.json`, with per-app
 * blueprint assets under `<base>/blueprints/<id>/`.
 *
 * One catalog, several surfaces: the console App Store, platform.hanzo.ai, and the
 * public gallery at oss.hanzo.ai. They previously each carried their own copy of the
 * shape, the normalizer and the URL builders, which is how three surfaces come to
 * disagree about the same catalog row. This is the one implementation.
 *
 * The catalog is a PUBLIC CDN with open CORS, so a browser fetches it DIRECTLY — no
 * BFF, no `/v1` proxy — which is why this works in the go:embed console where the
 * Next reverse-proxies are pruned. The base URL is INJECTED by the caller, so this
 * module holds no config import and its normalizers + URL builders stay pure.
 */

/** One open-source app in the catalog (the meta.json entry, load-bearing fields only). */
export type OssApp = {
  /** Stable catalog id + blueprint path segment, e.g. `2fauth`, `n8n`, `postgres`. */
  id: string
  /** Display name, e.g. "2FAuth". */
  name: string
  /** One-line description. */
  description: string
  /** Version label — often the literal string `"latest"`, rendered raw. */
  version: string
  /** Bare logo filename (e.g. `logo.svg`), resolved against the blueprint path. */
  logo: string
  /** Category/provenance tags (e.g. `productivity`, `self-hosted`, `caprover`). */
  tags: string[]
  /** External links; only github/website/docs are surfaced. */
  links: { github?: string; website?: string; docs?: string }
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const strTrim = (v: unknown): string | undefined => {
  const s = str(v).trim()
  return s ? s : undefined
}
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter((x) => x !== '') : []
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

/** Normalize one catalog record to an `OssApp` (drops a record with no id + name). */
export function normalizeOssApp(raw: unknown): OssApp | null {
  const r = asRecord(raw)
  const id = str(r.id).trim()
  const name = str(r.name).trim() || id
  if (!id || !name) return null
  const links = asRecord(r.links)
  return {
    id,
    name,
    description: str(r.description).trim(),
    version: str(r.version).trim() || 'latest',
    logo: str(r.logo).trim(),
    tags: strList(r.tags),
    links: {
      github: strTrim(links.github),
      website: strTrim(links.website),
      docs: strTrim(links.docs),
    },
  }
}

/** Normalize the catalog payload to the app list (bare array OR a `{data|apps|…}` wrap). */
export function normalizeOssApps(payload: unknown): OssApp[] {
  let arr: unknown[] = []
  if (Array.isArray(payload)) arr = payload
  else if (payload && typeof payload === 'object') {
    for (const k of ['data', 'apps', 'templates', 'items', 'rows']) {
      const v = (payload as Record<string, unknown>)[k]
      if (Array.isArray(v)) {
        arr = v
        break
      }
    }
  }
  const out: OssApp[] = []
  const seen = new Set<string>()
  for (const raw of arr) {
    const app = normalizeOssApp(raw)
    if (app && !seen.has(app.id)) {
      seen.add(app.id)
      out.push(app)
    }
  }
  return out
}

/** The per-app blueprint asset base: `<base>/blueprints/<id>`. */
export function blueprintBase(base: string, id: string): string {
  return `${base.replace(/\/+$/, '')}/blueprints/${encodeURIComponent(id)}`
}

/**
 * The app's logo URL, or null when the entry carries no logo filename — a surface then
 * renders its monogram fallback rather than a broken image.
 */
export function logoUrl(base: string, app: OssApp): string | null {
  if (!app.logo) return null
  return `${blueprintBase(base, app.id)}/${app.logo}`
}

/**
 * Derive `owner/repo` from a GitHub URL — the maker identity, since the catalog
 * carries no author field. Returns null for a non-GitHub / malformed URL.
 */
export function ownerRepo(githubUrl?: string): string | null {
  if (!githubUrl) return null
  const m = githubUrl.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i)
  if (!m) return null
  const owner = m[1]
  const repo = m[2].replace(/\.git$/i, '')
  if (!owner || !repo) return null
  return `${owner}/${repo}`
}

/** An app is one-click deployable when it carries a buildable source (its repo). */
export function hasDeploySource(app: OssApp): boolean {
  return Boolean(app.links.github)
}

// ── Live fetch (the one impure surface) ──────────────────────────────────────
//
// Cached per base URL so several mounts share ONE ~500 KB fetch. An in-flight fetch is
// de-duped (concurrent callers await the same promise); a failure is not cached.
const cache = new Map<string, OssApp[]>()
const inflight = new Map<string, Promise<OssApp[]>>()

/**
 * Fetch + normalize the catalog from `<base>/meta.json`. Cross-origin and
 * unauthenticated (public CDN); throws on a non-2xx or parse failure so the caller can
 * show an honest error state. Cached on success; `force` bypasses for a manual refresh.
 */
export async function fetchOssApps(base: string, force = false): Promise<OssApp[]> {
  const key = base.replace(/\/+$/, '')
  if (!force) {
    const hit = cache.get(key)
    if (hit) return hit
    const pending = inflight.get(key)
    if (pending) return pending
  }
  const run = (async () => {
    const res = await fetch(`${key}/meta.json`, {
      headers: { Accept: 'application/json' },
      // Public catalog — no credentials, so a session cookie never leaks cross-origin.
      credentials: 'omit',
    })
    if (!res.ok) throw new Error(`Catalog unavailable (HTTP ${res.status})`)
    const apps = normalizeOssApps(await res.json())
    cache.set(key, apps)
    return apps
  })()
  inflight.set(key, run)
  try {
    return await run
  } finally {
    inflight.delete(key)
  }
}

/**
 * Fetch one app's `docker-compose.yml` as raw text, or null when the entry publishes
 * none. A 404 is a NORMAL answer for a large community catalog — not every blueprint
 * ships compose — so this never throws: a detail view treats an absent blueprint as
 * "nothing to show", and an optional asset must not fail a whole page.
 */
export async function fetchCompose(base: string, id: string): Promise<string | null> {
  try {
    const res = await fetch(`${blueprintBase(base, id)}/docker-compose.yml`, {
      headers: { Accept: 'text/plain' },
      credentials: 'omit',
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.trim() ? text : null
  } catch {
    return null
  }
}
