/**
 * Canonical Hanzo IAM OIDC wiring for the zero-dependency `@hanzo/ui` auth
 * components (HIP-0111).
 *
 * The full `@hanzo/iam` SDK is the canonical client everywhere it can be a
 * dependency. `@hanzo/ui` is intentionally dependency-light, so this module
 * mirrors the SDK's contract for the two things these components need —
 * the OIDC endpoint paths and a PKCE-S256 authorize redirect — and nothing
 * else. The paths below are byte-for-byte the SDK's `OIDC_PATHS`.
 *
 * There is no `/api/` prefix, no legacy `/oauth/*` or `/login/oauth/*`, and
 * PKCE (S256) is always on. A bare authorize redirect without PKCE is a
 * security gap, not just a path nit.
 */

/** OIDC endpoint paths, relative to the brand `serverUrl`. Mirrors `@hanzo/iam` `OIDC_PATHS`. */
export const IAM_OIDC_PATHS = {
  authorize: '/v1/iam/oauth/authorize',
  token: '/v1/iam/oauth/token',
  userinfo: '/v1/iam/oauth/userinfo',
  jwks: '/v1/iam/.well-known/jwks',
  logout: '/v1/iam/oauth/logout',
} as const

const trim = (s: string): string => s.replace(/\/+$/, '')

/** Absolute IAM endpoint URL from a brand origin and a path key. */
export function iamUrl(serverUrl: string, key: keyof typeof IAM_OIDC_PATHS): string {
  return `${trim(serverUrl)}${IAM_OIDC_PATHS[key]}`
}

const PKCE_VERIFIER_KEY = 'hanzo_iam_pkce_verifier'
const PKCE_STATE_KEY = 'hanzo_iam_state'

function base64UrlEncode(bytes: ArrayBuffer): string {
  const b = new Uint8Array(bytes)
  let s = ''
  for (const x of b) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  const a = new Uint8Array(48)
  crypto.getRandomValues(a)
  return base64UrlEncode(a.buffer)
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(digest)
}

export interface StartIamLoginOptions {
  /** Brand IAM origin, e.g. https://hanzo.id. */
  serverUrl: string
  /** OAuth client id (`<org>-<app>`). */
  clientId: string
  /** Redirect URI; defaults to the current origin + `/auth/callback`. */
  redirectUri?: string
  /** Scopes; defaults to `openid profile email`. */
  scope?: string
  /**
   * Social/web3 provider hint (e.g. "google", "github", "web3"). The ONE knob
   * that selects a method — omit it for the IAM login page, or name a provider
   * to delegate the social hop to IAM's shared org-level OAuth client. It rides
   * as `&provider=<name>` on `/v1/iam/oauth/authorize`; the app NEVER registers
   * a per-app Google/GitHub client. Same shape as `@hanzo/iam`'s `startLogin`.
   */
  provider?: string
}

/**
 * Build the canonical IAM authorization-code + PKCE-S256 authorize URL and
 * stash the verifier + state in `sessionStorage` for the callback. Returned
 * without redirecting — useful for `<a href>` or tests. `provider` (if given)
 * rides as `&provider=<name>`; one flow, parameterized.
 */
export async function buildIamAuthorizeUrl(opts: StartIamLoginOptions): Promise<string> {
  const redirectUri = opts.redirectUri || `${window.location.origin}/auth/callback`
  const verifier = randomVerifier()
  const challenge = await challengeFor(verifier)
  const state = crypto.randomUUID()

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
  sessionStorage.setItem(PKCE_STATE_KEY, state)

  const url = new URL(iamUrl(opts.serverUrl, 'authorize'))
  url.searchParams.set('client_id', opts.clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', opts.scope || 'openid profile email')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  if (opts.provider) url.searchParams.set('provider', opts.provider)

  return url.toString()
}

/**
 * Begin the canonical IAM authorization-code + PKCE-S256 flow by redirecting
 * the browser to `/v1/iam/oauth/authorize`. The verifier + state are stashed in
 * `sessionStorage` for the callback to consume. `provider` selects the method.
 */
export async function startIamLogin(opts: StartIamLoginOptions): Promise<void> {
  window.location.href = await buildIamAuthorizeUrl(opts)
}
