/**
 * The category taxonomy — the SINGLE axis every surface groups by.
 *
 * The list itself is NOT here. It is `CATEGORIES` in ./taxonomy.generated, copied
 * down from hanzoai/commerce by scripts/sync.mjs, because which categories exist
 * is the catalog's answer and this package is a reader of it. What IS here is the
 * display copy that has no home in the catalog — one line and one accent per
 * category — keyed so that a category can never go without either.
 *
 * Pure + dependency-free (no React), so it is unit-testable and importable from a
 * Fumadocs build or an Express service alike.
 */
import type { ProductCategory } from "./types"
import { CATEGORIES } from "./taxonomy.generated"

/** Every category in exact display order. Every nav, launcher, and docs group
 *  reads this one list; groupers skip empty categories. */
export const CATEGORY_ORDER: readonly ProductCategory[] = CATEGORIES

/** URL slug for a category — lowercased and stable (`"AI"` → `"ai"`, `"Web3"` → `"web3"`). */
export const categorySlug = (category: ProductCategory): string => category.toLowerCase()

/** The category a URL slug names, or `null` when it matches none (case-insensitive). */
export const categoryFromSlug = (slug: string): ProductCategory | null =>
  CATEGORY_ORDER.find((c) => categorySlug(c) === slug.toLowerCase()) ?? null

/**
 * One honest line describing each category — the header copy for its landing page
 * and the docs group intro. Describes what the category IS (the class of products
 * it groups); the product list is always the live catalog, so nothing here is data.
 *
 * `Record<ProductCategory, …>` is the enforcement: the key type comes from the
 * generated list, so a category commerce adds will not compile until it has a
 * line, and a line for a category commerce dropped will not compile either.
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
  Dev: "API, SDKs, CLI, IDE, desktop, and keys — the developer tools you build against the cloud with.",
  Platform:
    "Projects, environments, builds, registry, releases, and pipelines — ship and run your applications.",
  Observe:
    "Usage, spend, traces, metrics, logs, dashboards, and alerts — see and evaluate what your workloads do.",
  Web3: "Networks, tokens, wallets, oracles, indexer, and settlement — the on-chain surface.",
  Apps: "Chat, bot, search, marketplace, and studio — end-user AI applications.",
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
  Dev: "indigo",
  Platform: "teal",
  Observe: "green",
  Web3: "amber",
  Apps: "pink",
}
