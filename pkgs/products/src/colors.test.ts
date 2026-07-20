import { describe, expect, it } from "vitest"
import {
  COLOR_SWATCHES,
  CURATED_COLORS,
  defaultColorKey,
  hashColorKey,
  isSwatchKey,
  productColorHex,
  productColorKey,
  swatchHex,
  categoryColor,
} from "./colors"
import { CATEGORY_COLORS, CATEGORY_ORDER } from "./categories"

// Ported from console2 colors.test.ts (the colorToken -> css map) + category color.

describe("color palette", () => {
  it("has unique, non-empty keys and valid hex values", () => {
    const keys = COLOR_SWATCHES.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const s of COLOR_SWATCHES) {
      expect(s.key).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
  it("every curated color references a real swatch key", () => {
    for (const [id, key] of Object.entries(CURATED_COLORS)) {
      expect(isSwatchKey(key), `${id} -> ${key}`).toBe(true)
    }
  })
})

describe("swatchHex (colorToken -> css)", () => {
  it("resolves a known key and falls back for unknown/empty", () => {
    expect(swatchHex("indigo")).toBe("#5E6AD2")
    const fallback = swatchHex("slate")
    expect(swatchHex("nope")).toBe(fallback)
    expect(swatchHex(undefined)).toBe(fallback)
    expect(swatchHex("")).toBe(fallback)
  })
})

describe("defaultColorKey (brandColor seed)", () => {
  it("prefers a curated color for a flagship product", () => {
    expect(defaultColorKey("chat")).toBe("green")
    expect(defaultColorKey("gpus")).toBe("orange")
  })
  it("is deterministic and valid for the long tail", () => {
    const a = defaultColorKey("some-unlisted-product")
    expect(a).toBe(defaultColorKey("some-unlisted-product"))
    expect(isSwatchKey(a)).toBe(true)
  })
  it("hashColorKey spreads across the palette", () => {
    const ids = Array.from({ length: 60 }, (_, i) => `product-${i}`)
    expect(new Set(ids.map(hashColorKey)).size).toBeGreaterThan(4)
  })
})

describe("productColorKey — override precedence", () => {
  it("a valid user override wins over curated + hash", () => {
    expect(productColorKey("chat", { chat: "red" })).toBe("red")
  })
  it("an invalid override is ignored", () => {
    expect(productColorKey("chat", { chat: "not-a-color" })).toBe("green")
  })
  it("no override → the default key; hex tracks the key", () => {
    expect(productColorKey("chat", {})).toBe("green")
    expect(productColorKey("chat", null)).toBe("green")
    expect(productColorHex("chat", { chat: "red" })).toBe(swatchHex("red"))
  })
})

describe("categoryColor (per-category accent)", () => {
  it("every category has a real swatch key that resolves to a hex", () => {
    for (const c of CATEGORY_ORDER) {
      expect(isSwatchKey(CATEGORY_COLORS[c]), `${c} -> ${CATEGORY_COLORS[c]}`).toBe(true)
      expect(categoryColor(c)).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
    expect(Object.keys(CATEGORY_COLORS).sort()).toEqual([...CATEGORY_ORDER].sort())
  })
})
