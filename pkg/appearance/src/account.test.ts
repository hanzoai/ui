import { describe, expect, it, vi } from 'vitest'

import { load, save } from './account'

const base = 'https://hanzo.id'

describe('the account layer', () => {
  it('asks nobody when there is no bearer, because there is no person yet', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await load({ base })).toBeUndefined()
    expect(await save({ type: 1.3 }, { base })).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('reads the appearance member out of the whole preferences blob', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ consent: { training: 'refused' }, appearance: { type: 1.3 } }),
    })))
    expect(await load({ base, token: 't' })).toEqual({ type: 1.3 })
    vi.unstubAllGlobals()
  })

  // A default here would be indistinguishable from a choice, and would outrank
  // the device's own answer with a neutral one.
  it('is absent, not neutral, when the account cannot answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    expect(await load({ base, token: 't' })).toBeUndefined()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await load({ base, token: 't' })).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('sends only its own member, so a sibling key is not clobbered', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({}) }))
    vi.stubGlobal('fetch', fetchSpy)
    await save({ density: 'compact' }, { base, token: 't' })
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://hanzo.id/v1/iam/preferences')
    expect(JSON.parse(init.body as string)).toEqual({ appearance: { density: 'compact' } })
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t')
    vi.unstubAllGlobals()
  })

  it('answers whether it stuck, because a caller promised "saved"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    expect(await save({ type: 1 }, { base, token: 't' })).toBe(false)
    vi.unstubAllGlobals()
  })
})
