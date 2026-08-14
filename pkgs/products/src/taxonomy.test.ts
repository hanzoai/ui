import { describe, expect, it } from "vitest"
import { CATEGORIES, BRAND_SCOPE } from "./taxonomy.generated"
import { CATEGORY_ORDER, CATEGORY_SUMMARY, CATEGORY_COLORS, categorySlug } from "./categories"
import { ALL_BRANDS, BRAND_CATEGORIES, brandsForCategory } from "./brands"
import { isSwatchKey } from "./colors"
import { SNAPSHOT } from "./snapshot"

/**
 * The drift guard.
 *
 * There were four hand-written copies of this taxonomy in the estate and they
 * disagreed: commerce sold `Dev`, this package sold `Commerce`, and the console
 * sold both plus `Settings`. Nothing failed, because each copy's tests asserted
 * that copy. This package's own suite asserted `Dev` was CUT — the one category
 * the catalog has eight products under.
 *
 * So the list is generated now (scripts/sync.mjs, from commerce), and what is
 * left to check is everything that has to stay in step WITH it. These run
 * offline, against the committed files. The remaining question — is the
 * committed copy what the catalog currently serves? — is not answerable offline
 * and is not guessed at here: `pnpm sync --check` asks the API, and the publish
 * runs it.
 */
describe("the generated taxonomy is the only list", () => {
  it("CATEGORY_ORDER is the generated list, not a second copy of it", () => {
    expect([...CATEGORY_ORDER]).toEqual([...CATEGORIES])
  })

  it("names no category twice", () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length)
  })

  // A slug is what /products/<slug> and /category/<slug> are keyed by, so two
  // categories colliding there would make one of them unreachable.
  it("gives every category a distinct url slug", () => {
    const slugs = CATEGORY_ORDER.map(categorySlug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe("every category carries its display copy", () => {
  // Record<ProductCategory, …> already makes a missing key a COMPILE error.
  // These catch the other direction at runtime: a key the generated list no
  // longer names, which type-checks against a stale build of the union.
  it("has one summary per category and no summary for a category that is gone", () => {
    expect(Object.keys(CATEGORY_SUMMARY).sort()).toEqual([...CATEGORY_ORDER].sort())
    for (const c of CATEGORY_ORDER) expect(CATEGORY_SUMMARY[c].length, c).toBeGreaterThan(0)
  })

  it("has one real swatch per category and no swatch for a category that is gone", () => {
    expect(Object.keys(CATEGORY_COLORS).sort()).toEqual([...CATEGORY_ORDER].sort())
    for (const c of CATEGORY_ORDER) expect(isSwatchKey(CATEGORY_COLORS[c]), c).toBe(true)
  })
})

describe("brand scope agrees with the catalog that serves each brand", () => {
  it("scopes every brand to categories the taxonomy actually has", () => {
    for (const brand of ALL_BRANDS) {
      for (const c of BRAND_CATEGORIES[brand] ?? []) {
        expect(CATEGORY_ORDER, `${brand} admits ${c}`).toContain(c)
      }
    }
  })

  it("mirrors the generated scope rather than restating it", () => {
    for (const brand of ALL_BRANDS) {
      const generated = BRAND_SCOPE[brand]
      expect(BRAND_CATEGORIES[brand], brand).toEqual(generated === null ? null : [...generated])
    }
  })

  it("puts every category in at least one brand's console", () => {
    for (const c of CATEGORY_ORDER) {
      expect(brandsForCategory(c).length, `${c} is shown by no brand`).toBeGreaterThan(0)
    }
  })
})

/**
 * A category with no products is worse than no category: it renders an empty
 * shelf and a landing page that says nothing is here. The catalog is what decides
 * whether a category has earned its place, and the snapshot is the catalog's
 * answer, so this is the check that would have caught `Commerce` — a category
 * carried for six products that the catalog has never held.
 */
describe("every category has products", () => {
  it("leaves no category empty", () => {
    const empty = CATEGORY_ORDER.filter((c) => !SNAPSHOT.some((e) => e.category === c))
    expect(empty, `categories with no products: ${empty.join(", ")}`).toEqual([])
  })

  it("files no product outside the taxonomy", () => {
    const stray = [...new Set(SNAPSHOT.map((e) => e.category))].filter(
      (c) => !(CATEGORY_ORDER as readonly string[]).includes(c),
    )
    expect(stray, `products filed under: ${stray.join(", ")}`).toEqual([])
  })
})
