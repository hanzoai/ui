/**
 * Dynamic Design Tokens & Appearance Engine for @hanzo/theme.
 *
 * Pure TypeScript, zero React, zero runtime dependencies — safe for SSR,
 * browser extensions, desktop/mobile shells, TUI, and web apps.
 */

import {
  BUILT_IN_THEMES_BY_ID,
  LEGACY_THEME_ALIASES,
  LIGHT_THEME,
  THEME_COLOR_ROLES,
  ZEN_THEME,
  getBuiltInTheme,
  getThemeColorsForAppearance,
  isValidThemeColor,
  resolveThemeId,
  type BuiltInThemeId,
  type ThemeAppearance,
  type ThemeColorRole,
  type ThemeColors,
  type ThemeDefinition,
  type ThemeMode,
} from './palettes'

// ── Types & Presets ──────────────────────────────────────────────────────────

export const RADIUS_MIN = 0
export const RADIUS_MAX = 20

export const RADIUS_PRESETS = {
  sharp: 0,
  subtle: 4,
  balanced: 8,
  soft: 12,
  round: 16,
} as const

export type RadiusPreset = keyof typeof RADIUS_PRESETS

export const FONT_SIZE_MIN = 12
export const FONT_SIZE_MAX = 18

export const TYPE_RATIOS = [1.125, 1.2, 1.25, 1.333] as const
export type TypeRatio = (typeof TYPE_RATIOS)[number]

export const TYPE_RATIO_LABELS: Readonly<Record<TypeRatio, string>> = {
  1.125: 'Major Second (1.125)',
  1.2: 'Minor Third (1.200)',
  1.25: 'Major Third (1.250)',
  1.333: 'Perfect Fourth (1.333)',
}

export type FontFamily = 'system' | 'sans' | 'mono'

export const FONT_FAMILY_STACKS: Readonly<Record<FontFamily, string>> = {
  system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  sans: '"Geist", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  mono: '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
}

export type LineHeightPreset = 'tight' | 'normal' | 'relaxed'

export const LINE_HEIGHT_VALUES: Readonly<Record<LineHeightPreset, number>> = {
  tight: 1.35,
  normal: 1.5,
  relaxed: 1.65,
}

export type DensityPreset = 'compact' | 'comfortable' | 'spacious'

export const DENSITY_VALUES: Readonly<Record<DensityPreset, number>> = {
  compact: 0.85,
  comfortable: 1.0,
  spacious: 1.15,
}

export type ContrastPreset = 'subtle' | 'default' | 'high'

export type AccentPreset = 'default' | 'mono' | 'indigo' | 'emerald' | 'amber' | 'rose'
export type AccentChoice = AccentPreset | (string & {})

export const ACCENT_PRESETS: Readonly<
  Record<Exclude<AccentPreset, 'default'>, Readonly<Record<ThemeAppearance, string>>>
> = {
  mono: { dark: '#ffffff', light: '#18181b' },
  indigo: { dark: '#818cf8', light: '#4f46e5' },
  emerald: { dark: '#34d399', light: '#059669' },
  amber: { dark: '#fbbf24', light: '#d97706' },
  rose: { dark: '#fb7185', light: '#e11d48' },
}

export interface AppearanceConfig {
  /** Active palette ID or `'system'` to follow OS preference. Default `'zen'`. */
  theme: ThemeMode
  /** Base border radius in px (0–20). Default `8` (`balanced`). */
  borderRadius: number
  /** Base body font size in px (12–18). Default `14`. */
  fontSize: number
  /** Modular typography scale ratio. Default `1.2`. */
  typeRatio: TypeRatio
  /** Primary UI font stack. Default `'sans'`. */
  fontFamily: FontFamily
  /** Body line-height preset. Default `'normal'` (`1.5`). */
  lineHeight: LineHeightPreset
  /** Spacing density preset. Default `'comfortable'` (`1.0`). */
  density: DensityPreset
  /** Visual contrast preset. Default `'default'`. */
  contrast: ContrastPreset
  /** Accent preset or custom CSS color (e.g. `#0ea5e9`). Default `'default'`. */
  accent: AccentChoice
  /** Optional explicit light/dark override for dual-variant palettes. */
  colorScheme?: ThemeAppearance | 'system'
}

export const DEFAULT_APPEARANCE: Readonly<AppearanceConfig> = {
  theme: 'zen',
  borderRadius: 8,
  fontSize: 14,
  typeRatio: 1.2,
  fontFamily: 'sans',
  lineHeight: 'normal',
  density: 'comfortable',
  contrast: 'default',
  accent: 'default',
}

