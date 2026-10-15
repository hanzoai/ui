// @vitest-environment jsdom

/**
 * The Checkbox's mark, asserted on the compiled markup.
 *
 * jsdom does no layout, so the mark's drawn width cannot be measured here; what
 * is asserted is the zero padding that gives it room, and the mark each state
 * draws.
 *
 * Imports `./checkbox` directly rather than the backend barrel: a test for one
 * component should not fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Checkbox } from './checkbox'

const html = (node: React.ReactNode, theme: 'dark' | 'light' = 'dark') =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme={theme}>
      {node}
    </GuiProvider>,
  )

const frame = (markup: string) => markup.match(/<button[^>]*data-slot="checkbox"[^>]*>/)?.[0] ?? ''

/** The compiled class for one style property at rest, e.g. cls(el, 'bg') -> '_bg-transparent'. */
const PSEUDO = /^_[a-zA-Z]+-0(hover|press|focus|active|disabled)/
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '')
    .split(/\s+/)
    .find((c) => c.startsWith(`_${prop}-`) && !PSEUDO.test(c)) ?? ''

const svg = (markup: string) => markup.match(/<svg[^>]*>/)?.[0] ?? ''
const path = (markup: string) => markup.match(/<path[^>]*\bd="([^"]*)"/)?.[1] ?? ''

/** The stroke `$ink` compiles to. */
const INK = /stroke="var\(--ink\)"/
const TICK = 'M20 6 9 17l-5-5'
const DASH = 'M5 12h14'

describe('Checkbox', () => {
  // The frame is a <button>, which the user agent pads 1px 6px: on a 16px
  // border box that leaves a 2px content box and squeezes the 13px mark to 2x13.
  it('zeroes the button padding on every side', () => {
    const el = frame(html(<Checkbox checked />))

    for (const side of ['pt', 'pr', 'pb', 'pl']) expect(cls(el, side)).toBe(`_${side}-0px`)
  })

  it('draws a 13px tick in $ink when checked, nothing when not', () => {
    const on = html(<Checkbox checked />)

    expect(path(on)).toBe(TICK)
    expect(svg(on)).toContain('width="13"')
    expect(svg(on)).toContain('height="13"')
    expect(svg(on)).toMatch(INK)
    expect(svg(on)).toContain('stroke-width="3"')
    expect(html(<Checkbox checked={false} />)).not.toContain('<svg')
  })

  // `$ink` is the theme's foreground, so the mark flips with the ground rather
  // than being one colour that vanishes on one of them.
  it('takes the mark from the theme in light and dark alike', () => {
    for (const theme of ['light', 'dark'] as const)
      expect(svg(html(<Checkbox checked />, theme))).toMatch(INK)
  })

  // A select-all box over a partial selection is not "all selected".
  it('draws a dash, not a tick, when indeterminate', () => {
    expect(path(html(<Checkbox checked="indeterminate" />))).toBe(DASH)
  })

  // gui fills a checked box with `$backgroundActive` unless told otherwise; the
  // well stays what it is at rest, so the mark keeps its contrast.
  it('keeps the well transparent when checked', () => {
    const on = frame(html(<Checkbox checked />))
    const off = frame(html(<Checkbox checked={false} />))

    expect(cls(on, 'bg')).toBe('_bg-transparent')
    expect(cls(on, 'bg')).toBe(cls(off, 'bg'))
  })
})
