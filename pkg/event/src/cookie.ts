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
 * The name a cookie only this host may write is kept under: `__Host-<name>` on a
 * secure page, which the browser takes only from the host itself — Secure, Path=/
 * and no Domain — so no sibling subdomain (another tenant's app, a shared page)
 * can set it or shadow it. A page served over plain http (a developer's machine)
 * cannot hold one, and keeps the bare name on its host.
 */
export function own(name: string): string {
  return typeof window !== 'undefined' && window.location?.protocol === 'https:' ? `__Host-${name}` : name
}

/** Writes a cookie only this host may write (own) for `days`. */
export function setOwn(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${own(name)}=${encodeURIComponent(value)}; Max-Age=${days * DAY}; Path=/; SameSite=Lax${secure}`
}

/**
 * Forgets cookies: each name given, and every cookie whose name one of `patterns`
 * matches, wherever it was set — on this host, on our brand domain, and on every
 * domain above the host, since a third-party library (gtag, the Pixel) writes to the
 * registrable domain, .example.co.uk as readily as .example.com. A deletion the
 * browser does not apply (a public suffix) is a no-op.
 */
export function forget(names: readonly string[], patterns: readonly RegExp[] = []): void {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') return
  const held = document.cookie.split('; ').map((c) => c.slice(0, c.indexOf('=')))
  const gone = new Set([...names, ...held.filter((n) => patterns.some((p) => p.test(n)))])
  const labels = window.location.hostname.split('.')
  const scopes = new Set(['', domain(), ...labels.slice(0, -1).map((_, i) => `; Domain=.${labels.slice(i).join('.')}`)])
  for (const n of gone) for (const scope of scopes) document.cookie = `${n}=; Max-Age=0; Path=/${scope}`
}
