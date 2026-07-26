/**
 * The launcher surface registry — the ONE cross-surface app-switcher list. It
 * subsumes the two lists that used to drift: `SURFACES` (hanzoai/ui
 * `pkg/ui/.../surfaces.data.ts`), which now re-exports from here, and
 * `HANZO_APPS` (hanzoai/gui `@hanzogui/shell`), whose shared ids are all
 * represented here and which points back at this registry once that repo takes
 * the dependency. Add or reorder a surface ONCE and every launcher that sources
 * this moves together.
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
import { ORIGIN } from "./destinations"

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

/**
 * Launcher-only surfaces — real properties that are not flagship products. Hosts
 * come from `ORIGIN` and the subtitle is the href's own host, so a surface's tile
 * can never name a domain it does not open.
 */
const platform = (id: SurfaceId, label: string, href: string, blurb: string): Surface => ({
  id,
  label,
  href,
  domain: new URL(href).host,
  blurb,
})

const platformSurfaces: Surface[] = [
  platform("console", "Console", ORIGIN.console, "API keys, projects, and products."),
  platform("billing", "Billing", ORIGIN.billing, "Subscriptions, usage, and invoices."),
  platform("account", "Account", `${ORIGIN.id}/account`, "Profile, organizations, and security."),
  platform("admin", "Admin", ORIGIN.admin, "Platform administration."),
  platform("gateway", "Gateway", `${ORIGIN.console}/gateway`, "The unified AI API gateway."),
  platform("platform", "Platform", ORIGIN.platform, "Deploy and scale services."),
]

/** The full launcher registry, in order: root, the six products, then platform. */
export const SURFACES: Surface[] = [rootSurface, ...productSurfaces, ...platformSurfaces]

const BY_ID = new Map<string, Surface>(SURFACES.map((s) => [s.id, s]))

/** Look up a surface by id; `undefined` when unknown. */
export const surfaceById = (id: string): Surface | undefined => BY_ID.get(id)

/** Every surface except `current` — a launcher never links to itself. */
export const otherSurfaces = (current?: SurfaceId): Surface[] =>
  current ? SURFACES.filter((s) => s.id !== current) : SURFACES
