// Routes a session recorder must never run on.
//
// An OAuth callback renders a live authorization code — in the URL, and often on
// the page while the exchange is in flight. A DOM movie of that page IS the code:
// no masking rule helps, because the code is not a form field, it is the page.
// hanzoai/id already refuses to emit on exactly these paths for the same reason;
// this is that rule, applied to the recorder.
//
// Refusal is by PATH SUFFIX, not exact match, because the callback lives at a
// different place in every app (`/callback`, `/auth/callback`, `/api/auth/callback`).
// Over-refusing costs a recording; under-refusing costs an account.

/** Paths that carry a credential in flight. */
export const CREDENTIAL_ROUTES = ['/callback', '/login/oauth/device'] as const

/** normalize reduces a pathname to a leading-slash, no-trailing-slash, lowercase
 *  form so `/Auth/Callback/` and `/auth/callback` are one path. */
function normalize(pathname: string): string {
  const trimmed = String(pathname || '').replace(/^\/+|\/+$/g, '')
  return ('/' + trimmed).toLowerCase()
}

/** True when `pathname` is (or ends in) a route that carries a credential.
 *  `/oauth-callback` is NOT a match — the boundary is a path separator, so only a
 *  whole segment counts. */
export function isCredentialRoute(pathname: string): boolean {
  const p = normalize(pathname)
  return CREDENTIAL_ROUTES.some((r) => p === r || p.endsWith(r))
}

/** The live path, or '' where there is no browser (SSR / prerender). */
export function currentPath(): string {
  try {
    if (typeof window === 'undefined' || !window.location) return ''
    return window.location.pathname
  } catch {
    return ''
  }
}

/** The one gate `record()` asks before it starts, and again on every event and
 *  every flush tick — an SPA can route INTO a callback without a page load. */
export function refused(refuse?: (pathname: string) => boolean): boolean {
  const p = currentPath()
  if (isCredentialRoute(p)) return true
  if (!refuse) return false
  try {
    return refuse(p) === true
  } catch {
    return true // a refusal predicate that throws refuses
  }
}
