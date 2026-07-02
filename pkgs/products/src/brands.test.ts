import { describe, it, expect } from "vitest"
import { CATEGORY_ORDER, CATEGORY_SUMMARY, categorySlug, categoryFromSlug } from "./categories"
import {
  ALL_BRANDS,
  BRAND_CATEGORIES,
  categoriesForBrand,
  categoryInBrand,
  brandsForCategory,
  ALL_NODE_NETWORKS,
  BRAND_NODE_NETWORKS,
  nodeNetworksForBrand,
  type NodeNetworkId,
} from "./brands"
import type { BrandId, ProductCategory } from "./types"

// Ported from console2 registry-brand.test.ts. Proves the per-brand catalog scope
// (hanzo = full AI cloud; lux/zoo/pars = web3/bootnode admin) and the brands
// derivation. Pure (brand passed in), so no hostname mocking.

// The sovereign-console category scope (lux/zoo/pars) and its complement — the
// hanzo-only AI-cloud categories. Together they PARTITION CATEGORY_ORDER (10).
const SOVEREIGN_CATS: ProductCategory[] = ["Web3", "Network", "Security", "Platform"]
const HANZO_ONLY_CATS: ProductCategory[] = ["AI", "Compute", "Data", "Observe", "Apps", "Commerce"]
const SOVEREIGN: BrandId[] = ["lux", "zoo", "pars"]

describe("the locked 10-category taxonomy", () => {
  it("CATEGORY_ORDER is exactly the 10 canonical categories, in order", () => {
    expect(CATEGORY_ORDER).toEqual([
      "AI", "Compute", "Data", "Network", "Security",
      "Observe", "Platform", "Web3", "Apps", "Commerce",
    ])
    expect(CATEGORY_ORDER.length).toBe(10)
  })
  it("the cut categories (Training/Dev/Settings) are gone", () => {
    for (const gone of ["Training", "Dev", "Settings"]) {
      expect(CATEGORY_ORDER).not.toContain(gone as ProductCategory)
    }
  })
  it("sovereign + hanzo-only scopes PARTITION CATEGORY_ORDER (no overlap, no gap)", () => {
    expect([...SOVEREIGN_CATS, ...HANZO_ONLY_CATS].sort()).toEqual([...CATEGORY_ORDER].sort())
    for (const c of SOVEREIGN_CATS) expect(HANZO_ONLY_CATS).not.toContain(c)
  })
})

describe("per-brand catalog scope", () => {
  it("hanzo sees every category (full AI cloud)", () => {
    expect(BRAND_CATEGORIES.hanzo).toBeNull()
    expect(categoriesForBrand("hanzo")).toEqual(CATEGORY_ORDER)
    for (const c of CATEGORY_ORDER) expect(categoryInBrand("hanzo", c)).toBe(true)
  })

  for (const brand of SOVEREIGN) {
    describe(`${brand} = sovereign console`, () => {
      it("shows ONLY the sovereign categories, in display order", () => {
        const cats = categoriesForBrand(brand)
        expect(cats).toEqual(CATEGORY_ORDER.filter((c) => SOVEREIGN_CATS.includes(c)))
        expect(new Set(cats)).toEqual(new Set(SOVEREIGN_CATS))
      })
      it("HIDES every hanzo-only AI-cloud category", () => {
        for (const c of HANZO_ONLY_CATS) expect(categoryInBrand(brand, c)).toBe(false)
      })
      it("admits the sovereign categories", () => {
        for (const c of SOVEREIGN_CATS) expect(categoryInBrand(brand, c)).toBe(true)
      })
    })
  }

  it("every brand map key is a known brand; sovereign sets reference real categories", () => {
    for (const brand of Object.keys(BRAND_CATEGORIES) as BrandId[]) {
      expect(ALL_BRANDS).toContain(brand)
      const cats = BRAND_CATEGORIES[brand]
      if (cats === null) continue
      for (const c of cats) expect(CATEGORY_ORDER).toContain(c)
    }
  })
})

describe("brandsForCategory — the per-row brands derivation (single source)", () => {
  it("a hanzo-only AI-cloud category → hanzo only", () => {
    for (const c of HANZO_ONLY_CATS) expect(brandsForCategory(c)).toEqual(["hanzo"])
  })
  it("a sovereign category → every brand", () => {
    for (const c of SOVEREIGN_CATS) expect(brandsForCategory(c)).toEqual(ALL_BRANDS)
  })
  it("is exactly the brands whose scope admits the category (no drift possible)", () => {
    for (const c of CATEGORY_ORDER) {
      expect(brandsForCategory(c)).toEqual(ALL_BRANDS.filter((b) => categoryInBrand(b, c)))
    }
  })
  it("always includes hanzo (the full cloud)", () => {
    for (const c of CATEGORY_ORDER) expect(brandsForCategory(c)).toContain("hanzo")
  })
})

describe("category landing pages", () => {
  it("slugs are lowercase, stable, and round-trip", () => {
    for (const c of CATEGORY_ORDER) {
      expect(categorySlug(c)).toBe(c.toLowerCase())
      expect(categoryFromSlug(categorySlug(c))).toBe(c)
    }
    expect(categorySlug("AI")).toBe("ai")
    expect(categorySlug("Web3")).toBe("web3")
  })
  it("every category maps to a UNIQUE slug", () => {
    const slugs = CATEGORY_ORDER.map(categorySlug)
    expect(new Set(slugs).size).toBe(CATEGORY_ORDER.length)
  })
  it("categoryFromSlug is case-insensitive and null for unknown", () => {
    expect(categoryFromSlug("AI")).toBe("AI")
    expect(categoryFromSlug("ai")).toBe("AI")
    expect(categoryFromSlug("nope")).toBeNull()
    expect(categoryFromSlug("")).toBeNull()
  })
  it("has an honest one-line summary for EVERY category, no stray keys", () => {
    for (const c of CATEGORY_ORDER) {
      expect(typeof CATEGORY_SUMMARY[c]).toBe("string")
      expect(CATEGORY_SUMMARY[c].length).toBeGreaterThan(20)
    }
    expect(Object.keys(CATEGORY_SUMMARY).sort()).toEqual([...CATEGORY_ORDER].sort())
  })
})

describe("per-brand Nodes network scope", () => {
  it("hanzo sees EVERY configured network, in order", () => {
    expect(BRAND_NODE_NETWORKS.hanzo).toBe("all")
    expect(nodeNetworksForBrand("hanzo")).toEqual(ALL_NODE_NETWORKS)
  })
  it("lux sees only the three Lux networks", () => {
    expect(nodeNetworksForBrand("lux")).toEqual(["lux-mainnet", "lux-testnet", "lux-devnet"])
  })
  it("zoo/pars see only their own — no cross-brand leak", () => {
    expect(nodeNetworksForBrand("zoo")).toEqual(["zoo-mainnet"])
    expect(nodeNetworksForBrand("pars")).toEqual(["pars-mainnet"])
    for (const brand of SOVEREIGN) {
      const seen = nodeNetworksForBrand(brand)
      const prefix = brand === "lux" ? "lux" : brand
      expect(seen.filter((n) => !n.startsWith(prefix))).toEqual([])
    }
  })
  it("every brand-scoped network id is a real configured network", () => {
    for (const brand of Object.keys(BRAND_NODE_NETWORKS) as BrandId[]) {
      const cfg = BRAND_NODE_NETWORKS[brand]
      if (cfg === "all") continue
      for (const n of cfg as NodeNetworkId[]) expect(ALL_NODE_NETWORKS).toContain(n)
    }
  })
})
