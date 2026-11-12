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
import { SIGNIN_STYLE, SignInCard } from './look'
import { Input } from '../backends/gui/input'
import { InputGroup } from '../backends/gui/input-group'
import { Action } from '../marketing/controls'

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
    expect(imports('./panel.ts').sort()).toEqual(['./SignInPanel', './handoff', './look'])
    for (const file of ['./SignInPanel.tsx', './look.tsx']) expect(imports(file).some((d) => /SignIn$|onboarding|@hanzogui\/shell/.test(d))).toBe(false)
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
    expect(html).toContain('[data-signin] [data-signin-btn]{')
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

describe('SignInCard', () => {
  const wrap = (node: React.ReactNode) => (
    <GuiProvider config={config} defaultTheme="light">
      {node}
    </GuiProvider>
  )

  /** Every selector the rules name, past the card's own scope. */
  const selectors = () =>
    [...SIGNIN_STYLE.replace(/@container[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)].flatMap((m) => m[1]!.split(/,(?![^(]*\))/)).map((s) => s.trim())

  it('is a host’s own region, found by its own slot, with the rules every sign-in shares', () => {
    const html = renderToStaticMarkup(
      wrap(
        <SignInCard slot="signin" render="section" aria-label="Log in">
          <p>steps</p>
        </SignInCard>,
      ),
    )
    const frame = html.match(/<section[^>]*>/)?.[0] ?? ''
    expect(frame).toContain('data-signin=""')
    expect(frame).toContain('data-slot="signin"')
    expect(frame).toContain('aria-label="Log in"')
    expect(frame).toContain('data-surface="card"')
    expect(html).toContain('<p>steps</p>')
    // One scope for every rule, so nothing it says reaches past the card.
    expect(selectors().every((s) => s.startsWith('[data-signin] '))).toBe(true)
    expect(html).not.toContain('[data-signin]&quot;')
  })

  it('draws this library’s Input, InputGroup and filled Action as the field and the solid control, untouched by a mark', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () =>
      root.render(
        wrap(
          <SignInCard slot="signin">
            <Input size="lg" fill type="email" aria-label="Email" />
            <Input size="lg" type="password" aria-label="Password" />
            <InputGroup size="lg" fill>
              <Input aria-label="Phone number" />
            </InputGroup>
            <Action render="button" type="submit" fill>
              Continue
            </Action>
          </SignInCard>,
        ),
      ),
    )
    const card = host.querySelector('[data-signin]')!
    const hits = (el: Element) => selectors().filter((s) => !/:(hover|active|disabled|focus-visible)|::/.test(s) && el.matches(s))
    const email = card.querySelector('input[aria-label="Email"]')!
    const password = card.querySelector('input[aria-label="Password"]')!
    const phone = card.querySelector('input[aria-label="Phone number"]')!
    const group = card.querySelector('[data-slot="input-group"]')!
    const submit = [...card.querySelectorAll('button')].find((b) => b.textContent === 'Continue')!
    // The field's box, on a lone Input; a password keeps its own padding for the eye.
    for (const field of [email, password]) expect(hits(field).some((s) => s.includes('input[data-slot="input"]'))).toBe(true)
    expect(SIGNIN_STYLE).toMatch(/input\[data-slot="input"\]:not\(\[data-slot="input-group"\] \*\):not\(#_\)\{height:46px;border-radius:14px;font-size:14px;background-color:[^;}]+\}/)
    // Inside a group the group is the box, and the field is only its text.
    expect(hits(phone)).toEqual([])
    expect(hits(group).length).toBeGreaterThan(0)
    // The filled Action is the solid control, 46px with 14px corners.
    expect(submit.hasAttribute('data-fill')).toBe(true)
    const solid = hits(submit)
    expect(solid.some((s) => s.endsWith('[data-fill]'))).toBe(true)
    // Its corners outrank a host that holds every Action round with !important of its own.
    expect(SIGNIN_STYLE).toMatch(/\[data-slot="action"\]:not\(#_\)\{box-sizing:border-box;height:46px;min-height:46px;padding:0 14px;gap:9px;border-radius:14px!important;/)
    await act(async () => root.unmount())
  })

  it('splits the providers’ row in equal halves that no label can widen', () => {
    // A bare `1fr` keeps its label's width as its floor: "Continue with Google"
    // needs 197px of a 195px half, so the pair stood 402px against the field's
    // 398 and GitHub ran 3px past the column's edge (hanzo.ai/login at 1440).
    const columns = [...SIGNIN_STYLE.matchAll(/\[data-signin-pair\]\{[^}]*grid-template-columns:([^;}]+)/g)].map((m) => m[1])
    expect(columns).toEqual(['repeat(2,minmax(0,1fr))', 'minmax(0,1fr)'])
  })
})
