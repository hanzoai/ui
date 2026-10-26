/**
 * The composer setting is one record every composer obeys, so these pin that a
 * choice survives the trip and that nothing it does not know reaches a composer.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { COMPOSING, composing, loadComposing, readComposing, saveComposing, writeComposing } from './composing'

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('composing', () => {
  it('keeps only values a composer can obey', () => {
    expect(composing({ send: 'mod', chips: false, model: true, mode: false })).toEqual({ send: 'mod', chips: false, model: true, mode: false })
    expect(composing({ send: 'shift', chips: 'yes', model: 1, mode: 'on', other: 2 })).toEqual({})
    expect(composing(null)).toEqual({})
  })

  it('answers nothing where nothing was chosen, so the surface default holds', () => {
    expect(readComposing()).toEqual({})
  })

  it('round-trips a choice through this device and tells the page', () => {
    const heard = vi.fn()
    window.addEventListener('hanzo:composer', heard)
    writeComposing({ send: 'mod', chips: false })
    expect(JSON.parse(window.localStorage.getItem(COMPOSING)!)).toEqual({ send: 'mod', chips: false })
    expect(readComposing()).toEqual({ send: 'mod', chips: false })
    expect(heard).toHaveBeenCalledTimes(1)
    window.removeEventListener('hanzo:composer', heard)
  })

  it('removes the key once every axis is back to Auto', () => {
    writeComposing({ chips: true })
    writeComposing({})
    expect(window.localStorage.getItem(COMPOSING)).toBeNull()
    expect(readComposing()).toEqual({})
  })

  it('reads and writes the account under its own member', async () => {
    const fetch = vi.fn(async (_url: string, init: RequestInit) => {
      const patch = JSON.parse(String(init.body)) as Record<string, unknown>
      return new Response(JSON.stringify({ status: 'ok', data: { appearance: { type: 1 }, composer: { send: 'mod', bogus: 1 }, ...patch } }))
    })
    vi.stubGlobal('fetch', fetch)
    const account = { base: window.location.origin, token: 't' }
    expect(await loadComposing(account)).toEqual({ send: 'mod' })
    expect(await saveComposing({ chips: false }, account)).toBe(true)
    expect(JSON.parse(String(fetch.mock.calls[1]![1].body))).toEqual({ composer: { chips: false } })
    vi.unstubAllGlobals()
  })
})
