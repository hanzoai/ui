import { beforeEach, describe, expect, it } from 'vitest'

import {
  ACCENT_PRESETS,
  APPEARANCE_STORAGE_KEY,
  BUILT_IN_THEMES,
  BUILT_IN_THEMES_BY_ID,
  BUILT_IN_THEME_IDS,
  CLAY_THEME,
  DEFAULT_APPEARANCE,
  DENSITY_VALUES,
  EMBER_THEME,
  FONT_FAMILY_STACKS,
  GROVE_THEME,
  IRIS_THEME,
  LIGHT_THEME,
  LINE_HEIGHT_VALUES,
  OCEAN_THEME,
  RADIUS_PRESETS,
  RESERVED_THEME_IDS,
  THEME_COLOR_ROLES,
  TYPE_RATIOS,
  ZEN_THEME,
  applyThemeToDocument,
  buildPrePaintScript,
  computeContrastForeground,
  computeThemeVars,
  generateThemesStylesheet,
  getBuiltInTheme,
  getThemeColorsForAppearance,
  loadAppearance,
  parseThemeFile,
  resolveThemeId,
  roleToCssVar,
  saveAppearance,
  serializeThemeFile,
  themeCssLoadsRemoteFiles,
  themeCssValueFetches,
  themeToCss,
  type AppearanceConfig,
  type ThemeDefinition,
} from './index'

describe('Built-in palettes & legacy migration', () => {
  it('exposes exactly the 7 clean built-in theme IDs without hanzo-chat or lelouch', () => {
    expect(BUILT_IN_THEME_IDS).toEqual([
      'zen',
      'clay',
      'grove',
      'ocean',
      'ember',
      'iris',
      'light',
    ])
    expect(BUILT_IN_THEMES).toHaveLength(7)
    expect(BUILT_IN_THEME_IDS as readonly string[]).not.toContain('hanzo-chat')
    expect(BUILT_IN_THEME_IDS as readonly string[]).not.toContain('lelouch')
  })

  it('defines all 61 color roles for every built-in theme in both dark and light appearances', () => {
    expect(THEME_COLOR_ROLES).toHaveLength(61)

    for (const id of BUILT_IN_THEME_IDS) {
      const theme = BUILT_IN_THEMES_BY_ID[id]
      expect(theme.id).toBe(id)

      const darkColors = getThemeColorsForAppearance(theme, 'dark')
      const lightColors = getThemeColorsForAppearance(theme, 'light')
      expect(darkColors, `${id} dark palette`).not.toBeNull()
      expect(lightColors, `${id} light palette`).not.toBeNull()

      for (const role of THEME_COLOR_ROLES) {
        expect(darkColors![role], `${id}.dark.${role}`).toBeTruthy()
        expect(lightColors![role], `${id}.light.${role}`).toBeTruthy()
      }
    }
  })

  it('keeps Clay as pure warm stone/charcoal grey with no purple or crimson', () => {
    expect(CLAY_THEME.id).toBe('clay')
    expect(CLAY_THEME.label).toBe('Clay')
    expect(CLAY_THEME.appearance).toBe('dark')
    expect(CLAY_THEME.colors.canvas).toBe('#161514')
    expect(CLAY_THEME.colors.accent).toBe('#e7e4de')
    expect(CLAY_THEME.colors.accentForeground).toBe('#161514')
    expect(CLAY_THEME.variants?.light?.canvas).toBe('#f5f4f1')
  })

  it('silently resolves legacy aliases via resolveThemeId() and getBuiltInTheme()', () => {
    expect(resolveThemeId('lelouch')).toBe('clay')
    expect(resolveThemeId('  LELOUCH  ')).toBe('clay')
    expect(resolveThemeId('dark')).toBe('zen')
    expect(resolveThemeId('hanzo-chat-dark')).toBe('zen')
    expect(resolveThemeId('hanzo-chat')).toBe('light')
    expect(resolveThemeId('hanzo-grove')).toBe('grove')
    expect(resolveThemeId('hanzo-ocean')).toBe('ocean')
    expect(resolveThemeId('hanzo-ember')).toBe('ember')
    expect(resolveThemeId('hanzo-iris')).toBe('iris')
    expect(resolveThemeId('system')).toBe('system')
    expect(resolveThemeId('light')).toBe('light')
    expect(resolveThemeId('nonexistent')).toBe('zen')
    expect(resolveThemeId(undefined)).toBe('zen')

    expect(getBuiltInTheme('lelouch')).toBe(CLAY_THEME)
    expect(getBuiltInTheme('dark')).toBe(ZEN_THEME)
    expect(getBuiltInTheme('hanzo-chat')).toBe(LIGHT_THEME)
    expect(getBuiltInTheme('grove')).toBe(GROVE_THEME)
    expect(getBuiltInTheme('ocean')).toBe(OCEAN_THEME)
    expect(getBuiltInTheme('ember')).toBe(EMBER_THEME)
    expect(getBuiltInTheme('iris')).toBe(IRIS_THEME)
    expect(getBuiltInTheme('unknown')).toBeNull()
  })

  it('preserves lelouch and legacy aliases in RESERVED_THEME_IDS so custom themes cannot shadow them', () => {
    expect(RESERVED_THEME_IDS.has('lelouch')).toBe(true)
    expect(RESERVED_THEME_IDS.has('dark')).toBe(true)
    expect(RESERVED_THEME_IDS.has('light')).toBe(true)
    expect(RESERVED_THEME_IDS.has('system')).toBe(true)
    expect(RESERVED_THEME_IDS.has('hanzo-chat')).toBe(true)
    expect(RESERVED_THEME_IDS.has('hanzo-chat-dark')).toBe(true)
    for (const id of BUILT_IN_THEME_IDS) {
      expect(RESERVED_THEME_IDS.has(id)).toBe(true)
    }
  })
})

