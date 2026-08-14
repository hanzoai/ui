import { describe, expect, it } from "vitest"
import type { CatalogEntry, ProductCategory } from "./types"
import { docsCoverage, docsServicesMeta, docsSlugOf } from "./docs"

const mk = (id: string, category: ProductCategory, docsSlug = id): CatalogEntry => ({
  id,
  name: id,
  category,
  brandColor: "blue",
  iconKey: "Box",
  slug: id,
  route: `/${id}`,
  docsUrl: `https://docs.hanzo.ai/docs/services/${docsSlug}`,
  apiPath: `/v1/${id}`,
  kind: "service",
  pricingId: null,
  brands: [],
})

const fixture: CatalogEntry[] = [
  mk("models", "AI"),
  mk("agents", "AI"),
  mk("kms", "Security"),
  mk("products", "Commerce", "commerce"),
  mk("orders", "Commerce", "commerce"), // collapses to the same docs page
]

describe("docsSlugOf", () => {
  it("is the last path segment of docsUrl", () => {
    expect(docsSlugOf(mk("zero-trust", "Security", "zt"))).toBe("zt")
    expect(docsSlugOf(mk("plans", "Observe", "pricing"))).toBe("pricing")
  })
})

describe("docsServicesMeta — canonical taxonomy applied to docs", () => {
  const meta = docsServicesMeta(fixture)

  it("emits categories as separators in CATEGORY_ORDER, only present ones", () => {
    const seps = meta.pages.filter((p) => p.startsWith("---"))
    expect(seps).toEqual(["---AI---", "---Security---", "---Commerce---"])
  })
  it("lists a category's slugs after its separator, in order", () => {
    const ai = meta.pages.indexOf("---AI---")
    expect(meta.pages[ai + 1]).toBe("models")
    expect(meta.pages[ai + 2]).toBe("agents")
  })
  it("de-duplicates slugs (two commerce products → one 'commerce' page)", () => {
    expect(meta.pages.filter((p) => p === "commerce")).toHaveLength(1)
  })
  it("carries a sane title/icon/defaultOpen", () => {
    expect(meta.title).toBe("Platform")
    expect(meta.icon).toBe("Cloud")
    expect(meta.defaultOpen).toBe(true)
  })
  it("appends docs-only extras under a trailing 'More' group, without duplicating", () => {
    const withExtra = docsServicesMeta(fixture, { extraSlugs: ["sign", "captable", "models"] })
    const more = withExtra.pages.indexOf("---More---")
    expect(more).toBeGreaterThan(-1)
    expect(withExtra.pages.slice(more + 1)).toEqual(["sign", "captable"]) // 'models' already covered
  })

  it("with existingSlugs, lists ONLY pages that exist (no broken links)", () => {
    // only 'models' + 'commerce' have MDX; agents + kms are omitted from nav
    const m = docsServicesMeta(fixture, { existingSlugs: ["models", "commerce"] })
    const navSlugs = m.pages.filter((p) => !p.startsWith("---"))
    expect(navSlugs).toEqual(["models", "commerce"])
    // a category whose only pages are missing drops out entirely
    expect(m.pages).not.toContain("---Security---")
    expect(m.pages).toContain("---AI---")
    expect(m.pages).toContain("---Commerce---")
  })
})

describe("docsCoverage — flags both gaps", () => {
  it("reports catalog products missing a docs page", () => {
    const cov = docsCoverage(fixture, ["models", "commerce"])
    expect(cov.missing.map((m) => m.docsSlug).sort()).toEqual(["agents", "kms"])
    expect(cov.missing.find((m) => m.docsSlug === "kms")!.id).toBe("kms")
  })
  it("reports docs pages that back no catalog product", () => {
    const cov = docsCoverage(fixture, ["models", "agents", "kms", "commerce", "sign", "orphan"])
    expect(cov.missing).toEqual([])
    expect(cov.extra.sort()).toEqual(["orphan", "sign"])
  })
})
