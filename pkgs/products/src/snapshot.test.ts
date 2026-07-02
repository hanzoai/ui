import { describe, expect, it } from "vitest"
import { SNAPSHOT } from "./snapshot"
import { CATEGORY_ORDER } from "./categories"
import { isSwatchKey } from "./colors"
import { brandsForCategory } from "./brands"

// Integrity + drift guard over the checked-in snapshot (the fallback + seed).
// If any of these fail, the catalog is malformed BEFORE it ever reaches commerce.

describe("snapshot integrity", () => {
  it("holds the full 92-product catalog", () => {
    expect(SNAPSHOT.length).toBe(92)
  })

  it("every id and slug is unique", () => {
    expect(new Set(SNAPSHOT.map((e) => e.id)).size).toBe(SNAPSHOT.length)
    expect(new Set(SNAPSHOT.map((e) => e.slug)).size).toBe(SNAPSHOT.length)
  })

  it("every category is one of the 10 canonical", () => {
    for (const e of SNAPSHOT) expect(CATEGORY_ORDER).toContain(e.category)
  })

  it("holds NONE of the cut categories (Training/Dev/Settings)", () => {
    const cats = new Set(SNAPSHOT.map((e) => e.category))
    for (const gone of ["Training", "Dev", "Settings"]) expect(cats.has(gone as never)).toBe(false)
  })

  it("every brandColor is a real swatch key (colorToken -> css never falls through)", () => {
    for (const e of SNAPSHOT) expect(isSwatchKey(e.brandColor), `${e.id} -> ${e.brandColor}`).toBe(true)
  })

  it("every name and iconKey is a non-empty string", () => {
    for (const e of SNAPSHOT) {
      expect(e.name.length, e.id).toBeGreaterThan(0)
      expect(typeof e.iconKey === "string" && e.iconKey.length > 0, e.id).toBe(true)
    }
  })

  it("every route is /<slug> and every docsUrl is under the docs services base", () => {
    for (const e of SNAPSHOT) {
      expect(e.route, e.id).toBe(`/${e.slug}`)
      expect(e.docsUrl.startsWith("https://docs.hanzo.ai/docs/services/"), e.id).toBe(true)
    }
  })

  it("every apiPath is /v1-prefixed (nothing before /v1)", () => {
    for (const e of SNAPSHOT) expect(e.apiPath, e.id).toMatch(/^\/v1(\/|$)/)
  })

  it("pricingId is a non-empty string or null", () => {
    for (const e of SNAPSHOT) {
      expect(e.pricingId === null || (typeof e.pricingId === "string" && e.pricingId.length > 0), e.id).toBe(true)
    }
  })

  it("brands on every row EQUAL the category derivation (no drift baked in)", () => {
    for (const e of SNAPSHOT) expect(e.brands, e.id).toEqual(brandsForCategory(e.category))
  })

  it("admin flags are the known global-managed set", () => {
    const admins = SNAPSHOT.filter((e) => e.admin).map((e) => e.id).sort()
    expect(admins).toEqual(["audit", "clusters", "iam", "kms", "kubernetes", "providers", "secrets"])
  })
})
