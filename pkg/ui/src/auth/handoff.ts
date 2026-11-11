/**
 * Where a Hanzo site sends somebody to sign in: hanzo.ai, never its own page.
 *
 * One IAM, and one origin every Hanzo site signs in on, so the session that
 * answers every site lives on hanzo.ai. Each site is still its own OAuth client:
 * it mints its own authorize request (its client, its callback, a fresh state and
 * a PKCE challenge whose verifier stays in its own storage) with `getSigninUrl`,
 * and hands hanzo.ai only the query. hanzo.ai answers it and IAM returns the code
 * to the site's callback, where the site redeems it.
 *
 *   a provider     straight to IAM's authorize ON hanzo.ai with `provider`, which
 *                  sends the browser to Google or GitHub at once (one press) and
 *                  takes the provider's return on hanzo.ai, so the session lands
 *                  there. Not the issuer's authorize: a provider hop that starts
 *                  on hanzo.id returns to hanzo.id and leaves hanzo.ai signed out.
 *   an email       hanzo.ai/login with `login_hint`, where the password or the
 *                  code is typed.
 *   a new account  hanzo.ai/signup.
 *
 * Pure, so every address is tested without a browser.
 */

/** The one origin Hanzo signs people in on. */
export const SIGNIN = 'https://hanzo.ai'

/** The providers the shared panel draws. IAM names them by these words. */
export type ProviderKind = 'google' | 'github'

/**
 * Where a press goes. A provider is named the way IAM names it: a kind (`google`)
 * or a provider record's name (`provider-google`); either starts the same hop.
 */
export type Way = { kind: 'provider'; provider: string } | { kind: 'email'; email: string } | { kind: 'login' } | { kind: 'signup' } | { kind: 'another' }

/**
 * The address a press leaves for, from the site's own authorize request
 * (`request`, as `getSigninUrl` answered it). Only its query travels.
 */
export function handoff(request: string, way: Way, signin: string = SIGNIN): string {
  const q = new URL(request).searchParams
  const at = signin.replace(/\/+$/, '')
  switch (way.kind) {
    case 'provider':
      q.set('provider', way.provider)
      return `${at}/v1/iam/oauth/authorize?${q}`
    case 'email':
      q.set('login_hint', way.email)
      return `${at}/login?${q}`
    case 'another':
      q.set('prompt', 'select_account')
      return `${at}/login?${q}`
    case 'signup':
      return `${at}/signup?${q}`
    case 'login':
      return `${at}/login?${q}`
  }
}

/** The address typed, trimmed, when it reads as an email; null otherwise. */
export function address(typed: string): string | null {
  const s = typed.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null
}
