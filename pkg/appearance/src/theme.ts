/**
 * Canonical `@hanzo/theme` palette alignment & bridge helpers for `@hanzo/appearance`.
 *
 * `@hanzo/theme` is the single source of truth for the seven built-in Hanzo
 * palettes (`zen`, `clay`, `grove`, `ocean`, `ember`, `iris`, `light`) and
 * legacy alias migrations (including `'lelouch' -> 'clay'`). This module
 * re-exports those canonical definitions and provides pure conversion helpers
 * so neither palette colors nor migration maps are ever duplicated here.
 */
import type { Scheme } from '@hanzo/design'
import {
  BUILT_IN_THEME_IDS,
  BUILT_IN_THEMES,
  BUILT_IN_THEMES_BY_ID,
  CLAY_THEME,
  EMBER_THEME,
  GROVE_THEME,
  IRIS_THEME,
  LEGACY_THEME_ALIASES,
  LIGHT_THEME,
  OCEAN_THEME,
  RESERVED_THEME_IDS,
  THEME_COLOR_ROLES,
  ZEN_THEME,
  colorLuminance,
  computeContrastForeground,
  computeThemeVars,
  getBuiltInTheme,
  getDefaultThemeColors,
  getThemeColorsForAppearance,
  isBuiltInThemeId,
  isThemeMode,
  resolveThemeId,
  resolveThemeState,
  roleToCssVar,
  type AppearanceConfig,
  type BuiltInThemeId,
  type ResolvedThemeState,
  type ThemeAppearance,
  type ThemeColorRole,
  type ThemeColors,
  type ThemeDefinition,
  type ThemeMode,
} from '@hanzo/theme'

import type { Preference } from './scope'

export {
  BUILT_IN_THEME_IDS,
  BUILT_IN_THEMES,
  BUILT_IN_THEMES_BY_ID,
  CLAY_THEME,
  EMBER_THEME,
  GROVE_THEME,
  IRIS_THEME,
  LEGACY_THEME_ALIASES,
  LIGHT_THEME,
  OCEAN_THEME,
  RESERVED_THEME_IDS,
  THEME_COLOR_ROLES,
  ZEN_THEME,
  colorLuminance,
  computeContrastForeground,
  computeThemeVars,
  getBuiltInTheme,
  getDefaultThemeColors,
  getThemeColorsForAppearance,
  isBuiltInThemeId,
  isThemeMode,
  resolveThemeId,
  resolveThemeState,
  roleToCssVar,
  type AppearanceConfig,
  type BuiltInThemeId,
  type ResolvedThemeState,
  type ThemeAppearance,
  type ThemeColorRole,
  type ThemeColors,
  type ThemeDefinition,
  type ThemeMode,
}

export interface PaletteSummary {
  readonly id: BuiltInThemeId
  readonly label: string
  readonly appearance: ThemeAppearance
}

/**
 * Ordered list of all canonical Hanzo palettes, derived directly from
 * `@hanzo/theme`'s `BUILT_IN_THEMES` so labels, order, and IDs never drift.
 */
export const PALETTES: readonly PaletteSummary[] = BUILT_IN_THEMES.map((t) => ({
  id: t.id as BuiltInThemeId,
  label: t.label,
  appearance: t.appearance,
}))

/**
 * Resolve any canonical palette ID or legacy alias (e.g. `'lelouch' -> 'clay'`,
 * `'dark' -> 'zen'`, `'hanzo-chat' -> 'light'`) through `@hanzo/theme`.
 * Returns `undefined` for unrecognized values so invalid storage entries are
 * safely dropped rather than coerced.
 */
export function resolvePalette(id: string | null | undefined): BuiltInThemeId | undefined {
  const theme = getBuiltInTheme(id)
  return theme ? (theme.id as BuiltInThemeId) : undefined
}

/**
 * Semantic color & surface CSS custom properties emitted by a palette.
 * Deliberately excludes typography, density, and radius knobs so selecting a
 * palette never stamps neutral sizing values over an unset `@hanzo/appearance` axis.
 */
const SEMANTIC_PALETTE_KEYS: readonly string[] = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--primary-hover',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--accent-hover',
  '--destructive',
  '--destructive-foreground',
  '--warning',
  '--warning-foreground',
  '--border',
  '--input',
  '--ring',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-muted-foreground',
  '--sidebar-border',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-ring',
  ...THEME_COLOR_ROLES.map(roleToCssVar),
]

