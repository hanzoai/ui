// @vitest-environment jsdom

/**
 * The backend renders. Every component in the gui backend is mounted under the
 * real `GuiProvider` + the shipped config and asserted by its `data-slot` marker.
 *
 * This exists because a build, a typecheck and a pack all pass on a component
 * that throws on first paint — the flip was verified by all three and none of
 * them mounted anything.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Gallery } from '../../gallery'
import { Button } from './index'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const slots = (markup: string) =>
  [...markup.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1])

describe('gui backend renders', () => {
  // The surface is `src/gallery.tsx` — the same list `scripts/gen-css.mjs`
  // renders to generate the stylesheet and the consumer test renders in a
  // browser. A second copy of "every component" here would drift from it, and a
  // component styled by one list and missed by the other is the whole bug.
  it('mounts the whole surface and emits its slot markers', () => {
    const markup = html(<Gallery />)

    // Portalled panels (dialog/popover/menu/select content) do not appear in
    // static markup — they mount into a portal host at runtime. What is asserted
    // here is everything that renders in place.
    const seen = new Set(slots(markup))
    for (const slot of [
      'aspect-ratio',
      'badge',
      'button',
      'card',
      'command-group',
      'command-input',
      'command-item',
      'command-list',
      'input',
      'scroll-area',
      'scroll-area-viewport',
      'tabs',
      'tabs-list',
      'tabs-trigger',
      'textarea',
    ])
      expect(seen, slot).toContain(slot)
  })

  it('styles a Button and never leaks a style prop as an HTML attribute', () => {
    const markup = html(
      <Button variant="outline" size="lg">
        go
      </Button>,
    )
    expect(markup).toContain('data-variant="outline"')
    // gui compiles style props to classes; anything below means the frame is an
    // HOC and the styles went out as invalid attributes instead.
    for (const leak of ['backgroundcolor=', 'bordertopcolor=', 'hoverstyle=', 'font-size='])
      expect(markup, leak).not.toContain(leak)
  })

  it('styles a Button-as-link instead of dumping style props on the anchor', () => {
    const markup = html(
      <Button asChild="web" variant="outline" size="lg">
        <a href="/x">link</a>
      </Button>,
    )
    const anchor = markup.match(/<a [^>]*>/)?.[0] ?? ''
    // The anchor IS the button: same tag as the child, carrying the compiled
    // classes and the slot markers. Not a <button> wrapping an <a>.
    expect(anchor).toContain('href="/x"')
    expect(anchor).toContain('data-slot="button"')
    expect(anchor).toContain('is_Button')
    expect(markup).not.toMatch(/<button[\s\S]*<a /)
    for (const leak of ['backgroundcolor=', 'bordertopcolor=', 'hoverstyle=', 'height="40px"'])
      expect(markup, leak).not.toContain(leak)
  })

  it('gives a web Button a 44px touch target it cannot get from hitSlop', () => {
    const markup = html(<Button size="sm">go</Button>)
    // 32px tall + 6px each side. `hitSlop` is dropped on web, so this attribute
    // is the only thing that can lift the target — theme.css has the rule.
    expect(markup).toContain('data-touch-y="6"')
    expect(markup).not.toContain('hitslop')
  })
})
