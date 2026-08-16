/**
 * A preference is only worth offering if it survives a reload and reaches the
 * document. These pin both, plus the two ways this kind of control usually rots:
 * a cleared axis that stays stuck on the root, and a stored value nobody checked.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT, KEY, apply, bootScript, read, style, write } from './state'

/** A localStorage that behaves, and one that refuses — private mode and embedded
 *  frames both throw rather than returning null, which is the case that takes a
 *  surface down if it is not handled. */
const memory = (): Storage => {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size },
  } as Storage
}
const hostile = (): Storage => ({
  getItem() { throw new Error('blocked') },
  setItem() { throw new Error('blocked') },
  removeItem() {}, clear() {}, key: () => null, length: 0,
} as unknown as Storage)

let root: HTMLElement
beforeEach(() => { root = document.createElement('html') })

describe('read', () => {
  it('answers EMPTY when nothing is stored — an unset axis is absent, not neutral', () => {
    // Deliberately not DEFAULT. What `read()` returns reaches the document as an
    // INLINE custom property, which outranks every stylesheet, so answering with
    // a neutral 1 would override a brand's own scale on every untouched install.
    expect(read({ store: memory() })).toEqual({})
  })

  it('round-trips what write stored', () => {
    const s = memory()
    write({ type: 1.15, density: 'compact', accent: '#808000' }, { store: s })
    expect(read({ store: s })).toEqual({ type: 1.15, density: 'compact', accent: '#808000' })
  })

  it('never throws when storage is blocked — an unreadable preference is an unset one', () => {
    expect(read({ store: hostile() })).toEqual({})
    expect(write({ type: 1.2 }, { store: hostile() })).toBe(false)
  })

  it('drops values it does not recognise rather than passing them to CSS', () => {
    const s = memory()
    s.setItem(KEY, JSON.stringify({ type: 'huge', density: 'roomy', evil: '</style>' }))
    const p = read({ store: s }) as Record<string, unknown>
    expect(p.type).toBeUndefined()
    expect(p.density).toBeUndefined()
    expect(p.evil).toBeUndefined()
  })

  it('survives a corrupt value', () => {
    const s = memory()
    s.setItem(KEY, 'not json{')
    expect(read({ store: s })).toEqual({})
  })

  it('DEFAULT is what an unset axis READS AS, never what gets written', () => {
    // The panel shows Default selected for an absent axis; the document is left
    // alone. Both halves of that sentence matter, so both are stated here.
    expect(DEFAULT).toEqual({ type: 1, density: 'default' })
    const empty = read({ store: memory() })
    expect(empty.type ?? DEFAULT.type).toBe(1)
    apply(empty, root)
    expect(root.style.getPropertyValue('--type-scale')).toBe('')
    expect(root.style.getPropertyValue('--density')).toBe('')
  })
})

describe('apply', () => {
  it('puts the knobs on the root, where every ramp reads them', () => {
    apply({ type: 1.15, density: 'compact' }, root)
    expect(root.style.getPropertyValue('--type-scale')).toBe('1.15')
    expect(root.style.getPropertyValue('--density')).toBe('0.85')
  })

  it('REMOVES an axis that is cleared, instead of writing a neutral value', () => {
    // Writing `1` looks identical and silently outranks a brand that set its own.
    apply({ type: 1.3, accent: '#808000' }, root)
    expect(root.style.getPropertyValue('--type-scale')).toBe('1.3')
    expect(root.style.getPropertyValue('--primary')).toBe('#808000')

    apply({}, root)
    expect(root.style.getPropertyValue('--type-scale')).toBe('')
    expect(root.style.getPropertyValue('--primary')).toBe('')
    expect(root.style.getPropertyValue('--accent')).toBe('')
  })

  it('refuses a colour that is trying to be a second declaration', () => {
    apply({ accent: 'red; background-image:url(//evil/x)' }, root)
    expect(root.style.getPropertyValue('--primary')).toBe('')
  })

  it('clamps a preference that would render the UI illegible', () => {
    apply({ type: 99 }, root)
    expect(Number(root.style.getPropertyValue('--type-scale'))).toBeLessThanOrEqual(1.4)
    apply({ type: 0.01 }, root)
    expect(Number(root.style.getPropertyValue('--type-scale'))).toBeGreaterThanOrEqual(0.85)
  })

  it('is a no-op without a document, so a server render does not crash', () => {
    expect(() => apply({ type: 1.2 }, undefined)).not.toThrow()
  })
})

describe('first paint', () => {
  it('style() emits one block for the root', () => {
    const out = style({ type: 1.15 })
    expect(out.startsWith('html:root{')).toBe(true)
    expect(out).toContain('--type-scale:1.15')
  })

  // Two implementations of one rule is how a flash becomes a permanent
  // disagreement, so they are checked against each other rather than trusted.
  //
  // BOTH cases, and the empty one is the whole point: the head script has always
  // set a property only when one is stored, while `read()` used to merge DEFAULT
  // in, so `apply(read())` stamped `--type-scale: 1; --density: 1` on every
  // untouched install. Checking only a stored value passed throughout.
  it.each([
    ['a stored value', { type: 1.15, density: 'comfortable' as const }],
    ['NOTHING stored', {}],
  ])('the boot script agrees with apply() on %s', (_name, stored) => {
    const store = memory()
    write(stored, { store })

    apply(read({ store }), root)
    const viaApply = {
      type: root.style.getPropertyValue('--type-scale'),
      density: root.style.getPropertyValue('--density'),
    }

    const boot = document.createElement('html')
    const g = globalThis as unknown as { localStorage: Storage; document: { documentElement: HTMLElement } }
    const realDoc = g.document
    g.localStorage = store
    g.document = { documentElement: boot }
    try {
      // eslint-disable-next-line no-eval
      ;(0, eval)(bootScript())
    } finally {
      g.document = realDoc
    }

    expect({
      type: boot.style.getPropertyValue('--type-scale'),
      density: boot.style.getPropertyValue('--density'),
    }).toEqual(viaApply)
  })

  it('the boot script never throws on a blocked or corrupt store', () => {
    const g = globalThis as unknown as { localStorage: Storage; document: { documentElement: HTMLElement } }
    const realDoc = g.document
    g.localStorage = hostile()
    g.document = { documentElement: document.createElement('html') }
    try {
      // eslint-disable-next-line no-eval
      expect(() => (0, eval)(bootScript())).not.toThrow()
    } finally {
      g.document = realDoc
    }
  })
})
