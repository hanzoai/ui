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

  it('lets an explicit prop win over the class that says the same thing', () => {
    const out = html(<Box className="px-6" paddingLeft={2}>x</Box>)
    expect(out).toBeTruthy()
  })
})
