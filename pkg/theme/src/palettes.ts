/**
 * Canonical Hanzo theme palettes, color roles, legacy alias resolution,
 * and portable JSON theme file serialization/parsing.
 *
 * Pure TypeScript with zero runtime dependencies — safe in browsers, SSR,
 * Node, TUI, desktop, mobile, and browser extensions.
 */

export const BUILT_IN_THEME_IDS = [
  'zen',
  'clay',
  'grove',
  'ocean',
  'ember',
  'iris',
  'light',
] as const

export type BuiltInThemeId = (typeof BUILT_IN_THEME_IDS)[number]
export type ThemeMode = BuiltInThemeId | 'system'
export type ThemeAppearance = 'light' | 'dark'

/**
 * Silent legacy migration aliases so stored preferences from older Hanzo apps
 * resolve seamlessly without exposing retired IDs as built-in themes.
 */
export const LEGACY_THEME_ALIASES: Readonly<Record<string, BuiltInThemeId>> = {
  lelouch: 'clay',
  dark: 'zen',
  'hanzo-chat-dark': 'zen',
  'hanzo-chat': 'light',
  'hanzo-grove': 'grove',
  'hanzo-ocean': 'ocean',
  'hanzo-ember': 'ember',
  'hanzo-iris': 'iris',
  'hanzo-dev': 'zen',
}

/**
 * Reserve appearance keywords, built-in theme IDs, and legacy aliases so custom
 * themes can never shadow built-ins or hijack migrated preferences.
 */
export const RESERVED_THEME_IDS: ReadonlySet<string> = new Set([
  'system',
  'light',
  'dark',
  ...BUILT_IN_THEME_IDS,
  ...Object.keys(LEGACY_THEME_ALIASES),
])

/** All 61 semantic color roles defined by every canonical Hanzo theme. */
export const THEME_COLOR_ROLES = [
  'canvas',
  'chrome',
  'toolbar',
  'toolbarForeground',
  'toolbarBorder',
  'toolbarControl',
  'toolbarControlForeground',
  'toolbarControlHover',
  'surface',
  'surfaceRaised',
  'surfaceOverlay',
  'text',
  'textMuted',
  'border',
  'input',
  'focus',
  'accent',
  'accentForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'placeholder',
  'secondaryLabel',
  'iconMuted',
  'error',
  'errorForeground',
  'errorSurface',
  'warning',
  'warningForeground',
  'warningSurface',
  'update',
  'updateForeground',
  'updateSurface',
  'accentSurface',
  'accentSurfaceForeground',
  'messageSurface',
  'messageForeground',
  'messageAction',
  'messageActionForeground',
  'messageActionHover',
  'codeBackground',
  'codeForeground',
  'searchMatchBackground',
  'searchMatchForeground',
  'searchMatchActiveBackground',
  'searchMatchActiveForeground',
  'sidebar',
  'sidebarForeground',
  'sidebarMutedForeground',
  'sidebarControlSurface',
  'sidebarRowHover',
  'sidebarRowActive',
  'sidebarRowSelected',
  'sidebarBorder',
  'terminalBackground',
  'terminalForeground',
  'terminalCursor',
  'terminalSelection',
  'terminalScrollbar',
  'terminalScrollbarHover',
] as const

export type ThemeColorRole = (typeof THEME_COLOR_ROLES)[number]
export type ThemeColors = Readonly<Record<ThemeColorRole, string>>
export type ThemeColorOverrides = Readonly<Partial<Record<ThemeColorRole, string>>>
export type ThemeVariants = Readonly<Partial<Record<ThemeAppearance, ThemeColors>>>
export type ThemeCollection = Readonly<{ id: string; label: string }>

export type ThemeDefinition = Readonly<{
  id: string
  label: string
  appearance: ThemeAppearance
  colors: ThemeColors
  variants?: ThemeVariants
  collection?: ThemeCollection
  sidebarArtwork?: boolean
  managed?: boolean
  /** Optional custom CSS for web and desktop hosts. */
  css?: string
}>

export const THEME_FILE_VERSION = 1 as const
export const THEME_CSS_MAX_LENGTH = 100_000

export type ThemeFile = Readonly<{
  version: typeof THEME_FILE_VERSION
  id: string
  name: string
  appearance: ThemeAppearance
  colors: ThemeColorOverrides
  variants?: Readonly<Partial<Record<ThemeAppearance, ThemeColorOverrides>>>
  collection?: ThemeCollection
  managed?: boolean
  css?: string
}>

