/**
 * @hanzo/theme — Canonical theme palettes, dynamic design tokens, appearance
 * engine, CSS helpers, and zero-FOUC pre-paint script for every Hanzo surface.
 *
 * Pure TypeScript with zero runtime dependencies (React bindings live at
 * `@hanzo/theme/react` so SSR, Node, TUI, and extension hosts never pull React).
 */

export * from './palettes'
export * from './appearance'
export {
  generateThemesStylesheet,
  themeCssLoadsRemoteFiles,
  themeCssValueFetches,
  themeToCss,
  varsToCssBlock,
  type ThemeToCssOptions,
} from './css'
