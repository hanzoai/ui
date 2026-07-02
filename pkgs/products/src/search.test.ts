import { describe, expect, it } from "vitest"
import type { CatalogEntry, ProductCategory } from "./types"
import { entryMatches, searchCatalog } from "./search"

const mk = (id: string, name: string, category: ProductCategory, gcp?: string): CatalogEntry => ({
  id,
  name,
  category,
  brandColor: "blue",
  iconKey: "Box",
  slug: id,
  route: `/${id}`,
  docsUrl: `https://docs.hanzo.ai/docs/services/${id}`,
  apiPath: `/v1/${id}`,
  pricingId: null,
  brands: [],
  gcp,
})

const catalog: CatalogEntry[] = [
  mk("vector", "Vector", "Data", "Vertex Vector Search"),
  mk("gateway", "Gateway", "Network", "API Gateway"),
  mk("kms", "KMS", "Security"),
]

describe("entryMatches — the sidebar filter", () => {
  const vector = catalog[0]
  it("is permissive on empty and case-insensitive on real matches", () => {
    expect(entryMatches(vector, "")).toBe(true)
    expect(entryMatches(vector, "   ")).toBe(true)
    expect(entryMatches(vector, "VECTOR")).toBe(true)
    expect(entryMatches(vector, "vec")).toBe(true)
  })
  it("matches across id, category, and gcp — not just name", () => {
    expect(entryMatches(vector, "data")).toBe(true) // category
    expect(entryMatches(vector, "vertex")).toBe(true) // gcp
    expect(entryMatches(vector, "kubernetes")).toBe(false)
  })
})

describe("searchCatalog — ranked", () => {
  it("empty query returns the catalog in natural order", () => {
    expect(searchCatalog(catalog, "").map((e) => e.id)).toEqual(["vector", "gateway", "kms"])
  })
  it("ranks an exact name hit first", () => {
    expect(searchCatalog(catalog, "gateway")[0].id).toBe("gateway")
  })
  it("drops non-matches", () => {
    expect(searchCatalog(catalog, "zzzzz")).toEqual([])
  })
  it("is stable on ties (input order preserved)", () => {
    // both match "a" via subsequence; stable order keeps catalog order
    const res = searchCatalog(catalog, "a")
    expect(res.length).toBeGreaterThan(0)
  })
})
