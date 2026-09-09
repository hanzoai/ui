/**
 * Per-brand catalog scope — which categories each brand's console admits, and the
 * derivation that fills a row's `brands[]` from its `category`. Pure + React-free.
 *
 * `hanzo` is the full AI cloud. The sovereign-chain brands (`lux`, `zoo`, `pars`)
 * are web3 / bootnode admin consoles: Web3 (on-chain), Network (nodes/peering),
 * Security (keys/HSM/authz), Dev (keys/CLI/SDKs) — NOT the AI-cloud surfaces.
 * Account settings (team/profile/org) live in the avatar menu, orthogonal to this
 * grid.
 *
 * The scope is not decided here either. `GET /v1/commerce/catalog?brand=lux`
 * already answers it — that is the request a Lux console actually makes — so
 * scripts/sync.mjs reads each brand's answer into `BRAND_SCOPE`. A second copy
 * here would be a rule with two homes, and it had already drifted: this file
 * scoped the chain brands to `Infrastructure` while the API scoped them to `Dev`,
 * so a row's `brands[]` disagreed with the catalog that served it.
 */
import type { BrandId, ProductCategory } from "./types"
import { CATEGORY_ORDER } from "./categories"
import { BRAND_SCOPE } from "./taxonomy.generated"

/** Every brand, in display order. */
export const ALL_BRANDS: BrandId[] = ["hanzo", "lux", "zoo", "pars"]

/** The categories each brand's console admits. `null` = all. */
export const BRAND_CATEGORIES: Record<BrandId, ProductCategory[] | null> = {
  hanzo: BRAND_SCOPE.hanzo,
  lux: [...BRAND_SCOPE.lux],
  zoo: [...BRAND_SCOPE.zoo],
  pars: [...BRAND_SCOPE.pars],
}

/** Categories a given brand's console surfaces, in display order (all for hanzo). */
export const categoriesForBrand = (brand: BrandId): readonly ProductCategory[] => {
  const allowed = BRAND_CATEGORIES[brand]
  return allowed === null ? CATEGORY_ORDER : CATEGORY_ORDER.filter((c) => allowed.includes(c))
}

/** True when a category belongs to a given brand's console. */
export const categoryInBrand = (brand: BrandId, category: ProductCategory): boolean => {
  const allowed = BRAND_CATEGORIES[brand]
  return allowed === null || allowed.includes(category)
}

/**
 * The brands whose console surfaces a product IN `category` — the derivation that
 * backs every row's `brands[]`. This is the single source: a source that omits
 * `brands` gets it from here (see ./client, ./catalog `resolveEntry`), so the
 * per-row list can never drift from the category scope above.
 */
export const brandsForCategory = (category: ProductCategory): BrandId[] =>
  ALL_BRANDS.filter((b) => categoryInBrand(b, category))

// ── Nodes surface — which chain networks each brand reports on ────────────────
// Orthogonal DATA scope for the Network-category Nodes product: which luxd
// primary networks a given brand may SEE. Lifted from console2 brand-scope.ts.

/** A configured chain network the Nodes surface can report on. */
export type NodeNetworkId =
  | "lux-mainnet"
  | "lux-testnet"
  | "lux-devnet"
  | "pars-mainnet"
  | "zoo-mainnet"

/** Every configured node network, in display order. */
export const ALL_NODE_NETWORKS: NodeNetworkId[] = [
  "lux-mainnet",
  "lux-testnet",
  "lux-devnet",
  "pars-mainnet",
  "zoo-mainnet",
]

/**
 * Which networks each brand's Nodes surface reports on. `hanzo` is the
 * all-networks super-admin view; each sovereign brand sees ONLY its own chain.
 */
export const BRAND_NODE_NETWORKS: Record<BrandId, NodeNetworkId[] | "all"> = {
  hanzo: "all",
  lux: ["lux-mainnet", "lux-testnet", "lux-devnet"],
  zoo: ["zoo-mainnet"],
  pars: ["pars-mainnet"],
}

/** The node networks a given brand may see, in display order (all for hanzo). */
export const nodeNetworksForBrand = (brand: BrandId): NodeNetworkId[] => {
  const allowed = BRAND_NODE_NETWORKS[brand]
  return allowed === "all" ? ALL_NODE_NETWORKS : ALL_NODE_NETWORKS.filter((n) => allowed.includes(n))
}
