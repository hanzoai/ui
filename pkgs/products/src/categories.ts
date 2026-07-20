/**
 * The reconciled category taxonomy — the SINGLE axis every surface groups by.
 *
 * Canonical = the console operational axis (it is product-page-backed). docs'
 * descriptive groups ("AI & Models", "Backend Services", …) map ONTO these; see
 * the reconciliation report. Pure + dependency-free (no React), so it is
 * unit-testable and importable from a Fumadocs build or an Express service.
 */
import type { ProductCategory } from "./types"

/** The 10 categories in exact display order. Every nav, launcher, and docs group
 *  reads this one list; groupers skip empty categories. */
export const CATEGORY_ORDER: ProductCategory[] = [
  "AI",
  "Compute",
  "Data",
  "Network",
  "Security",
  "Observe",
  "Platform",
  "Web3",
  "Apps",
  "Commerce",
]

/** URL slug for a category — lowercased and stable (`"AI"` → `"ai"`, `"Web3"` → `"web3"`). */
export const categorySlug = (category: ProductCategory): string => category.toLowerCase()

/** The category a URL slug names, or `null` when it matches none (case-insensitive). */
export const categoryFromSlug = (slug: string): ProductCategory | null =>
  CATEGORY_ORDER.find((c) => categorySlug(c) === slug.toLowerCase()) ?? null

/**
 * One honest line describing each category — the header copy for its landing page
 * and the docs group intro. Describes what the category IS (the class of products
 * it groups); the product list is always the live catalog, so nothing here is data.
 */
export const CATEGORY_SUMMARY: Record<ProductCategory, string> = {
  AI: "Models, providers, inference, agents, embeddings, fine-tuning, prompts, and the playground — the hub for everything you build, train, and ship with AI.",
  Compute:
    "Kubernetes, containers, functions, GPUs, machines, and tasks — the infrastructure your workloads run on.",
  Data: "Vector, SQL, key-value, object, document, and memory stores — managed data primitives for your apps.",
  Network:
    "Gateway, DNS, CDN, load balancing, VPC, and service mesh — connect, route, and expose your services.",
  Security:
    "IAM, authorization, KMS, HSM, secrets, MPC, and audit — identity and secrets for your organization.",
  Observe:
    "Usage, spend, traces, metrics, logs, dashboards, and alerts — see and evaluate what your workloads do.",
  Platform:
    "Projects, environments, builds, registry, releases, and pipelines, plus the CLI, SDKs, API, and IDE — the developer surface to ship and run your applications.",
  Web3: "Networks, tokens, wallets, oracles, indexer, and settlement — the on-chain surface.",
  Apps: "Chat, bot, search, marketplace, and studio — end-user AI applications.",
  Commerce:
    "Products, orders, customers, inventory, and promotions — run your store on Hanzo Commerce (payments via Square in Billing).",
}

/**
 * One representative color-swatch KEY per category — the accent a category header
 * (landing page, docs group, marketing shelf) tints with. Resolved to css by
 * `swatchHex` (./colors), like every product's `brandColor`. Chosen to match the
 * dominant flagship color in each group, so the per-category and per-product
 * accents read as one palette. This is the "per-category color" axis; per-product
 * colors live on each row's `brandColor`.
 */
export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  AI: "violet",
  Compute: "sky",
  Data: "cyan",
  Network: "blue",
  Security: "red",
  Observe: "green",
  Platform: "indigo",
  Web3: "amber",
  Apps: "pink",
  Commerce: "teal",
}
