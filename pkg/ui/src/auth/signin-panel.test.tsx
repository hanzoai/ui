// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import config from '../gui-config'

// The site's own authorize request, as @hanzo/iam's getSigninUrl answers it: its
// client, its callback, its state and PKCE challenge, on the issuer's authorize.
const REQUEST =
  'https://hanzo.id/v1/iam/oauth/authorize?client_id=hanzo-team-native&response_type=code&redirect_uri=https%3A%2F%2Fhanzo.team%2Fauth%2Fcallback&scope=openid+profile+email&state=s1&code_challenge=c1&code_challenge_method=S256'
const getSigninUrl = vi.fn(async () => REQUEST)
vi.mock('@hanzo/iam/react', () => ({ useIam: () => ({ sdk: { getSigninUrl }, config: { serverUrl: 'https://hanzo.id', clientId: 'hanzo-team-native' } }) }))

import { address, handoff } from './handoff'
import { SignInPanel } from './SignInPanel'

afterEach(() => {
  getSigninUrl.mockClear()
  document.body.innerHTML = ''
})

describe('handoff', () => {
  const at = (u: string) => new URL(u)

  it('sends a provider press straight to IAM’s authorize on hanzo.ai, with the site’s own request', () => {
    const u = at(handoff(REQUEST, { kind: 'provider', provider: 'google' }))
    expect(u.origin + u.pathname).toBe('https://hanzo.ai/v1/iam/oauth/authorize')
    expect(u.searchParams.get('provider')).toBe('google')
    expect(u.searchParams.get('client_id')).toBe('hanzo-team-native')
    expect(u.searchParams.get('redirect_uri')).toBe('https://hanzo.team/auth/callback')
    expect(u.searchParams.get('code_challenge')).toBe('c1')
    expect(u.searchParams.get('state')).toBe('s1')
  })

  it('sends an email to hanzo.ai/login with the address, a new account to /signup, another account to the chooser', () => {
    const email = at(handoff(REQUEST, { kind: 'email', email: 'ada@example.com' }))
    expect(email.origin + email.pathname).toBe('https://hanzo.ai/login')
    expect(email.searchParams.get('login_hint')).toBe('ada@example.com')
    expect(at(handoff(REQUEST, { kind: 'signup' })).pathname).toBe('/signup')
    expect(at(handoff(REQUEST, { kind: 'another' })).searchParams.get('prompt')).toBe('select_account')
    expect(at(handoff(REQUEST, { kind: 'login' })).pathname).toBe('/login')
  })

  it('leaves for the sign-in origin it is given, never the issuer the request names', () => {
    expect(handoff(REQUEST, { kind: 'login' }, 'https://test.hanzo.ai/').startsWith('https://test.hanzo.ai/login?')).toBe(true)
    expect(handoff(REQUEST, { kind: 'provider', provider: 'github' })).not.toContain('hanzo.id')
  })

  it('reads an email as one and anything else as none', () => {
    expect(address('  ada@example.com ')).toBe('ada@example.com')
    expect(address('ada')).toBeNull()
    expect(address('ada@example')).toBeNull()
    expect(address('')).toBeNull()
  })
})

describe('SignInPanel', () => {
  const wrap = (node: React.ReactNode) => (
    <GuiProvider config={config} defaultTheme="light">
      {node}
    </GuiProvider>
  )

  it('draws the headline, both providers, the email way in and no password field', () => {
    const html = renderToStaticMarkup(wrap(<SignInPanel title="Sign in to Hanzo Team" line="Channels, agents and issues." />))
    expect(html).toContain('Sign in to Hanzo Team')
    expect(html).toContain('Continue with Google')
    expect(html).toContain('Continue with GitHub')
    expect(html).toContain('Continue with email')
    expect(html).toContain('Create account')
    expect(html).not.toContain('type="password"')
  })

  it('leaves for Google in one press, with the site’s own request', async () => {
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://hanzo.team', href: 'https://hanzo.team/', protocol: 'https:', host: 'hanzo.team', hostname: 'hanzo.team', pathname: '/', search: '', hash: '', assign },
      writable: true,
    })
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => root.render(wrap(<SignInPanel title="Sign in to Hanzo Team" />)))
    const google = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Google'))!
    await act(async () => google.click())
    expect(getSigninUrl).toHaveBeenCalledTimes(1)
    const left = new URL(assign.mock.calls[0]![0] as string)
    expect(left.origin + left.pathname).toBe('https://hanzo.ai/v1/iam/oauth/authorize')
    expect(left.searchParams.get('provider')).toBe('google')
    await act(async () => root.unmount())
  })
})