export const APPEARANCE_STORAGE_KEY = 'hanzo.theme'
export const APPEARANCE_CHANGE_EVENT = 'hanzo:theme'

// ── Color Contrast Helpers ───────────────────────────────────────────────────

const DARK_INK = '#0a0a0a'
const LIGHT_INK = '#ffffff'

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function round(n: number, decimals = 4): number {
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}

function formatPx(n: number): string {
  return `${round(n, 2)}px`
}

function srgbChannelToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  )
}

function contrastRatio(lumA: number, lumB: number): number {
  const hi = Math.max(lumA, lumB)
  const lo = Math.min(lumA, lumB)
  return (hi + 0.05) / (lo + 0.05)
}

function parseNumberOrPercent(token: string, scale: number): number {
  const n = Number.parseFloat(token)
  return token.trim().endsWith('%') ? (n / 100) * scale : n
}

/**
 * Compute WCAG relative luminance (0..1) for hex, rgb/rgba, hsl/hsla, and
 * oklch/oklab CSS colors. Returns `null` when unparseable.
 */
export function colorLuminance(color: string): number | null {
  const s = color.trim().toLowerCase()

  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s)
  if (hex) {
    const raw = hex[1]!
    const full =
      raw.length <= 4 ? [...raw.slice(0, 3)].map((ch) => ch + ch).join('') : raw.slice(0, 6)
    const r = Number.parseInt(full.slice(0, 2), 16) / 255
    const g = Number.parseInt(full.slice(2, 4), 16) / 255
    const b = Number.parseInt(full.slice(4, 6), 16) / 255
    return relativeLuminance(r, g, b)
  }

  const fn = /^(rgba?|hsla?|oklch|oklab)\(([^)]*)\)$/.exec(s)
  if (!fn) return null
  const fnName = fn[1]!
  const parts = fn[2]!.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3 || parts.slice(0, 3).some((p) => !Number.isFinite(Number.parseFloat(p)))) {
    return null
  }

  if (fnName.startsWith('rgb')) {
    const r = clamp(parseNumberOrPercent(parts[0]!, 255), 0, 255) / 255
    const g = clamp(parseNumberOrPercent(parts[1]!, 255), 0, 255) / 255
    const b = clamp(parseNumberOrPercent(parts[2]!, 255), 0, 255) / 255
    return relativeLuminance(r, g, b)
  }

  if (fnName.startsWith('hsl')) {
    const h = ((Number.parseFloat(parts[0]!) % 360) + 360) % 360
    const sat = clamp(parseNumberOrPercent(parts[1]!, 1), 0, 1)
    const l = clamp(parseNumberOrPercent(parts[2]!, 1), 0, 1)
    const k = (n: number) => (n + h / 30) % 12
    const a = sat * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
    return relativeLuminance(f(0), f(8), f(4))
  }

  // OKLCH / OKLab: L^3 approximates relative luminance accurately for dark/light ink decisions.
  const l = clamp(parseNumberOrPercent(parts[0]!, 1), 0, 1)
  return l ** 3
}

/**
 * Return the highest-contrast foreground ink (`#0a0a0a` or `#ffffff`) for a
 * given background/accent color according to WCAG 2.1 contrast ratio.
 */
export function computeContrastForeground(color: string): string {
  const lum = colorLuminance(color)
  if (lum === null) return LIGHT_INK
  const darkLum = colorLuminance(DARK_INK) ?? 0
  const lightLum = colorLuminance(LIGHT_INK) ?? 1
  return contrastRatio(lum, darkLum) >= contrastRatio(lum, lightLum) ? DARK_INK : LIGHT_INK
}

// ── Role -> CSS Variable Mapping ─────────────────────────────────────────────

/** Convert a camelCase theme role (e.g. `surfaceRaised`) to `--hz-surface-raised`. */
export function roleToCssVar(role: ThemeColorRole): string {
  const kebab = role.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
  return `--hz-${kebab}`
}

// ── Sanitization & Resolution ────────────────────────────────────────────────

function nearestTypeRatio(value: unknown): TypeRatio {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_APPEARANCE.typeRatio
  let best: TypeRatio = DEFAULT_APPEARANCE.typeRatio
  let bestDiff = Number.POSITIVE_INFINITY
  for (const ratio of TYPE_RATIOS) {
    const diff = Math.abs(ratio - value)
    if (diff < bestDiff) {
      bestDiff = diff
      best = ratio
    }
  }
  return best
}

function isFontFamily(value: unknown): value is FontFamily {
  return value === 'system' || value === 'sans' || value === 'mono'
}

