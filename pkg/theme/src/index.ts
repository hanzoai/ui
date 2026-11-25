/**
 * @hanzo/theme — Canonical theme palettes, dynamic design tokens, appearance
 * engine, CSS helpers, desktop workbench mapper, and zero-FOUC pre-paint script
 * for every Hanzo surface.
 *
 * Pure TypeScript with zero React dependency (React bindings live at
 * `@hanzo/theme/react` so SSR, Node, TUI, and extension hosts never pull React).
 */

export * from './palettes'
export * from './appearance'
export {
  applyDesktopThemeCssVars,
  buildDesktopThemeCssVars,
  formatDesktopThemeCssText,
  generateThemesStylesheet,
  themeCssLoadsRemoteFiles,
  themeCssValueFetches,
  themeToCss,
  varsToCssBlock,
  type DocumentLike,
  type RootElementLike,
  type ThemeToCssOptions,
} from './css'
export {
  colorToHex,
  mixColorsToHex,
  parseCssColorToRgba,
  withAlphaHex,
  type Rgba,
} from './color-convert'
export {
  buildWorkbenchThemeFromTokens,
  type MonacoStandaloneThemeData,
  type MonacoThemeRule,
  type TerminalThemePalette,
  type TextMateTokenRule,
  type WorkbenchThemePayload,
} from './workbench'
export {
  APP_THEME_CSS_VARIABLES,
  DESKTOP_DESIGN_TOKENS,
  DESKTOP_DIMENSIONS,
  DESKTOP_MOTION,
  DESKTOP_TYPOGRAPHY,
  LEGACY_THEME_ID_ALIASES,
  MOBILE_DEFAULT_THEME_ID,
  MOBILE_THEME_IDS,
  UNPUBLISHABLE_THEME_IDS,
  ZEN_DARK_DESKTOP_TOKENS,
  ZEN_DARK_SYNTAX_TOKENS,
  ZEN_LIGHT_DESKTOP_TOKENS,
  ZEN_LIGHT_SYNTAX_TOKENS,
  getThemeColorVariable,
  resolveLegacyThemeId,
  type DesktopSurfaceTokens,
  type DesktopSyntaxTokens,
  type MobileThemeId,
} from '@hanzo/tokens/desktop'
