// @vitest-environment jsdom

/**
 * Pin3D's whole behaviour is a cascade: the frame's pseudo state drives rules
 * on two descendants. jsdom does not compute :hover, so every claim below
 * reads the compiled rule the markup ships and ties it, by class, to the
 * element it governs — never the text, because gui drops a prop it does not
 * recognise with no throw, so "content rendered" proves nothing about the lift.
 *
 * Imports `./3d-pin` directly rather than the backend barrel: a test for one
 * component should not fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Pin3D } from './3d-pin'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** Every compiled class for one style property, e.g. cls(el, 'o') for opacity. */
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).filter((c) => c.startsWith(`_${prop}-`))

/** The stylesheet gui inlines ahead of the markup. */
const sheet = (markup: string) => markup.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The declarations the sheet makes under `selector` for one of `classes`. */
const declared = (css: string, selector: string, classes: string[]) =>
  classes
    .map((c) => css.match(new RegExp(`${selector}\\s+\\.${escape(c)}\\{([^}]*)\\}`))?.[1] ?? '')
    .filter(Boolean)

describe('Pin3D', () => {
  it('renders a div frame that is a group over a wash and the scene', () => {
    const markup = html(<Pin3D>content</Pin3D>)
    const frame = tag(markup, '3d-pin')

    expect(frame.startsWith('<div')).toBe(true)
    expect(frame).not.toContain('href=')
    expect(frame).toContain('t_group_true')
    expect(tag(markup, '3d-pin-wash')).not.toBe('')
    expect(tag(markup, '3d-pin-scene')).toContain('data-slot="3d-pin-scene"')
    expect(markup).toContain('content')
  })

  it('renders as a link once href is given, carrying the title', () => {
    const frame = tag(
      html(
        <Pin3D href="/docs/3d-pin" title="3D Pin">
          content
        </Pin3D>,
      ),
      '3d-pin',
    )

    expect(frame.startsWith('<a')).toBe(true)
    expect(frame).toContain('href="/docs/3d-pin"')
    expect(frame).toContain('title="3D Pin"')
  })

  // A gui group is a CSS size container by default, and inline-size containment
  // makes an auto-width frame in a row measure as if it were empty.
  it('is not a size container', () => {
    const markup = html(<Pin3D>content</Pin3D>)
    const [ct] = cls(tag(markup, '3d-pin'), 'containerType')

    expect(ct).toBeTruthy()
    expect(sheet(markup)).toContain(`.${ct}{container-type:normal;}`)
  })

  it('rests with the wash clear and the scene unscaled, wash above scene', () => {
    const markup = html(<Pin3D>content</Pin3D>)
    const css = sheet(markup)
    const wash = tag(markup, '3d-pin-wash')
    const scene = tag(markup, '3d-pin-scene')

    expect(declared(css, ':root', cls(wash, 'o'))).toContain('opacity:0;')
    expect(wash).toContain('z-index:10')
    expect(declared(css, ':root', cls(scene, 'tr'))).toContain('transform:scale(1);')
  })

  it('washes and shrinks the scene while the frame is hovered, on devices that hover', () => {
    const markup = html(<Pin3D>content</Pin3D>)
    const css = sheet(markup)
    const hovered = '@media \\(hover:hover\\)\\{(?::root)+ \\.t_group_true:hover'

    expect(declared(css, hovered, cls(tag(markup, '3d-pin-wash'), 'o'))).toContain('opacity:0.5;')
    expect(declared(css, hovered, cls(tag(markup, '3d-pin-scene'), 'tr'))).toContain(
      'transform:scale(0.95);',
    )
  })

  it('lifts on keyboard focus too, with no hover guard', () => {
    const markup = html(<Pin3D href="/x">content</Pin3D>)
    const css = sheet(markup)
    const focused = '(?::root)+ \\.t_group_true:focus-visible'

    expect(declared(css, focused, cls(tag(markup, '3d-pin-wash'), 'o'))).toContain('opacity:0.5;')
    expect(declared(css, focused, cls(tag(markup, '3d-pin-scene'), 'tr'))).toContain(
      'transform:scale(0.95);',
    )
  })

  it('eases the wash and the scene over 500ms, each on its own property', () => {
    const markup = html(<Pin3D>content</Pin3D>)

    expect(tag(markup, '3d-pin-wash')).toContain('transition:opacity 500ms')
    expect(tag(markup, '3d-pin-scene')).toContain('transition:transform 500ms')
  })
})
