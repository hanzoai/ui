import { describe, expect, it } from "vitest"

import { DESTINATIONS } from "./destinations"
import {
  admits,
  FAMILY,
  findProduct,
  listed,
  listing,
  PRODUCTS,
  ROOT,
  type MenuVerb,
  type Viewer,
} from "./family"

describe("FAMILY — exactly the six flagship products", () => {
  it("has exactly six products", () => {
    expect(FAMILY).toHaveLength(6)
  })

  it("is the canonical journey order chat → app → team → studio → bot → cloud", () => {
    expect(FAMILY.map((p) => p.id)).toEqual([
      "chat",
      "app",
      "team",
      "studio",
      "bot",
      "cloud",
    ])
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
    const expected: MenuVerb[] = [
      "Use",
      "Build",
      "Work",
      "Create AI",
      "Deploy",
      "Operate",
    ]
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
    expect(ROOT.action).toEqual({
      label: "Open Chat",
      href: "https://hanzo.chat",
    })
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
  const ids = (v: Viewer) => listing(v).map((p) => p.id)

  it("offers everything but the secret one to a stranger", () => {
    // The floor for being SEEN is anonymous for ga and beta alike: a marketing
    // site's job is offering what you cannot use yet. Only alpha is secret.
    expect(ids("anon")).toEqual(["chat", "app", "team", "bot", "cloud"])
    expect(ids("anon")).not.toContain("studio")
  })

  it("hides studio from a customer and shows it to staff", () => {
    expect(ids("customer")).not.toContain("studio")
    expect(ids("staff")).toContain("studio")
    expect(listing("staff")).toHaveLength(FAMILY.length)
  })

  it("offers beta to a stranger but does not let them in", () => {
    // The whole reason `listed` and `admits` are two questions. Collapsing them
    // hid bot and team from the public footer -- including hanzo.bot's own.
    for (const p of FAMILY.filter((p) => p.stage === "beta")) {
      expect(listed(p.stage, "anon"), `${p.id} must be offered`).toBe(true)
      expect(admits(p.stage, "anon"), `${p.id} must not open`).toBe(false)
      expect(admits(p.stage, "customer")).toBe(true)
    }
  })

  it("never admits what it does not offer", () => {
    // The invariant that makes the two floors safe to state separately: a door
    // you cannot see is one you cannot be let through.
    for (const p of FAMILY)
      for (const v of ["anon", "customer", "staff"] as const)
        if (admits(p.stage, v))
          expect(listed(p.stage, v), `${p.id}/${v}`).toBe(true)
  })

  it("widens monotonically, so a stranger never sees more than staff", () => {
    expect(ids("anon").every((id) => ids("customer").includes(id))).toBe(true)
    expect(ids("customer").every((id) => ids("staff").includes(id))).toBe(true)
  })

  it("gives every product a stage", () => {
    for (const p of FAMILY) expect(["alpha", "beta", "ga"]).toContain(p.stage)
  })
})