describe('computeThemeVars — dynamic design tokens', () => {
  it('emits both @hanzo/design standard vars and --hz-* semantic vars for default Zen', () => {
    const vars = computeThemeVars(DEFAULT_APPEARANCE)
    expect(vars['--background']).toBe('#000000')
    expect(vars['--foreground']).toBe('#f5f5f5')
    expect(vars['--card']).toBe('#080808')
    expect(vars['--border']).toBe('#1c1c1c')
    expect(vars['--primary']).toBe('#ffffff')
    expect(vars['--primary-foreground']).toBe('#0a0a0a')
    expect(vars['--accent']).toBe('#ffffff')
    expect(vars['--radius']).toBe('8px')
    expect(vars['--type-scale']).toBe('1')
    expect(vars['--density']).toBe('1')

    expect(vars['--hz-canvas']).toBe('#000000')
    expect(vars['--hz-radius-md']).toBe('8px')
    expect(vars['--hz-font-size']).toBe('14px')
    expect(vars['--hz-line-height']).toBe('1.5')
    expect(vars['--hz-density']).toBe('1')

    // All 61 color roles should be emitted as --hz-<kebab>
    for (const role of THEME_COLOR_ROLES) {
      expect(vars[roleToCssVar(role)], `missing ${role}`).toBeTruthy()
    }
  })

  it('computes border radius tokens across all presets and clamps 0..20px', () => {
    expect(RADIUS_PRESETS).toEqual({
      sharp: 0,
      subtle: 4,
      balanced: 8,
      soft: 12,
      round: 16,
    })

    const sharp = computeThemeVars({ borderRadius: RADIUS_PRESETS.sharp })
    expect(sharp['--radius']).toBe('0px')
    expect(sharp['--hz-radius-sm']).toBe('0px')
    expect(sharp['--hz-radius-lg']).toBe('0px')
    expect(sharp['--radius-scale']).toBe('0')

    const round = computeThemeVars({ borderRadius: RADIUS_PRESETS.round })
    expect(round['--radius']).toBe('16px')
    expect(round['--hz-radius-sm']).toBe('8px')
    expect(round['--hz-radius-lg']).toBe('24px')
    expect(round['--hz-radius-xl']).toBe('32px')
    expect(round['--radius-scale']).toBe('2')

    // Clamp out-of-range inputs
    expect(computeThemeVars({ borderRadius: -10 })['--radius']).toBe('0px')
    expect(computeThemeVars({ borderRadius: 999 })['--radius']).toBe('20px')
  })

  it('computes monotonic modular typography scale across all 4 type ratios (1.125..1.333)', () => {
    expect(TYPE_RATIOS).toEqual([1.125, 1.2, 1.25, 1.333])

    const parsePx = (v: string) => Number.parseFloat(v.replace('px', ''))

    for (const ratio of TYPE_RATIOS) {
      const vars = computeThemeVars({ fontSize: 16, typeRatio: ratio })
      expect(vars['--type-ratio']).toBe(String(ratio))
      expect(vars['--hz-type-ratio']).toBe(String(ratio))
      expect(vars['--hz-font-size']).toBe('16px')
      expect(vars['--type-scale']).toBe(String(Math.round((16 / 14) * 10000) / 10000))

      const xs = parsePx(vars['--hz-text-xs']!)
      const sm = parsePx(vars['--hz-text-sm']!)
      const base = parsePx(vars['--hz-text-base']!)
      const lg = parsePx(vars['--hz-text-lg']!)
      const xl = parsePx(vars['--hz-text-xl']!)
      const x2 = parsePx(vars['--hz-text-2xl']!)
      const x3 = parsePx(vars['--hz-text-3xl']!)

      expect(base).toBe(16)
      expect(xs).toBeLessThanOrEqual(sm)
      expect(sm).toBeLessThan(base)
      expect(base).toBeLessThan(lg)
      expect(lg).toBeLessThan(xl)
      expect(xl).toBeLessThan(x2)
      expect(x2).toBeLessThan(x3)
    }

    // Higher ratio yields larger 3xl than lower ratio at same base font size
    const tightScale = parsePx(computeThemeVars({ fontSize: 14, typeRatio: 1.125 })['--hz-text-3xl']!)
    const wideScale = parsePx(computeThemeVars({ fontSize: 14, typeRatio: 1.333 })['--hz-text-3xl']!)
    expect(wideScale).toBeGreaterThan(tightScale * 1.5)
  })

  it('applies density, font family, and line height presets', () => {
    for (const [preset, expected] of Object.entries(DENSITY_VALUES)) {
      const vars = computeThemeVars({ density: preset as AppearanceConfig['density'] })
      expect(vars['--density']).toBe(String(expected))
      expect(vars['--hz-density']).toBe(String(expected))
    }

    for (const [family, stack] of Object.entries(FONT_FAMILY_STACKS)) {
      const vars = computeThemeVars({ fontFamily: family as AppearanceConfig['fontFamily'] })
      expect(vars['--font-sans']).toBe(stack)
      expect(vars['--hz-font-family']).toBe(stack)
    }

    for (const [lh, value] of Object.entries(LINE_HEIGHT_VALUES)) {
      const vars = computeThemeVars({ lineHeight: lh as AppearanceConfig['lineHeight'] })
      expect(vars['--line-height']).toBe(String(value))
      expect(vars['--hz-line-height']).toBe(String(value))
    }
  })

  it('applies named accent presets and custom hex colors with WCAG contrast-safe foreground', () => {
    const emeraldDark = computeThemeVars({ theme: 'zen', accent: 'emerald' })
    expect(emeraldDark['--primary']).toBe(ACCENT_PRESETS.emerald.dark)
    expect(emeraldDark['--accent']).toBe(ACCENT_PRESETS.emerald.dark)
    expect(emeraldDark['--primary-foreground']).toBe('#0a0a0a')

    const indigoLight = computeThemeVars({ theme: 'light', accent: 'indigo' })
    expect(indigoLight['--primary']).toBe(ACCENT_PRESETS.indigo.light)
    expect(indigoLight['--primary-foreground']).toBe('#ffffff')

    // Bright yellow custom hex -> dark ink foreground
    const yellowCustom = computeThemeVars({ theme: 'zen', accent: '#facc15' })
    expect(yellowCustom['--primary']).toBe('#facc15')
    expect(yellowCustom['--primary-foreground']).toBe('#0a0a0a')

    // Deep navy custom hex -> light ink foreground
    const navyCustom = computeThemeVars({ theme: 'light', accent: '#1e3a8a' })
    expect(navyCustom['--primary']).toBe('#1e3a8a')
    expect(navyCustom['--primary-foreground']).toBe('#ffffff')

    expect(computeContrastForeground('#ffffff')).toBe('#0a0a0a')
    expect(computeContrastForeground('#000000')).toBe('#ffffff')
  })

  it('adjusts tokens cleanly for subtle, default, and high contrast modes', () => {
    const highDark = computeThemeVars({ theme: 'clay', contrast: 'high' })
    expect(highDark['--background']).toBe('#000000')
    expect(highDark['--foreground']).toBe('#ffffff')
    expect(highDark['--hz-contrast']).toBe('high')
    expect(highDark['--hz-contrast-level']).toBe('1.2')

    const highLight = computeThemeVars({ theme: 'light', contrast: 'high' })
    expect(highLight['--background']).toBe('#ffffff')
    expect(highLight['--foreground']).toBe('#000000')

    const subtle = computeThemeVars({ theme: 'clay', contrast: 'subtle' })
    expect(subtle['--hz-contrast']).toBe('subtle')
    expect(subtle['--hz-contrast-level']).toBe('0.85')
    expect(subtle['--border']).toContain('color-mix')
  })

  it('resolves system theme dynamically against osDark', () => {
    const darkVars = computeThemeVars({ theme: 'system' }, true)
    const lightVars = computeThemeVars({ theme: 'system' }, false)
    expect(darkVars['--background']).toBe(ZEN_THEME.colors.canvas)
    expect(lightVars['--background']).toBe(LIGHT_THEME.colors.canvas)
  })
})

