import { describe, expect, it } from "vitest"
import type { CatalogEntry, ProductCategory } from "./types"
import {
  catalogByCategory,
  catalogByCategoryForBrand,
  catalogForBrand,
  findEntry,
  isAdminEntry,
  resolveCatalog,
  resolveEntry,
} from "./catalog"
import { brandsForCategory } from "./brands"

const mk = (id: string, category: ProductCategory, extra: Partial<CatalogEntry> = {}): CatalogEntry => ({
  id,
  name: id,
  category,
  brandColor: "blue",
  iconKey: "Box",
  slug: id,
  route: `/${id}`,
  docsUrl: `https://docs.hanzo.ai/docs/services/${id}`,
  apiPath: `/v1/${id}`,
  kind: "service",
  pricingId: null,
  brands: [],
  ...extra,
})

const fixture: CatalogEntry[] = [
  mk("models", "AI"),
  mk("gateway", "Network"),
  mk("kms", "Security", { admin: true }),
  mk("tokens", "Web3"),
]

describe("resolveEntry — brands derivation (DRY invariant)", () => {
  it("derives brands from category when the source omits them", () => {
    expect(resolveEntry(mk("x", "AI")).brands).toEqual(brandsForCategory("AI"))
    expect(resolveEntry(mk("y", "Web3")).brands).toEqual(brandsForCategory("Web3"))
  })
  it("keeps an explicit brands list when present", () => {
    expect(resolveEntry(mk("z", "AI", { brands: ["hanzo", "lux"] })).brands).toEqual(["hanzo", "lux"])
  })
  it("is idempotent", () => {
    const once = resolveEntry(mk("a", "Security"))
    expect(resolveEntry(once)).toEqual(once)
  })
})

describe("findEntry / isAdminEntry", () => {
  it("finds by id and flags admin entries", () => {
    expect(findEntry(fixture, "gateway")?.category).toBe("Network")
    expect(findEntry(fixture, "nope")).toBeUndefined()
    expect(isAdminEntry(findEntry(fixture, "kms")!)).toBe(true)
    expect(isAdminEntry(findEntry(fixture, "models")!)).toBe(false)
  })
})

describe("catalogByCategory — grouped in canonical order, empty skipped", () => {
  it("groups present categories in CATEGORY_ORDER and skips empty ones", () => {
    const groups = catalogByCategory(fixture)
    expect(groups.map((g) => g.category)).toEqual(["AI", "Network", "Security", "Web3"])
    expect(groups.every((g) => g.entries.length > 0)).toBe(true)
  })
})

describe("catalogForBrand — category scope", () => {
  it("hanzo sees all; a sovereign brand sees only web3-scope categories", () => {
    expect(catalogForBrand(fixture, "hanzo").length).toBe(4)
    const lux = catalogForBrand(fixture, "lux").map((e) => e.id)
    expect(lux).toContain("tokens") // Web3
    expect(lux).toContain("gateway") // Network
    expect(lux).toContain("kms") // Security
    expect(lux).not.toContain("models") // AI hidden
  })
  it("catalogByCategoryForBrand composes scope + grouping", () => {
    const luxGroups = catalogByCategoryForBrand(fixture, "lux").map((g) => g.category)
    expect(luxGroups).not.toContain("AI")
    expect(luxGroups).toEqual(["Network", "Security", "Web3"])
  })
})

describe("resolveCatalog", () => {
  it("resolves every row's brands", () => {
    const resolved = resolveCatalog(fixture)
    expect(resolved.every((e) => e.brands.length > 0)).toBe(true)
    expect(resolved.find((e) => e.id === "models")!.brands).toEqual(["hanzo"])
  })
})
