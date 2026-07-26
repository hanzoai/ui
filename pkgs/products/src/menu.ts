/**
 * The "Meet Hanzo" mega-menu — the launcher every property's header opens. It leads
 * with the six-product grid (NOT a 9-dot of utilities), then a slim utility row,
 * then an install row. The grid IS `FAMILY` (single source); the two rows are links
 * into the platform and the installs.
 *
 * Pure data, React-free — a renderer maps each `Link.id` to its own glyph.
 */
import type { Link } from "./link"
import type { Product } from "./family"
import { FAMILY } from "./family"
import { DESTINATIONS, ORIGIN } from "./destinations"

/** The full Meet Hanzo menu model. */
export interface MeetHanzoMenu {
  /** The one-line positioning above the grid. */
  eyebrow: string
  /** The "Explore all products →" link to the products index. */
  allProducts: Link
  /** The six-product grid — each cell renders its product's name, job, and action. */
  products: Product[]
  /** The slim utility row under the grid. */
  utilities: Link[]
  /** The install row at the foot of the menu. */
  installs: Link[]
}

export const MEET_HANZO_MENU: MeetHanzoMenu = {
  eyebrow: "AI for every way you build and work.",
  allProducts: { id: "all-products", label: "Explore all products", href: DESTINATIONS.products },
  products: FAMILY,
  utilities: [
    { id: "models", label: "Models", href: DESTINATIONS.models },
    { id: "enso", label: "Enso", href: `${ORIGIN.root}/enso` },
    { id: "agents", label: "Managed Agents", href: `${ORIGIN.root}/agents` },
    { id: "dev", label: "Hanzo Dev", href: `${ORIGIN.root}/dev` },
    { id: "mcp", label: "MCP Tools", href: `${ORIGIN.root}/mcp` },
    { id: "docs", label: "Documentation", href: DESTINATIONS.docs },
  ],
  installs: [
    { id: "desktop", label: "Desktop app", href: DESTINATIONS.desktop },
    { id: "browser", label: "Browser extension", href: DESTINATIONS.browserExtension },
    { id: "vscode", label: "VS Code", href: DESTINATIONS.vscode },
    { id: "cli", label: "CLI", href: DESTINATIONS.cli },
    { id: "sdks", label: "SDKs", href: DESTINATIONS.sdks },
    { id: "downloads", label: "All downloads", href: DESTINATIONS.downloads },
  ],
}
