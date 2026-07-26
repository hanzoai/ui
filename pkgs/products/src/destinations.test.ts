import { describe, expect, it } from "vitest"
import { DESTINATIONS, ORIGIN, type Destination } from "./destinations"

describe("DESTINATIONS — the canonical shared addresses (pinned by the spec)", () => {
  it("matches the spec exactly", () => {
    expect(DESTINATIONS).toEqual({
      products: "https://hanzo.ai/products",
      apps: "https://hanzo.ai/apps",
      models: "https://hanzo.ai/models",
      cloudProducts: "https://cloud.hanzo.ai/products",
      downloads: "https://hanzo.app/download",
      browserExtension: "https://hanzo.app/download/browser",
      desktop: "https://hanzo.app/download/desktop",
      vscode: "https://hanzo.app/download/vscode",
      cli: "https://hanzo.app/download/cli",
      sdks: "https://docs.hanzo.ai/developers/sdks",
      docs: "https://docs.hanzo.ai",
      apiReference: "https://docs.hanzo.ai/reference",
      console: "https://cloud.hanzo.ai",
      status: "https://status.hanzo.ai",
    })
  })

  it("every destination is a non-empty absolute https URL", () => {
    for (const key of Object.keys(DESTINATIONS) as Destination[]) {
      const href = DESTINATIONS[key]
      expect(href).toBeTruthy()
      expect(href).toMatch(/^https:\/\//)
    }
  })

  it("never uses an /api/ path prefix", () => {
    for (const href of Object.values(DESTINATIONS)) expect(href).not.toMatch(/\/api(\/|$)/)
  })

  it("composes every destination from an ORIGIN host (no fabricated hosts)", () => {
    const hosts = new Set(Object.values(ORIGIN).map((o) => new URL(o).host))
    for (const href of Object.values(DESTINATIONS)) expect(hosts).toContain(new URL(href).host)
  })
})
