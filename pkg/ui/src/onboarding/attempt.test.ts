// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { keyFor, purchase, settle, uncharged } from './attempt'

/** A browser's store, the same on every runtime the suite runs on. */
function browserStore(): void {
  const kept = new Map<string, string>()
  const store = {
    getItem: (k: string) => kept.get(k) ?? null,
    setItem: (k: string, v: string) => void kept.set(k, v),
    removeItem: (k: string) => void kept.delete(k),
    clear: () => kept.clear(),
    key: (i: number) => [...kept.keys()][i] ?? null,
    get length() {
      return kept.size
    },
  }
  Object.defineProperty(window, 'localStorage', { value: store, configurable: true })
}

describe('the retry key of a purchase', () => {
  beforeEach(browserStore)

  it('is the same key for the same purchase until it settles, across a remount or a second tab', () => {
    const sale = purchase('acme', 'dev', 'monthly', 1)
    const first = keyFor(sale)
    expect(keyFor(sale)).toBe(first)
    expect(keyFor(purchase('acme', 'dev', 'monthly', 1))).toBe(first)
    settle(sale)
    expect(keyFor(sale)).not.toBe(first)
  })

  it('is a different key for a different organization, plan, term or seat count', () => {
    const base = keyFor(purchase('acme', 'team', 'monthly', 2))
    expect(keyFor(purchase('other', 'team', 'monthly', 2))).not.toBe(base)
    expect(keyFor(purchase('acme', 'dev', 'monthly', 2))).not.toBe(base)
    expect(keyFor(purchase('acme', 'team', 'annual', 2))).not.toBe(base)
    expect(keyFor(purchase('acme', 'team', 'monthly', 3))).not.toBe(base)
  })

  it('is given up only on an answer that says nothing was charged, or that the account already pays', () => {
    for (const status of [400, 402, 404, 422]) expect(uncharged(status)).toBe(true)
    expect(uncharged(409, 'this account already pays for the "dev" plan (subscription s1); change that subscription instead')).toBe(true)
    expect(uncharged(409, 'subscription already in progress')).toBe(false)
    for (const status of [undefined, 0, 409, 500, 502, 503, 504]) expect(uncharged(status)).toBe(false)
  })

  it('is new after a day, so a later purchase is not a replay of an old one', () => {
    const sale = purchase('acme', 'dev', 'monthly', 1)
    const t0 = 1_800_000_000_000
    const first = keyFor(sale, t0)
    expect(keyFor(sale, t0 + 60_000)).toBe(first)
    expect(keyFor(sale, t0 + 25 * 60 * 60 * 1000)).not.toBe(first)
  })
})
