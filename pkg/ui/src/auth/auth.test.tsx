// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import config from '../gui-config'
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

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="light">
      {node}
    </GuiProvider>,
  )

describe('SignIn', () => {
  it('draws the card on the host, with both providers before IAM answers', () => {
    const out = html(<SignIn site="Hanzo" />)
    expect(out).toContain('Log in to Hanzo')
    expect(out).toContain('Continue with Google')
    expect(out).toContain('Continue with GitHub')
    expect(out).not.toContain('hanzo.id')
    expect(out).not.toMatch(/class="[^"]*\bhz-/)
  })

  it('offers an email field with a caption, and the or between it and the providers', () => {
    const out = html(<SignIn />)
    expect(out).toContain('for="hanzo-email"')
    expect(out).toContain('Continue with Google')
  })

  it('offers sign up with the terms and a way back to log in', () => {
    const out = html(<SignIn mode="signup" site="Hanzo" termsPath="/legal/terms" />)
    expect(out).toContain('Create your Hanzo account')
    expect(out).toContain('href="/legal/terms"')
    expect(out).toContain('href="/login"')
  })
})

describe('SignIn frame', () => {
  it('draws the card alone when the page brings its own brand, heading and other-mode line', () => {
    const out = html(<SignIn frame={false} />).replace(/<style[\s\S]*?<\/style>/g, '')
    expect(out).toContain('Continue with Google')
    expect(out).toContain('for="hanzo-email"')
    expect(out).not.toContain('<h1')
    expect(out).not.toContain('Log in to Hanzo')
    expect(out).not.toContain('New to Hanzo?')
    expect(out).not.toMatch(/min-height|padding-top:\s*112/)
  })

  it('keeps the brand, the heading and the other-mode line by default', () => {
    const out = html(<SignIn />)
    expect(out).toContain('<h1')
    expect(out).toContain('New to Hanzo?')
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
  it('revokes refresh then access, ends IAM\'s session cookie, clears, and lands on /login?from=logout', async () => {
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
    expect(calls.map((c) => c.url)).toEqual(['https://hanzo.team/v1/iam/oauth/revoke', 'https://hanzo.team/v1/iam/oauth/revoke', 'https://hanzo.team/v1/iam/oauth/logout'])
    expect(calls[0]!.body).toContain('token=r')
    expect(calls[1]!.body).toContain('token=a')
    expect(assign).toHaveBeenCalledWith('/login?from=logout')
    expect(seen).toEqual(['logout_completed'])
    expect(bearer()).toBeNull()
  })
})
