/**
 * The launcher surface registry — the ONE cross-surface app-switcher list, the
 * collapse of the two lists that used to drift: `SURFACES` (hanzoai/ui
 * `pkg/ui/.../surfaces.data.ts`) and `HANZO_APPS` (hanzoai/gui
 * `@hanzogui/shell`). Both now re-export from here, so add or reorder a surface
 * ONCE and every launcher moves together.
 *
 * A surface is a place the switcher can open. The six product surfaces DERIVE from
 * `FAMILY` (single source — their label/href/domain/job can't drift from the
 * product), the root surface is `hanzo.ai` under the legacy launcher id `"ai"`, and
 * the platform surfaces (Console, Billing, Account, Admin, Gateway, Platform) are
 * launcher-only — real properties that are not flagship products.
 *
 * `id` is the stable key AND the glyph key: each renderer (React → lucide, the gui
 * shell → its inline SVG set) maps it to its own icon, so the DATA stays glyph-free
 * and this module imports no React. Pure data.
 */
import { FAMILY, ROOT } from "./family"

/** Every launcher surface id — the family ids (root as legacy `"ai"`) + platform. */
export type SurfaceId =
  | "ai"
  | "chat"
  | "app"
  | "team"
  | "studio"
  | "bot"
  | "cloud"
  | "console"
  | "billing"
  | "account"
  | "admin"
  | "gateway"
  | "platform"

/** One launcher surface. */
export interface Surface {
  /** Stable id; also the per-renderer glyph key. */
  id: SurfaceId
  /** Menu label. */
  label: string
  /** Absolute front-door URL. */
  href: string
  /** The domain, shown as the tile subtitle. */
  domain: string
  /** One-line description. */
  blurb: string
}

/** The root — `hanzo.ai` under the launcher's legacy id `"ai"`. */
const rootSurface: Surface = { id: "ai", label: "Hanzo AI", href: ROOT.url, domain: ROOT.domain, blurb: ROOT.job }

/** The six product surfaces, projected from `FAMILY` (the single source). */
const productSurfaces: Surface[] = FAMILY.map((p) => ({
  id: p.id as SurfaceId,
  label: p.short,
  href: p.url,
  domain: p.domain,
  blurb: p.job,
}))

/** Launcher-only surfaces — real properties that are not flagship products. */
const platformSurfaces: Surface[] = [
  { id: "console", label: "Console", href: "https://console.hanzo.ai", domain: "console.hanzo.ai", blurb: "API keys, projects, and products." },
  { id: "billing", label: "Billing", href: "https://billing.hanzo.ai", domain: "billing.hanzo.ai", blurb: "Subscriptions, usage, and invoices." },
  { id: "account", label: "Account", href: "https://hanzo.id/account", domain: "hanzo.id", blurb: "Profile, organizations, and security." },
  { id: "admin", label: "Admin", href: "https://admin.hanzo.ai", domain: "admin.hanzo.ai", blurb: "Platform administration." },
  { id: "gateway", label: "Gateway", href: "https://console.hanzo.ai/gateway", domain: "console.hanzo.ai", blurb: "The unified AI API gateway." },
  { id: "platform", label: "Platform", href: "https://platform.hanzo.ai", domain: "platform.hanzo.ai", blurb: "Deploy and scale services." },
]

/** The full launcher registry, in order: root, the six products, then platform. */
export const SURFACES: Surface[] = [rootSurface, ...productSurfaces, ...platformSurfaces]

const BY_ID = new Map<string, Surface>(SURFACES.map((s) => [s.id, s]))

/** Look up a surface by id; `undefined` when unknown. */
export const surfaceById = (id: string): Surface | undefined => BY_ID.get(id)

/** Every surface except `current` — a launcher never links to itself. */
export const otherSurfaces = (current?: SurfaceId): Surface[] =>
  current ? SURFACES.filter((s) => s.id !== current) : SURFACES
