// The five fields every event carries so one funnel can be read across sites:
// hostname, route, release, device_class and outcome. This file owns the two that
// need a rule: the route template and the device class.
//
// A route is the page's SHAPE, never its address. `/chat/21bc1d59bd39…` and
// `/chat/9f2…` are one page, `/chat/[id]`; counting them apart makes every
// conversation its own funnel step and ships the conversation's id to the warehouse.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NUMERIC = /^\d+$/
// An id with a prefix (`sess_ab12…`, `bld_…`) or a counter suffix (`1795…-000016`).
const PREFIXED = /^[a-z]{2,8}_[A-Za-z0-9_-]{6,}$/
const DASHED_NUMBER = /^\d[\d-]{5,}$/
// A long run of hex or base64url is a token or a hash, not a word.
const OPAQUE = /^(?=.*\d)[A-Za-z0-9_-]{20,}$/
const HEX = /^[0-9a-f]{12,}$/i

function isId(segment: string): boolean {
  return (
    UUID.test(segment) ||
    NUMERIC.test(segment) ||
    HEX.test(segment) ||
    PREFIXED.test(segment) ||
    DASHED_NUMBER.test(segment) ||
    OPAQUE.test(segment)
  )
}

/** routeOf templates a pathname: every id-shaped segment becomes `[id]`, the query
 *  and fragment are dropped, and a trailing slash is not a different page. */
export function routeOf(pathname: string | undefined): string {
  const bare = (pathname ?? '').split(/[?#]/, 1)[0] || '/'
  const parts = bare.split('/').map((s) => {
    if (!s) return s
    let seg = s
    try {
      seg = decodeURIComponent(s)
    } catch {
      /* keep the raw segment */
    }
    return isId(seg) ? '[id]' : s
  })
  const out = parts.join('/').replace(/\/+$/, '')
  return out || '/'
}

/** isAuthCallback names the page an authorization code lands on. Its address
 *  carries `code` and `state`, so it is reported as an ops event and never as a view. */
export function isAuthCallback(route: string): boolean {
  return route === '/auth/callback' || route.startsWith('/auth/callback/')
}

export type DeviceClass = 'mobile' | 'tablet' | 'desktop'

/** deviceClassOf buckets a viewport width the way the funnels read it. */
export function deviceClassOf(width: number): DeviceClass {
  if (width > 0 && width < 768) return 'mobile'
  if (width > 0 && width < 1024) return 'tablet'
  return 'desktop'
}
