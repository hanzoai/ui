/**
 * The Hanzo product family — the SIX flagship products the "Meet Hanzo" menu leads
 * with, plus the `hanzo.ai` root. This is the single source of truth for the family:
 * the mega-menu grid (`./menu`), the footer PRODUCTS column (`./footer`), the
 * per-site header identity (`./header`), and the launcher's product tiles
 * (`./surfaces`) all read it, so a product's name / domain / job / action can never
 * drift across surfaces.
 *
 * Each product owns exactly ONE job, named by its menu verb:
 *   Chat → Use · App → Build · Team → Work · Studio → Create AI · Bot → Deploy · Cloud → Operate.
 * The journey the family tells: Chat is the entry point, App builds things, Team runs
 * work, Studio creates intelligence, Bot distributes it, Cloud operates everything.
 *
 * Pure data, React-free.
 */
import type { Action } from "./link"

/** The one verb naming each flagship product's job. Exactly six, one per product. */
export type MenuVerb =
  | "Use"
  | "Build"
  | "Work"
  | "Create AI"
  | "Deploy"
  | "Operate"

/**
 * How far a product has rolled out, and therefore WHO may see and use it.
 *
 * This is NOT `ProductStatus` (`enabled` | `soon`), which answers whether a
 * product EXISTS. A thing can exist and still not be yours to open. One field,
 * three readers: the menus decide whether to offer it, the surface decides
 * whether to serve it, and a marketing page decides whether to claim it — so a
 * product cannot be hidden in the launcher and advertised on the home page.
 *
 *   ga    — everyone, signed in or not.
 *   beta  — any signed-in customer. Discoverable and usable; not yet promised.
 *   alpha — Hanzo staff only.
 *
 * `alpha` deliberately reuses the ONE identity predicate this fleet already has
 * — membership of the reserved `admin` org (SuperAdmin) — rather than a list of
 * addresses. A list is a second source of truth for who someone is, it drifts
 * the day somebody joins, and it cannot be revoked centrally. Widening alpha to
 * a cohort later is an IAM group, still asked here, still one predicate.
 */
export type Stage = "alpha" | "beta" | "ga"

/** What a viewer is, as far as staged rollout cares. Nothing finer is needed. */
export type Viewer = "anon" | "customer" | "staff"

/** Viewers rank, so the rules below are an ordering and not a pile of cases. */
const RANK: Record<Viewer, number> = { anon: 0, customer: 1, staff: 2 }

/**
 * Being OFFERED a product and being LET IN are different questions, and a stage
 * answers both — with different floors.
 *
 * Collapsing them into one predicate hides three products to hide one. Studio is
 * the only thing not ready to be SEEN; Bot and Team are ready to be seen by
 * anyone and ready to be opened by a customer. A menu renders to an anonymous
 * reader, so one predicate at the anonymous floor drops Bot and Team out of the
 * public footer too — measured: Studio was linked from five live surfaces, all
 * anonymous loads, and all five are this package's menu and footer.
 *
 * A marketing site's whole job is offering something you cannot use yet. So
 * `see` is about SECRECY and `open` is about READINESS, and only alpha is
 * secret.
 */
const FLOOR: Record<Stage, { see: Viewer; open: Viewer }> = {
  ga: { see: "anon", open: "anon" },
  beta: { see: "anon", open: "customer" },
  alpha: { see: "staff", open: "staff" },
}

const reaches = (viewer: Viewer, floor: Viewer): boolean =>
  RANK[viewer] >= RANK[floor]

/** Whether `viewer` may be shown a product at `stage` at all. */
export const listed = (stage: Stage, viewer: Viewer): boolean =>
  reaches(viewer, FLOOR[stage].see)

/** Whether `viewer` may actually open a product at `stage`. */
export const admits = (stage: Stage, viewer: Viewer): boolean =>
  reaches(viewer, FLOOR[stage].open)

/** The products `viewer` may be shown, in canonical order. What a menu renders. */
export const listing = (viewer: Viewer): Product[] =>
  FAMILY.filter((p) => listed(p.stage, viewer))

