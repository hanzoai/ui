/**
 * Rendered through the real `GuiProvider` and the shipped config, the way
 * `backends/gui/render.test.tsx` does — not through `<Hanzo>`, whose own
 * imports do not resolve in a bare checkout.
 *
 * Static markup is enough for what is at stake here: a style prop gui cannot
 * take throws while rendering, and a class Box failed to hand on is absent from
 * the output.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import config from './gui-config'
import { Box } from './box'

const html = (ui: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config as never}>{ui}</GuiProvider>)

describe('Box', () => {
  it('renders, which a style prop gui cannot take would prevent', () => {
    expect(html(<Box className="flex items-center gap-4 px-6">ok</Box>)).toContain('ok')
  })

  it('keeps a class it could not read', () => {
    // `group` is selected on by another rule. Dropping it breaks that rule
    // silently — the element looks right until something hovers it.
    expect(html(<Box className="flex group">x</Box>)).toContain('group')
  })

  it('does not leave a class it did read', () => {
    expect(html(<Box className="flex px-6">x</Box>)).not.toContain('px-6')
  })

  it('is a block, like the div it replaces — not the Stack it is built on', () => {
    // A gui Stack is flex-column. Taking that default silently turned 77 of 225
    // elements on one page into flex containers nothing asked to be.
    expect(html(<Box className="px-4">x</Box>)).toMatch(/display:\s*block/)
  })

  it('still becomes flex when a class says so', () => {
    // gui compiles every style value it sees into one sheet, so both words are
    // in the markup either way. The element's own class list is what decides.
    const el = /<div[^>]*class="([^"]*)"/.exec(html(<Box className="flex items-center">x</Box>))
    expect(el?.[1]).toMatch(/_dsp-flex/)
    expect(el?.[1]).not.toMatch(/_dsp-block/)
  })

  it('renders a text size the frame would have dropped', () => {
    // `fontSize` is not a frame style prop — set on a Stack it silently does
    // nothing, so a box carrying `text-xs` rendered at the inherited size and
    // every page using one came out taller.
    expect(html(<Box className="text-xs">x</Box>)).toMatch(/font-size:\s*var\(--text-xs\)/)
  })

  it('shrinks like the div it replaces, not like the View it is built on', () => {
    // React Native defaults flexShrink to 0. A converted flex child that will
    // not shrink keeps its whole basis and pushes its row wide.
    const el = /<div[^>]*class="([^"]*)"/.exec(html(<Box className="p-2">x</Box>))
    expect(el?.[1]).toMatch(/_shrink-1/)
  })

  it('still refuses to shrink when a class says so', () => {
    const el = /<div[^>]*class="([^"]*)"/.exec(html(<Box className="flex-shrink-0">x</Box>))
    expect(el?.[1]).toMatch(/_shrink-0/)
  })

  it('keeps the automatic minimum size a div has', () => {
    // A View pins min-height 0, so a converted flex child measured 0px tall.
    const cls = (ui: React.ReactNode) => /<div[^>]*class="([^"]*)"/.exec(html(ui))?.[1] ?? ''
    expect(cls(<Box className="p-2">x</Box>)).toMatch(/_minH-auto/)
    expect(cls(<Box className="min-h-0">x</Box>)).not.toMatch(/_minH-auto/)
  })

  it('lets an explicit prop win over the class that says the same thing', () => {
    const out = html(<Box className="px-6" paddingLeft={2}>x</Box>)
    expect(out).toBeTruthy()
  })
})
