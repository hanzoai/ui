// First-party cookies for consent, the ad click and the browser ids the ad
// platforms match on. Set on the registrable domain so every subdomain of a site
// reads the same choice and the same click; on localhost or an address it stays
// on the host.

const DAY = 86_400

/** The domain attribute for this host, or '' to keep the cookie on the host. */
function domain(): string {
  const h = window.location.hostname
  if (h === 'localhost' || /^[\d.]+$/.test(h) || h.includes(':')) return ''
  const parts = h.split('.')
  return parts.length > 2 ? `; Domain=.${parts.slice(-2).join('.')}` : `; Domain=.${h}`
}

/** Reads one cookie, or undefined. */
export function get(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined
}

/** Writes one cookie for `days`. */
export function set(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * DAY}; Path=/; SameSite=Lax${domain()}${secure}`
}
