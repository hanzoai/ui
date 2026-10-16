// First-party cookies for consent, the ad click and the browser ids the ad
// platforms match on. On one of our own brands' domains (org.ts ORG_DOMAIN) they
// are set on that registrable domain, so every subdomain of the brand reads the
// same choice and the same click. Anywhere else they stay on the host: a customer's
// app on a shared tenant domain (hanzo.app) is another controller, and a choice or
// a click given to one tenant is never another's; and a host whose registrable
// domain this cannot know (shop.co.uk, me.github.io) keeps what it can keep.

import { ORG_DOMAIN } from './org'

const DAY = 86_400

/** Brand domains whose subdomains are customers' apps, not the brand's own pages. */
const TENANTS = new Set(['hanzo.app'])

/** The brand domain this host belongs to, or '' for any other host. */
function brand(h: string): string {
  for (const domains of Object.values(ORG_DOMAIN)) {
    for (const d of domains) if (!TENANTS.has(d) && (h === d || h.endsWith(`.${d}`))) return d
  }
  return ''
}

/** The domain attribute for this host, or '' to keep the cookie on the host. */
function domain(): string {
  const d = brand(window.location.hostname.toLowerCase())
  return d ? `; Domain=.${d}` : ''
}

/** Reads one cookie, or undefined. */
export function get(name: string): string | undefined {
  // A host whose document keeps no cookies (a webview, a test double) holds none.
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') return undefined
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined
}

/** Writes one cookie for `days`. */
export function set(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * DAY}; Path=/; SameSite=Lax${domain()}${secure}`
}

/**
 * Forgets cookies: each name given, and every cookie whose name starts with one of
 * `prefixes`, wherever it was set — on this host, on our brand domain, and on the
 * registrable-looking domain a third-party library (gtag, the Pixel) writes to. A
 * deletion the browser does not apply is a no-op.
 */
export function forget(names: readonly string[], prefixes: readonly string[] = []): void {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') return
  const held = document.cookie.split('; ').map((c) => c.slice(0, c.indexOf('=')))
  const gone = new Set([...names, ...held.filter((n) => prefixes.some((p) => n.startsWith(p)))])
  const h = window.location.hostname
  const scopes = new Set(['', domain(), `; Domain=.${h.split('.').slice(-2).join('.')}`])
  for (const n of gone) for (const scope of scopes) document.cookie = `${n}=; Max-Age=0; Path=/${scope}`
}
