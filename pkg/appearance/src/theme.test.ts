/**
 * Verifies `@hanzo/appearance` aligns 100% with `@hanzo/theme` as the single
 * source of truth for canonical palettes (`zen`, `clay`, `grove`, `ocean`,
 * `ember`, `iris`, `light`) and legacy migrations (`'lelouch' -> 'clay'`),
 * with zero duplicated palette definitions.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import * as HanzoTheme from '@hanzo/theme'

import {
  BUILT_IN_THEMES,
  BUILT_IN_THEME_IDS,
  CLAY_THEME,
  KEY,
  LEGACY_THEME_ALIASES,
  PALETTES,
  apply,
  bootScript,
  fromThemeConfig,
  paletteVars,
  read,
  resolve,
  resolvePalette,
  toThemeConfig,
  write,
} from './index'
import { KNOBS } from './state'

const memory = (): Storage => {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
  } as Storage
}

let root: HTMLElement
beforeEach(() => {
  root = document.createElement('html')
})

describe('@hanzo/theme single-source-of-truth alignment', () => {
  it('re-exports canonical palette registries and alias tables directly from @hanzo/theme', () => {
    expect(BUILT_IN_THEME_IDS).toBe(HanzoTheme.BUILT_IN_THEME_IDS)
    expect(BUILT_IN_THEMES).toBe(HanzoTheme.BUILT_IN_THEMES)
    expect(LEGACY_THEME_ALIASES).toBe(HanzoTheme.LEGACY_THEME_ALIASES)
    expect(CLAY_THEME).toBe(HanzoTheme.CLAY_THEME)
    expect([...BUILT_IN_THEME_IDS]).toEqual(['zen', 'clay', 'grove', 'ocean', 'ember', 'iris', 'light'])
    expect(PALETTES.map((p) => p.id)).toEqual(['zen', 'clay', 'grove', 'ocean', 'ember', 'iris', 'light'])
  })

  it('migrates legacy aliases (including lelouch -> clay) without duplicating alias tables', () => {
    expect(resolvePalette('lelouch')).toBe('clay')
    expect(resolvePalette('LELOUCH')).toBe('clay')
    expect(resolvePalette('dark')).toBe('zen')
    expect(resolvePalette('hanzo-chat-dark')).toBe('zen')
    expect(resolvePalette('hanzo-chat')).toBe('light')
    expect(resolvePalette('hanzo-grove')).toBe('grove')
    expect(resolvePalette('hanzo-ocean')).toBe('ocean')
    expect(resolvePalette('hanzo-ember')).toBe('ember')
    expect(resolvePalette('hanzo-iris')).toBe('iris')
    expect(resolvePalette('hanzo-dev')).toBe('zen')

    // Canonical IDs pass through unchanged
    for (const id of BUILT_IN_THEME_IDS) {
      expect(resolvePalette(id)).toBe(id)
    }

    // Unknown or unsafe strings are rejected
    expect(resolvePalette('sepia')).toBeUndefined()
    expect(resolvePalette('</style>')).toBeUndefined()
    expect(resolvePalette('')).toBeUndefined()
    expect(resolvePalette(undefined)).toBeUndefined()
  })

  it('paletteVars() emits canonical theme colors without stamping unset sizing knobs', () => {
    const clay = paletteVars('clay')
    const migrated = paletteVars('lelouch')
    expect(migrated).toEqual(clay)
    expect(clay['--background']).toBe(CLAY_THEME.colors.canvas)
    expect(clay['--foreground']).toBe(CLAY_THEME.colors.text)
    expect(clay['--hz-canvas']).toBe(CLAY_THEME.colors.canvas)

    // Unset sizing axes MUST stay absent so brand defaults are never clobbered
    expect(clay['--type-scale']).toBeUndefined()
    expect(clay['--density']).toBeUndefined()
    expect(clay['--radius-scale']).toBeUndefined()
    expect(clay['--font-sans']).toBeUndefined()
  })

  it('supports dual-variant light/dark palettes via scheme', () => {
    const clayDark = paletteVars('clay', 'dark')
    const clayLight = paletteVars('clay', 'light')
    expect(clayDark['--background']).toBe(CLAY_THEME.colors.canvas)
    expect(clayLight['--background']).toBe(CLAY_THEME.variants?.light?.canvas)
    expect(clayLight['--background']).not.toBe(clayDark['--background'])
  })
})

describe('storage, scoping, and DOM lifecycle for palettes', () => {
  it('migrates stored lelouch -> clay on read() and write() and drops unknown palettes', () => {
    const s = memory()
    s.setItem(KEY, JSON.stringify({ palette: 'lelouch', type: 1.15 }))
    expect(read({ store: s })).toEqual({ palette: 'clay', type: 1.15 })

    s.setItem(KEY, JSON.stringify({ palette: 'not-a-theme' }))
    expect(read({ store: s })).toEqual({})

    write({ palette: 'lelouch' as never, density: 'compact' }, { store: s })
    expect(JSON.parse(s.getItem(KEY)!)).toEqual({ palette: 'clay', density: 'compact' })
  })

  it('composes palette per-axis across install < org < user < userOrg layers', () => {
    const r = resolve({
      install: { palette: 'zen' },
      org: { palette: 'grove', accent: '#10b981' },
      user: { type: 1.15 },
      userOrg: { palette: 'ocean' },
    })
    expect(r.pref).toEqual({ palette: 'ocean', accent: '#10b981', type: 1.15 })
    expect(r.from).toEqual({ palette: 'userOrg', accent: 'org', type: 'user' })
  })

  it('applies palette vars + data-theme and clears every single knob cleanly on reset', () => {
    apply({ palette: 'lelouch' as never }, root)
    expect(root.getAttribute('data-theme')).toBe('clay')
    expect(root.style.getPropertyValue('--background')).toBe(CLAY_THEME.colors.canvas)
    expect(root.style.getPropertyValue('--hz-canvas')).toBe(CLAY_THEME.colors.canvas)
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.style.getPropertyValue('--type-scale')).toBe('')

    // Clearing the preference removes every emitted palette custom property and data-theme
    apply({}, root)
    expect(root.hasAttribute('data-theme')).toBe(false)
    for (const name of KNOBS) {
      expect([name, root.style.getPropertyValue(name)]).toEqual([name, ''])
    }
  })

  it('bootScript() replays palette vars and data-theme identically to apply()', () => {
    const store = memory()
    apply({ palette: 'grove', type: 1.15 }, document.documentElement, { store })

    const html = document.createElement('html')
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

    expect(html.getAttribute('data-theme')).toBe('grove')
    expect(html.style.getPropertyValue('--background')).toBe(
      document.documentElement.style.getPropertyValue('--background'),
    )
    expect(html.style.getPropertyValue('--type-scale')).toBe('1.15')
  })

  it('bridges Preference <-> AppearanceConfig cleanly via toThemeConfig / fromThemeConfig', () => {
    const cfg = toThemeConfig({
      palette: 'lelouch' as never,
      density: 'compact',
      radius: 'round',
      contrast: 'high',
      type: 1.15,
      accent: '#10b981',
    })
    expect(cfg).toEqual({
      theme: 'clay',
      density: 'compact',
      borderRadius: 16,
      contrast: 'high',
      fontSize: 16,
      accent: '#10b981',
    })

    const pref = fromThemeConfig({
      theme: 'lelouch' as never,
      density: 'compact',
      borderRadius: 16,
      contrast: 'high',
      fontSize: 16,
      accent: '#10b981',
    })
    expect(pref).toEqual({
      palette: 'clay',
      theme: 'dark',
      density: 'compact',
      radius: 'round',
      contrast: 'high',
      type: 1.14,
      accent: '#10b981',
    })
  })
})
