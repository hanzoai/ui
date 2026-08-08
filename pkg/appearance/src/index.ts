/**
 * @hanzo/appearance — a person's own reading of the Hanzo design system.
 *
 *   import { Appearance } from '@hanzo/appearance'          // the settings panel
 *   import { bootScript } from '@hanzo/appearance/state'    // no-flash, in <head>
 *
 * The knobs it writes are published by @hanzo/design and multiplied into every
 * ramp, so a change reaches the whole product — including @hanzo/gui's `$n`
 * ladder, which resolves through `var(--text-*)` since @hanzo/ui 8.0.69.
 */
export { Appearance, useAppearance, TYPE_STEPS } from './Appearance'
export { read, write, apply, style, bootScript, DEFAULT, KEY, type Preference } from './state'
