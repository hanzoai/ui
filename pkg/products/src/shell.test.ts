import { describe, expect, it } from "vitest"
import { addresses } from "./addresses"
import { HEADERS } from "./header"

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

describe("ecosystem-shell href integrity", () => {
  // ONE enumeration for every guard — site-relative nav resolved to its property,
  // so nothing escapes the host check by being a bare path.
  const hrefs = addresses().map((a) => a.href)

  it("exposes hrefs to check", () => {
    expect(hrefs.length).toBeGreaterThan(60)
  })

  it("every href is a non-empty string", () => {
    for (const h of hrefs) expect(typeof h === "string" && h.length > 0).toBe(true)
  })

  it("no href uses an /api/ path prefix", () => {
    for (const h of hrefs) expect(h).not.toMatch(/\/api(\/|$)/)
  })

  it("every href points at a real Hanzo host (no fabrication)", () => {
    for (const h of hrefs) expect(ALLOWED_HOSTS).toContain(new URL(h).host)
  })

  it("every href is https (never plaintext http)", () => {
    for (const h of hrefs) expect(h).toMatch(/^https:\/\//)
  })

  it("site-relative header hrefs are rooted and never protocol-relative", () => {
    for (const h of Object.values(HEADERS)) {
      for (const raw of [h.action.href, ...h.localNav.map((n) => n.href)]) {
        if (raw.startsWith("http")) continue
        expect(raw.startsWith("/") && !raw.startsWith("//")).toBe(true)
      }
    }
  })
})
