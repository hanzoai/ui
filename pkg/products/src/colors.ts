/**
 * The colorToken → css code map (one of the two maps that can't live in a DB).
 *
 * A catalog row carries a `brandColor` KEY (e.g. `"violet"`); this module resolves
 * it to a hex string from ONE curated palette so the whole surface stays cohesive.
 * Lifted verbatim from console2 `colors.ts` (the per-product system) and extended
 * with `categoryColor` (the per-category accent). Pure + dependency-free.
 *
 * Resolution is three honest layers (most specific wins):
 *   1. the caller's per-product override (a user's explicit choice),
 *   2. a curated color for a flagship product,
 *   3. a deterministic hash of the id into the palette (stable for the long tail).
 */
import type { ProductCategory } from "./types"
import { CATEGORY_COLORS } from "./categories"

/** One selectable color. `hex` is tuned to read well on BOTH dark and light. */
export type Swatch = { key: string; label: string; hex: string }

/** The curated palette — a cohesive, Linear-like set. Keys are stable (persisted
 *  in prefs), so a key is NEVER renamed once shipped (add new ones at the end). */
export const COLOR_SWATCHES: Swatch[] = [
  { key: "indigo", label: "Indigo", hex: "#5E6AD2" },
  { key: "blue", label: "Blue", hex: "#4C8DFF" },
  { key: "sky", label: "Sky", hex: "#38BDF8" },
  { key: "cyan", label: "Cyan", hex: "#22C3C3" },
  { key: "teal", label: "Teal", hex: "#2DD4A7" },
  { key: "green", label: "Green", hex: "#3FB950" },
  { key: "lime", label: "Lime", hex: "#84CC16" },
  { key: "amber", label: "Amber", hex: "#E3A008" },
  { key: "orange", label: "Orange", hex: "#F0883E" },
  { key: "red", label: "Red", hex: "#F2564B" },
  { key: "rose", label: "Rose", hex: "#F16D8A" },
  { key: "pink", label: "Pink", hex: "#EC6FAF" },
  { key: "purple", label: "Purple", hex: "#A972F0" },
  { key: "violet", label: "Violet", hex: "#8257E6" },
  { key: "slate", label: "Slate", hex: "#8B93A7" },
]

const SWATCH_BY_KEY: Record<string, Swatch> = Object.fromEntries(COLOR_SWATCHES.map((s) => [s.key, s]))

/** A stable neutral used when a key is unknown (never throws). */
const FALLBACK = SWATCH_BY_KEY.slate

/** True when `key` is a real, selectable swatch key. */
export const isSwatchKey = (key: string | undefined | null): key is string =>
  typeof key === "string" && key in SWATCH_BY_KEY

/** Resolve a swatch key to its hex (unknown/empty → the neutral fallback). */
export const swatchHex = (key: string | undefined | null): string =>
  (isSwatchKey(key) ? SWATCH_BY_KEY[key] : FALLBACK).hex

/**
 * Intentional colors for flagship products, so the surfaces that matter most read
 * exactly right. Every value MUST be a real swatch key. A product not listed here
 * still gets a stable color from the hash — this map only pins the important ones.
 * These seed each row's `brandColor` in the snapshot; commerce may override per row.
 */
export const CURATED_COLORS: Record<string, string> = {
  overview: "indigo",
  models: "violet",
  providers: "blue",
  chat: "green",
  playground: "purple",
  bot: "orange",
  marketplace: "pink",
  inference: "violet",
  agents: "purple",
  embeddings: "cyan",
  vector: "cyan",
  sql: "teal",
  kv: "teal",
  s3: "amber",
  datastore: "blue",
  docdb: "sky",
  search: "sky",
  base: "indigo",
  gpus: "orange",
  machines: "blue",
  kubernetes: "sky",
  containers: "sky",
  functions: "amber",
  tasks: "amber",
  clusters: "blue",
  edge: "lime",
  dns: "sky",
  cdn: "sky",
  network: "sky",
  gateway: "blue",
  iam: "red",
  kms: "red",
  authz: "red",
  hsm: "rose",
  audit: "rose",
  traces: "purple",
  observations: "purple",
  cost: "green",
  plans: "green",
  billing: "green",
  status: "teal",
  alerts: "red",
  cli: "slate",
  sdks: "slate",
  ide: "indigo",
}

/** Small, well-distributed string hash (FNV-1a, 32-bit). Deterministic + pure. */
function hash32(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** A stable swatch key for any id — hashed across the palette so it is varied. */
export const hashColorKey = (id: string): string =>
  COLOR_SWATCHES[hash32(id) % COLOR_SWATCHES.length].key

/** The DEFAULT swatch key for a product (no override): a curated pick if flagship,
 *  else the deterministic hash. This is how the snapshot's `brandColor` is seeded. */
export const defaultColorKey = (id: string): string => CURATED_COLORS[id] ?? hashColorKey(id)

/** The EFFECTIVE swatch key for a product, honoring a caller's overrides first.
 *  An override to an unknown key is ignored (falls through to the default). */
export function productColorKey(id: string, overrides?: Record<string, string> | null): string {
  const override = overrides?.[id]
  if (isSwatchKey(override)) return override
  return defaultColorKey(id)
}

/** The effective hex for a product's icon, honoring overrides. */
export const productColorHex = (id: string, overrides?: Record<string, string> | null): string =>
  swatchHex(productColorKey(id, overrides))

/** The hex accent for a category header (the per-category color). */
export const categoryColor = (category: ProductCategory): string => swatchHex(CATEGORY_COLORS[category])