function isLineHeightPreset(value: unknown): value is LineHeightPreset {
  return value === 'tight' || value === 'normal' || value === 'relaxed'
}

function isDensityPreset(value: unknown): value is DensityPreset {
  return value === 'compact' || value === 'comfortable' || value === 'spacious'
}

function isContrastPreset(value: unknown): value is ContrastPreset {
  return value === 'subtle' || value === 'default' || value === 'high'
}

function isAccentPreset(value: unknown): value is AccentPreset {
  return (
    value === 'default' ||
    value === 'mono' ||
    value === 'indigo' ||
    value === 'emerald' ||
    value === 'amber' ||
    value === 'rose'
  )
}

function sanitizeAccent(value: unknown): AccentChoice {
  if (typeof value !== 'string') return DEFAULT_APPEARANCE.accent
  const trimmed = value.trim()
  const lower = trimmed.toLowerCase()
  if (isAccentPreset(lower)) return lower
  if (isValidThemeColor(trimmed)) return trimmed
  return DEFAULT_APPEARANCE.accent
}

/**
 * Normalize and clamp a partial or untrusted appearance config, migrating
 * legacy theme aliases (`lelouch` -> `clay`, `dark` -> `zen`, etc.).
 */
export function sanitizeAppearance(
  raw: Partial<Record<keyof AppearanceConfig, unknown>> | null | undefined,
): AppearanceConfig {
  const input = raw ?? {}
  const borderRadius =
    typeof input.borderRadius === 'number' && Number.isFinite(input.borderRadius)
      ? Math.round(clamp(input.borderRadius, RADIUS_MIN, RADIUS_MAX))
      : DEFAULT_APPEARANCE.borderRadius

  const fontSize =
    typeof input.fontSize === 'number' && Number.isFinite(input.fontSize)
      ? round(clamp(input.fontSize, FONT_SIZE_MIN, FONT_SIZE_MAX), 2)
      : DEFAULT_APPEARANCE.fontSize

  const colorScheme =
    input.colorScheme === 'light' ||
    input.colorScheme === 'dark' ||
    input.colorScheme === 'system'
      ? input.colorScheme
      : undefined

  return {
    theme: resolveThemeId(typeof input.theme === 'string' ? input.theme : undefined),
    borderRadius,
    fontSize,
    typeRatio: nearestTypeRatio(input.typeRatio),
    fontFamily: isFontFamily(input.fontFamily) ? input.fontFamily : DEFAULT_APPEARANCE.fontFamily,
    lineHeight: isLineHeightPreset(input.lineHeight)
      ? input.lineHeight
      : DEFAULT_APPEARANCE.lineHeight,
    density: isDensityPreset(input.density) ? input.density : DEFAULT_APPEARANCE.density,
    contrast: isContrastPreset(input.contrast) ? input.contrast : DEFAULT_APPEARANCE.contrast,
    accent: sanitizeAccent(input.accent),
    ...(colorScheme ? { colorScheme } : {}),
  }
}

export interface ResolvedThemeState {
  config: AppearanceConfig
  /** Requested mode (`zen`, `clay`, ..., `light`, or `system`). */
  themeMode: ThemeMode
  /** Concrete resolved palette ID (`zen`, `clay`, ..., `light`). */
  resolvedThemeId: BuiltInThemeId
  /** Concrete resolved theme definition. */
  resolvedTheme: ThemeDefinition
  /** Resolved light/dark polarity. */
  appearance: ThemeAppearance
  /** Active 61-role color map for the resolved theme & appearance. */
  colors: ThemeColors
}

/**
 * Resolve an appearance configuration + OS dark preference into the concrete
 * theme definition, polarity, and 61-role color palette.
 */
