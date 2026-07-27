import { describe, expect, it } from "vitest"
import { FOOTER } from "./footer"
import { FAMILY } from "./family"
import { DESTINATIONS } from "./destinations"

describe("FOOTER — the unified footer", () => {
  it("has exactly the six columns in order", () => {
    expect(FOOTER.columns.map((c) => c.title)).toEqual([
      "PRODUCTS",
      "AI PLATFORM",
      "INSTALL",
      "DEVELOPERS",
      "RESOURCES",
      "COMPANY",
    ])
  })

  it("PRODUCTS column is the six family front doors (single source) plus Dev", () => {
    const products = FOOTER.columns.find((c) => c.id === "products")!
    expect(products.links.map((l) => l.id)).toEqual(["chat", "app", "team", "studio", "bot", "cloud", "dev"])
    // the six product hrefs come straight from FAMILY — they cannot drift
    for (const p of FAMILY) {
      expect(products.links.find((l) => l.id === p.id)!.href).toBe(p.url)
    }
  })

  it("INSTALL column resolves to the pinned install destinations", () => {
    const install = FOOTER.columns.find((c) => c.id === "install")!
    expect(install.links.map((l) => l.href)).toEqual([
      DESTINATIONS.desktop,
      DESTINATIONS.browserExtension,
      DESTINATIONS.cli,
      DESTINATIONS.sdks,
      DESTINATIONS.downloads,
    ])
  })

  it("the legal bottom bar carries the copyright and the five legal links", () => {
    expect(FOOTER.legal.copyright).toBe("© 2026 Hanzo AI, Inc.")
    expect(FOOTER.legal.links.map((l) => l.id)).toEqual(["status", "security", "privacy", "terms", "cookies"])
    // privacy / terms / cookies are top-level pages on the marketing root — the
    // addresses the live site serves (there is no /legal/<slug> namespace).
    for (const id of ["privacy", "terms", "cookies"]) {
      expect(FOOTER.legal.links.find((l) => l.id === id)!.href).toBe(`https://hanzo.ai/${id}`)
    }
    expect(FOOTER.legal.links.find((l) => l.id === "status")!.href).toBe(DESTINATIONS.status)
  })

  it("every footer link has a non-empty label + href, no /api/, and no column repeats an id", () => {
    for (const col of FOOTER.columns) {
      for (const l of col.links) {
        expect(l.label).toBeTruthy()
        expect(l.href).toBeTruthy()
        expect(l.href).not.toMatch(/\/api(\/|$)/)
      }
      const ids = col.links.map((l) => l.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})