/**
 * Compute CSS custom properties for a canonical `@hanzo/theme` palette (or
 * legacy alias like `'lelouch'`). Respects an explicit `scheme` (`'light'`,
 * `'dark'`, or `'system'`) for dual-variant palettes.
 */
export function paletteVars(
  palette: string | undefined,
  scheme?: Scheme,
  osDark = typeof matchMedia === 'function'
    ? matchMedia('(prefers-color-scheme: dark)').matches
    : true,
): Record<string, string> {
  const id = resolvePalette(palette)
  if (!id) return {}
  const all = computeThemeVars(
    {
      theme: id,
      ...(scheme ? { colorScheme: scheme } : {}),
    },
    osDark,
  )
  const out: Record<string, string> = {}
  for (const key of SEMANTIC_PALETTE_KEYS) {
    const val = all[key]
    if (val !== undefined) out[key] = val
  }
  return out
}

/**
 * Convert a `@hanzo/appearance` `Preference` into a `@hanzo/theme`
 * `Partial<AppearanceConfig>`, preserving canonical palette IDs and legacy
 * migrations (`'lelouch' -> 'clay'`).
 */
export function toThemeConfig(p: Preference): Partial<AppearanceConfig> {
  const out: Partial<AppearanceConfig> = {}
  const palette = resolvePalette(p.palette)
  if (palette) {
    out.theme = palette
    if (p.theme) out.colorScheme = p.theme
  } else if (p.theme === 'system') {
    out.theme = 'system'
  } else if (p.theme === 'light') {
    out.theme = 'light'
  } else if (p.theme === 'dark') {
    out.theme = 'zen'
  }

  if (p.density === 'compact') out.density = 'compact'
  else if (p.density === 'default') out.density = 'comfortable'
  else if (p.density === 'comfortable') out.density = 'spacious'

  if (p.radius === 'sharp') out.borderRadius = 0
  else if (p.radius === 'default') out.borderRadius = 8
  else if (p.radius === 'round') out.borderRadius = 16

  if (p.contrast === 'high') out.contrast = 'high'
  else if (p.contrast === 'soft') out.contrast = 'subtle'

  if (p.font === 'system') out.fontFamily = 'system'
  else if (p.font === 'mono') out.fontFamily = 'mono'
  else if (p.font === 'default') out.fontFamily = 'sans'

  if (typeof p.type === 'number' && Number.isFinite(p.type)) {
    out.fontSize = Math.round(Math.min(18, Math.max(12, 14 * p.type)))
  }

  if (p.accent) out.accent = p.accent

  return out
}

/**
 * Convert a `@hanzo/theme` `AppearanceConfig` into a `@hanzo/appearance`
 * `Preference`, migrating legacy theme IDs (such as `'lelouch' -> 'clay'`) via
 * `@hanzo/theme`'s `resolveThemeId`.
 */
export function fromThemeConfig(config: Partial<AppearanceConfig>): Preference {
  const out: Preference = {}

  if (config.theme !== undefined) {
    const resolved = resolveThemeId(config.theme)
    if (resolved === 'system') {
      out.theme = 'system'
    } else {
      out.palette = resolved
      if (config.colorScheme) {
        out.theme = config.colorScheme
      } else {
        const def = getBuiltInTheme(resolved)
        if (def) out.theme = def.appearance
      }
    }
  } else if (config.colorScheme) {
    out.theme = config.colorScheme
  }

  if (config.density === 'compact') out.density = 'compact'
  else if (config.density === 'comfortable') out.density = 'default'
  else if (config.density === 'spacious') out.density = 'comfortable'

  if (typeof config.borderRadius === 'number' && Number.isFinite(config.borderRadius)) {
    if (config.borderRadius <= 2) out.radius = 'sharp'
    else if (config.borderRadius >= 14) out.radius = 'round'
    else out.radius = 'default'
  }

  if (config.contrast === 'high') out.contrast = 'high'
  else if (config.contrast === 'subtle') out.contrast = 'soft'

  if (config.fontFamily === 'system') out.font = 'system'
  else if (config.fontFamily === 'mono') out.font = 'mono'
  else if (config.fontFamily === 'sans') out.font = 'default'

  if (typeof config.fontSize === 'number' && Number.isFinite(config.fontSize)) {
    out.type = Math.round((config.fontSize / 14) * 100) / 100
  }

  if (config.accent && config.accent !== 'default') {
    out.accent = config.accent
  }

  return out
}
