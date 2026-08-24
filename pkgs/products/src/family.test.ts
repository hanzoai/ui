import { describe, expect, it } from "vitest"
import { FAMILY, ROOT, PRODUCTS, familyFor, findProduct, visibleTo, type MenuVerb, type Viewer } from "./family"
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

describe("staged rollout", () => {
  // Day 1 is the smallest honest surface: the three core properties plus the
  // cloud console. Everything else is reachable, by someone, on purpose.
  it("GA is hanzo.ai, chat, app and cloud — and nothing else", () => {
    expect(familyFor("anon").map((p) => p.id).sort()).toEqual(["app", "chat", "cloud"])
    expect(ROOT.stage).toBe("ga")
  })

  it("beta adds bot and team for a signed-in customer, and no more", () => {
    const gained = familyFor("customer")
      .filter((p) => !familyFor("anon").includes(p))
      .map((p) => p.id)
      .sort()
    expect(gained).toEqual(["bot", "team"])
  })

  it("studio is alpha — staff only, and invisible to a customer", () => {
    expect(FAMILY.find((p) => p.id === "studio")!.stage).toBe("alpha")
    expect(familyFor("customer").some((p) => p.id === "studio")).toBe(false)
    expect(familyFor("staff").some((p) => p.id === "studio")).toBe(true)
  })

  // The rule is an ordering, so reach only ever widens. A stage that let an anon
  // see more than a customer would be a hole no per-surface check could close.
  it("reach is monotone: anon ⊆ customer ⊆ staff", () => {
    const ids = (v: Viewer) => new Set(familyFor(v).map((p) => p.id))
    const [a, c, s] = [ids("anon"), ids("customer"), ids("staff")]
    expect([...a].every((id) => c.has(id))).toBe(true)
    expect([...c].every((id) => s.has(id))).toBe(true)
    expect(s.size).toBe(FAMILY.length)
  })

  it("every product declares a stage — silence must not read as GA", () => {
    for (const p of [ROOT, ...FAMILY]) expect(p.stage).toBeDefined()
  })
})