export const HANZO_DEV_LIGHT_THEME_COLORS: ThemeColors = {
  searchMatchBackground: '#ffde8b',
  searchMatchForeground: '#21180a',
  searchMatchActiveBackground: '#eea52b',
  searchMatchActiveForeground: '#21180a',
  canvas: '#fcfcfc',
  chrome: '#fcfcfc',
  toolbar: '#fcfcfc',
  toolbarForeground: '#27272a',
  toolbarBorder: '#e4e4e7',
  toolbarControl: '#ffffff',
  toolbarControlForeground: '#27272a',
  toolbarControlHover: '#f4f4f5',
  surface: '#ffffff',
  surfaceRaised: '#fcfcfc',
  surfaceOverlay: '#ffffff',
  text: '#27272a',
  textMuted: '#71717b',
  border: '#e4e4e7',
  input: '#d4d4d8',
  focus: '#18181b',
  accent: '#18181b',
  accentForeground: '#ffffff',
  secondary: '#fafafa',
  secondaryForeground: '#27272a',
  muted: '#fafafa',
  mutedForeground: '#71717b',
  placeholder: '#71717b',
  secondaryLabel: '#71717b',
  iconMuted: '#71717b',
  error: '#fb2c36',
  errorForeground: '#c10007',
  errorSurface: '#fcebec',
  warning: '#fe9a00',
  warningForeground: '#bb4d00',
  warningSurface: '#fcf4e8',
  update: '#18181b',
  updateForeground: '#18181b',
  updateSurface: '#f4f4f5',
  accentSurface: '#f4f4f5',
  accentSurfaceForeground: '#18181b',
  messageSurface: '#f4f4f5',
  messageForeground: '#27272a',
  messageAction: '#18181b',
  messageActionForeground: '#ffffff',
  messageActionHover: '#27272a',
  codeBackground: '#ffffff',
  codeForeground: '#27272a',
  sidebar: '#fafafa',
  sidebarForeground: '#27272a',
  sidebarMutedForeground: '#71717b',
  sidebarControlSurface: '#f4f4f5',
  sidebarRowHover: '#fcfcfc',
  sidebarRowActive: '#ffffff',
  sidebarRowSelected: '#ffffff',
  sidebarBorder: '#e4e4e7',
  terminalBackground: '#fcfcfc',
  terminalForeground: '#27272a',
  terminalCursor: '#18181b',
  terminalSelection: '#e4e4e7',
  terminalScrollbar: '#d6d6d6',
  terminalScrollbarHover: '#bdbdbd',
}

export const HANZO_DEV_DARK_THEME_COLORS: ThemeColors = {
  searchMatchBackground: '#8c6c1f',
  searchMatchForeground: '#f5f5f5',
  searchMatchActiveBackground: '#eea52b',
  searchMatchActiveForeground: '#21180a',
  canvas: '#0a0a0a',
  chrome: '#0a0a0a',
  toolbar: '#0a0a0a',
  toolbarForeground: '#f5f5f5',
  toolbarBorder: '#191919',
  toolbarControl: '#111111',
  toolbarControlForeground: '#f5f5f5',
  toolbarControlHover: '#141414',
  surface: '#111111',
  surfaceRaised: '#111111',
  surfaceOverlay: '#111111',
  text: '#f5f5f5',
  textMuted: '#818181',
  border: '#191919',
  input: '#1e1e1e',
  focus: '#ffffff',
  accent: '#ffffff',
  accentForeground: '#0a0a0a',
  secondary: '#111111',
  secondaryForeground: '#f5f5f5',
  muted: '#111111',
  mutedForeground: '#818181',
  placeholder: '#818181',
  secondaryLabel: '#818181',
  iconMuted: '#818181',
  error: '#fb414a',
  errorForeground: '#ff6467',
  errorSurface: '#301214',
  warning: '#fe9a00',
  warningForeground: '#ffb900',
  warningSurface: '#312108',
  update: '#ffffff',
  updateForeground: '#ffffff',
  updateSurface: '#1a1a1a',
  accentSurface: '#141414',
  accentSurfaceForeground: '#f5f5f5',
  messageSurface: '#141414',
  messageForeground: '#f5f5f5',
  messageAction: '#ffffff',
  messageActionForeground: '#0a0a0a',
  messageActionHover: '#e5e5e5',
  codeBackground: '#111111',
  codeForeground: '#f5f5f5',
  sidebar: '#000000',
  sidebarForeground: '#f1f3f7',
  sidebarMutedForeground: '#a3a3a3',
  sidebarControlSurface: '#0a0a0a',
  sidebarRowHover: '#131313',
  sidebarRowActive: '#1a1b1b',
  sidebarRowSelected: '#111111',
  sidebarBorder: '#141414',
  terminalBackground: '#0a0a0a',
  terminalForeground: '#f5f5f5',
  terminalCursor: '#ffffff',
  terminalSelection: '#2a2a2a',
  terminalScrollbar: '#222222',
  terminalScrollbarHover: '#363636',
}