/** One product in the family — the unit the menu grid, footer, and headers render. */
export interface Product {
  /** Stable id and glyph key (e.g. `"chat"`); `"hanzo"` is the root. Unique. */
  id: string
  /** Full display name, e.g. `"Hanzo Chat"`. */
  name: string
  /** Short label for dense surfaces (grid tiles, launcher), e.g. `"Chat"`. */
  short: string
  /** The property's domain, shown as a subtitle, e.g. `"hanzo.chat"`. */
  domain: string
  /** Absolute entry-point URL — always `https://<domain>`. */
  url: string
  /** The one job this product owns, in a line. */
  job: string
  /** The menu verb for the six family products; omitted for the root umbrella. */
  verb?: MenuVerb
  /** The mega-menu call-to-action, e.g. `{ label: "Open Chat", href: "https://hanzo.chat" }`. */
  action: Action
  /** How far it has rolled out, and so who may see it. See `Stage`. */
  stage: Stage
}

/**
 * The six flagship products, in the canonical journey order
 * (Chat → App → Team, then Studio → Bot → Cloud). Order IS the menu-grid order.
 */
export const FAMILY: Product[] = [
  {
    id: "chat",
    name: "Hanzo Chat",
    short: "Chat",
    domain: "hanzo.chat",
    url: "https://hanzo.chat",
    job: "Talk to Hanzo — use models and agents.",
    verb: "Use",
    action: { label: "Open Chat", href: "https://hanzo.chat" },
    stage: "ga",
  },
  {
    id: "app",
    name: "Hanzo App",
    short: "App",
    domain: "hanzo.app",
    url: "https://hanzo.app",
    job: "Build AI websites and apps.",
    verb: "Build",
    action: { label: "Start building", href: "https://hanzo.app" },
    stage: "ga",
  },
  {
    id: "team",
    name: "Hanzo Team",
    short: "Team",
    domain: "hanzo.team",
    url: "https://hanzo.team",
    job: "Shared work and AI coworkers — channels, projects, tasks, and knowledge.",
    verb: "Work",
    action: { label: "Open Team", href: "https://hanzo.team" },
    stage: "beta",
  },
  {
    id: "studio",
    name: "Hanzo Studio",
    short: "Studio",
    domain: "studio.hanzo.ai",
    url: "https://studio.hanzo.ai",
    job: "Design, test, evaluate, and version models, prompts, tools, and agents.",
    verb: "Create AI",
    action: { label: "Open Studio", href: "https://studio.hanzo.ai" },
    stage: "alpha",
  },
  {
    id: "bot",
    name: "Hanzo Bot",
    short: "Bot",
    domain: "hanzo.bot",
    url: "https://hanzo.bot",
    job: "Publish agents to your site, support, Slack, Discord, and channels.",
    verb: "Deploy",
    action: { label: "Create a bot", href: "https://hanzo.bot" },
    stage: "beta",
  },
  {
    id: "cloud",
    name: "Hanzo Cloud",
    short: "Cloud",
    domain: "cloud.hanzo.ai",
    url: "https://cloud.hanzo.ai",
    job: "Run the infrastructure — deploy, observe, secure, and bill.",
    verb: "Operate",
    action: { label: "Open Cloud", href: "https://cloud.hanzo.ai" },
    stage: "ga",
  },
]

/** The `hanzo.ai` root — the umbrella brand, not one of the six verb-products. */
export const ROOT: Product = {
  id: "hanzo",
  name: "Hanzo",
  short: "Hanzo",
  domain: "hanzo.ai",
  url: "https://hanzo.ai",
  job: "AI for every way you build and work.",
  action: { label: "Open Chat", href: "https://hanzo.chat" },
  // The umbrella is the front door; it is never staged behind anything it leads to.
  stage: "ga",
}

/** The root plus the six family products — the full product set. */
export const PRODUCTS: Product[] = [ROOT, ...FAMILY]

/** Find a product by id across the root + family; `undefined` when unknown. */
export const findProduct = (id: string): Product | undefined =>
  PRODUCTS.find((p) => p.id === id)
