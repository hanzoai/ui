// @vitest-environment jsdom

/**
 * The Switch's geometry and its state affordance, asserted on the compiled
 * markup. Both defects this covers were invisible to a build, a typecheck and a
 * pack — the component rendered, it just rendered the wrong shape in one colour.
 *
 * Imports `./switch` directly rather than the backend barrel: the barrel pulls
 * the whole surface in, and a test for one component should not fail because a
 * different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Switch } from './switch'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

/** The frame is the element carrying the switch slot; the thumb carries its own. */
const frame = (markup: string) => markup.match(/<button[^>]*data-slot="switch"[^>]*>/)?.[0] ?? ''
const thumb = (markup: string) =>
  markup.match(/<div[^>]*data-slot="switch-thumb"[^>]*>/)?.[0] ?? ''

/** The compiled class for one style property, e.g. cls(el, 'bg') -> '_bg-color3'. */
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

describe('Switch', () => {
  // gui's `size` variant returns { height, minHeight, width }, so setting only
  // `height` left its 29px floor in place — and min-height beats height. Every
  // switch in every app rendered 36×29, which at that ratio clamps a 1000px
  // radius to 10px: a rounded rectangle, not a pill, with the thumb adrift.
  it('is a 20px pill, and gui\'s size floor does not overrule its height', () => {
    const el = frame(html(<Switch checked={false} />))

    expect(cls(el, 'height')).toBe('_height-20px')
    expect(cls(el, 'minH')).toBe('_minH-20px')
    expect(el).not.toContain('_minH-29px')
  })

  // The whole point of a switch is that you can see which way it is set. gui's
  // default checked treatment is `$backgroundActive`, which in this theme
  // resolves to the value the unchecked track already has — so on and off were
  // pixel-identical apart from the thumb's 14px of travel. Asserting the classes
  // DIFFER rather than naming one keeps this honest if the palette moves.
  it('says on and off in colour, not only in the thumb\'s position', () => {
    const on = html(<Switch checked />)
    const off = html(<Switch checked={false} />)

    expect(cls(frame(on), 'bg')).not.toBe('')
    expect(cls(frame(on), 'bg')).not.toBe(cls(frame(off), 'bg'))
    expect(cls(thumb(on), 'bg')).not.toBe(cls(thumb(off), 'bg'))
  })

  // The checked thumb must REPLACE its colour, not add a second class that races
  // the first. `background` in activeStyle compiles to `_background-…` beside the
  // base `_bg-…`, so which one paints is decided by stylesheet order — a bug that
  // looks fine in one build and wrong in the next. Exactly one background class.
  it('resolves the thumb to a single background class in both states', () => {
    for (const checked of [true, false]) {
      const el = thumb(html(<Switch checked={checked} />))
      const bgs = (el.match(/class="([^"]*)"/)?.[1] ?? '')
        .split(/\s+/)
        .filter((c) => /^_(bg|background)-/.test(c))
      expect(bgs, `checked=${checked}: ${bgs.join(' ')}`).toHaveLength(1)
    }
  })

  // A disabled control that looks live invites a click that does nothing, and
  // this page had one sitting beside eight enabled ones.
  it('looks disabled when it is disabled', () => {
    const on = frame(html(<Switch checked={false} />))
    const off = frame(html(<Switch checked={false} disabled />))

    expect(off).toContain('disabled')
    expect(cls(off, 'o')).not.toBe(cls(on, 'o'))
  })

  // hitSlop is dropped on web, so this attribute is the only thing that can lift
  // a 20px control to the 44px floor. theme.css carries the matching rule.
  it('reaches the 44px touch floor without growing the pill', () => {
    const markup = html(<Switch checked={false} />)

    expect(frame(markup)).toContain('data-touch-y="12"')
    expect(markup).not.toContain('hitslop')
  })
})
