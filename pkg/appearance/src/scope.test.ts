import { describe, expect, it } from 'vitest'

import { isInherited, layerFor, resolve } from './scope'
import { KNOBS, keyFor, read, readLayers, write } from './state'
import { vars } from '@hanzo/design'

const memory = (): Storage => {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
  } as Storage
}

describe('resolve', () => {
  it('composes AXES, not layers — an org keeps its accent while a person sets their size', () => {
    // The failure this exists to prevent: choosing a whole winning layer would
    // drop the org's brand colour the instant someone nudged type size, which
    // reads as the setting being broken rather than as precedence working.
    const r = resolve({ org: { accent: '#ff5c00' }, user: { type: 1.15 } })
    expect(r.pref).toEqual({ type: 1.15, accent: '#ff5c00' })
    expect(r.from).toEqual({ type: 'user', accent: 'org' })
  })

  it('gives the narrowest layer the axis it sets, and only that axis', () => {
    const r = resolve({
      install: { type: 1, ratio: 1, density: 'default', accent: '#111' },
      org: { accent: '#ff5c00', density: 'compact' },
      user: { type: 1.15 },
      userOrg: { type: 1.3 },
    })
    expect(r.pref).toEqual({ type: 1.3, ratio: 1, density: 'compact', accent: '#ff5c00' })
    expect(r.from).toEqual({ type: 'userOrg', ratio: 'install', density: 'org', accent: 'org' })
  })

  it('leaves an axis nobody set ABSENT rather than neutral', () => {
    // Decisive, not cosmetic: apply() writes an inline custom property for a
    // present axis, and an inline property outranks any stylesheet — so a
    // neutral 1 written here silently overrides a brand that set its own scale.
    const r = resolve({ user: { type: 1.15 } })
    expect('density' in r.pref).toBe(false)
    expect('ratio' in r.pref).toBe(false)
    expect(r.from.density).toBeUndefined()
  })

  it('treats an empty string as unset, so a cleared field does not win', () => {
    expect(resolve({ org: { accent: '#ff5c00' }, user: { accent: '' } }).pref.accent).toBe('#ff5c00')
  })

  it('answers with nothing when nobody has an opinion', () => {
    expect(resolve({}).pref).toEqual({})
  })
})

describe('scope', () => {
  it('sends a save to the layer the person chose', () => {
    expect(layerFor('everywhere')).toBe('user')
    expect(layerFor('org')).toBe('userOrg')
  })

  it('knows when a value is being decided somewhere the person cannot reach', () => {
    const r = resolve({ org: { accent: '#ff5c00' }, user: { type: 1.15 } })
    expect(isInherited(r, 'accent', 'everywhere')).toBe(true)
    expect(isInherited(r, 'type', 'everywhere')).toBe(false)
    // Editing the org layer: their own everywhere setting is now the one they
    // cannot change from here either.
    expect(isInherited(r, 'type', 'org')).toBe(true)
  })
})

describe('a modular scale', () => {
  it('is removable — every rung it writes is on the removal list', () => {
    // An inline custom property outranks the stylesheet, so a rung a modular
    // scale wrote and nothing removes is a ramp the design system can never get
    // back. This is the exact shape of the bug the removal list exists for.
    const written = Object.keys(vars({ modular: 1.618 }))
    expect(written.length).toBeGreaterThan(0)
    for (const name of written) expect(KNOBS).toContain(name)
  })

  it('resolves per axis like every other — an org scale, a person size', () => {
    const r = resolve({ org: { modular: 1.618 }, user: { type: 1.15 } })
    expect(r.pref).toEqual({ type: 1.15, modular: 1.618 })
    expect(r.from).toEqual({ type: 'user', modular: 'org' })
  })
})

describe('storage', () => {
  it('keeps the bare key for everywhere, so a pre-scoping install reads back unchanged', () => {
    expect(keyFor('everywhere')).toBe('hanzo.appearance')
    expect(keyFor('org', 'acme')).toBe('hanzo.appearance@acme')
    // No org in scope is not an org named "undefined".
    expect(keyFor('org')).toBe('hanzo.appearance')
  })

  it('holds the two personal layers apart — clearing one leaves the other', () => {
    const store = memory()
    write({ type: 1.15 }, { store })
    write({ type: 1.3 }, { scope: 'org', org: 'acme', store })

    expect(resolve(readLayers({ org: 'acme', store })).pref.type).toBe(1.3)

    write({}, { scope: 'org', org: 'acme', store })
    expect(resolve(readLayers({ org: 'acme', store })).pref.type).toBe(1.15)
    expect(read({ store }).type).toBe(1.15)
  })

  it('does not read an org layer when no org is in scope', () => {
    // Otherwise one org's settings become the home of everyone signed out.
    const store = memory()
    write({ type: 1.3 }, { scope: 'org', org: 'acme', store })
    expect(readLayers({ store }).userOrg).toBeUndefined()
    expect(resolve(readLayers({ store })).pref.type).toBeUndefined()
  })

  it('round-trips the ratio axis and drops a non-numeric one', () => {
    const store = memory()
    write({ ratio: 1.2 }, { store })
    expect(read({ store }).ratio).toBe(1.2)

    store.setItem('hanzo.appearance', JSON.stringify({ ratio: 'airy' }))
    expect(read({ store }).ratio).toBeUndefined()
  })
})