/** Pure monochrome OLED-black dark default with crisp high-key light variant. */
export const ZEN_THEME: ThemeDefinition = {
  id: 'zen',
  label: 'Zen',
  appearance: 'dark',
  colors: {
    ...HANZO_DEV_DARK_THEME_COLORS,
    canvas: '#000000',
    chrome: '#000000',
    toolbar: '#000000',
    toolbarBorder: '#181818',
    toolbarControl: '#0b0b0b',
    toolbarControlHover: '#141414',
    surface: '#080808',
    surfaceRaised: '#101010',
    surfaceOverlay: '#121212',
    border: '#1c1c1c',
    input: '#1a1a1a',
    secondary: '#0e0e0e',
    muted: '#0e0e0e',
    codeBackground: '#090909',
    sidebar: '#000000',
    sidebarControlSurface: '#0c0c0c',
    sidebarRowHover: '#121212',
    sidebarRowActive: '#1a1a1a',
    sidebarRowSelected: '#161616',
    sidebarBorder: '#141414',
    terminalBackground: '#000000',
  },
  variants: {
    light: {
      ...HANZO_DEV_LIGHT_THEME_COLORS,
      canvas: '#ffffff',
      chrome: '#ffffff',
      toolbar: '#ffffff',
      surface: '#ffffff',
      surfaceRaised: '#fafafa',
      surfaceOverlay: '#ffffff',
      sidebar: '#f7f7f7',
      sidebarRowHover: '#efefef',
      sidebarRowActive: '#e8e8e8',
      sidebarRowSelected: '#eaeaea',
      codeBackground: '#f5f5f5',
      terminalBackground: '#fafafa',
    },
  },
}

