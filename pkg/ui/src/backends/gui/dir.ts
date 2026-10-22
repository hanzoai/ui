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
 * Spread onto text whose order is not language: a keyboard shortcut (⌘C), a
 * key chord, an email or URL field. It stays left to right inside an RTL line,
 * isolated so the line around it keeps its own order. `theme.css` holds the
 * rule: `[data-i18n-ltr] { direction: ltr; unicode-bidi: isolate }`, the
 * attribute @hanzo/i18n's rtl.css reads too.
 */
export const ltr = { 'data-i18n-ltr': '' } as object

/**
 * A string that reads left to right inside any line, wrapped in Unicode's
 * LEFT-TO-RIGHT ISOLATE and POP DIRECTIONAL ISOLATE. For a shortcut hint that
 * sits at the end of a row: `ltr` would turn the element itself left to right,
 * and its `marginInlineStart: 'auto'` would then push it the wrong way under
 * RTL. The marks travel with the text, so native renders them too.
 */
export const ltrText = <T,>(text: T): T | string =>
  typeof text === 'string' ? `\u2066${text}\u2069` : text

/**
 * Text aligned to a reading edge. CSS has `start` and `end`, and gui maps them
 * to the left/right react-native swaps under RTL; gui's type still names only
 * the physical values, so the logical one is spread rather than typed.
 */
export const align = (edge: 'start' | 'end') => ({ textAlign: edge }) as object

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

/**
 * The key as it reads left to right. Under RTL the next item sits to the left,
 * so ArrowLeft moves forward: a handler written for LTR compares `along(e)`
 * and is right in both directions. Other keys pass through.
 */
export const along = (e: { key?: string; currentTarget?: unknown }): string => {
  const key = e.key ?? ''
  if (!rtl(e.currentTarget)) return key
  return key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key
}
