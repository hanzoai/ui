import { describe, expect, it } from "vitest"
import { ORIGIN, DESTINATIONS } from "./destinations"
import { PRODUCTS } from "./family"
import { MEET_HANZO_MENU } from "./menu"
import { FOOTER } from "./footer"
import { HEADERS } from "./header"
import { SURFACES } from "./surfaces"

/**
 * Cross-cutting honesty guards over the WHOLE ecosystem-shell spec: no href points
 * at a fabricated host, none carries an `/api/` path, and none is empty. These bind
 * the spec to "real products / domains only".
 */

/** Every real Hanzo host the shell is allowed to link to. */
const ALLOWED_HOSTS = new Set([
  "hanzo.ai",
  "hanzo.chat",
  "hanzo.app",
  "hanzo.team",
  "studio.hanzo.ai",
  "hanzo.bot",
  "cloud.hanzo.ai",
  "api.hanzo.ai",
  "console.hanzo.ai",
  "billing.hanzo.ai",
  "admin.hanzo.ai",
  "platform.hanzo.ai",
  "hanzo.id",
  "docs.hanzo.ai",
  "status.hanzo.ai",
  "github.com",
])

/** Collect every href the spec exposes. */
function allHrefs(): string[] {
  const out: string[] = []
  out.push(...Object.values(ORIGIN))
  out.push(...Object.values(DESTINATIONS))
  for (const p of PRODUCTS) {
    out.push(p.url, p.action.href)
  }
  out.push(MEET_HANZO_MENU.allProducts.href)
  out.push(...MEET_HANZO_MENU.utilities.map((l) => l.href))
  out.push(...MEET_HANZO_MENU.installs.map((l) => l.href))
  for (const col of FOOTER.columns) out.push(...col.links.map((l) => l.href))
  out.push(...FOOTER.legal.links.map((l) => l.href))
  for (const h of Object.values(HEADERS)) {
    out.push(h.action.href, ...h.localNav.map((n) => n.href))
  }
  out.push(...SURFACES.map((s) => s.href))
  return out
}

describe("ecosystem-shell href integrity", () => {
  const hrefs = allHrefs()

  it("exposes hrefs to check", () => {
    expect(hrefs.length).toBeGreaterThan(60)
  })

  it("every href is a non-empty string", () => {
    for (const h of hrefs) expect(typeof h === "string" && h.length > 0).toBe(true)
  })

  it("no href uses an /api/ path prefix", () => {
    for (const h of hrefs) expect(h).not.toMatch(/\/api(\/|$)/)
  })

  it("every absolute href points at a real Hanzo host (no fabrication)", () => {
    for (const h of hrefs) {
      if (!h.startsWith("http")) continue // site-relative nav/action paths
      expect(ALLOWED_HOSTS).toContain(new URL(h).host)
    }
  })

  it("every absolute href is https (never plaintext http)", () => {
    for (const h of hrefs) {
      if (!h.startsWith("http")) continue
      expect(h).toMatch(/^https:\/\//)
    }
  })

  it("site-relative hrefs are rooted and never protocol-relative", () => {
    for (const h of hrefs) {
      if (h.startsWith("http")) continue
      expect(h.startsWith("/") && !h.startsWith("//")).toBe(true)
    }
  })
})