export function resolveThemeState(
  rawConfig: Partial<AppearanceConfig> | undefined,
  osDark = true,
  customThemes?: readonly ThemeDefinition[],
): ResolvedThemeState {
  const config = sanitizeAppearance(rawConfig)

  // Check if a caller passed an unregistered custom theme ID directly in rawConfig.theme.
  const rawThemeId = typeof rawConfig?.theme === 'string' ? rawConfig.theme.trim().toLowerCase() : ''
  const customMatch =
    rawThemeId && customThemes
      ? customThemes.find((t) => t.id.toLowerCase() === rawThemeId)
      : undefined

  let resolvedTheme: ThemeDefinition
  let resolvedThemeId: BuiltInThemeId
  let appearance: ThemeAppearance

  if (customMatch) {
    resolvedTheme = customMatch
    resolvedThemeId = customMatch.appearance === 'light' ? 'light' : 'zen'
    appearance =
      config.colorScheme === 'light' || config.colorScheme === 'dark'
        ? config.colorScheme
        : config.colorScheme === 'system'
          ? osDark
            ? 'dark'
            : 'light'
          : customMatch.appearance
  } else if (config.theme === 'system') {
    appearance = osDark ? 'dark' : 'light'
    resolvedThemeId = osDark ? 'zen' : 'light'
    resolvedTheme = osDark ? ZEN_THEME : LIGHT_THEME
  } else {
    resolvedThemeId = config.theme
    resolvedTheme = getBuiltInTheme(config.theme) ?? ZEN_THEME
    if (config.colorScheme === 'light' || config.colorScheme === 'dark') {
      appearance = config.colorScheme
    } else if (config.colorScheme === 'system') {
      appearance = osDark ? 'dark' : 'light'
    } else {
      appearance = resolvedTheme.appearance
    }
  }

  const colors = getThemeColorsForAppearance(resolvedTheme, appearance) ?? resolvedTheme.colors

  return {
    config,
    themeMode: config.theme,
    resolvedThemeId,
    resolvedTheme,
    appearance,
    colors,
  }
}

// ── Dynamic CSS Variable Computation ─────────────────────────────────────────

export interface ComputeThemeVarsOptions {
  customThemes?: readonly ThemeDefinition[]
}

/**
 * Pure function computing all CSS custom properties for an `AppearanceConfig`.
 * Emits both `@hanzo/design` / shadcn standard variables (`--background`,
 * `--foreground`, `--card`, `--primary`, `--accent`, `--radius`, `--type-scale`,
 * `--density`, etc.) and `--hz-*` semantic tokens (including modular typography
 * `--hz-text-xs`..`--hz-text-3xl`, `--hz-radius-*`, and all 61 palette roles).
 */
