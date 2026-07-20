/**
 * Catalog accessors — grouping, brand scope, resolution. Every function takes the
 * `CatalogEntry[]` explicitly, so the SAME logic serves live commerce data and the
 * snapshot fallback with no hidden global. Pure + React-free.
 */
import type { BrandId, CatalogEntry, ProductCategory, ResolvedEntry } from "./types"
import { CATEGORY_ORDER } from "./categories"
import { brandsForCategory, categoryInBrand } from "./brands"

/**
 * Guarantee `brands` is populated: derive it from `category` when a source omits
 * it (or ships it empty). This is the ONE place per-row brands come from, so the
 * list can never drift from the category scope. Idempotent.
 */
export const resolveEntry = (entry: CatalogEntry): ResolvedEntry => ({
  ...entry,
  brands: entry.brands && entry.brands.length > 0 ? entry.brands : brandsForCategory(entry.category),
})

/** Resolve every row's `brands`. */
export const resolveCatalog = (entries: CatalogEntry[]): ResolvedEntry[] => entries.map(resolveEntry)

/** Find an entry by id. */
export const findEntry = (entries: CatalogEntry[], id: string): CatalogEntry | undefined =>
  entries.find((e) => e.id === id)

/** An admin-only (global / Hanzo-managed) entry — hidden from a customer's nav. */
export const isAdminEntry = (e: CatalogEntry): boolean => e.admin === true

/** The catalog grouped by category, in display order, skipping empty groups. */
export const catalogByCategory = (
  entries: CatalogEntry[],
): { category: ProductCategory; entries: CatalogEntry[] }[] =>
  CATEGORY_ORDER.map((category) => ({
    category,
    entries: entries.filter((e) => e.category === category),
  })).filter((g) => g.entries.length > 0)

/** The entries a given brand's console surfaces (category-scoped). */
export const catalogForBrand = (entries: CatalogEntry[], brand: BrandId): CatalogEntry[] =>
  entries.filter((e) => categoryInBrand(brand, e.category))

/** `catalogByCategory` scoped to one brand — the per-brand nav, in display order. */
export const catalogByCategoryForBrand = (
  entries: CatalogEntry[],
  brand: BrandId,
): { category: ProductCategory; entries: CatalogEntry[] }[] =>
  catalogByCategory(catalogForBrand(entries, brand))
