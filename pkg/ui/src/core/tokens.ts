/**
 * Design tokens — re-exported from `@hanzo/design`, the single source of truth.
 *
 * This used to read `@hanzo/tokens`, a workspace package last touched
 * 2026-03-22, while the design lane and several surfaces had already moved to
 * `@hanzo/design`. One fact, two homes: store/billing/hanzo.industries followed
 * design, the convergence branches followed the stale package, and pushing
 * either over the other reverted real work. `@hanzo/design` wins — it IS the
 * design system, it publishes the finished values, and it is what the rest of
 * the estate already consumes.
 *
 * The token layer this exposes to code is the SAME layer `theme.css` ships as
 * CSS — composed from @hanzo/design at build time by scripts/compose-theme.mjs
 * — so runtime and stylesheet cannot drift.
 *
 * `cssVar` is how code should reach a token: it returns `var(--name, <literal>)`
 * so the value resolves through the live cascade and honours the viewer's theme
 * instead of baking one theme's number into a component.
 *
 * NOTE: the root barrel's `tokens` export (the gui/product theme object from
 * `@hanzo/data`) is a DIFFERENT, complementary thing; these are named exports
 * and never collide with it.
 */
export {
  colors,
  typography,
  spacing,
  grid,
  radius,
  elevation,
  motion,
  zIndex,
  fonts,
  cssVars,
  cssVar,
  tokenValue,
} from '@hanzo/design'

export type { CssVarName, TokenName } from '@hanzo/design'
