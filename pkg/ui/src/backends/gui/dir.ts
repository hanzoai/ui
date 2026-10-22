/**
 * Direction.
 *
 * Hosts set `<html dir="rtl">` (through @hanzo/i18n) for Arabic, Persian,
 * Hebrew, Urdu and the other right-to-left locales. Layout follows it through
 * logical props alone — `marginInlineStart`, `paddingInlineEnd`,
 * `insetInlineStart`, `borderStartStartRadius`, `textAlign: 'start'` — and gui's
 * rows already run in the document's direction. These two cover what a prop
 * cannot say.
 */

/**
 * Spread onto an icon whose meaning is a direction along the line — a chevron
 * that drills in, back, forward, next, previous, send — so it points the other
 * way under RTL. Never on a logo, a media control, a number, code or a chart's
 * time axis. `theme.css` holds the rule:
 * `[data-i18n-mirror]:dir(rtl) { transform: scaleX(-1) }`.
 */
export const mirror = { 'data-i18n-mirror': '' } as object

/**
 * Whether `el` reads right to left, asked when it matters: in a key handler
 * (ArrowRight moves BACK under RTL), a pointer gesture, a scroll. Reading it at
 * the event rather than at render keeps a server render and the first client
 * render identical.
 */
export const rtl = (el: unknown): boolean =>
  typeof Element !== 'undefined' &&
  el instanceof Element &&
  getComputedStyle(el).direction === 'rtl'