export function computeThemeVars(
  rawConfig: Partial<AppearanceConfig> = DEFAULT_APPEARANCE,
  osDark = true,
  options?: ComputeThemeVarsOptions,
): Record<string, string> {
  const state = resolveThemeState(rawConfig, osDark, options?.customThemes)
  const { config, appearance, colors } = state
  const isDark = appearance === 'dark'

  // Contrast adjustments
  let background = colors.canvas
  let foreground = colors.text
  let card = colors.surface
  let popover = colors.surfaceOverlay
  let muted = colors.muted
  let mutedForeground = colors.mutedForeground
  let secondary = colors.secondary
  let secondaryForeground = colors.secondaryForeground
  let border = colors.border
  let input = colors.input
  let focus = colors.focus
  let contrastLevel = '1'

  if (config.contrast === 'high') {
    contrastLevel = '1.2'
    if (isDark) {
      background = '#000000'
      foreground = '#ffffff'
      card = '#080808'
      popover = '#0a0a0a'
      mutedForeground = '#d4d4d8'
      border = 'rgba(255, 255, 255, 0.28)'
      input = 'rgba(255, 255, 255, 0.32)'
      focus = '#ffffff'
    } else {
      background = '#ffffff'
      foreground = '#000000'
      card = '#ffffff'
      popover = '#ffffff'
      mutedForeground = '#3f3f46'
      border = 'rgba(0, 0, 0, 0.28)'
      input = 'rgba(0, 0, 0, 0.32)'
      focus = '#000000'
    }
  } else if (config.contrast === 'subtle') {
    contrastLevel = '0.85'
    border = `color-mix(in oklab, ${colors.border} 65%, ${colors.canvas})`
    input = `color-mix(in oklab, ${colors.input} 70%, ${colors.canvas})`
  }

  // Accent resolution with WCAG contrast-safe foreground calculation
  let resolvedAccent = colors.accent
  let resolvedAccentForeground = colors.accentForeground

  if (config.accent !== 'default') {
    const preset =
      config.accent in ACCENT_PRESETS
        ? ACCENT_PRESETS[config.accent as Exclude<AccentPreset, 'default'>][appearance]
        : isValidThemeColor(config.accent)
          ? config.accent
          : null

    if (preset) {
      resolvedAccent = preset
      resolvedAccentForeground = computeContrastForeground(preset)
      focus = preset
    }
  }

  const resolvedAccentHover = `color-mix(in oklab, ${resolvedAccent} 85%, ${resolvedAccentForeground})`

  // Radii
  const r = config.borderRadius
  const rXs = Math.max(0, Math.round(r * 0.25))
  const rSm = Math.max(0, Math.round(r * 0.5))
  const rMd = r
  const rLg = Math.round(r * 1.5)
  const rXl = Math.round(r * 2)
  const r2xl = Math.round(r * 2.5)
  const radiusScale = String(round(r / 8, 4))

  // Typography & modular scale
  const baseSize = config.fontSize
  const ratio = config.typeRatio
  const typeScale = String(round(baseSize / 14, 4))
  const fontStack = FONT_FAMILY_STACKS[config.fontFamily]
  const lineHeightValue = LINE_HEIGHT_VALUES[config.lineHeight]

  const textXs = Math.max(10, round(baseSize / (ratio * ratio), 2))
  const textSm = Math.max(10.5, round(baseSize / ratio, 2))
  const textBase = round(baseSize, 2)
  const textLg = round(baseSize * ratio, 2)
  const textXl = round(baseSize * ratio ** 2, 2)
  const text2xl = round(baseSize * ratio ** 3, 2)
  const text3xl = round(baseSize * ratio ** 4, 2)

  // Density
  const densityMultiplier = DENSITY_VALUES[config.density]

  const vars: Record<string, string> = {
    // ── @hanzo/design & shadcn standard tokens ──
    '--background': background,
    '--foreground': foreground,
    '--card': card,
    '--card-foreground': foreground,
    '--popover': popover,
    '--popover-foreground': foreground,
    '--primary': resolvedAccent,
    '--primary-foreground': resolvedAccentForeground,
    '--primary-hover': resolvedAccentHover,
    '--secondary': secondary,
    '--secondary-foreground': secondaryForeground,
    '--muted': muted,
    '--muted-foreground': mutedForeground,
    '--accent': resolvedAccent,
    '--accent-foreground': resolvedAccentForeground,
    '--accent-hover': resolvedAccentHover,
    '--destructive': colors.error,
    '--destructive-foreground': colors.errorForeground,
    '--warning': colors.warning,
    '--warning-foreground': colors.warningForeground,
    '--border': border,
    '--input': input,
    '--ring': focus,
    '--sidebar': colors.sidebar,
    '--sidebar-foreground': colors.sidebarForeground,
    '--sidebar-muted-foreground': colors.sidebarMutedForeground,
    '--sidebar-border': colors.sidebarBorder,
    '--sidebar-accent': colors.sidebarRowActive,
    '--sidebar-accent-foreground': colors.sidebarForeground,
    '--sidebar-primary': resolvedAccent,
    '--sidebar-primary-foreground': resolvedAccentForeground,
    '--sidebar-ring': focus,
    '--radius': `${rMd}px`,
    '--radius-sm': `${rSm}px`,
    '--radius-md': `${rMd}px`,
    '--radius-lg': `${rLg}px`,
    '--radius-xl': `${rXl}px`,
    '--radius-full': '9999px',
    '--radius-scale': radiusScale,
    '--type-scale': typeScale,
    '--type-ratio': String(ratio),
    '--density': String(densityMultiplier),
    '--font-sans': fontStack,
    '--font-mono': FONT_FAMILY_STACKS.mono,
    '--line-height': String(lineHeightValue),

    // ── --hz-* semantic tokens ──
    '--hz-radius': `${rMd}px`,
    '--hz-radius-none': '0px',
    '--hz-radius-xs': `${rXs}px`,
    '--hz-radius-sm': `${rSm}px`,
    '--hz-radius-md': `${rMd}px`,
    '--hz-radius-lg': `${rLg}px`,
    '--hz-radius-xl': `${rXl}px`,
    '--hz-radius-2xl': `${r2xl}px`,
    '--hz-radius-full': '9999px',
    '--hz-font-size': formatPx(baseSize),
    '--hz-type-ratio': String(ratio),
    '--hz-font-family': fontStack,
    '--hz-line-height': String(lineHeightValue),
    '--hz-text-xs': formatPx(textXs),
    '--hz-text-sm': formatPx(textSm),
    '--hz-text-base': formatPx(textBase),
    '--hz-text-lg': formatPx(textLg),
    '--hz-text-xl': formatPx(textXl),
    '--hz-text-2xl': formatPx(text2xl),
    '--hz-text-3xl': formatPx(text3xl),
    '--hz-density': String(densityMultiplier),
    '--hz-space-1': formatPx(4 * densityMultiplier),
    '--hz-space-2': formatPx(8 * densityMultiplier),
    '--hz-space-3': formatPx(12 * densityMultiplier),
    '--hz-space-4': formatPx(16 * densityMultiplier),
    '--hz-space-6': formatPx(24 * densityMultiplier),
    '--hz-space-8': formatPx(32 * densityMultiplier),
    '--hz-contrast': config.contrast,
    '--hz-contrast-level': contrastLevel,
  }

  // Emit all 61 semantic color roles under --hz-<kebab-role>
  for (const role of THEME_COLOR_ROLES) {
    vars[roleToCssVar(role)] = colors[role]
  }

  // Reflect active contrast & accent overrides on the corresponding --hz-* color roles
  vars['--hz-canvas'] = background
  vars['--hz-text'] = foreground
  vars['--hz-surface'] = card
  vars['--hz-surface-overlay'] = popover
  vars['--hz-muted-foreground'] = mutedForeground
  vars['--hz-border'] = border
  vars['--hz-input'] = input
  vars['--hz-focus'] = focus
  vars['--hz-accent'] = resolvedAccent
  vars['--hz-accent-foreground'] = resolvedAccentForeground

  return vars
}

