/**
 * The ONE catalog contract — the typed shape every Hanzo surface shares.
 *
 * Data (which products exist, their names/categories/order) is EDITABLE and lives
 * in hanzoai/commerce (a `hanzo-platform` product collection, served at
 * `GET /v1/commerce/catalog`). This package owns the SCHEMA + the two code maps
 * that can never live in a DB (`iconKey` → component, `brandColor` → css) + a
 * client with a checked-in snapshot fallback. See ./client and ./icons, ./colors.
 *
 * Decomplected on purpose:
 *   - `iconKey` and `brandColor` are VALUES (strings), not places. A row carries
 *     the NAME of an icon / the KEY of a color; code resolves each to a component
 *     / css at the edge. That keeps this contract React-free and portable to a
 *     Fumadocs build, an Express service, and a Next app alike.
 *   - `brands` is DERIVED from `category` (see ./brands `brandsForCategory`), so a
 *     source may omit it; the client fills it in. It is never authored by hand —
 *     duplicating it per-row is exactly the drift this package exists to kill.
 */

/** The 10 canonical Hanzo Cloud categories — the console operational axis, in the
 *  one true order (see ./categories `CATEGORY_ORDER`). This is the reconciled
 *  taxonomy every surface groups by; docs' descriptive groups map onto it. */
export type ProductCategory =
  | "AI"
  | "Compute"
  | "Data"
  | "Network"
  | "Security"
  | "Observe"
  | "Platform"
  | "Web3"
  | "Apps"
  | "Commerce"

/** A white-label brand whose console surfaces a category-scoped subset of the
 *  catalog. `hanzo` = the full AI cloud; the sovereign chains = web3/admin only. */
export type BrandId = "hanzo" | "lux" | "zoo" | "pars"

/**
 * A PascalCase export name of `@hanzogui/lucide-icons-2` (e.g. `"Network"`,
 * `"Brain"`). Stored as a string so the catalog stays pure data; the code map in
 * `@hanzo/products/icons` resolves it to a React component, and docs' lucide
 * plugin resolves the SAME name against `lucide-react`. One vocabulary, many
 * renderers — that is how "same icon set everywhere" holds across three stacks.
 */
export type IconKey = string

/** A color-swatch key (e.g. `"blue"`, `"violet"`) from `./colors` `COLOR_SWATCHES`.
 *  Resolved to a hex/css value by the code map (`swatchHex`) — never a raw hex in
 *  the data, so a re-theme is one place. */
export type ColorToken = string

/** Honest enablement — a live product, or a primitive with no surface yet. */
export type ProductStatus = "enabled" | "soon"

/**
 * One product row — the unit commerce stores and every surface renders.
 *
 * The first eleven fields are the CONTRACT (present on every row). The trailing
 * optional fields are provenance carried by the snapshot/seed (useful to the
 * console runtime overlay); static consumers ignore them.
 */
export interface CatalogEntry {
  /** Stable id and base route segment, e.g. `"gateway"`. Unique across the catalog. */
  id: string
  /** Display name (the canonical menu label), e.g. `"Gateway"`. */
  name: string
  /** Category grouping — one of the 10 canonical `ProductCategory` values. */
  category: ProductCategory
  /** Color-swatch key; resolved to css by `swatchHex` (./colors). */
  brandColor: ColorToken
  /** Icon export name; resolved to a component by `iconComponent` (./icons). */
  iconKey: IconKey
  /** URL slug (equals `id` today; kept explicit for docs/site linking). */
  slug: string
  /** Console route to the product index, e.g. `"/gateway"`. */
  route: string
  /** Canonical docs deep link, `https://docs.hanzo.ai/docs/services/<docsSlug>`. */
  docsUrl: string
  /** The product's `/v1` API surface, e.g. `"/v1/gateway"`. Always `/v1`-prefixed. */
  apiPath: string
  /** Pricing service key (`plans/<key>.json` in hanzoai/pricing), or `null` when unpriced. */
  pricingId: string | null
  /** Brands whose console surfaces this product. Derived from `category`. */
  brands: BrandId[]

  // ── Optional provenance (snapshot/seed only) ────────────────────────────────
  /** Source repo, e.g. `"hanzoai/gateway"`. */
  repo?: string | null
  /** Admin-gated (global / Hanzo-managed) surface. */
  admin?: boolean
  /** Enablement state. */
  status?: ProductStatus
  /** The Google Cloud product this is the open equivalent of, for the subtitle. */
  gcp?: string | null
}

/** A `CatalogEntry` with `brands` guaranteed populated (post-resolution view). */
export type ResolvedEntry = CatalogEntry & { brands: BrandId[] }