describe('applyThemeToDocument, persistence, and buildPrePaintScript', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-mode')
    document.documentElement.removeAttribute('data-appearance')
    document.documentElement.removeAttribute('data-contrast')
    document.documentElement.removeAttribute('data-density')
    window.localStorage.clear()
  })

  it('applies data attributes, color-scheme, classes, and CSS vars to documentElement', () => {
    const res = applyThemeToDocument(
      {
        theme: 'clay',
        borderRadius: 12,
        fontSize: 16,
        typeRatio: 1.25,
        density: 'compact',
        contrast: 'high',
        accent: 'emerald',
      },
      document,
    )

    const root = document.documentElement
    expect(res.resolvedThemeId).toBe('clay')
    expect(res.appearance).toBe('dark')
    expect(root.getAttribute('data-theme')).toBe('clay')
    expect(root.getAttribute('data-appearance')).toBe('dark')
    expect(root.getAttribute('data-contrast')).toBe('high')
    expect(root.getAttribute('data-density')).toBe('compact')
    expect(root.style.colorScheme).toBe('dark')
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.classList.contains('light')).toBe(false)
    expect(root.classList.contains('t_dark')).toBe(true)
    expect(root.style.getPropertyValue('--radius')).toBe('12px')
    expect(root.style.getPropertyValue('--hz-font-size')).toBe('16px')
    expect(root.style.getPropertyValue('--density')).toBe('0.85')
    expect(root.style.getPropertyValue('--primary')).toBe(ACCENT_PRESETS.emerald.dark)

    // Switch to light theme
    applyThemeToDocument({ theme: 'light' }, document)
    expect(root.getAttribute('data-theme')).toBe('light')
    expect(root.style.colorScheme).toBe('light')
    expect(root.classList.contains('light')).toBe(true)
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.classList.contains('t_light')).toBe(true)
  })

  it('round-trips loadAppearance / saveAppearance and migrates legacy lelouch -> clay', () => {
    const custom: AppearanceConfig = {
      theme: 'ocean',
      borderRadius: 16,
      fontSize: 15,
      typeRatio: 1.25,
      fontFamily: 'mono',
      lineHeight: 'relaxed',
      density: 'spacious',
      contrast: 'high',
      accent: '#0ea5e9',
    }
    expect(saveAppearance(custom, window.localStorage)).toBe(true)
    expect(loadAppearance(window.localStorage)).toEqual(custom)

    // Legacy stored preference migration
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme: 'lelouch', borderRadius: 10, fontSize: 15 }),
    )
    const migrated = loadAppearance(window.localStorage)
    expect(migrated.theme).toBe('clay')
    expect(migrated.borderRadius).toBe(10)
    expect(migrated.fontSize).toBe(15)

    // Legacy dark / hanzo-chat migration
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme: 'hanzo-chat-dark' }),
    )
    expect(loadAppearance(window.localStorage).theme).toBe('zen')

    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: 'hanzo-chat' }))
    expect(loadAppearance(window.localStorage).theme).toBe('light')

    // Corrupt JSON never throws
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, '{invalid-json')
    expect(loadAppearance(window.localStorage)).toEqual(DEFAULT_APPEARANCE)
  })

  it('executes buildPrePaintScript() synchronously with zero FOUC and migrates lelouch -> clay', () => {
    const storageKey = 'test.hanzo.theme'
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        theme: 'lelouch',
        borderRadius: 12,
        fontSize: 16,
        density: 'compact',
      }),
    )

    const script = buildPrePaintScript(storageKey)
    expect(script).toContain(storageKey)

    // Execute inline script in jsdom just like <head><script>...</script></head>
    new Function(script)()

    const root = document.documentElement
    expect(root.getAttribute('data-theme')).toBe('clay')
    expect(root.getAttribute('data-appearance')).toBe('dark')
    expect(root.style.colorScheme).toBe('dark')
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.style.getPropertyValue('--background')).toBe(CLAY_THEME.colors.canvas)
    expect(root.style.getPropertyValue('--radius')).toBe('12px')
    expect(root.style.getPropertyValue('--hz-font-size')).toBe('16px')
    expect(root.style.getPropertyValue('--density')).toBe('0.85')
  })

  it('replays full painted snapshot from saveAppearance in buildPrePaintScript()', () => {
    const storageKey = 'test.hanzo.painted'
    saveAppearance(
      { theme: 'ember', accent: '#f97316', borderRadius: 4, contrast: 'high' },
      window.localStorage,
      storageKey,
    )

    new Function(buildPrePaintScript(storageKey))()

    const root = document.documentElement
    expect(root.getAttribute('data-theme')).toBe('ember')
    expect(root.getAttribute('data-contrast')).toBe('high')
    expect(root.style.getPropertyValue('--primary')).toBe('#f97316')
    expect(root.style.getPropertyValue('--radius')).toBe('4px')
  })
})

