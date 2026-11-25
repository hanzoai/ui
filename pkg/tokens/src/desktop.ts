/**
 * Canonical Hanzo Unified Desktop Design System Tokens.
 *
 * Extracted from Hanzo Dev (`dev-desktop`) and the Zen workspace specification:
 * "One design system. One agent experience. One appearance engine. Multiple specialized workspaces."
 */

export const BUILT_IN_THEME_IDS = [
  "zen",
  "clay",
  "grove",
  "ocean",
  "ember",
  "iris",
  "light",
] as const

export const MOBILE_DEFAULT_THEME_ID = "hanzo-dev" as const

export const MOBILE_THEME_IDS = [MOBILE_DEFAULT_THEME_ID, ...BUILT_IN_THEME_IDS] as const

export type BuiltInThemeId = (typeof BUILT_IN_THEME_IDS)[number]
export type MobileThemeId = (typeof MOBILE_THEME_IDS)[number]
export type ThemeAppearance = "light" | "dark"

/** Maps retired built-in theme ids to their current built-in replacement. */
export const LEGACY_THEME_ID_ALIASES: Readonly<Record<string, BuiltInThemeId>> = {
  lelouch: "clay",
  dark: "zen",
  "hanzo-chat-dark": "zen",
  "hanzo-chat": "light",
  "hanzo-grove": "grove",
  "hanzo-ocean": "ocean",
  "hanzo-ember": "ember",
  "hanzo-iris": "iris",
  "hanzo-dev": "zen",
}

export function resolveLegacyThemeId(themeId: string): string {
  return Object.prototype.hasOwnProperty.call(LEGACY_THEME_ID_ALIASES, themeId)
    ? (LEGACY_THEME_ID_ALIASES[themeId] ?? themeId)
    : themeId
}

/** Reserve appearance keywords, built-ins, and legacy aliases so custom themes cannot capture stored preferences. */
export const RESERVED_THEME_IDS: ReadonlySet<string> = new Set([
  "system",
  "light",
  "dark",
  ...BUILT_IN_THEME_IDS,
  ...Object.keys(LEGACY_THEME_ID_ALIASES),
])

/** The mobile default id is valid in saved themes but cannot be published because web/desktop cannot resolve it. */
export const UNPUBLISHABLE_THEME_IDS: ReadonlySet<string> = new Set([
  ...RESERVED_THEME_IDS,
  MOBILE_DEFAULT_THEME_ID,
])

export const THEME_COLOR_ROLES = [
  "canvas",
  "chrome",
  "toolbar",
  "toolbarForeground",
  "toolbarBorder",
  "toolbarControl",
  "toolbarControlForeground",
  "toolbarControlHover",
  "surface",
  "surfaceRaised",
  "surfaceOverlay",
  "text",
  "textMuted",
  "border",
  "input",
  "focus",
  "accent",
  "accentForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "placeholder",
  "secondaryLabel",
  "iconMuted",
  "error",
  "errorForeground",
  "errorSurface",
  "warning",
  "warningForeground",
  "warningSurface",
  "update",
  "updateForeground",
  "updateSurface",
  "accentSurface",
  "accentSurfaceForeground",
  "messageSurface",
  "messageForeground",
  "messageAction",
  "messageActionForeground",
  "messageActionHover",
  "codeBackground",
  "codeForeground",
  "searchMatchBackground",
  "searchMatchForeground",
  "searchMatchActiveBackground",
  "searchMatchActiveForeground",
  "sidebar",
  "sidebarForeground",
  "sidebarMutedForeground",
  "sidebarControlSurface",
  "sidebarRowHover",
  "sidebarRowActive",
  "sidebarRowSelected",
  "sidebarBorder",
  "terminalBackground",
  "terminalForeground",
  "terminalCursor",
  "terminalSelection",
  "terminalScrollbar",
  "terminalScrollbarHover",
] as const

export type ThemeColorRole = (typeof THEME_COLOR_ROLES)[number]
export type ThemeColors = Readonly<Record<ThemeColorRole, string>>
export type ThemeVariants = Readonly<Partial<Record<ThemeAppearance, ThemeColors>>>
export type ThemeDefinition = Readonly<{
  id: string
  label: string
  appearance: ThemeAppearance
  colors: ThemeColors
  variants?: ThemeVariants
  collection?: Readonly<{ id: string; label: string }>
  sidebarArtwork?: boolean
  managed?: boolean
  /** Custom styles for web and desktop. */
  css?: string
}>

