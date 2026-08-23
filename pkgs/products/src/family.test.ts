import { describe, expect, it } from "vitest"
import { FAMILY, ROOT, PRODUCTS, findProduct, type MenuVerb } from "./family"
import { DESTINATIONS } from "./destinations"

describe("FAMILY — exactly the six flagship products", () => {
  it("has exactly six products", () => {
    expect(FAMILY).toHaveLength(6)
  })

  it("is the canonical journey order chat → app → team → studio → bot → cloud", () => {
    expect(FAMILY.map((p) => p.id)).toEqual(["chat", "app", "team", "studio", "bot", "cloud"])
  })

  it("assigns each product its one menu verb, one each", () => {
    const byId = Object.fromEntries(FAMILY.map((p) => [p.id, p.verb]))
    expect(byId).toEqual({
      chat: "Use",
      app: "Build",
      team: "Work",
      studio: "Create AI",
      bot: "Deploy",
      cloud: "Operate",
    })
    const verbs = FAMILY.map((p) => p.verb)
    expect(new Set(verbs).size).toBe(6) // all distinct
    const expected: MenuVerb[] = ["Use", "Build", "Work", "Create AI", "Deploy", "Operate"]
    expect(new Set(verbs)).toEqual(new Set(expected))
  })
})

describe("ROOT — the hanzo.ai umbrella", () => {
  it("is id 'hanzo' on hanzo.ai and carries no verb", () => {
    expect(ROOT.id).toBe("hanzo")
    expect(ROOT.domain).toBe("hanzo.ai")
    expect(ROOT.url).toBe("https://hanzo.ai")
    expect(ROOT.verb).toBeUndefined()
  })
  it("its action is Open Chat (per the header table)", () => {
    expect(ROOT.action).toEqual({ label: "Open Chat", href: "https://hanzo.chat" })
  })
})

describe("every product row is complete and honest", () => {
  it("has non-empty name/short/domain/url/job and an action with label+href", () => {
    for (const p of PRODUCTS) {
      expect(p.id).toBeTruthy()
      expect(p.name).toBeTruthy()
      expect(p.short).toBeTruthy()
      expect(p.domain).toBeTruthy()
      expect(p.job).toBeTruthy()
      expect(p.action.label).toBeTruthy()
      expect(p.action.href).toBeTruthy()
    }
  })

  it("url is always https://<domain>", () => {
    for (const p of PRODUCTS) expect(p.url).toBe(`https://${p.domain}`)
  })

  it("every action href is an absolute https URL", () => {
    for (const p of PRODUCTS) expect(p.action.href).toMatch(/^https:\/\//)
  })

  it("has no duplicate ids across root + family", () => {
    const ids = PRODUCTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("family ↔ destinations consistency", () => {
  it("Cloud's entry point is the developer console destination", () => {
    expect(findProduct("cloud")!.url).toBe(DESTINATIONS.console)
  })
})

describe("findProduct", () => {
  it("finds root and family members", () => {
    expect(findProduct("hanzo")).toBe(ROOT)
    expect(findProduct("studio")!.name).toBe("Hanzo Studio")
  })
  it("returns undefined for an unknown id", () => {
    expect(findProduct("nope")).toBeUndefined()
  })
})
