/**
 * Per-brand catalog scope — the ONE knob that makes each brand's console show the
 * right surfaces, and the derivation that fills a row's `brands[]` from its
 * `category`. Lifted verbatim from console2 `brand-scope.ts`; pure + React-free.
 *
 * `hanzo` is the full AI cloud. The sovereign-chain brands (`lux`, `zoo`, `pars`)
 * are web3 / bootnode admin consoles: Web3 (on-chain), Network (nodes/peering),
 * Security (keys/HSM/authz), Infrastructure (deploy + CLI/SDKs/API keys/IDE) — NOT the
 * AI-cloud surfaces (AI, Compute, Data, Observe, Apps, Commerce). Account settings
 * (team/profile/org) live in the avatar menu, orthogonal to this grid. `null` = all.
 */
import type { BrandId, ProductCategory } from "./types"
import { CATEGORY_ORDER } from "./categories"

/** Every brand, in display order. */
export const ALL_BRANDS: BrandId[] = ["hanzo", "lux", "zoo", "pars"]

/** The categories each brand's console admits. `null` = all. Adjust a brand here. */
export const BRAND_CATEGORIES: Record<BrandId, ProductCategory[] | null> = {
  hanzo: null,
  lux: ["Web3", "Network", "Security", "Infrastructure"],
  zoo: ["Web3", "Network", "Security", "Infrastructure"],
  pars: ["Web3", "Network", "Security", "Infrastructure"],
}

/** Categories a given brand's console surfaces, in display order (all for hanzo). */
export const categoriesForBrand = (brand: BrandId): ProductCategory[] => {
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
