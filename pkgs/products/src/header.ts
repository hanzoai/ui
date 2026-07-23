/**
 * Per-property header config — the ONE shared header renders the same everywhere;
 * only the current product, its site-local nav, and its primary action change.
 * `HEADERS` maps each of the seven properties to that delta.
 *
 * `productId` ties the header to `FAMILY`/`ROOT` (the brand mark + Meet Hanzo menu
 * are the same everywhere and come from there). Local-nav items are site-relative
 * `/slug` paths (each site serves its own), except the ones that are inherently a
 * shared destination (Docs, Download) which resolve from `DESTINATIONS`. Primary
 * actions are absolute when they cross to another property (hanzo.ai → Open Chat)
 * and site-relative when they act in place (New chat, Create bot, …).
 *
 * Pure data, React-free.
 */
import type { Action, Link } from "./link"
import { DESTINATIONS } from "./destinations"

/** The seven canonical Hanzo properties. */
export type SiteId =
  | "hanzo.ai"
  | "hanzo.chat"
  | "hanzo.app"
  | "hanzo.team"
  | "studio.hanzo.ai"
  | "hanzo.bot"
  | "cloud.hanzo.ai"

/** The header delta for one property. */
export interface SiteHeader {
  /** The property. */
  site: SiteId
  /** Which product this property is — a `FAMILY`/`ROOT` id (`findProduct`). */
  productId: string
  /** The site-local navigation, in order. */
  localNav: Link[]
  /** The property's primary call-to-action. */
  action: Action
}

const slug = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

/** A site-local nav link; defaults to a `/slug` path, overridable for shared destinations. */
const nav = (label: string, href?: string): Link => ({ id: slug(label), label, href: href ?? `/${slug(label)}` })

export const HEADERS: Record<SiteId, SiteHeader> = {
  "hanzo.ai": {
    site: "hanzo.ai",
    productId: "hanzo",
    localNav: [nav("Models"), nav("Solutions"), nav("Developers"), nav("Pricing"), nav("Enterprise")],
    action: { label: "Open Chat", href: "https://hanzo.chat" },
  },
  "hanzo.chat": {
    site: "hanzo.chat",
    productId: "chat",
    localNav: [nav("Features"), nav("Models"), nav("Agents"), nav("Download", DESTINATIONS.downloads), nav("Pricing")],
    action: { label: "New chat", href: "/new" },
  },
  "hanzo.app": {
    site: "hanzo.app",
    productId: "app",
    localNav: [nav("Product"), nav("Templates"), nav("Showcase"), nav("Pricing"), nav("Enterprise")],
    action: { label: "New project", href: "/new" },
  },
  "hanzo.team": {
    site: "hanzo.team",
    productId: "team",
    localNav: [nav("Product"), nav("Solutions"), nav("Integrations"), nav("Pricing")],
    action: { label: "Open workspace", href: "/" },
  },
  "studio.hanzo.ai": {
    site: "studio.hanzo.ai",
    productId: "studio",
    localNav: [nav("Models"), nav("Agents"), nav("Evaluations"), nav("Docs", DESTINATIONS.docs)],
    action: { label: "Create", href: "/new" },
  },
  "hanzo.bot": {
    site: "hanzo.bot",
    productId: "bot",
    localNav: [nav("Product"), nav("Channels"), nav("Templates"), nav("Pricing")],
    action: { label: "Create bot", href: "/new" },
  },
  "cloud.hanzo.ai": {
    site: "cloud.hanzo.ai",
    productId: "cloud",
    localNav: [nav("Products"), nav("Solutions"), nav("Developers"), nav("Pricing"), nav("Docs", DESTINATIONS.docs)],
    action: { label: "Open console", href: "/" },
  },
}

/** Look up a property's header by site; `undefined` when unknown. */
export const findHeader = (site: string): SiteHeader | undefined =>
  site in HEADERS ? HEADERS[site as SiteId] : undefined
