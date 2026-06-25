/**
 * Tests for the composable `@hanzo/ui` sign-in surface.
 *
 * Mechanism (buildIamAuthorizeUrl):
 *   - canonical /v1/iam/oauth/authorize path, PKCE-S256, verifier + state stashed.
 *   - the `provider` knob rides as &provider=<name> — one flow, parameterized.
 * Presentation (<SignIn>):
 *   - renders a method per provider; brand-neutral (semantic tokens, no hex).
 *   - each social atom delegates to the injected login starter with `provider`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'

import { buildIamAuthorizeUrl, startIamLogin } from './iam'
import { SignIn } from './SignIn'
import { SocialButton } from './SocialButton'

const CONFIG = { serverUrl: 'https://hanzo.id', clientId: 'hanzo-app' }

beforeEach(() => {
  sessionStorage.clear()
})

describe('buildIamAuthorizeUrl (mechanism)', () => {
  it('builds the canonical PKCE-S256 authorize URL with no provider by default', async () => {
    const url = new URL(await buildIamAuthorizeUrl({ ...CONFIG, redirectUri: 'https://app.test/auth/callback' }))
    expect(url.pathname).toBe('/v1/iam/oauth/authorize')
    expect(url.searchParams.get('client_id')).toBe('hanzo-app')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/auth/callback')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect((url.searchParams.get('code_challenge') ?? '').length).toBeGreaterThanOrEqual(43)
    expect(url.searchParams.get('state')).toBeTruthy()
    expect(url.searchParams.get('provider')).toBeNull()
    expect(sessionStorage.getItem('hanzo_iam_pkce_verifier')).toBeTruthy()
    expect(sessionStorage.getItem('hanzo_iam_state')).toBeTruthy()
  })

  it.each(['google', 'github', 'web3'])('rides provider=%s as a hint (one flow, still PKCE)', async (provider) => {
    const url = new URL(await buildIamAuthorizeUrl({ ...CONFIG, provider }))
    expect(url.pathname).toBe('/v1/iam/oauth/authorize')
    expect(url.searchParams.get('provider')).toBe(provider)
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('code_challenge')).toBeTruthy()
  })

  it('no /api/ prefix anywhere in the authorize URL', async () => {
    const url = await buildIamAuthorizeUrl({ ...CONFIG, provider: 'google' })
    expect(url).not.toContain('/api/')
  })
})

describe('<SignIn> (presentation)', () => {
  it('renders the password form + one button per social provider', () => {
    render(
      <SignIn providers={['password', 'google', 'github', 'web3']} config={CONFIG} onPasswordSubmit={vi.fn()} />,
    )
    // password form
    expect(screen.getByLabelText(/email/i)).toBeTruthy()
    expect(screen.getByLabelText(/password/i)).toBeTruthy()
    // a button per provider, each tagged with its provider
    expect(document.querySelector('[data-provider="google"]')).toBeTruthy()
    expect(document.querySelector('[data-provider="github"]')).toBeTruthy()
    expect(document.querySelector('[data-provider="web3"]')).toBeTruthy()
  })

  it('renders social-only (no password form) when password is not requested', () => {
    render(<SignIn providers={['google']} config={CONFIG} />)
    expect(screen.queryByLabelText(/password/i)).toBeNull()
    expect(document.querySelector('[data-provider="google"]')).toBeTruthy()
  })

  it('is brand-neutral — no hardcoded hex colors in the rendered markup', () => {
    const { container } = render(<SignIn providers={['password', 'google']} config={CONFIG} onPasswordSubmit={vi.fn()} />)
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
  })
})

describe('<SocialButton> composition (injected starter)', () => {
  it('delegates to the injected onLogin with the provider knob', () => {
    const onLogin = vi.fn()
    render(<SocialButton provider="google" config={CONFIG} onLogin={onLogin} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google', clientId: 'hanzo-app' }))
  })

  it('defaults to startIamLogin when no onLogin is injected (smoke: PKCE flow begins)', async () => {
    // happy-dom navigation is a no-op; assert the verifier got stashed (flow began).
    // buildIamAuthorizeUrl awaits an async SHA-256 digest, so poll rather than tick once.
    render(<SocialButton provider="github" config={CONFIG} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(sessionStorage.getItem('hanzo_iam_pkce_verifier')).toBeTruthy())
  })
})

// Keep a direct reference so tree-shakers/linters don't flag the import.
void startIamLogin
