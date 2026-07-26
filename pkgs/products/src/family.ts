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
 * The journey the family tells: Chat is the front door, App builds things, Team runs
 * work, Studio creates intelligence, Bot distributes it, Cloud operates everything.
 *
 * Pure data, React-free.
 */
import type { Action } from "./link"

/** The one verb naming each flagship product's job. Exactly six, one per product. */
export type MenuVerb = "Use" | "Build" | "Work" | "Create AI" | "Deploy" | "Operate"

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
  /** Absolute front-door URL — always `https://<domain>`. */
  url: string
  /** The one job this product owns, in a line. */
  job: string
  /** The menu verb for the six family products; omitted for the root umbrella. */
  verb?: MenuVerb
  /** The mega-menu call-to-action, e.g. `{ label: "Open Chat", href: "https://hanzo.chat" }`. */
  action: Action
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
}

/** The root plus the six family products — the full product set. */
export const PRODUCTS: Product[] = [ROOT, ...FAMILY]

/** Find a product by id across the root + family; `undefined` when unknown. */
export const findProduct = (id: string): Product | undefined => PRODUCTS.find((p) => p.id === id)
