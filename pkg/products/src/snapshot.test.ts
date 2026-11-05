import { describe, expect, it } from "vitest"
import { SNAPSHOT } from "./snapshot"
import { CATEGORY_ORDER } from "./categories"
import { isSwatchKey } from "./colors"
import { ALL_BRANDS } from "./brands"
import { resolveEntry } from "./catalog"

// Integrity + drift guard over the checked-in snapshot (the fallback + seed).
// If any of these fail, the catalog is malformed BEFORE it ever reaches commerce.

describe("snapshot integrity", () => {
  // Not a magic number to keep in step by hand: the snapshot is generated from
  // the catalog, so this only pins that it is a catalog and not an empty file.
  // Its exact size is the catalog's business and `pnpm sync --check` compares it.
  it("holds a catalog", () => {
    expect(SNAPSHOT.length).toBeGreaterThan(50)
  })

  it("every id and slug is unique", () => {
    expect(new Set(SNAPSHOT.map((e) => e.id)).size).toBe(SNAPSHOT.length)
    expect(new Set(SNAPSHOT.map((e) => e.slug)).size).toBe(SNAPSHOT.length)
  })

  it("every category is one the taxonomy carries", () => {
    for (const e of SNAPSHOT) expect(CATEGORY_ORDER).toContain(e.category)
  })

  // This used to assert that `Dev` was cut. It is not cut — it is the catalog's
  // sixth category and eight products are filed under it — and asserting the
  // opposite is how the disagreement survived: the copy was wrong and its own
  // suite defended it. Which categories exist is not this file's opinion; see
  // ./taxonomy.test.ts, which reads the generated list.
  it("holds no category the console administers rather than sells", () => {
    const cats = new Set(SNAPSHOT.map((e) => e.category))
    for (const nav of ["Settings", "Billing", "Training"]) expect(cats.has(nav as never)).toBe(false)
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

  // The route is commerce's answer, not `/${slug}`: inference is /engine, vpc is
  // /network, and most cloud surfaces route under /cloud/*. The pre-sync snapshot
  // hand-derived every route from the slug, so `/${slug}` held by construction and
  // would have blessed the wrong addresses the moment sync carried commerce's.
  // What must always hold: an internal route is a well-formed path and an external
  // one is a product's own https origin.
  it("every route is a well-formed path (or a product's own https origin) and every docsUrl is under the docs services base", () => {
    for (const e of SNAPSHOT) {
      if (e.route.startsWith("https://")) expect(e.route, e.id).toMatch(/^https:\/\/[a-z0-9.-]+$/)
      else expect(e.route, e.id).toMatch(/^\/[a-z0-9][a-z0-9\/-]*$/)
      expect(e.docsUrl.startsWith("https://docs.hanzo.ai/docs/services/"), e.id).toBe(true)
    }
  })

  // A service is reached at a real /v1 route; a client and a pending product are
  // reached at none, and their apiPath is empty because that is what is true.
  // The old rule demanded a path from EVERY row, which is why every row had one —
  // 31 of them made up out of the slug, each a link that answers 404.
  it("a service names a /v1 route, and nothing else names any", () => {
    for (const e of SNAPSHOT) {
      if (e.kind === "client" || e.kind === "pending") expect(e.apiPath, e.id).toBe("")
      else expect(e.apiPath, e.id).toMatch(/^\/v1(\/|$)/)
    }
  })
  it("every row states its kind", () => {
    for (const e of SNAPSHOT) expect(["service", "client", "pending"], e.id).toContain(e.kind)
  })

  it("pricingId is a non-empty string or null", () => {
    for (const e of SNAPSHOT) {
      expect(e.pricingId === null || (typeof e.pricingId === "string" && e.pricingId.length > 0), e.id).toBe(true)
    }
  })

  it("brands on every row are valid catalog brands preserved by resolveEntry", () => {
    for (const e of SNAPSHOT) {
      expect(e.brands.length, e.id).toBeGreaterThan(0)
      for (const b of e.brands) expect(ALL_BRANDS, e.id).toContain(b)
      expect(resolveEntry(e).brands, e.id).toEqual(e.brands)
    }
  })

  it("admin flags are the known global-managed set", () => {
    const admins = SNAPSHOT.filter((e) => e.admin).map((e) => e.id).sort()
    // Commerce is the owner: sync carried the catalog's answer (audit/iam/kms/
    // secrets no longer carry admin=true). Pin the synced set exactly, so a
    // future commerce change that flips a flag fails here loudly rather than
    // silently hiding a product from customer nav.
    expect(admins).toEqual(["clusters", "kubernetes", "providers"])
  })
})