// ── Document Application ─────────────────────────────────────────────────────

export function detectOsDark(): boolean {
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  } catch {
    // Ignore environments without matchMedia support.
  }
  return true
}

export interface ApplyThemeOptions {
  osDark?: boolean
  customThemes?: readonly ThemeDefinition[]
}

export interface AppliedThemeResult {
  config: AppearanceConfig
  themeMode: ThemeMode
  resolvedThemeId: BuiltInThemeId
  appearance: ThemeAppearance
  vars: Record<string, string>
}

/**
 * Apply an `AppearanceConfig` to a DOM document (`document.documentElement`).
 * Sets `data-theme`, `data-theme-mode`, `data-appearance`, `data-contrast`,
 * `data-density`, `color-scheme`, `.dark`/`.light` (and `@hanzo/gui`'s
 * `.t_dark`/`.t_light`), plus all computed CSS custom properties.
 */
export function applyThemeToDocument(
  rawConfig: Partial<AppearanceConfig>,
  doc: Document | undefined = typeof document !== 'undefined' ? document : undefined,
  options?: ApplyThemeOptions,
): AppliedThemeResult {
  const osDark = options?.osDark ?? detectOsDark()
  const state = resolveThemeState(rawConfig, osDark, options?.customThemes)
  const vars = computeThemeVars(state.config, osDark, {
    customThemes: options?.customThemes,
  })

  if (doc?.documentElement) {
    const root = doc.documentElement
    const isDark = state.appearance === 'dark'

    root.setAttribute('data-theme', state.resolvedThemeId)
    root.setAttribute('data-theme-mode', state.themeMode)
    root.setAttribute('data-appearance', state.appearance)
    root.setAttribute('data-contrast', state.config.contrast)
    root.setAttribute('data-density', state.config.density)

    root.style.colorScheme = state.appearance
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
    root.classList.toggle('t_dark', isDark)
    root.classList.toggle('t_light', !isDark)

    for (const [prop, val] of Object.entries(vars)) {
      root.style.setProperty(prop, val)
    }
  }

  return {
    config: state.config,
    themeMode: state.themeMode,
    resolvedThemeId: state.resolvedThemeId,
    appearance: state.appearance,
    vars,
  }
}

// ── Storage Persistence ──────────────────────────────────────────────────────

function getDefaultStorage(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined
  } catch {
    return undefined
  }
}

function paintedStorageKey(storageKey: string): string {
  return `${storageKey}.painted`
}

/**
 * Load and sanitize the stored `AppearanceConfig` from `storage` (defaults to
 * `localStorage`). Automatically migrates legacy theme IDs (`lelouch` -> `clay`,
 * `dark` -> `zen`, `hanzo-chat-dark` -> `zen`, `hanzo-chat` -> `light`).
 * Never throws.
 */
export function loadAppearance(
  storage: Pick<Storage, 'getItem'> | undefined = getDefaultStorage(),
  storageKey: string = APPEARANCE_STORAGE_KEY,
): AppearanceConfig {
  try {
    const raw = storage?.getItem(storageKey)
    if (!raw) return { ...DEFAULT_APPEARANCE }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_APPEARANCE }
    }
    return sanitizeAppearance(parsed as Partial<Record<keyof AppearanceConfig, unknown>>)
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

/**
 * Persist an `AppearanceConfig` to `storage` (defaults to `localStorage`),
 * migrating any legacy theme aliases before writing, and caches the computed
 * CSS variables for zero-FOUC replay by `buildPrePaintScript()`. Never throws.
 */
