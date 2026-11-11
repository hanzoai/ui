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

describe('the panel entry (@hanzo/ui/auth/panel)', () => {
  it('loads the panel and its hand-off, and never the in-place form or @hanzogui/shell', async () => {
    const { readFileSync } = await import('node:fs')
    const imports = (file: string) => [...readFileSync(new URL(file, import.meta.url), 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
    // A bundler binds every name a module imports: a site with an older @hanzo/iam
    // (no SecondFactor) or without @hanzogui/shell must still build from this entry.
    expect(imports('./panel.ts').sort()).toEqual(['./SignInPanel', './handoff'])
    expect(imports('./SignInPanel.tsx').some((d) => /SignIn$|onboarding|@hanzogui\/shell/.test(d))).toBe(false)
    expect(imports('./handoff.ts')).toEqual([])
  })
})

describe('SignInPanel', () => {
  const wrap = (node: React.ReactNode) => (
    <GuiProvider config={config} defaultTheme="light">
      {node}
    </GuiProvider>
  )

  it('draws the headline, both providers and the email way in, closed, as hanzo.app does', () => {
    const html = renderToStaticMarkup(wrap(<SignInPanel title="Sign in to Hanzo Team" line="Channels, agents and issues." />))
    expect(html).toContain('Sign in to Hanzo Team')
    expect(html).toMatch(/data-signin-pair="">(?:(?!<\/div>).)*Continue with Google(?:(?!<\/div>).)*Continue with GitHub/)
    expect(html).toContain('Continue with email')
    // The address field opens on a press, as on hanzo.app; nothing asks for a password.
    expect(html).not.toContain('type="email"')
    expect(html).not.toContain('type="password"')
    // No sign-up line unless the site asks for one.
    expect(html).not.toContain('Create account')
    expect(renderToStaticMarkup(wrap(<SignInPanel signup />))).toContain('Create account')
    // Its rules ride along raw: an escaped quote would match nothing.
    expect(html).toContain('[data-slot="signin-panel"] [data-signin-btn]{')
    expect(html).not.toContain('[data-slot=&quot;')
  })

  it('stands on a solid card in the theme’s ground and hairline, which a site recolours or drops', () => {
    const frame = (props: Record<string, unknown> = {}) =>
      renderToStaticMarkup(wrap(<SignInPanel title="Sign in to Hanzo Team" {...props} />)).match(/<[a-z0-9]+[^>]*data-slot="signin-panel"[^>]*>/)?.[0] ?? ''
    const plain = frame()
    expect(plain).toContain('data-surface="card"')
    expect(plain).toMatch(/_bg-background/)
    expect(plain).toMatch(/_btw-1px/)
    expect(plain).toMatch(/borderColor/)
    const coloured = frame({ background: '$panel', borderColor: '$ink' })
    expect(coloured).toMatch(/_bg-panel/)
    expect(coloured).toMatch(/ink/)
    expect(coloured).not.toMatch(/_bg-background/)
    const bare = frame({ bare: true })
    expect(bare).toContain('data-surface="bare"')
    expect(bare).not.toMatch(/_bg-|_btw-1px/)
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

  it('takes the site’s own client when it mounts no provider, and leaves with the email it was given', async () => {
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://hanzo.team', href: 'https://hanzo.team/', protocol: 'https:', host: 'hanzo.team', hostname: 'hanzo.team', pathname: '/', search: '', hash: '', assign },
      writable: true,
    })
    const own = vi.fn(async () => REQUEST)
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => root.render(wrap(<SignInPanel title="Sign in to Hanzo Team" request={own} />)))
    expect(host.querySelector('input[type="email"]')).toBeNull()
    const open = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Continue with email'))!
    await act(async () => open.click())
    expect(own).not.toHaveBeenCalled()
    const input = host.querySelector('input[type="email"]') as HTMLInputElement
    expect(document.activeElement).toBe(input)
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(input, 'ada@example.com')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const email = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Continue with email'))!
    await act(async () => email.click())
    expect(own).toHaveBeenCalledWith({ additionalParams: { login_hint: 'ada@example.com' } })
    expect(getSigninUrl).not.toHaveBeenCalled()
    const left = new URL(assign.mock.calls[0]![0] as string)
    expect(left.origin + left.pathname).toBe('https://hanzo.ai/login')
    expect(left.searchParams.get('login_hint')).toBe('ada@example.com')
    await act(async () => root.unmount())
  })
})
