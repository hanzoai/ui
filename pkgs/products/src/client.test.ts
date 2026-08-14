import { describe, expect, it, vi } from "vitest"
import { fetchCatalog, normalizeEntry, type FetchLike } from "./client"
import { SNAPSHOT } from "./snapshot"
import { brandsForCategory } from "./brands"

const ok = (body: unknown): FetchLike => async () => ({ ok: true, status: 200, json: async () => body })
const bad = (status: number): FetchLike => async () => ({ ok: false, status, json: async () => ({}) })
const boom = (): FetchLike => async () => {
  throw new Error("network down")
}

const row = (over: Record<string, unknown> = {}) => ({
  id: "gateway",
  name: "Gateway",
  category: "Network",
  brandColor: "blue",
  iconKey: "Network",
  slug: "gateway",
  route: "/gateway",
  docsUrl: "https://docs.hanzo.ai/docs/services/gateway",
  apiPath: "/v1/gateway",
  pricingId: "gateway",
  ...over,
})

describe("normalizeEntry", () => {
  it("returns null for non-objects and missing id", () => {
    expect(normalizeEntry(null)).toBeNull()
    expect(normalizeEntry(42)).toBeNull()
    expect(normalizeEntry({ name: "x", category: "AI" })).toBeNull()
  })
  it("drops a row with an unknown/missing category (cannot be grouped)", () => {
    expect(normalizeEntry({ id: "x", category: "Nonsense" })).toBeNull()
    expect(normalizeEntry({ id: "x" })).toBeNull()
  })
  it("fills conventional defaults for missing optional fields", () => {
    const e = normalizeEntry({ id: "foo", category: "AI" })!
    expect(e.name).toBe("foo")
    expect(e.slug).toBe("foo")
    expect(e.route).toBe("/foo")
    expect(e.docsUrl).toBe("https://docs.hanzo.ai/docs/services/foo")
    expect(e.iconKey).toBe("Box")
    expect(e.pricingId).toBeNull()
  })
  // A name is not a route. This line used to read `/v1/foo`, and that default is
  // where 31 of the 84 products in the live catalog got the address they
  // advertise — /v1/providers, /v1/containers, /v1/nodes, /v1/wallet — none of
  // which api.hanzo.ai has ever answered. Defaulting produced a plausible dead
  // link and reported it as a working one, which is worse than producing nothing:
  // the gap could not be seen from any surface that rendered it.
  it("never invents an apiPath from the slug", () => {
    expect(normalizeEntry({ id: "foo", category: "AI" })!.apiPath).toBe("")
    expect(normalizeEntry({ id: "foo", category: "AI", apiPath: "" })!.apiPath).toBe("")
    expect(normalizeEntry({ id: "foo", category: "AI", apiPath: "/v1/foos" })!.apiPath).toBe("/v1/foos")
  })
  it("states what API a product has, defaulting to service", () => {
    expect(normalizeEntry({ id: "foo", category: "AI" })!.kind).toBe("service")
    expect(normalizeEntry({ id: "cli", category: "Dev", kind: "client" })!.kind).toBe("client")
    expect(normalizeEntry({ id: "mpc", category: "Security", kind: "pending" })!.kind).toBe("pending")
    // An unknown kind reads as a service, so a row is judged by its apiPath
    // rather than silently exempted by a word nothing here understands.
    expect(normalizeEntry({ id: "foo", category: "AI", kind: "whatever" })!.kind).toBe("service")
  })
  it("repairs a bogus brandColor to a stable default, keeps a real one", () => {
    expect(normalizeEntry({ id: "foo", category: "AI", brandColor: "not-a-color" })!.brandColor).not.toBe("not-a-color")
    expect(normalizeEntry({ id: "chat", category: "Apps", brandColor: "green" })!.brandColor).toBe("green")
  })
  it("accepts `slug`/`icon`/`title` aliases", () => {
    const e = normalizeEntry({ slug: "bar", title: "Bar", category: "Data", icon: "Database" })!
    expect(e.id).toBe("bar")
    expect(e.name).toBe("Bar")
    expect(e.iconKey).toBe("Database")
  })
})

describe("fetchCatalog — envelopes", () => {
  it("reads a bare array", async () => {
    const r = await fetchCatalog({ fetch: ok([row()]) })
    expect(r.source).toBe("live")
    expect(r.entries[0].id).toBe("gateway")
  })
  it("reads { products }, { catalog }, { data }, { items }", async () => {
    for (const key of ["products", "catalog", "data", "items"]) {
      const r = await fetchCatalog({ fetch: ok({ [key]: [row()] }) })
      expect(r.source, key).toBe("live")
      expect(r.entries.length, key).toBe(1)
    }
  })
})

describe("fetchCatalog — brands resolution", () => {
  it("derives brands from category when the source omits them", async () => {
    const r = await fetchCatalog({ fetch: ok([row({ brands: undefined })]) })
    expect(r.entries[0].brands).toEqual(brandsForCategory("Network"))
  })
  it("keeps an explicit brands list", async () => {
    const r = await fetchCatalog({ fetch: ok([row({ brands: ["hanzo"] })]) })
    expect(r.entries[0].brands).toEqual(["hanzo"])
  })
  it("filters bogus brand ids out, then derives if none survive", async () => {
    const r = await fetchCatalog({ fetch: ok([row({ brands: ["martians"] })]) })
    expect(r.entries[0].brands).toEqual(brandsForCategory("Network"))
  })
})

describe("fetchCatalog — fallback (never breaks)", () => {
  it("non-2xx → snapshot", async () => {
    const r = await fetchCatalog({ fetch: bad(500) })
    expect(r.source).toBe("snapshot")
    expect(r.error).toBe("HTTP 500")
    expect(r.entries.length).toBe(SNAPSHOT.length)
  })
  it("network error → snapshot", async () => {
    const r = await fetchCatalog({ fetch: boom() })
    expect(r.source).toBe("snapshot")
    expect(r.error).toContain("network down")
  })
  it("empty / unrecognized payload → snapshot", async () => {
    expect((await fetchCatalog({ fetch: ok([]) })).source).toBe("snapshot")
    expect((await fetchCatalog({ fetch: ok({ nope: 1 }) })).source).toBe("snapshot")
  })
  it("all rows invalid → snapshot", async () => {
    const r = await fetchCatalog({ fetch: ok([{ id: "x", category: "Bogus" }]) })
    expect(r.source).toBe("snapshot")
  })
  it("uses a caller-supplied fallback", async () => {
    const custom = [row({ id: "only" })].map((r) => normalizeEntry(r)!)
    const r = await fetchCatalog({ fetch: bad(503), fallback: custom })
    expect(r.entries.map((e) => e.id)).toEqual(["only"])
  })
  it("snapshot fallback always has brands resolved", async () => {
    const r = await fetchCatalog({ fetch: bad(500) })
    expect(r.entries.every((e) => e.brands.length > 0)).toBe(true)
  })
})

describe("fetchCatalog — request", () => {
  it("builds <baseUrl>/v1/commerce/catalog and forwards headers", async () => {
    const spy = vi.fn(ok([row()]))
    await fetchCatalog({ fetch: spy as FetchLike, baseUrl: "https://api.example.com/", headers: { "X-Org-Id": "acme" } })
    const [url, init] = spy.mock.calls[0]
    expect(url).toBe("https://api.example.com/v1/commerce/catalog")
    expect((init as { headers: Record<string, string> }).headers["X-Org-Id"]).toBe("acme")
    expect((init as { headers: Record<string, string> }).headers.accept).toBe("application/json")
  })
})
