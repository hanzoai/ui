// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { IAM } from '@hanzo/iam'

vi.mock('@hanzo/iam/react', () => ({
  useIam: () => ({
    config: { serverUrl: 'https://hanzo.id', clientId: 'hanzo-app', redirectUri: 'https://hanzo.team/auth/callback' },
    sdk: { getSigninUrl: async () => 'https://hanzo.id/x' },
  }),
}))

import { SignIn } from './SignIn'
import { signOut } from './signout'
import { bearer, live } from './session'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('SignIn', () => {
  it('draws the card on the host, with both providers before IAM answers', () => {
    const html = renderToStaticMarkup(<SignIn site="Hanzo" />)
    expect(html).toContain('Log in to Hanzo')
    expect(html).toContain('Continue with Google')
    expect(html).toContain('Continue with GitHub')
    expect(html).not.toContain('hanzo.id')
  })

  it('offers sign up with the terms and a way back to log in', () => {
    const html = renderToStaticMarkup(<SignIn mode="signup" site="Hanzo" termsPath="/legal/terms" />)
    expect(html).toContain('Create your Hanzo account')
    expect(html).toContain('href="/legal/terms"')
    expect(html).toContain('href="/login"')
  })
})

describe('session', () => {
  it('reads the bearer the SDK stored, and its expiry', () => {
    expect(bearer()).toBeNull()
    localStorage.setItem('hanzo_iam_access_token', 't')
    expect(live()).toBe(true)
    localStorage.setItem('hanzo_iam_expires_at', String(Date.now() - 1))
    expect(live()).toBe(false)
  })
})

describe('signOut', () => {
  it('revokes refresh then access through this origin, clears, and lands on /login?from=logout', async () => {
    localStorage.setItem('hanzo_iam_access_token', 'a')
    localStorage.setItem('hanzo_iam_refresh_token', 'r')
    const calls: { url: string; body: string }[] = []
    vi.stubGlobal('fetch', async (url: string, init: { body: string }) => {
      calls.push({ url, body: init.body })
      return new Response('{}')
    })
    const assign = vi.fn()
    Object.defineProperty(window, 'location', { value: { origin: 'https://hanzo.team', assign }, writable: true })
    const seen: string[] = []
    const iam = { clearTokens: () => localStorage.clear() } as unknown as IAM
    await signOut(iam, { clientId: 'hanzo-app', track: (n) => seen.push(n) })
    expect(calls.map((c) => c.url)).toEqual(['https://hanzo.team/v1/iam/oauth/revoke', 'https://hanzo.team/v1/iam/oauth/revoke'])
    expect(calls[0]!.body).toContain('token=r')
    expect(calls[1]!.body).toContain('token=a')
    expect(assign).toHaveBeenCalledWith('/login?from=logout')
    expect(seen).toEqual(['logout_completed'])
    expect(bearer()).toBeNull()
  })
})
