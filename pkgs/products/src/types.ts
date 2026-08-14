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
import { CATEGORIES } from "./taxonomy.generated"

/**
 * A product category — read off the catalog's own list rather than spelled out
 * again here.
 *
 * The union used to be typed by hand, and a hand-typed union is a claim about
 * someone else's data: it claimed `Commerce` (which the catalog has never
 * carried a single product under) and omitted `Dev` (which carries eight). The
 * claim was load-bearing — `normalizeEntry` drops any row whose category is not
 * in it — so every Dev product the live catalog served was silently discarded.
 *
 * Deriving it from `CATEGORIES` makes that class of disagreement unstateable:
 * the only way to name a category here is for commerce to be serving it.
 */
export type ProductCategory = (typeof CATEGORIES)[number]

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
 * What API a product has on api.hanzo.ai. `service` serves one at `apiPath`;
 * `client` consumes one and serves none; `pending` is a real product this API
 * does not front yet. The last two carry an EMPTY `apiPath`, which is the honest
 * value — see `normalizeEntry`, which used to invent `/v1/<slug>` there.
 */
export type ProductKind = "service" | "client" | "pending"

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
  /**
   * The product's `/v1` API surface, e.g. `"/v1/gateway"` — `/v1`-prefixed when
   * present, and EMPTY when the product has none. Empty is a real answer, not a
   * gap to be filled: read `kind` for which of the two reasons applies.
   */
  apiPath: string
  /**
   * What API this product has: it SERVES one (`apiPath` is a live route), it
   * CONSUMES one and serves none (the CLI, the SDKs, the desktop app), or it is
   * a real product this API does not front yet (`pending`). Stated rather than
   * inferred, so a surface never has to guess why `apiPath` is empty.
   */
  kind: ProductKind
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
