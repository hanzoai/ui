/**
 * Design tokens — re-exported from `@hanzo/tokens`, the single source of truth.
 *
 * `@hanzo/ui` is BUILT ON `@hanzo/tokens`: the color scale, the dark/light theme
 * token sets (the exact values `theme.css` emits as CSS variables), the radii,
 * the spacing, and the typography scale all originate there. Surfacing them here
 * lets a consumer read the same tokens programmatically —
 * `import { themes, colors } from '@hanzo/ui/tokens'` — that the stylesheet and
 * the components render against, so runtime and CSS can never drift.
 *
 * NOTE: the root barrel's `tokens` export (the gui/product theme object from
 * `@hanzo/data`) is a DIFFERENT, complementary thing; these are named exports
 * (`colors`, `themes`, `dark`, `light`, `radii`, …) and never collide with it.
 */
export {
  colors,
  zinc,
  oklch,
  hsl,
  spacing,
  spacingPx,
  radii,
  radiiPx,
  fontFamily,
  fontSize,
  fontSizePx,
  fontWeight,
  lineHeight,
  letterSpacing,
  dark,
  light,
  themes,
} from '@hanzo/tokens'

export type {
  ColorToken,
  ZincStep,
  SpacingStep,
  RadiusToken,
  FontSizeToken,
  FontWeightToken,
  ThemeTokens,
} from '@hanzo/tokens'
