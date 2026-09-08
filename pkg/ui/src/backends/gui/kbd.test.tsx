// @vitest-environment jsdom

/**
 * Kbd renders as a real `<kbd>` element with `pointer-events: none` and
 * `user-select: none` (a key label is never a click target, nor text a
 * sentence around it would drag into a selection) and `KbdGroup` lays
 * several out inline, asserted on compiled markup — @hanzo/gui drops an
 * unrecognised prop silently, so only the rendered attributes prove the
 * contract held.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Kbd, KbdGroup } from './kbd'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('Kbd', () => {
  it('is a real <kbd> element carrying its label', () => {
    const markup = html(<Kbd>Ctrl</Kbd>)
    const el = tag(markup, 'kbd')

    expect(el.startsWith('<kbd')).toBe(true)
    expect(markup).toContain('Ctrl')
  })

  it('is not itself a pointer target, and its label cannot be selected', () => {
    const el = tag(html(<Kbd>Esc</Kbd>), 'kbd')

    // gui compiles `pointerEvents` to an atomic class; `userSelect` is web-only
    // and outside the typed style props, so it rides the `style` prop instead.
    expect(el).toMatch(/class="[^"]*_pe-none/)
    expect(el).toMatch(/style="user-select:none"/)
  })

  it('forwards unknown DOM props, e.g. an id', () => {
    const el = tag(html(<Kbd id="save-key">S</Kbd>), 'kbd')

    expect(el).toContain('id="save-key"')
  })
})

describe('KbdGroup', () => {
  it('renders every key it is given, in order', () => {
    const markup = html(
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>B</Kbd>
      </KbdGroup>
    )
    const kbds = [...markup.matchAll(/<kbd[^>]*data-slot="kbd"[^>]*>/g)]

    expect(tag(markup, 'kbd-group')).not.toBe('')
    expect(kbds).toHaveLength(2)
    expect(markup.indexOf('>Ctrl<')).toBeLessThan(markup.indexOf('>B<'))
  })
})
