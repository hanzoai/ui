import { describe, it, expect } from 'vitest'

import {
  PROVIDERS,
  createSocialApi,
  normalizeAccounts,
  normalizePost,
  normalizeProviderCapability,
  normalizeProviders,
  normalizeSummary,
  type SocialRest,
} from './api'

/**
 * The /v1/social contract. These pin (1) that the real store.go JSON shape — including
 * the server-managed publish results — normalizes, (2) that a garbage/absent field
 * degrades to a safe default rather than throwing, and (3) the EXACT path + method each
 * method asks its host transport for. The host owns the origin and the credential, so
 * pinning paths here is what keeps every host on one contract.
 */
describe('Social normalizers — real store.go JSON shape, defensive', () => {
  it('normalizes a post including the server-managed publish results', () => {
    const p = normalizePost({
      id: 'post_1', content: 'hi', channel: 'linkedin', status: 'published',
      scheduleAt: 1000, accountId: 'acct_1', externalId: 'ext_9', error: '',
      createdAt: 1, updatedAt: 2,
    })
    expect(p).toMatchObject({
      id: 'post_1', content: 'hi', channel: 'linkedin', status: 'published',
      scheduleAt: 1000, accountId: 'acct_1', externalId: 'ext_9',
    })
    // Empty error normalizes to undefined (omitted), never the string "".
    expect(p.error).toBeUndefined()
  })

  it('coerces missing/garbage post fields to safe defaults (never throws)', () => {
    const p = normalizePost({ id: 'post_2' })
    expect(p).toMatchObject({ id: 'post_2', content: '', channel: 'x', status: 'draft', scheduleAt: 0 })
    expect(p.externalId).toBeUndefined()
    expect(normalizePost(null).id).toBe('')
  })

  it('carries a post’s media through — cloud’s PUT rebuilds the row, so dropping it would wipe it', () => {
    expect(normalizePost({ id: 'post_3', media: ['https://s3/a.png', 'https://s3/b.png'] }).media).toEqual([
      'https://s3/a.png',
      'https://s3/b.png',
    ])
    // Always an array, and non-string entries are dropped rather than rendered.
    expect(normalizePost({ id: 'post_4' }).media).toEqual([])
    expect(normalizePost({ id: 'post_5', media: 'nope' }).media).toEqual([])
    expect(normalizePost({ id: 'post_6', media: ['ok', 7, null] }).media).toEqual(['ok'])
  })

  it('normalizes a provider capability with the missing-credentials list', () => {
    const c = normalizeProviderCapability({
      provider: 'x', credentialsConfigured: false, missingCredentials: ['X_API_KEY', 'X_API_SECRET'],
    })
    expect(c).toEqual({ provider: 'x', credentialsConfigured: false, missingCredentials: ['X_API_KEY', 'X_API_SECRET'] })
    // A configured provider with a non-array field degrades to an empty list.
    expect(normalizeProviderCapability({ provider: 'linkedin', credentialsConfigured: true })).toEqual({
      provider: 'linkedin', credentialsConfigured: true, missingCredentials: [],
    })
  })

  it('reads lists from any envelope key or a bare array', () => {
    expect(normalizeProviders({ data: [{ provider: 'x' }, { provider: 'threads' }] }).map((c) => c.provider)).toEqual([
      'x', 'threads',
    ])
    expect(normalizeAccounts([{ id: 'a' }, { id: 'b' }]).length).toBe(2)
    expect(normalizeSummary({ posts: 3, scheduled: 1, published: 2, accounts: 4 })).toEqual({
      posts: 3, scheduled: 1, published: 2, accounts: 4,
    })
  })

  it('exposes the network vocabulary', () => {
    expect(PROVIDERS).toEqual(['x', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'threads'])
  })
})

describe('createSocialApi — the paths every host asks its transport for', () => {
  const calls: string[] = []
  const rest: SocialRest = {
    get: (p) => (calls.push(`GET ${p}`), Promise.resolve({ data: [] })),
    post: (p) => (calls.push(`POST ${p}`), Promise.resolve({ id: 'post_1', status: 'failed', error: 'not configured' })),
    put: (p) => (calls.push(`PUT ${p}`), Promise.resolve({})),
    del: (p) => (calls.push(`DELETE ${p}`), Promise.resolve()),
  }
  const api = createSocialApi(rest)

  it('asks for every documented route, relative to /v1/social', async () => {
    calls.length = 0
    await api.summary()
    await api.providers()
    await api.posts.list()
    await api.accounts.list('x')
    await api.accounts.remove('acct 1')
    expect(calls).toEqual([
      'GET summary',
      'GET providers',
      'GET posts',
      'GET accounts?provider=x',
      'DELETE accounts/acct%201', // ids are URI-encoded, never interpolated raw
    ])
  })

  it('publishes through POST posts/:id/publish and normalizes the honest failure', async () => {
    calls.length = 0
    const p = await api.posts.publish('post_1')
    expect(calls).toEqual(['POST posts/post_1/publish'])
    expect(p).toMatchObject({ id: 'post_1', status: 'failed', error: 'not configured' })
  })
})
