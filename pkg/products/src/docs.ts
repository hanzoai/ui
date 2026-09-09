/**
 * Docs nav generation — derive docs.hanzo.ai's "All Services" taxonomy FROM the
 * catalog, so docs and console can never disagree. Pure: takes the entries, emits
 * the Fumadocs `meta.json` object (categories as `---Separator---` lines, service
 * slugs in order). A thin checked-in generator in the docs repo writes the result.
 *
 * The separators ARE the 10 canonical console categories — that is the taxonomy
 * reconciliation, applied. Docs-only pages that back no catalog product are NOT
 * dropped: pass them as `extraSlugs` and they land under a trailing "More" group,
 * so nothing already documented becomes unreachable.
 */
import type { CatalogEntry, ProductCategory } from "./types"
import { CATEGORY_ORDER } from "./categories"

/** The docs service slug a product maps to — the last segment of its `docsUrl`. */
export const docsSlugOf = (entry: CatalogEntry): string => entry.docsUrl.split("/").filter(Boolean).pop() ?? entry.slug

/** A Fumadocs `meta.json` — folder title/icon + the ordered `pages` (separators + slugs). */
export interface FumadocsMeta {
  title: string
  description?: string
  icon?: string
  defaultOpen?: boolean
  pages: string[]
}

export interface DocsMetaOptions {
  title?: string
  description?: string
  /** Folder icon (a lucide name, resolved by docs' own icon plugin). */
  icon?: string
  /**
   * The docs slugs that actually have an MDX page. When given, the nav lists ONLY
   * these (so it never emits a broken link to a not-yet-written page); products
   * whose docs page is missing are reported by `docsCoverage`, not linked here.
   * When omitted, every catalog slug is listed (the pure taxonomy view).
   */
  existingSlugs?: string[]
  /** Docs-only slugs (real MDX with no catalog product) to preserve under "More". */
  extraSlugs?: string[]
}

/** A Fumadocs separator line, e.g. `"---AI---"`. */
const separator = (label: string): string => `---${label}---`

/**
 * Build the services `meta.json` from the catalog: for each canonical category
 * that has at least one listable product, a separator then that category's docs
 * slugs (in catalog order, de-duplicated — several commerce products share one
 * `commerce` page). When `existingSlugs` is provided, only slugs with a real MDX
 * page are listed (no broken links). `extraSlugs` (docs-only pages) follow under
 * "More". The separators ARE the canonical categories — the reconciled taxonomy.
 */
export function docsServicesMeta(entries: CatalogEntry[], opts: DocsMetaOptions = {}): FumadocsMeta {
  const pages: string[] = []
  const seen = new Set<string>()
  const exists = opts.existingSlugs ? new Set(opts.existingSlugs) : null

  for (const category of CATEGORY_ORDER) {
    const inCat = entries.filter((e) => e.category === category)
    if (inCat.length === 0) continue
    const slugs: string[] = []
    for (const e of inCat) {
      const s = docsSlugOf(e)
      if (seen.has(s)) continue
      if (exists && !exists.has(s)) continue // skip a not-yet-written page (no broken link)
      seen.add(s)
      slugs.push(s)
    }
    if (slugs.length === 0) continue
    pages.push(separator(category), ...slugs)
  }

  const extra = (opts.extraSlugs ?? []).filter((s) => !seen.has(s))
  if (extra.length > 0) pages.push(separator("More"), ...extra)

  return {
    title: opts.title ?? "Platform",
    description: opts.description ?? "Hanzo Cloud Platform services",
    icon: opts.icon ?? "Cloud",
    defaultOpen: true,
    pages,
  }
}

export interface DocsCoverage {
  /** Catalog products with no backing docs page (need docs written). */
  missing: { id: string; docsSlug: string; category: ProductCategory }[]
  /** Docs pages that back no catalog product (docs-only, or drift). */
  extra: string[]
}

/**
 * Compare the catalog against the docs MDX slugs that actually exist. Flags both
 * gaps: catalog products missing a docs page, and docs pages with no product.
 */
export function docsCoverage(entries: CatalogEntry[], existingSlugs: string[]): DocsCoverage {
  const existing = new Set(existingSlugs)
  const wanted = new Set<string>()
  const missing: DocsCoverage["missing"] = []
  for (const e of entries) {
    const s = docsSlugOf(e)
    wanted.add(s)
    if (!existing.has(s)) missing.push({ id: e.id, docsSlug: s, category: e.category })
  }
  const extra = existingSlugs.filter((s) => !wanted.has(s))
  return { missing, extra }
}
