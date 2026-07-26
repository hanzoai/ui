/**
 * @hanzo/products — the canonical Hanzo product source of truth. Two orthogonal
 * concerns, one React-FREE barrel:
 *
 * 1. The CATALOG — the console operational taxonomy: ONE typed contract
 *    (`CatalogEntry`) + the two code maps that can't live in a DB (`iconKey` →
 *    component via `@hanzo/products/icons`; `brandColor` → css via `swatchHex`) +
 *    a `fetchCatalog` client over the editable commerce source with a checked-in
 *    `SNAPSHOT` fallback + docs nav generation.
 *
 * 2. The ECOSYSTEM SHELL — the "Meet Hanzo" chrome shared by every property: the
 *    six-product `FAMILY` + `ROOT`, the `MEET_HANZO_MENU`, the unified `FOOTER`,
 *    the per-site `HEADERS`, the canonical `DESTINATIONS`, and the collapsed
 *    launcher `SURFACES` (the de-dupe of the two rival app-switcher lists).
 *
 * The icon map lives at the `@hanzo/products/icons` subpath so static consumers
 * (docs, site, pricing) pull no React.
 */

// ── Catalog (console operational taxonomy) ──────────────────────────────────
export * from "./types"
export * from "./categories"
export * from "./brands"
export * from "./colors"
export * from "./catalog"
export * from "./search"
export * from "./snapshot"
export * from "./client"
export * from "./docs"

// ── Ecosystem shell ("Meet Hanzo" header/footer/menu) ───────────────────────
export * from "./link"
export * from "./family"
export * from "./destinations"
export * from "./menu"
export * from "./footer"
export * from "./header"
export * from "./surfaces"
