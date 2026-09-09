import { describe, expect, it } from "vitest"
import { HEADERS, findHeader, type SiteId } from "./header"
import { findProduct } from "./family"

const SITES: SiteId[] = ["hanzo.ai", "hanzo.chat", "hanzo.app", "hanzo.team", "studio.hanzo.ai", "hanzo.bot", "cloud.hanzo.ai"]

describe("HEADERS — per-property header config", () => {
  it("covers exactly the seven properties", () => {
    expect(Object.keys(HEADERS).sort()).toEqual([...SITES].sort())
  })

  it("each header's productId resolves to a real product", () => {
    const map: Record<SiteId, string> = {
      "hanzo.ai": "hanzo",
      "hanzo.chat": "chat",
      "hanzo.app": "app",
      "hanzo.team": "team",
      "studio.hanzo.ai": "studio",
      "hanzo.bot": "bot",
      "cloud.hanzo.ai": "cloud",
    }
    for (const site of SITES) {
      expect(HEADERS[site].productId).toBe(map[site])
      expect(findProduct(HEADERS[site].productId)).toBeDefined()
    }
  })

  it("carries the spec's local nav labels per site", () => {
    const labels = (site: SiteId) => HEADERS[site].localNav.map((n) => n.label)
    expect(labels("hanzo.ai")).toEqual(["Models", "Solutions", "Developers", "Pricing", "Enterprise"])
    expect(labels("hanzo.chat")).toEqual(["Features", "Models", "Agents", "Download", "Pricing"])
    expect(labels("hanzo.app")).toEqual(["Community", "Features", "Templates", "Gallery", "Pricing", "Enterprise"])
    expect(labels("hanzo.team")).toEqual(["Product", "Solutions", "Integrations", "Pricing"])
    expect(labels("studio.hanzo.ai")).toEqual(["Models", "Agents", "Evaluations", "Docs"])
    expect(labels("hanzo.bot")).toEqual(["Docs", "Channels", "Pricing"])
    expect(labels("cloud.hanzo.ai")).toEqual(["Products", "Solutions", "Developers", "Pricing", "Docs"])
  })

  it("carries the spec's primary action label per site", () => {
    const action = (site: SiteId) => HEADERS[site].action.label
    expect(action("hanzo.ai")).toBe("Open Chat")
    expect(action("hanzo.chat")).toBe("New chat")
    expect(action("hanzo.app")).toBe("New project")
    expect(action("hanzo.team")).toBe("Open workspace")
    expect(action("studio.hanzo.ai")).toBe("Create")
    expect(action("hanzo.bot")).toBe("Create bot")
    expect(action("cloud.hanzo.ai")).toBe("Open console")
  })

  it("every nav + action href is non-empty, and no local nav repeats an id", () => {
    for (const site of SITES) {
      const h = HEADERS[site]
      expect(h.action.label).toBeTruthy()
      expect(h.action.href).toBeTruthy()
      for (const n of h.localNav) {
        expect(n.label).toBeTruthy()
        expect(n.href).toBeTruthy()
      }
      const ids = h.localNav.map((n) => n.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it("findHeader resolves a site and is undefined for an unknown one", () => {
    expect(findHeader("hanzo.chat")).toBe(HEADERS["hanzo.chat"])
    expect(findHeader("example.com")).toBeUndefined()
  })
})
