import { describe, expect, it } from "vitest"
import { DESTINATIONS, ORIGIN, type Destination } from "./destinations"

describe("DESTINATIONS — the canonical shared addresses (pinned by the spec)", () => {
  it("matches the spec exactly", () => {
    expect(DESTINATIONS).toEqual({
      products: "https://hanzo.ai/products",
      apps: "https://docs.hanzo.ai/docs/apps",
      models: "https://hanzo.ai/models",
      cloudProducts: "https://cloud.hanzo.ai/products",
      downloads: "https://hanzo.ai/download",
      browserExtension: "https://hanzo.ai/extension",
      desktop: "https://hanzo.ai/desktop",
      cli: "https://hanzo.ai/cli",
      sdks: "https://hanzo.ai/sdks",
      docs: "https://docs.hanzo.ai",
      apiReference: "https://docs.hanzo.ai/reference",
      console: "https://cloud.hanzo.ai",
      status: "https://status.hanzo.ai",
      community: "https://hanzo.ai/community",
    })
  })

  it("ORIGIN names each host exactly once (it is the only place a host lives)", () => {
    const hosts = Object.values(ORIGIN).map((o) => new URL(o).host)
    expect(new Set(hosts).size).toBe(hosts.length)
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
