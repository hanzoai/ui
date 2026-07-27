import { describe, expect, it } from "vitest"
import { MEET_HANZO_MENU } from "./menu"
import { FAMILY } from "./family"
import { DESTINATIONS } from "./destinations"

describe("MEET_HANZO_MENU — the launcher model", () => {
  it("leads with the eyebrow and an all-products link to the products index", () => {
    expect(MEET_HANZO_MENU.eyebrow).toBe("AI for every way you build and work.")
    expect(MEET_HANZO_MENU.allProducts.label).toBe("Explore all products")
    expect(MEET_HANZO_MENU.allProducts.href).toBe(DESTINATIONS.products)
  })

  it("the grid IS the six-product family (single source, not a copy)", () => {
    expect(MEET_HANZO_MENU.products).toBe(FAMILY)
    expect(MEET_HANZO_MENU.products).toHaveLength(6)
  })

  it("the utility row is Models · Enso · Managed Agents · Hanzo Dev · MCP Tools · Documentation", () => {
    expect(MEET_HANZO_MENU.utilities.map((l) => l.id)).toEqual(["models", "enso", "agents", "dev", "mcp", "docs"])
    expect(MEET_HANZO_MENU.utilities.map((l) => l.label)).toEqual([
      "Models",
      "Enso",
      "Managed Agents",
      "Hanzo Dev",
      "MCP Tools",
      "Documentation",
    ])
  })

  it("the install row is Desktop · Browser · CLI · SDKs · All downloads", () => {
    expect(MEET_HANZO_MENU.installs.map((l) => l.id)).toEqual(["desktop", "browser", "cli", "sdks", "downloads"])
    // each install link resolves to its pinned destination
    expect(MEET_HANZO_MENU.installs.map((l) => l.href)).toEqual([
      DESTINATIONS.desktop,
      DESTINATIONS.browserExtension,
      DESTINATIONS.cli,
      DESTINATIONS.sdks,
      DESTINATIONS.downloads,
    ])
  })

  it("every menu link has a non-empty label and href, and no row repeats an id", () => {
    for (const row of [MEET_HANZO_MENU.utilities, MEET_HANZO_MENU.installs]) {
      for (const l of row) {
        expect(l.label).toBeTruthy()
        expect(l.href).toBeTruthy()
      }
      const ids = row.map((l) => l.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})