/** Pure warm stone & charcoal grey palette (migrated from legacy `lelouch`). */
export const CLAY_THEME: ThemeDefinition = {
  id: 'clay',
  label: 'Clay',
  appearance: 'dark',
  colors: {
    ...HANZO_DEV_DARK_THEME_COLORS,
    canvas: '#161514',
    chrome: '#161514',
    toolbar: '#161514',
    toolbarForeground: '#f0eee9',
    toolbarBorder: '#2a2826',
    toolbarControl: '#201e1c',
    toolbarControlForeground: '#f0eee9',
    toolbarControlHover: '#292724',
    surface: '#1c1b19',
    surfaceRaised: '#242220',
    surfaceOverlay: '#292724',
    text: '#f0eee9',
    textMuted: '#9e9990',
    border: '#2d2b28',
    input: '#262422',
    focus: '#e7e4de',
    accent: '#e7e4de',
    accentForeground: '#161514',
    secondary: '#22201e',
    secondaryForeground: '#f0eee9',
    muted: '#201e1c',
    mutedForeground: '#9e9990',
    placeholder: '#858077',
    secondaryLabel: '#9e9990',
    iconMuted: '#9e9990',
    update: '#d6d2ca',
    updateForeground: '#e7e4de',
    updateSurface: '#2a2825',
    accentSurface: '#292724',
    accentSurfaceForeground: '#f0eee9',
    messageSurface: '#22201e',
    messageForeground: '#f0eee9',
    messageAction: '#e7e4de',
    messageActionForeground: '#161514',
    messageActionHover: '#d6d2ca',
    codeBackground: '#131211',
    codeForeground: '#f0eee9',
    sidebar: '#121110',
    sidebarForeground: '#f0eee9',
    sidebarMutedForeground: '#9e9990',
    sidebarControlSurface: '#1d1c1a',
    sidebarRowHover: '#211f1d',
    sidebarRowActive: '#2b2926',
    sidebarRowSelected: '#262421',
    sidebarBorder: '#262422',
    terminalBackground: '#131211',
    terminalForeground: '#f0eee9',
    terminalCursor: '#e7e4de',
    terminalSelection: '#383530',
    terminalScrollbar: '#33302c',
    terminalScrollbarHover: '#4a4641',
  },
  variants: {
    light: {
      ...HANZO_DEV_LIGHT_THEME_COLORS,
      canvas: '#f5f4f1',
      chrome: '#f5f4f1',
      toolbar: '#f5f4f1',
      toolbarForeground: '#24221f',
      toolbarBorder: '#e2dfd9',
      toolbarControl: '#faf9f7',
      toolbarControlForeground: '#24221f',
      toolbarControlHover: '#ebe8e2',
      surface: '#faf9f7',
      surfaceRaised: '#efede8',
      surfaceOverlay: '#ffffff',
      text: '#24221f',
      textMuted: '#6f6b64',
      border: '#dfdcd5',
      input: '#d1cdc4',
      focus: '#292724',
      accent: '#292724',
      accentForeground: '#faf9f7',
      secondary: '#efede8',
      secondaryForeground: '#24221f',
      muted: '#efede8',
      mutedForeground: '#6f6b64',
      placeholder: '#7d7870',
      secondaryLabel: '#6f6b64',
      iconMuted: '#6f6b64',
      update: '#3a3733',
      updateForeground: '#24221f',
      updateSurface: '#e8e5df',
      accentSurface: '#eae7e1',
      accentSurfaceForeground: '#24221f',
      messageSurface: '#edeae4',
      messageForeground: '#24221f',
      messageAction: '#292724',
      messageActionForeground: '#faf9f7',
      messageActionHover: '#3d3a36',
      codeBackground: '#efede8',
      codeForeground: '#24221f',
      sidebar: '#eeece7',
      sidebarForeground: '#24221f',
      sidebarMutedForeground: '#6f6b64',
      sidebarControlSurface: '#e5e2db',
      sidebarRowHover: '#e7e4dd',
      sidebarRowActive: '#dedad2',
      sidebarRowSelected: '#e1ddd6',
      sidebarBorder: '#ddd9d1',
      terminalBackground: '#f5f4f1',
      terminalForeground: '#24221f',
      terminalCursor: '#292724',
      terminalSelection: '#dfdcd5',
      terminalScrollbar: '#d1cdc4',
      terminalScrollbarHover: '#b8b3a8',
    },
  },
}


import { EMBER_THEME, GROVE_THEME, IRIS_THEME, OCEAN_THEME } from './palettes-pigments'
export { EMBER_THEME, GROVE_THEME, IRIS_THEME, OCEAN_THEME }

/** Crisp monochrome daylight theme with dark variant fallback. */
export const LIGHT_THEME: ThemeDefinition = {
  id: 'light',
  label: 'Light',
  appearance: 'light',
  colors: HANZO_DEV_LIGHT_THEME_COLORS,
  variants: {
    dark: HANZO_DEV_DARK_THEME_COLORS,
  },
}

/** Legacy-compatible Hanzo Chat daylight theme alias (`id: 'hanzo-chat'`). */
export const HANZO_CHAT_THEME: ThemeDefinition = {
  ...LIGHT_THEME,
  id: 'hanzo-chat',
  label: 'Hanzo Chat',
}

/** Canonical ordered list of all built-in themes. */
export const BUILT_IN_THEMES: ReadonlyArray<ThemeDefinition> = [
  ZEN_THEME,
  CLAY_THEME,
  GROVE_THEME,
  OCEAN_THEME,
  EMBER_THEME,
  IRIS_THEME,
  LIGHT_THEME,
]

export const BUILT_IN_THEMES_BY_ID: Readonly<Record<BuiltInThemeId, ThemeDefinition>> = {
  zen: ZEN_THEME,
  clay: CLAY_THEME,
  grove: GROVE_THEME,
  ocean: OCEAN_THEME,
  ember: EMBER_THEME,
  iris: IRIS_THEME,
  light: LIGHT_THEME,
}

const BUILT_IN_THEME_ID_SET: ReadonlySet<string> = new Set(BUILT_IN_THEME_IDS)
const THEME_COLOR_ROLE_SET: ReadonlySet<string> = new Set(THEME_COLOR_ROLES)

export function isBuiltInThemeId(value: unknown): value is BuiltInThemeId {
  return typeof value === 'string' && BUILT_IN_THEME_ID_SET.has(value)
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || isBuiltInThemeId(value)
}

