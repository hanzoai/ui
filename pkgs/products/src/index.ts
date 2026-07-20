/**
 * @hanzo/products — the canonical Hanzo product catalog.
 *
 * ONE typed contract (`CatalogEntry`) + the two code maps that can't live in a DB
 * (`iconKey` → component via `@hanzo/products/icons`; `brandColor` → css via
 * `swatchHex`) + a `fetchCatalog` client over the editable commerce source with a
 * checked-in `SNAPSHOT` fallback + the reconciled taxonomy + docs nav generation.
 *
 * This barrel is React-FREE — the icon map lives at the `@hanzo/products/icons`
 * subpath so static consumers (docs, site, pricing) pull no React.
 */
export * from "./types"
export * from "./categories"
export * from "./brands"
export * from "./colors"
export * from "./catalog"
export * from "./search"
export * from "./snapshot"
export * from "./client"
export * from "./docs"