export function saveAppearance(
  rawConfig: Partial<AppearanceConfig>,
  storage: Pick<Storage, 'setItem'> | undefined = getDefaultStorage(),
  storageKey: string = APPEARANCE_STORAGE_KEY,
): boolean {
  if (!storage) return false
  try {
    const config = sanitizeAppearance(rawConfig)
    storage.setItem(storageKey, JSON.stringify(config))

    // Cache painted snapshot for instant zero-FOUC replay in <head>
    const osDark = detectOsDark()
    const state = resolveThemeState(config, osDark)
    const vars = computeThemeVars(config, osDark)
    try {
      storage.setItem(
        paintedStorageKey(storageKey),
        JSON.stringify({
          themeMode: state.themeMode,
          resolvedThemeId: state.resolvedThemeId,
          appearance: state.appearance,
          contrast: config.contrast,
          density: config.density,
          vars,
        }),
      )
    } catch {
      // Snapshot cache is best-effort; config itself is already persisted.
    }

    if (typeof window !== 'undefined' && typeof Event === 'function') {
      window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT))
    }
    return true
  } catch {
    return false
  }
}

// ── Zero-FOUC Pre-Paint Inline Script ────────────────────────────────────────

/**
 * Generate a compact, self-contained inline `<script>` string for HTML `<head>`
 * across any Vite, Next.js, or Astro Hanzo app.
 *
 * Applies `data-theme`, `color-scheme`, `.dark`/`.light`/`.t_dark`/`.t_light`,
 * and CSS variables synchronously before first paint — including migrating
 * legacy `'lelouch'` -> `'clay'` / `'dark'` -> `'zen'` preferences.
 */
