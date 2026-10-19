'use client'

/**
 * A data hue on a component: the colour a person chose for a record, carried as
 * custom properties so the component's rules are written once.
 *
 * A tag, an avatar, an icon tile and a status pill can each take any of thirty
 * hues, and which one is DATA — read from a record at run time. Spelling the
 * hue into each style prop would mint one atomic class per hue per step, every
 * one of which the shipped sheet would have to hold before first paint. So the
 * element states its hue once, inline — `--tone-3: var(--data-red-3)` — and the
 * styled parts read `var(--tone-3)`: one class per step, whatever the hue, and
 * the value still follows the theme, because `--data-red-3` is declared per
 * theme in @hanzo/tokens' data.css.
 *
 * Off the web there are no custom properties, so `tone(step)` hands back the
 * step's own hex for the theme being rendered (from `scales`), and `style` is
 * empty.
 */
import { isWeb, useThemeName } from '@hanzo/gui'
import { hues, neutrals, scales, type DataHue } from '@hanzo/tokens/data'

export type { DataHue }
export { hues, neutrals }

/** Whether `v` names one of the thirty data hues. */
export const isHue = (v: unknown): v is DataHue => typeof v === 'string' && Object.hasOwn(scales, v)

/** `v` when it is a hue, `gray` otherwise — an unknown colour reads as the neutral, never as nothing. */
export const hueOr = (v: unknown, fallback: DataHue = 'gray'): DataHue => (isHue(v) ? v : fallback)

/**
 * The hue's steps for one element.
 *
 * `style` goes on the element that roots the part (its children inherit the
 * properties); `tone(step)` is the value a style prop reads.
 */
export function useTone(hue: DataHue, steps: readonly number[]) {
  const theme = useThemeName()
  if (!isWeb) {
    const scale = scales[hue][String(theme).startsWith('light') ? 'light' : 'dark']
    return { style: {}, tone: (step: number) => scale[step - 1] }
  }
  const style: Record<string, string> = {}
  for (const s of steps) style[`--tone-${s}`] = `var(--data-${hue}-${s})`
  return { style, tone: (step: number) => `var(--tone-${step})` }
}
