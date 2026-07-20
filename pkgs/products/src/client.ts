/**
 * The catalog client — reads the editable source (`GET /v1/commerce/catalog`,
 * owned by hanzoai/commerce) and ALWAYS degrades to the checked-in snapshot, so a
 * commerce blip never breaks a static site or the console.
 *
 * Contract consumed (owned here; commerce conforms):
 *   GET <baseUrl>/v1/commerce/catalog  →  200
 *     Array<CatalogEntry>              (bare array)          — OR —
 *     { products: CatalogEntry[] }     (preferred envelope)  — OR —
 *     { catalog | data | items: [...] }                      (tolerated)
 *   Each row: { id, name, category, brandColor, iconKey, slug, route, docsUrl,
 *               apiPath, pricingId, brands? }. `brands` MAY be omitted — the
 *   client derives it from `category`. Unknown-category rows are dropped (they
 *   cannot be grouped). Missing optional fields are filled with the conventional
 *   default so a partial row still renders.
 *
 * Env-agnostic: takes an injected `fetch` (Node, browser, edge, or a test mock);
 * no DOM lib dependency. React-free.
 */
import type { BrandId, CatalogEntry, ProductCategory, ResolvedEntry } from "./types"
import { CATEGORY_ORDER } from "./categories"
import { ALL_BRANDS } from "./brands"
import { SNAPSHOT } from "./snapshot"
import { resolveCatalog } from "./catalog"
import { defaultColorKey, isSwatchKey } from "./colors"

/** Minimal `fetch` shape — the subset the client needs, so no DOM lib is required. */
export type FetchLike = (
  input: string,
  init?: { signal?: unknown; headers?: Record<string, string>; method?: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>

export interface FetchCatalogOptions {
  /** API origin. Default `https://api.hanzo.ai`. */
  baseUrl?: string
  /** Catalog path. Default `/v1/commerce/catalog`. */
  path?: string
  /** Injected fetch (defaults to `globalThis.fetch` when present). */
  fetch?: FetchLike
  /** Abort signal, forwarded verbatim. */
  signal?: unknown
  /** Extra request headers (e.g. `X-Org-Id`). */
  headers?: Record<string, string>
  /** Offline fallback. Default: the checked-in `SNAPSHOT`. */
  fallback?: CatalogEntry[]
}

export interface CatalogResult {
  /** The catalog, every row's `brands` resolved. */
  entries: ResolvedEntry[]
  /** Where the data came from — `live` commerce or the `snapshot` fallback. */
  source: "live" | "snapshot"
  /** Why the fallback was used, when it was. */
  error?: string
}

const CATEGORY_SET = new Set<string>(CATEGORY_ORDER)
const BRAND_SET = new Set<string>(ALL_BRANDS)

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x)

const str = (x: unknown): string | undefined => (typeof x === "string" && x.length > 0 ? x : undefined)

/** Pull the entry array out of any tolerated envelope. */
function extractArray(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  if (isRecord(body)) {
    for (const key of ["products", "catalog", "data", "items"]) {
      const v = body[key]
      if (Array.isArray(v)) return v
    }
  }
  return []
}

/** Coerce one raw row into a `CatalogEntry`, or `null` if it cannot be placed. */
export function normalizeEntry(raw: unknown): CatalogEntry | null {
  if (!isRecord(raw)) return null
  const id = str(raw.id) ?? str(raw.slug)
  if (!id) return null
  const category = raw.category
  if (typeof category !== "string" || !CATEGORY_SET.has(category)) return null // cannot group it

  const slug = str(raw.slug) ?? id
  const bc = str(raw.brandColor)
  const brandColor = isSwatchKey(bc) ? bc : defaultColorKey(id)
  const iconKey = str(raw.iconKey) ?? str(raw.icon) ?? "Box"
  const brandsRaw = Array.isArray(raw.brands)
    ? (raw.brands.filter((b): b is BrandId => typeof b === "string" && BRAND_SET.has(b)) as BrandId[])
    : []

  const pricing = raw.pricingId
  return {
    id,
    name: str(raw.name) ?? str(raw.title) ?? id,
    category: category as ProductCategory,
    brandColor,
    iconKey,
    slug,
    route: str(raw.route) ?? `/${slug}`,
    docsUrl: str(raw.docsUrl) ?? `https://docs.hanzo.ai/docs/services/${slug}`,
    apiPath: str(raw.apiPath) ?? `/v1/${slug}`,
    pricingId: typeof pricing === "string" && pricing.length > 0 ? pricing : null,
    brands: brandsRaw, // resolveCatalog derives from category when empty
    repo: str(raw.repo) ?? null,
    admin: raw.admin === true,
    status: raw.status === "soon" ? "soon" : "enabled",
    gcp: str(raw.gcp) ?? null,
  }
}

function fromSnapshot(fallback: CatalogEntry[], error: string): CatalogResult {
  return { entries: resolveCatalog(fallback), source: "snapshot", error }
}

/**
 * Fetch the live catalog, falling back to the snapshot on ANY failure (no fetch,
 * non-2xx, network error, or a payload with zero placeable rows). Never throws.
 */
export async function fetchCatalog(opts: FetchCatalogOptions = {}): Promise<CatalogResult> {
  const fallback = opts.fallback ?? SNAPSHOT
  const doFetch = opts.fetch ?? (globalThis as { fetch?: FetchLike }).fetch
  if (!doFetch) return fromSnapshot(fallback, "no fetch available")

  const base = (opts.baseUrl ?? "https://api.hanzo.ai").replace(/\/+$/, "")
  const path = opts.path ?? "/v1/commerce/catalog"
  try {
    const res = await doFetch(`${base}${path}`, {
      signal: opts.signal,
      headers: { accept: "application/json", ...opts.headers },
    })
    if (!res.ok) return fromSnapshot(fallback, `HTTP ${res.status}`)
    const rows = extractArray(await res.json())
    const entries = rows.map(normalizeEntry).filter((e): e is CatalogEntry => e !== null)
    if (entries.length === 0) return fromSnapshot(fallback, "empty or unrecognized payload")
    return { entries: resolveCatalog(entries), source: "live" }
  } catch (err) {
    return fromSnapshot(fallback, err instanceof Error ? err.message : "fetch failed")
  }
}
