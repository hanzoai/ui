/**
 * The unified footer — the ONE footer every property renders. Six columns
 * (Products · AI Platform · Install · Developers · Resources · Company) plus a
 * bottom bar (copyright + legal links). The PRODUCTS column is built from `FAMILY`
 * (single source) plus Dev; the INSTALL column and the shared links resolve from
 * `DESTINATIONS`, so a footer link and its menu twin can never disagree.
 *
 * Links whose address the spec pins go through `DESTINATIONS`; the rest are built
 * from `ORIGIN` on the `hanzo.ai/<slug>` and `docs.hanzo.ai/docs/<slug>` conventions.
 * Every address here resolves against the live properties — no host and no path is
 * a guess. Pure data, React-free.
 */
import type { Link } from "./link"
import { FAMILY } from "./family"
import { DESTINATIONS, ORIGIN } from "./destinations"

/** One footer column — a titled list of links. */
export interface FooterColumn {
  /** Stable id. */
  id: string
  /** The column heading, e.g. `"PRODUCTS"`. */
  title: string
  /** The column's links, in order. */
  links: Link[]
}

/** The full footer model — columns plus the legal bottom bar. */
export interface Footer {
  columns: FooterColumn[]
  legal: {
    /** The copyright line. */
    copyright: string
    /** The bottom-bar legal links. */
    links: Link[]
  }
}

/** The PRODUCTS column: the six family products (short label → entry point) + Dev. */
const productLinks: Link[] = [
  ...FAMILY.map((p) => ({ id: p.id, label: p.short, href: p.url })),
  { id: "dev", label: "Dev", href: `${ORIGIN.root}/dev` },
]

/** The App property — it serves the ecosystem's community page, so resolve it from `FAMILY`. */
const app = FAMILY.find((p) => p.id === "app")!

export const FOOTER: Footer = {
  columns: [
    { id: "products", title: "PRODUCTS", links: productLinks },
    {
      id: "platform",
      title: "AI PLATFORM",
      links: [
        { id: "models", label: "Models", href: DESTINATIONS.models },
        { id: "enso", label: "Enso", href: `${ORIGIN.root}/enso` },
        { id: "agents", label: "Managed Agents", href: `${ORIGIN.root}/agents` },
        { id: "mcp", label: "MCP Tools", href: `${ORIGIN.root}/mcp` },
        { id: "api", label: "API Platform", href: ORIGIN.api },
        { id: "console", label: "Developer Console", href: DESTINATIONS.console },
        { id: "cloud-products", label: "All cloud products", href: DESTINATIONS.cloudProducts },
      ],
    },
    {
      id: "install",
      title: "INSTALL",
      links: [
        { id: "desktop", label: "Desktop", href: DESTINATIONS.desktop },
        { id: "browser", label: "Browser extension", href: DESTINATIONS.browserExtension },
        { id: "cli", label: "Hanzo CLI", href: DESTINATIONS.cli },
        { id: "sdks", label: "SDKs", href: DESTINATIONS.sdks },
        { id: "downloads", label: "All downloads", href: DESTINATIONS.downloads },
      ],
    },
    {
      id: "developers",
      title: "DEVELOPERS",
      links: [
        { id: "docs", label: "Documentation", href: DESTINATIONS.docs },
        { id: "api-reference", label: "API Reference", href: DESTINATIONS.apiReference },
        { id: "sdks", label: "SDKs", href: DESTINATIONS.sdks },
        { id: "mcp", label: "MCP Tools", href: `${ORIGIN.root}/mcp` },
        { id: "cli-reference", label: "CLI Reference", href: `${ORIGIN.docs}/docs/cli` },
        { id: "github", label: "GitHub", href: ORIGIN.github },
      ],
    },
    {
      id: "resources",
      title: "RESOURCES",
      links: [
        { id: "learn", label: "Learn", href: `${ORIGIN.root}/learn` },
        { id: "quickstarts", label: "Quickstarts", href: `${ORIGIN.docs}/docs/getting-started` },
        { id: "community", label: "Community", href: `${app.url}/community` },
        { id: "support", label: "Support", href: `${ORIGIN.root}/support` },
        { id: "status", label: "Status", href: DESTINATIONS.status },
      ],
    },
    {
      id: "company",
      title: "COMPANY",
      links: [
        { id: "about", label: "About", href: `${ORIGIN.root}/about` },
        { id: "customers", label: "Customers", href: `${ORIGIN.root}/customers` },
        { id: "blog", label: "Blog", href: `${ORIGIN.root}/blog` },
        { id: "careers", label: "Careers", href: `${ORIGIN.root}/careers` },
        { id: "enterprise", label: "Enterprise", href: `${ORIGIN.root}/enterprise` },
        { id: "security", label: "Security", href: `${ORIGIN.root}/security` },
      ],
    },
  ],
  legal: {
    copyright: "© 2026 Hanzo AI, Inc.",
    links: [
      { id: "status", label: "Status", href: DESTINATIONS.status },
      { id: "security", label: "Security", href: `${ORIGIN.root}/security` },
      { id: "privacy", label: "Privacy", href: `${ORIGIN.root}/privacy` },
      { id: "terms", label: "Terms", href: `${ORIGIN.root}/terms` },
      { id: "cookies", label: "Cookies", href: `${ORIGIN.root}/cookies` },
    ],
  },
}
