/**
 * A preference is only worth offering if it survives a reload and reaches the
 * document. These pin both, plus the two ways this kind of control usually rots:
 * a cleared axis that stays stuck on the root, and a stored value nobody checked.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT, KEY, KNOBS, PAINTED, apply, bootScript, paint, read, style, write } from './state'

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
    write({ type: 1.15, density: 'compact', accent: '#808000', theme: 'light', radius: 'round' }, { store: s })
    expect(read({ store: s })).toEqual({ type: 1.15, density: 'compact', accent: '#808000', theme: 'light', radius: 'round' })
  })

  it('never throws when storage is blocked — an unreadable preference is an unset one', () => {
    expect(read({ store: hostile() })).toEqual({})
    expect(write({ type: 1.2 }, { store: hostile() })).toBe(false)
  })

  it('drops values it does not recognise rather than passing them to CSS', () => {
    const s = memory()
    s.setItem(KEY, JSON.stringify({ type: 'huge', density: 'roomy', theme: 'sepia', radius: 'pill', evil: '</style>' }))
    const p = read({ store: s }) as Record<string, unknown>
    expect(p.type).toBeUndefined()
    expect(p.density).toBeUndefined()
    expect(p.theme).toBeUndefined()
    expect(p.radius).toBeUndefined()
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

  it('an accent is a family: fill, ink and hover land and leave together', () => {
    apply({ accent: '#f59e0b' }, root)
    expect(root.style.getPropertyValue('--accent')).toBe('#f59e0b')
    expect(root.style.getPropertyValue('--accent-foreground')).toBe('#0a0a0a')
    expect(root.style.getPropertyValue('--accent-hover')).toContain('#f59e0b')
    expect(root.style.getPropertyValue('--primary-hover')).toContain('#f59e0b')
    apply({}, root)
    for (const name of ['--accent', '--accent-foreground', '--accent-hover', '--primary', '--primary-foreground', '--primary-hover']) {
      expect([name, root.style.getPropertyValue(name)]).toEqual([name, ''])
    }
  })

  it('corners are one knob on the root', () => {
    apply({ radius: 'sharp' }, root)
    expect(root.style.getPropertyValue('--radius-scale')).toBe('0.5')
    apply({}, root)
    expect(root.style.getPropertyValue('--radius-scale')).toBe('')
  })

  it('paints a chosen theme in design\'s and gui\'s words at once', () => {
    apply({ theme: 'light' }, root)
    expect(root.classList.contains('light')).toBe(true)
    expect(root.classList.contains('t_light')).toBe(true)
    expect(root.classList.contains('t_dark')).toBe(false)
    apply({ theme: 'dark' }, root)
    expect(root.classList.contains('light')).toBe(false)
    expect(root.classList.contains('t_dark')).toBe(true)
    expect(root.style.colorScheme).toBe('dark')
  })

  it('leaves a theme nobody chose to whoever else answers it', () => {
    root.className = 'light t_light'
    apply({ type: 1.1 }, root)
    expect(root.className).toBe('light t_light')
  })

  it('hands a cleared theme back to design\'s dark rather than leaving it stuck', () => {
    apply({ theme: 'light' }, root)
    apply({}, root)
    expect(root.classList.contains('light')).toBe(false)
    expect(root.classList.contains('t_dark')).toBe(true)
    expect(root.hasAttribute('data-scheme')).toBe(false)
  })

  it('system follows the device', () => {
    const real = globalThis.matchMedia
    globalThis.matchMedia = ((q: string) => ({ matches: q.includes('dark') ? false : true, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia
    try {
      paint('system', root)
      expect(root.classList.contains('light')).toBe(true)
      expect(root.getAttribute('data-scheme')).toBe('system')
    } finally {
      globalThis.matchMedia = real
    }
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

  // The boot script REPLAYS what apply() painted, so it cannot disagree with
  // it — and every axis is covered, the accent and the theme included, which
  // the computed copy it replaced never painted.
  const boot = (store: Storage, html = document.createElement('html')) => {
    const g = globalThis as unknown as { localStorage: Storage; document: { documentElement: HTMLElement } }
    const realDoc = g.document
    const realStore = g.localStorage
    g.localStorage = store
    g.document = { documentElement: html }
    try {
      // eslint-disable-next-line no-eval
      ;(0, eval)(bootScript())
    } finally {
      g.document = realDoc
      g.localStorage = realStore
    }
    return html
  }

  it.each([
    ['type and density', { type: 1.15, density: 'comfortable' as const }],
    ['an accent, with its ink and hover', { accent: '#3b82f6' }],
    ['corners', { radius: 'round' as const }],
    ['NOTHING stored', {}],
  ])('the boot script paints what apply() painted: %s', (_name, pref) => {
    const store = memory()
    apply(pref, document.documentElement, { store })
    const html = boot(store)
    for (const name of KNOBS) {
      expect([name, html.style.getPropertyValue(name)]).toEqual([name, document.documentElement.style.getPropertyValue(name)])
    }
  })

  it('the boot script paints the theme as both vocabularies, before React', () => {
    const store = memory()
    apply({ theme: 'light' }, document.documentElement, { store })
    const html = boot(store)
    expect([...html.classList].sort()).toEqual(['light', 't_light'])
    expect(html.getAttribute('data-scheme')).toBe('light')
    expect(html.style.colorScheme).toBe('light')
  })

  it('a device that never applied anything paints the install default', () => {
    const store = memory()
    const g = globalThis as unknown as { document: { documentElement: HTMLElement } }
    const html = document.createElement('html')
    const realDoc = g.document
    const realStore = (globalThis as { localStorage?: Storage }).localStorage
    ;(globalThis as { localStorage?: Storage }).localStorage = store
    g.document = { documentElement: html }
    try {
      // eslint-disable-next-line no-eval
      ;(0, eval)(bootScript({ base: { accent: '#f59e0b', theme: 'dark' } }))
    } finally {
      g.document = realDoc
      ;(globalThis as { localStorage?: Storage }).localStorage = realStore
    }
    expect(html.style.getPropertyValue('--primary')).toBe('#f59e0b')
    expect(html.style.getPropertyValue('--primary-foreground')).toBe('#0a0a0a')
    expect(html.classList.contains('t_dark')).toBe(true)
    expect(store.getItem(PAINTED)).toBeNull()
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