/**
 * Resolve any stored or user-supplied theme ID, silently migrating legacy
 * aliases (`lelouch` -> `clay`, `dark` | `hanzo-chat-dark` -> `zen`,
 * `hanzo-chat` -> `light`). Falls back to `fallback` (default `'zen'`) for
 * unknown values.
 */
export function resolveThemeId(
  id: string | null | undefined,
  fallback: ThemeMode = 'zen',
): ThemeMode {
  if (typeof id !== 'string') return fallback
  const normalized = id.trim().toLowerCase()
  if (!normalized) return fallback
  if (normalized === 'system') return 'system'
  if (isBuiltInThemeId(normalized)) return normalized
  const alias = LEGACY_THEME_ALIASES[normalized]
  if (alias) return alias
  return fallback
}

/** Look up a built-in theme definition by ID (including legacy aliases). */
export function getBuiltInTheme(id: string | null | undefined): ThemeDefinition | null {
  if (typeof id !== 'string') return null
  const normalized = id.trim().toLowerCase()
  const resolved = LEGACY_THEME_ALIASES[normalized] ?? normalized
  return isBuiltInThemeId(resolved) ? BUILT_IN_THEMES_BY_ID[resolved] : null
}

/** Return the 61-role color map for a theme (or built-in theme ID) in the requested appearance. */
export function getThemeColorsForAppearance(
  theme: ThemeDefinition | string,
  appearance: ThemeAppearance,
): ThemeColors | null {
  const def = typeof theme === 'string' ? getBuiltInTheme(theme) : theme
  if (!def) {
    if (theme === 'dark') return ZEN_THEME.variants?.dark ?? HANZO_DEV_DARK_THEME_COLORS
    if (theme === 'light') return LIGHT_THEME.colors
    return null
  }
  if (def.appearance === appearance) return def.colors
  return def.variants?.[appearance] ?? null
}

/**
 * Always resolves a complete `ThemeColors` object for any theme identifier or object,
 * defaulting to canonical `ZEN_THEME` (`dark` or `light`) when unknown.
 */
export function resolveDesktopThemeColors(
  themeOrId: ThemeDefinition | ThemeColors | string = 'zen',
  appearance: ThemeAppearance = 'dark',
): ThemeColors {
  if (typeof themeOrId === 'object' && themeOrId !== null) {
    if ('colors' in themeOrId && 'id' in themeOrId) {
      const def = themeOrId as ThemeDefinition
      return getThemeColorsForAppearance(def, appearance) ?? def.colors
    }
    return themeOrId as ThemeColors
  }
  const normalized = themeOrId.trim().toLowerCase()
  if (normalized === 'hanzo-dev') {
    return appearance === 'dark' ? HANZO_DEV_DARK_THEME_COLORS : HANZO_DEV_LIGHT_THEME_COLORS
  }
  const resolved = getThemeColorsForAppearance(normalized, appearance)
  if (resolved) return resolved
  return (
    getThemeColorsForAppearance(ZEN_THEME, appearance) ??
    (appearance === 'dark' ? HANZO_DEV_DARK_THEME_COLORS : HANZO_DEV_LIGHT_THEME_COLORS)
  )
}

/** Default 61-role base palette for a light or dark custom theme. */
export function getDefaultThemeColors(appearance: ThemeAppearance): ThemeColors {
  return appearance === 'dark' ? HANZO_DEV_DARK_THEME_COLORS : HANZO_DEV_LIGHT_THEME_COLORS
}

// ── Portable JSON Custom Theme Parsing & Serialization ────────────────────────

const SAFE_CSS_COLOR_RE =
  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\(\s*[^;{}()]+\s*\)|transparent)$/i
const THEME_ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,47})$/
const COLLECTION_ID_RE = /^[a-z0-9][a-z0-9.:-]{0,127}$/i