/** Canonical `--app-theme-*` CSS custom property names used by Hanzo Dev & Unified Desktop. */
export const APP_THEME_CSS_VARIABLES: Readonly<Record<ThemeColorRole, string>> = {
  canvas: "--app-theme-canvas",
  chrome: "--app-theme-chrome",
  toolbar: "--app-theme-toolbar",
  toolbarForeground: "--app-theme-toolbar-foreground",
  toolbarBorder: "--app-theme-toolbar-border",
  toolbarControl: "--app-theme-toolbar-control",
  toolbarControlForeground: "--app-theme-toolbar-control-foreground",
  toolbarControlHover: "--app-theme-toolbar-control-hover",
  surface: "--app-theme-surface",
  surfaceRaised: "--app-theme-surface-raised",
  surfaceOverlay: "--app-theme-surface-overlay",
  text: "--app-theme-text",
  textMuted: "--app-theme-text-muted",
  border: "--app-theme-border",
  input: "--app-theme-input",
  focus: "--app-theme-focus",
  accent: "--app-theme-accent",
  accentForeground: "--app-theme-accent-foreground",
  secondary: "--app-theme-secondary",
  secondaryForeground: "--app-theme-secondary-foreground",
  muted: "--app-theme-muted",
  mutedForeground: "--app-theme-muted-foreground",
  placeholder: "--app-theme-placeholder",
  secondaryLabel: "--app-theme-secondary-label",
  iconMuted: "--app-theme-icon-muted",
  error: "--app-theme-error",
  errorForeground: "--app-theme-error-foreground",
  errorSurface: "--app-theme-error-surface",
  warning: "--app-theme-warning",
  warningForeground: "--app-theme-warning-foreground",
  warningSurface: "--app-theme-warning-surface",
  update: "--app-theme-update",
  updateForeground: "--app-theme-update-foreground",
  updateSurface: "--app-theme-update-surface",
  accentSurface: "--app-theme-accent-surface",
  accentSurfaceForeground: "--app-theme-accent-surface-foreground",
  messageSurface: "--app-theme-message-surface",
  messageForeground: "--app-theme-message-foreground",
  messageAction: "--app-theme-message-action",
  messageActionForeground: "--app-theme-message-action-foreground",
  messageActionHover: "--app-theme-message-action-hover",
  codeBackground: "--app-theme-code-background",
  codeForeground: "--app-theme-code-foreground",
  searchMatchBackground: "--app-theme-search-match-background",
  searchMatchForeground: "--app-theme-search-match-foreground",
  searchMatchActiveBackground: "--app-theme-search-match-active-background",
  searchMatchActiveForeground: "--app-theme-search-match-active-foreground",
  sidebar: "--app-theme-sidebar",
  sidebarForeground: "--app-theme-sidebar-foreground",
  sidebarMutedForeground: "--app-theme-sidebar-muted-foreground",
  sidebarControlSurface: "--app-theme-sidebar-control-surface",
  sidebarRowHover: "--app-theme-sidebar-row-hover",
  sidebarRowActive: "--app-theme-sidebar-row-active",
  sidebarRowSelected: "--app-theme-sidebar-row-selected",
  sidebarBorder: "--app-theme-sidebar-border",
  terminalBackground: "--app-theme-terminal-background",
  terminalForeground: "--app-theme-terminal-foreground",
  terminalCursor: "--app-theme-terminal-cursor",
  terminalSelection: "--app-theme-terminal-selection-background",
  terminalScrollbar: "--app-theme-terminal-scrollbar",
  terminalScrollbarHover: "--app-theme-terminal-scrollbar-hover",
}

export function getThemeColorVariable(role: ThemeColorRole): string {
  return APP_THEME_CSS_VARIABLES[role]
}

export interface DesktopSurfaceTokens {
  readonly chrome: string
  readonly canvas: string
  readonly editorBackground: string
  readonly sidebar: string
  readonly panel: string
  readonly secondaryPanel: string
  readonly surface: string
  readonly surfaceRaised: string
  readonly surfaceOverlay: string
  readonly hover: string
  readonly rowHover: string
  readonly border: string
  readonly borderSubtle: string
  readonly text: string
  readonly foreground: string
  readonly textMuted: string
  readonly secondary: string
  readonly subtle: string
  readonly dim: string
  readonly accent: string
}

/**
 * Zen Canonical Dark Tokens — neutral black workspace surfaces.
 * Zero stock VS Code blue-gray (#1e1e1e / #252526 / #007acc).
 */
export const ZEN_DARK_DESKTOP_TOKENS: DesktopSurfaceTokens = {
  chrome: "#000000",
  canvas: "#090909",
  editorBackground: "#090909",
  sidebar: "#0C0C0C",
  panel: "#0C0C0C",
  secondaryPanel: "#0D0D0D",
  surface: "#141414",
  surfaceRaised: "#141414",
  surfaceOverlay: "#141414",
  hover: "#1B1B1B",
  rowHover: "#1C1C1C",
  border: "#222222",
  borderSubtle: "#262626",
  text: "#EDEDED",
  foreground: "#E5E5E5",
  textMuted: "#A3A3A3",
  secondary: "#A0A0A0",
  subtle: "#777777",
  dim: "#555555",
  accent: "#D8D8D8",
} as const

