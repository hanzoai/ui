import { describe, expect, it } from "vitest"
import { addresses } from "./addresses"

/**
 * The LIVE link check — the guard that binds the spec to the running properties.
 * Host-only assertions (see `shell.test.ts`) cannot catch a fabricated PATH, so
 * this fetches every address the spec claims and fails on any 404.
 *
 * Network-gated, so it never makes the unit suite flaky:
 *   HANZO_LIVE_LINKS=1 vitest run addresses.live
 *
 * Caveat by design: several properties (chat, team, studio, cloud, console,
 * billing, admin, api, id) are SPA hosts that answer 200 for ANY path, so a pass
 * there proves reachability, not that the route exists. The hard-404 hosts
 * (hanzo.ai, docs.hanzo.ai, hanzo.app, hanzo.bot, platform, status) are the ones
 * this check truly pins.
 */
const live = process.env.HANZO_LIVE_LINKS === "1"

/**
 * A link is good when the address exists. 200 is served; 401/403 mean the route is
 * there and asks the visitor to sign in first (Studio's whole app is behind auth) —
 * a correct link to a gated app, not a broken one. Anything else (notably 404) is a
 * fabricated address.
 */
const RESOLVES = new Set([200, 401, 403])

const status = async (href: string): Promise<number> => {
  const control = new AbortController()
  const timer = setTimeout(() => control.abort(), 20_000)
  try {
    const res = await fetch(href, { redirect: "follow", signal: control.signal })
    return res.status
  } catch {
    return 0
  } finally {
    clearTimeout(timer)
  }
}

describe.skipIf(!live)("every address the spec claims resolves", () => {
  it(
    "no address 404s",
    async () => {
      const claims = addresses()
      const unique = [...new Set(claims.map((a) => a.href))]
      const codes = new Map<string, number>()
      // Serial: the whole point is a truthful answer, not a fast one.
      for (const href of unique) codes.set(href, await status(href))

      const broken = claims
        .filter((a) => !RESOLVES.has(codes.get(a.href)!))
        .map((a) => `${a.where} → ${a.href} [${codes.get(a.href)}]`)

      expect(broken, `broken addresses:\n${broken.join("\n")}`).toEqual([])
    },
    600_000,
  )
})
