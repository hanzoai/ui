/**
 * @hanzo/appearance — a person's own reading of the Hanzo design system.
 *
 *   import { Appearance } from '@hanzo/appearance'          // the settings panel
 *   import { bootScript } from '@hanzo/appearance/state'    // no-flash, in <head>
 *
 * The knobs it writes are published by @hanzo/design and multiplied into every
 * ramp, so a change reaches the whole product — including @hanzo/gui's `$n`
 * ladder, which resolves through `var(--text-*)` since @hanzo/ui 8.0.69.
 *
 * Four parties get an opinion, and the narrowest one that HAS an opinion wins,
 * axis by axis:
 *
 *     install  <  org  <  person (everywhere)  <  person (this org)
 *
 * The install's and the org's layers are ARGUMENTS, because they are not the
 * browser's to know — an org's branding is a row on a server.
 *
 * The personal layers belong to the PERSON, so IAM keeps them (`./account`) and
 * they cross a domain. localStorage keeps a copy under `hanzo.appearance` and
 * `hanzo.appearance@<org>`, but as a CACHE rather than the truth: the head script
 * has to paint before a fetch can return, and a device that has never signed in
 * still has to answer. localStorage alone is what made one person's setting four
 * settings — it is per-origin, so hanzo.ai, hanzo.chat, hanzo.app and console each
 * held their own.
 *
 *   <Appearance org="acme" orgName="Acme" orgPref={fromServer} />
 *   current({ install, org: fromServer, orgId: 'acme' })   // outside React
 */
export { Appearance, useAppearance, useScheme, TYPE_STEPS, RATIO_STEPS, ARABICS, ACCENTS, HIGHLIGHTS, CONTRASTS, BACKGROUNDS } from './Appearance'
export { read, readLayers, write, apply, paint, dark, current, style, bootScript, keyFor, companion, CHANGE, COMPANIONS, DEFAULT, KEY, PAINTED, type Arabic, type Contrast, type Preference, type Scheme, type At } from './state'
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
  PALETTES,
  RESERVED_THEME_IDS,
  THEME_COLOR_ROLES,
  ZEN_THEME,
  colorLuminance,
  computeContrastForeground,
  computeThemeVars,
  fromThemeConfig,
  getBuiltInTheme,
  getDefaultThemeColors,
  getThemeColorsForAppearance,
  isBuiltInThemeId,
  isThemeMode,
  paletteVars,
  resolvePalette,
  resolveThemeId,
  resolveThemeState,
  roleToCssVar,
  toThemeConfig,
  type AppearanceConfig,
  type BuiltInThemeId,
  type PaletteSummary,
  type ResolvedThemeState,
  type ThemeAppearance,
  type ThemeColorRole,
  type ThemeColors,
  type ThemeDefinition,
  type ThemeMode,
} from './theme'
export { get, load, put, save, type Account } from './account'
export { COMPOSING, composing, loadComposing, readComposing, saveComposing, useComposing, writeComposing, type Composing } from './composing'
export { resolve, layerFor, isInherited, LAYERS, type Layer, type Layers, type Resolved, type Scope } from './scope'
