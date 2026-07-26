import { describe, expect, it } from "vitest"
import { SURFACES, surfaceById, otherSurfaces, type Surface } from "./surfaces"
import { findProduct } from "./family"

/**
 * The two rival lists this registry collapses, as they shipped:
 *   - pkg/ui `SURFACES` (Surface = { id, label, href, hint }) — 7 ids.
 *   - @hanzogui/shell `HANZO_APPS` — the 10 ids; `zach`/`world` stay local to that
 *     shim (a personal portal / an uncorroborated surface), so the 8 SHARED ids are
 *     what must be sourced from here.
 * These are frozen so a byte-identity drift in the canonical data fails the build.
 */
const LEGACY_PKGUI: { id: string; label: string; href: string; domain: string }[] = [
  { id: "ai", label: "Hanzo AI", href: "https://hanzo.ai", domain: "hanzo.ai" },
  { id: "console", label: "Console", href: "https://console.hanzo.ai", domain: "console.hanzo.ai" },
  { id: "app", label: "App", href: "https://hanzo.app", domain: "hanzo.app" },
  { id: "chat", label: "Chat", href: "https://hanzo.chat", domain: "hanzo.chat" },
  { id: "bot", label: "Bot", href: "https://hanzo.bot", domain: "hanzo.bot" },
  { id: "team", label: "Team", href: "https://hanzo.team", domain: "hanzo.team" },
  { id: "billing", label: "Billing", href: "https://billing.hanzo.ai", domain: "billing.hanzo.ai" },
]

const LEGACY_GUI_SHARED = ["console", "cloud", "chat", "app", "admin", "gateway", "platform", "account"]

describe("SURFACES — the collapsed launcher registry", () => {
  it("has no duplicate ids", () => {
    const ids = SURFACES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("subsumes every id the pkg/ui SURFACES list needed", () => {
    for (const l of LEGACY_PKGUI) expect(surfaceById(l.id)).toBeDefined()
  })

  it("subsumes every shared id the gui HANZO_APPS list needed", () => {
    for (const id of LEGACY_GUI_SHARED) expect(surfaceById(id)).toBeDefined()
  })

  it("reproduces the pkg/ui surfaces byte-for-byte (the shim cannot drift)", () => {
    for (const legacy of LEGACY_PKGUI) {
      const s = surfaceById(legacy.id)!
      expect({ id: s.id, label: s.label, href: s.href, domain: s.domain }).toEqual(legacy)
    }
  })

  it("projects the six product surfaces straight from FAMILY (single source)", () => {
    for (const id of ["chat", "app", "team", "studio", "bot", "cloud"]) {
      const s = surfaceById(id)!
      const p = findProduct(id)!
      expect(s.href).toBe(p.url)
      expect(s.label).toBe(p.short)
      expect(s.domain).toBe(p.domain)
      expect(s.blurb).toBe(p.job)
    }
  })

  it("keeps the root under the legacy launcher id 'ai' (not the product id 'hanzo')", () => {
    expect(surfaceById("ai")!.href).toBe("https://hanzo.ai")
    expect(surfaceById("hanzo")).toBeUndefined()
  })

  it("every surface is complete with an absolute https href", () => {
    for (const s of SURFACES as Surface[]) {
      expect(s.id).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.domain).toBeTruthy()
      expect(s.blurb).toBeTruthy()
      expect(s.href).toMatch(/^https:\/\//)
    }
  })
})

describe("registry accessors", () => {
  it("otherSurfaces excludes the current surface and returns all when unscoped", () => {
    expect(otherSurfaces()).toHaveLength(SURFACES.length)
    const others = otherSurfaces("chat")
    expect(others).toHaveLength(SURFACES.length - 1)
    expect(others.find((s) => s.id === "chat")).toBeUndefined()
  })
  it("surfaceById returns undefined for an unknown id", () => {
    expect(surfaceById("nope")).toBeUndefined()
  })
})
