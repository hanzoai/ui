'use client'

import { useCallback } from 'react'
import type { IAM } from '@hanzo/iam'
import { useIam } from '@hanzo/iam/react'
import { bearer, identity, refresher } from './session'

export interface SignOutOptions {
  /** The origin that answers IAM's /v1/iam routes. Default: this page's origin. */
  via?: string
  /** Where the person lands. Default `/login?from=logout`: the site's own sign-in hero. */
  to?: string
  /** The IAM client id the tokens were minted for. */
  clientId?: string
  /** `logout_completed` reaches the stream here. */
  track?: (name: string, props?: Record<string, unknown>) => void
}

/** RFC 7009: hand one token back to IAM's /v1/iam route; a refusal is not the person's problem. */
async function revoke(origin: string, token: string | null, hint: string, access: string | null, clientId?: string) {
  if (!token) return
  try {
    await fetch(`${origin}/v1/iam/oauth/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(access ? { Authorization: `Bearer ${access}` } : {}) },
      body: new URLSearchParams({ token, token_type_hint: hint, ...(clientId ? { client_id: clientId } : {}) }).toString(),
    })
  } catch {
    // The local clear below has already signed the machine out.
  }
}

/**
 * End IAM's session for this browser: POST its /v1/iam end-session route with
 * the cookie, so the session a later /login would resume is gone too. The same
 * call @hanzo/iam's `end()` makes; `redirect: manual` keeps a registered
 * post-logout address from being fetched.
 */
async function end(origin: string, idToken: string | null, clientId?: string) {
  try {
    await fetch(`${origin}/v1/iam/oauth/logout`, {
      method: 'POST',
      credentials: 'include',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...(clientId ? { client_id: clientId } : {}), ...(idToken ? { id_token_hint: idToken } : {}) }).toString(),
    })
  } catch {
    // The tokens are already revoked and cleared; this machine is signed out.
  }
}

/**
 * Sign out: hand both tokens back to IAM through its /v1/iam revocation route
 * (a same-site call, refresh token first, since it is the one that mints more),
 * end IAM's session cookie, clear the local session, and land on the site's own
 * `/login?from=logout`. IAM's own logout page is never visited.
 */
export async function signOut(iam: IAM, { via, to = '/login?from=logout', clientId, track }: SignOutOptions = {}): Promise<void> {
  const origin = via ?? window.location.origin
  const access = bearer()
  const refresh = refresher()
  const idToken = identity()
  iam.clearTokens()
  try {
    await revoke(origin, refresh, 'refresh_token', access, clientId)
    await revoke(origin, access, 'access_token', access, clientId)
    await end(origin, idToken, clientId)
  } finally {
    track?.('logout_completed', {})
    window.location.assign(to)
  }
}

/** `signOut` bound to the page's IAM client. */
export function useSignOut(options: SignOutOptions = {}): () => Promise<void> {
  const { sdk, config } = useIam()
  const { via, to, track, clientId = config.clientId } = options
  return useCallback(() => signOut(sdk, { via, to, track, clientId }), [sdk, via, to, track, clientId])
}