describe('Portable JSON theme parseThemeFile / serializeThemeFile & CSS utilities', () => {
  it('round-trips a custom theme JSON file cleanly', () => {
    const raw = {
      version: 1,
      name: 'Midnight Copper',
      appearance: 'dark',
      colors: {
        canvas: '#12100e',
        accent: '#d97706',
        accentForeground: '#ffffff',
      },
      variants: {
        light: {
          canvas: '#faf7f2',
          accent: '#b45309',
        },
      },
      collection: { id: 'hanzo.studio', label: 'Studio' },
    }

    const parsed: ThemeDefinition = parseThemeFile(raw)
    expect(parsed.id).toBe('midnight-copper')
    expect(parsed.label).toBe('Midnight Copper')
    expect(parsed.appearance).toBe('dark')
    expect(parsed.colors.canvas).toBe('#12100e')
    expect(parsed.colors.accent).toBe('#d97706')
    expect(Object.keys(parsed.colors)).toHaveLength(61)
    expect(parsed.variants?.light?.canvas).toBe('#faf7f2')
    expect(parsed.collection).toEqual({ id: 'hanzo.studio', label: 'Studio' })

    const json = serializeThemeFile(parsed)
    const reparsed = parseThemeFile(json)
    expect(reparsed).toEqual(parsed)
  })

  it('rejects reserved IDs (including lelouch and built-ins) and invalid CSS colors', () => {
    expect(() =>
      parseThemeFile({
        version: 1,
        id: 'lelouch',
        name: 'Lelouch',
        appearance: 'dark',
        colors: {},
      }),
    ).toThrow(/reserved/i)

    expect(() =>
      parseThemeFile({
        version: 1,
        id: 'zen',
        name: 'Zen',
        appearance: 'dark',
        colors: {},
      }),
    ).toThrow(/reserved/i)

    expect(() =>
      parseThemeFile({
        version: 1,
        name: 'Injected',
        appearance: 'dark',
        colors: { canvas: 'red; background: url(https://evil.example)' },
      }),
    ).toThrow(/invalid css color/i)

    expect(() =>
      parseThemeFile({
        version: 99,
        name: 'Future',
        appearance: 'dark',
        colors: {},
      }),
    ).toThrow(/unsupported version|unsupported theme file version/i)
  })

  it('generates static CSS stylesheets and blocks remote CSS resource fetches', () => {
    const block = themeToCss({ theme: 'clay', borderRadius: 10 })
    expect(block).toContain('[data-theme="clay"]')
    expect(block).toContain('color-scheme: dark;')
    expect(block).toContain(`--background: ${CLAY_THEME.colors.canvas};`)
    expect(block).toContain('--radius: 10px;')

    const fullSheet = generateThemesStylesheet()
    expect(fullSheet).toContain(':root {')
    for (const id of BUILT_IN_THEME_IDS) {
      expect(fullSheet).toContain(`[data-theme="${id}"]`)
    }

    expect(themeCssLoadsRemoteFiles('@import "https://evil.example/a.css";')).toBe(true)
    expect(themeCssLoadsRemoteFiles('body { background: url(https://evil.example/x.png); }')).toBe(
      true,
    )
    expect(themeCssLoadsRemoteFiles('body { background: url("data:image/png;base64,AAA"); }')).toBe(
      false,
    )
    expect(themeCssValueFetches('url(https://evil.example/x.png)')).toBe(true)
    expect(themeCssValueFetches('#161514')).toBe(false)
  })
})