/** Zen Canonical Light Tokens — crisp neutral paper counterpart. */
export const ZEN_LIGHT_DESKTOP_TOKENS: DesktopSurfaceTokens = {
  chrome: "#FFFFFF",
  canvas: "#FCFCFC",
  editorBackground: "#FFFFFF",
  sidebar: "#F7F7F7",
  panel: "#F7F7F7",
  secondaryPanel: "#F4F4F5",
  surface: "#FFFFFF",
  surfaceRaised: "#FAFAFA",
  surfaceOverlay: "#FFFFFF",
  hover: "#EFEFEF",
  rowHover: "#EAEAEA",
  border: "#E4E4E7",
  borderSubtle: "#ECECEF",
  text: "#18181B",
  foreground: "#27272A",
  textMuted: "#71717B",
  secondary: "#52525B",
  subtle: "#8A8A93",
  dim: "#A1A1AA",
  accent: "#18181B",
} as const

export interface DesktopSyntaxTokens {
  readonly foreground: string
  readonly keyword: string
  readonly string: string
  readonly comment: string
  readonly function: string
  readonly type: string
  readonly number: string
  readonly constant: string
  readonly variable: string
  readonly property: string
  readonly operator: string
  readonly punctuation: string
}

/** Restrained muted lavender/sage/sand/slate syntax tokens for Zen Dark on #090909. */
export const ZEN_DARK_SYNTAX_TOKENS: DesktopSyntaxTokens = {
  foreground: "#d5d5d5",
  keyword: "#b9a6d2",
  string: "#a8be9e",
  comment: "#777777",
  function: "#c5b68f",
  type: "#a5bacb",
  number: "#c5b68f",
  constant: "#b9a6d2",
  variable: "#d5d5d5",
  property: "#c2ccd6",
  operator: "#a3a3a3",
  punctuation: "#8c8c8c",
} as const

/** Restrained high-legibility syntax tokens for Zen Light on #FFFFFF. */
export const ZEN_LIGHT_SYNTAX_TOKENS: DesktopSyntaxTokens = {
  foreground: "#27272a",
  keyword: "#6b4c9a",
  string: "#3b6e4c",
  comment: "#71717b",
  function: "#7c5e24",
  type: "#2d6480",
  number: "#7c5e24",
  constant: "#6b4c9a",
  variable: "#27272a",
  property: "#3f4d59",
  operator: "#52525b",
  punctuation: "#71717b",
} as const

/** Canonical Desktop Geometry, Typography & Motion Standards. */
export const DESKTOP_DIMENSIONS = {
  toolbarHeightPx: 38,
  iconSizePx: 16,
  navIconSizePx: 18,
  iconStrokeWidth: 1.5,
  controlHitAreaPx: 28,
  controlRadiusPx: 6,
  composerRadiusPx: 16,
  uiFontSizePx: 13,
  smallLabelFontSizePx: 11,
  editorLineHeightPx: 23,
  leftSidebarWidthPx: 248,
  rightSidebarWidthPx: 330,
  bottomPanelHeightPx: 210,
  editorTabHeightPx: 28,
  statusBarHeightPx: 23,
  spacingGridPx: 4,
  scrollbarWidthPx: 6,
} as const

export const DESKTOP_TYPOGRAPHY = {
  fontSans: '"Zen", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontMono: '"Zen Mono", "JetBrains Mono", "SF Mono", Consolas, monospace',
  uiFontSizePx: 13,
  smallLabelFontSizePx: 11,
  editorFontSizePx: 13,
  editorLineHeightPx: 23,
} as const

export const DESKTOP_MOTION = {
  hoverTransitionMs: 120,
  hoverEasing: "cubic-bezier(0.32, 0.72, 0, 1)",
  hoverTransition: "120ms cubic-bezier(0.32, 0.72, 0, 1)",
} as const

export const DESKTOP_DESIGN_TOKENS = {
  ...DESKTOP_DIMENSIONS,
  ...DESKTOP_TYPOGRAPHY,
  ...DESKTOP_MOTION,
  zenDark: ZEN_DARK_DESKTOP_TOKENS,
  zenLight: ZEN_LIGHT_DESKTOP_TOKENS,
  zenDarkSyntax: ZEN_DARK_SYNTAX_TOKENS,
  zenLightSyntax: ZEN_LIGHT_SYNTAX_TOKENS,
} as const