export function isValidThemeColor(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 96) return false
  if (/[;{}\\]|url\(/i.test(trimmed)) return false
  return SAFE_CSS_COLOR_RE.test(trimmed)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isThemeAppearance(value: unknown): value is ThemeAppearance {
  return value === 'light' || value === 'dark'
}

function isThemeLabel(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 48
}

function themeIdFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function parseColorOverrides(value: unknown): ThemeColorOverrides {
  if (!isRecord(value)) {
    throw new Error('Theme colors must be a JSON object.')
  }
  const overrides: Partial<Record<ThemeColorRole, string>> = {}
  for (const [role, raw] of Object.entries(value)) {
    if (!THEME_COLOR_ROLE_SET.has(role)) continue
    if (!isValidThemeColor(raw)) {
      throw new Error(`Invalid CSS color for theme role "${role}".`)
    }
    overrides[role as ThemeColorRole] = raw.trim()
  }
  return overrides
}

function parseCollection(value: unknown): ThemeCollection | undefined {
  if (value === undefined) return undefined
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !COLLECTION_ID_RE.test(value.id) ||
    !isThemeLabel(value.label)
  ) {
    throw new Error('Theme collection must have a valid id and label.')
  }
  return { id: value.id, label: value.label.trim() }
}

/**
 * Parse and validate a portable JSON theme file (either a JSON string or
 * already-parsed object). Rejects reserved IDs (including legacy aliases like
 * `lelouch`), validates CSS colors, and fills omitted roles from base defaults.
 */
export function parseThemeFile(input: unknown): ThemeDefinition {
  const value = typeof input === 'string' ? (JSON.parse(input) as unknown) : input
  if (!isRecord(value)) {
    throw new Error('Theme file must contain a JSON object.')
  }
  if (value.version !== THEME_FILE_VERSION) {
    throw new Error(
      `Unsupported theme file version "${String(value.version)}". Expected ${THEME_FILE_VERSION}.`,
    )
  }
  if (!isThemeLabel(value.name)) {
    throw new Error('Theme file needs a non-empty name (48 characters or fewer).')
  }
  if (!isThemeAppearance(value.appearance)) {
    throw new Error('Theme file needs an appearance of "light" or "dark".')
  }

  const id = value.id === undefined ? themeIdFromName(value.name) : value.id
  if (typeof id !== 'string' || !THEME_ID_RE.test(id)) {
    throw new Error('Theme id may only contain lowercase letters, numbers, and hyphens.')
  }
  if (RESERVED_THEME_IDS.has(id)) {
    throw new Error(`The theme id "${id}" is reserved.`)
  }

  const overrides = parseColorOverrides(value.colors)
  const collection = parseCollection(value.collection)

  if (value.css !== undefined) {
    if (typeof value.css !== 'string' || value.css.length > THEME_CSS_MAX_LENGTH) {
      throw new Error(`Theme CSS must be a string of ${THEME_CSS_MAX_LENGTH} characters or fewer.`)
    }
  }

  const variants: Partial<Record<ThemeAppearance, ThemeColors>> = {}
  if (value.variants !== undefined) {
    if (!isRecord(value.variants)) {
      throw new Error('Theme variants must be an object.')
    }
    for (const [variantAppearance, variantColors] of Object.entries(value.variants)) {
      if (!isThemeAppearance(variantAppearance)) {
        throw new Error('Theme variants may only be named "light" or "dark".')
      }
      if (variantAppearance === value.appearance) {
        throw new Error(
          `Theme variants must not repeat the base appearance "${value.appearance}".`,
        )
      }
      variants[variantAppearance] = {
        ...getDefaultThemeColors(variantAppearance),
        ...parseColorOverrides(variantColors),
      }
    }
  }

  return {
    id,
    label: value.name.trim(),
    appearance: value.appearance,
    colors: {
      ...getDefaultThemeColors(value.appearance),
      ...overrides,
    },
    ...(Object.keys(variants).length > 0 ? { variants } : {}),
    ...(collection ? { collection } : {}),
    ...(value.managed === true ? { managed: true } : {}),
    ...(typeof value.css === 'string' && value.css.length > 0 ? { css: value.css } : {}),
  }
}

/** Serialize a `ThemeDefinition` into the canonical portable JSON theme format. */
export function serializeThemeFile(theme: ThemeDefinition): string {
  const file: ThemeFile = {
    version: THEME_FILE_VERSION,
    id: theme.id,
    name: theme.label,
    appearance: theme.appearance,
    colors: theme.colors,
    ...(theme.variants && Object.keys(theme.variants).length > 0
      ? { variants: theme.variants }
      : {}),
    ...(theme.collection ? { collection: theme.collection } : {}),
    ...(theme.managed ? { managed: true } : {}),
    ...(theme.css ? { css: theme.css } : {}),
  }
  return `${JSON.stringify(file, null, 2)}\n`
}