export function buildPrePaintScript(storageKey: string = APPEARANCE_STORAGE_KEY): string {
  const paletteSummary: Record<
    BuiltInThemeId,
    {
      a: ThemeAppearance
      bg: string
      fg: string
      card: string
      b: string
      ac: string
      af: string
    }
  > = {
    zen: {
      a: ZEN_THEME.appearance,
      bg: ZEN_THEME.colors.canvas,
      fg: ZEN_THEME.colors.text,
      card: ZEN_THEME.colors.surface,
      b: ZEN_THEME.colors.border,
      ac: ZEN_THEME.colors.accent,
      af: ZEN_THEME.colors.accentForeground,
    },
    clay: {
      a: BUILT_IN_THEMES_BY_ID.clay.appearance,
      bg: BUILT_IN_THEMES_BY_ID.clay.colors.canvas,
      fg: BUILT_IN_THEMES_BY_ID.clay.colors.text,
      card: BUILT_IN_THEMES_BY_ID.clay.colors.surface,
      b: BUILT_IN_THEMES_BY_ID.clay.colors.border,
      ac: BUILT_IN_THEMES_BY_ID.clay.colors.accent,
      af: BUILT_IN_THEMES_BY_ID.clay.colors.accentForeground,
    },
    grove: {
      a: BUILT_IN_THEMES_BY_ID.grove.appearance,
      bg: BUILT_IN_THEMES_BY_ID.grove.colors.canvas,
      fg: BUILT_IN_THEMES_BY_ID.grove.colors.text,
      card: BUILT_IN_THEMES_BY_ID.grove.colors.surface,
      b: BUILT_IN_THEMES_BY_ID.grove.colors.border,
      ac: BUILT_IN_THEMES_BY_ID.grove.colors.accent,
      af: BUILT_IN_THEMES_BY_ID.grove.colors.accentForeground,
    },
    ocean: {
      a: BUILT_IN_THEMES_BY_ID.ocean.appearance,
      bg: BUILT_IN_THEMES_BY_ID.ocean.colors.canvas,
      fg: BUILT_IN_THEMES_BY_ID.ocean.colors.text,
      card: BUILT_IN_THEMES_BY_ID.ocean.colors.surface,
      b: BUILT_IN_THEMES_BY_ID.ocean.colors.border,
      ac: BUILT_IN_THEMES_BY_ID.ocean.colors.accent,
      af: BUILT_IN_THEMES_BY_ID.ocean.colors.accentForeground,
    },
    ember: {
      a: BUILT_IN_THEMES_BY_ID.ember.appearance,
      bg: BUILT_IN_THEMES_BY_ID.ember.colors.canvas,
      fg: BUILT_IN_THEMES_BY_ID.ember.colors.text,
      card: BUILT_IN_THEMES_BY_ID.ember.colors.surface,
      b: BUILT_IN_THEMES_BY_ID.ember.colors.border,
      ac: BUILT_IN_THEMES_BY_ID.ember.colors.accent,
      af: BUILT_IN_THEMES_BY_ID.ember.colors.accentForeground,
    },
    iris: {
      a: BUILT_IN_THEMES_BY_ID.iris.appearance,
      bg: BUILT_IN_THEMES_BY_ID.iris.colors.canvas,
      fg: BUILT_IN_THEMES_BY_ID.iris.colors.text,
      card: BUILT_IN_THEMES_BY_ID.iris.colors.surface,
      b: BUILT_IN_THEMES_BY_ID.iris.colors.border,
      ac: BUILT_IN_THEMES_BY_ID.iris.colors.accent,
      af: BUILT_IN_THEMES_BY_ID.iris.colors.accentForeground,
    },
    light: {
      a: LIGHT_THEME.appearance,
      bg: LIGHT_THEME.colors.canvas,
      fg: LIGHT_THEME.colors.text,
      card: LIGHT_THEME.colors.surface,
      b: LIGHT_THEME.colors.border,
      ac: LIGHT_THEME.colors.accent,
      af: LIGHT_THEME.colors.accentForeground,
    },
  }

  return (
    `(function(){try{` +
    `var k=${JSON.stringify(storageKey)},pk=${JSON.stringify(paintedStorageKey(storageKey))},` +
    `A=${JSON.stringify(LEGACY_THEME_ALIASES)},P=${JSON.stringify(paletteSummary)},` +
    `F=${JSON.stringify(FONT_FAMILY_STACKS)},L=${JSON.stringify(LINE_HEIGHT_VALUES)},D=${JSON.stringify(DENSITY_VALUES)},` +
    `d=document.documentElement,s=d.style,cl=d.classList,` +
    `osDark=typeof matchMedia==='function'?matchMedia('(prefers-color-scheme: dark)').matches:true;` +
    `var raw=null,snap=null;` +
    `try{raw=JSON.parse(localStorage.getItem(k)||'null')}catch(e){}` +
    `try{snap=JSON.parse(localStorage.getItem(pk)||'null')}catch(e){}` +
    `var t=raw&&typeof raw.theme==='string'?raw.theme.trim().toLowerCase():'zen';` +
    `if(A[t])t=A[t];` +
    `if(t!=='system'&&!P[t])t='zen';` +
    `var id=t==='system'?(osDark?'zen':'light'):t,` +
    `p=P[id]||P.zen,` +
    `ap=p.a,dark=ap==='dark';` +
    `d.setAttribute('data-theme',id);` +
    `d.setAttribute('data-theme-mode',t);` +
    `d.setAttribute('data-appearance',ap);` +
    `s.colorScheme=ap;` +
    `cl.toggle('dark',dark);cl.toggle('light',!dark);cl.toggle('t_dark',dark);cl.toggle('t_light',!dark);` +
    `if(snap&&snap.resolvedThemeId===id&&snap.appearance===ap&&snap.vars&&typeof snap.vars==='object'){` +
    `for(var v in snap.vars)if(v.slice(0,2)==='--'&&typeof snap.vars[v]==='string')s.setProperty(v,snap.vars[v]);` +
    `if(snap.contrast)d.setAttribute('data-contrast',snap.contrast);` +
    `if(snap.density)d.setAttribute('data-density',snap.density);` +
    `}else{` +
    `var r=raw&&typeof raw.borderRadius==='number'?Math.min(20,Math.max(0,Math.round(raw.borderRadius))):8;` +
    `var fs=raw&&typeof raw.fontSize==='number'?Math.min(18,Math.max(12,raw.fontSize)):14;` +
    `var ff=(raw&&F[raw.fontFamily])||F.sans;` +
    `var lh=(raw&&L[raw.lineHeight])||L.normal;` +
    `var dn=(raw&&D[raw.density])||D.comfortable;` +
    `s.setProperty('--background',p.bg);s.setProperty('--foreground',p.fg);` +
    `s.setProperty('--card',p.card);s.setProperty('--border',p.b);` +
    `s.setProperty('--primary',p.ac);s.setProperty('--primary-foreground',p.af);` +
    `s.setProperty('--accent',p.ac);s.setProperty('--accent-foreground',p.af);` +
    `s.setProperty('--radius',r+'px');s.setProperty('--hz-radius',r+'px');` +
    `s.setProperty('--hz-font-size',fs+'px');s.setProperty('--type-scale',String(Math.round((fs/14)*10000)/10000));` +
    `s.setProperty('--font-sans',ff);s.setProperty('--hz-font-family',ff);` +
    `s.setProperty('--line-height',String(lh));s.setProperty('--hz-line-height',String(lh));` +
    `s.setProperty('--density',String(dn));s.setProperty('--hz-density',String(dn));` +
    `}` +
    `}catch(e){}})()`
  )
}
