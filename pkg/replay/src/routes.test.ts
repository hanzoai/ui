import { describe as group, expect, it } from 'vitest'
import { CREDENTIAL_ROUTES, isCredentialRoute } from './routes'

group('isCredentialRoute', () => {
  it('refuses the OAuth callback wherever an app mounted it', () => {
    for (const p of [
      '/callback',
      '/callback/',
      '/auth/callback',
      '/api/auth/callback',
      '/CALLBACK',
      '/Auth/Callback/',
    ]) {
      expect(isCredentialRoute(p), p).toBe(true)
    }
  })

  it('refuses the device-authorization page', () => {
    for (const p of ['/login/oauth/device', '/login/oauth/device/', '/id/login/oauth/device']) {
      expect(isCredentialRoute(p), p).toBe(true)
    }
  })

  it('records everywhere else — the boundary is a whole path segment', () => {
    for (const p of [
      '/',
      '/pricing',
      '/oauth-callback', // '-callback', not '/callback'
      '/callbacks',
      '/login',
      '/login/oauth',
      '/docs/callback-urls',
      '',
    ]) {
      expect(isCredentialRoute(p), p).toBe(false)
    }
  })

  it('names both refused routes', () => {
    expect([...CREDENTIAL_ROUTES]).toEqual(['/callback', '/login/oauth/device'])
  })
})
