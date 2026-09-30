// @vitest-environment jsdom

/**
 * Disclosure's contract is the document's, asserted on compiled markup: the
 * closed row still carries its answer, it is a real details/summary pair, and
 * the open attribute follows `defaultOpen`. Never on computed style.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Disclosure } from './disclosure'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('Disclosure', () => {
  it('is a details with a summary, and the closed answer is in the document', () => {
    const out = html(<Disclosure summary="What is it?">Nothing hidden from a crawler.</Disclosure>)
    expect(out).toMatch(/<details[^>]*data-slot="disclosure"/)
    expect(out).toMatch(/<summary[^>]*data-slot="disclosure-summary"/)
    expect(out).toContain('Nothing hidden from a crawler.')
    expect(out).not.toMatch(/<details[^>]* open/)
  })

  it('opens on first paint when asked', () => {
    const out = html(
      <Disclosure summary="Q" defaultOpen>
        A
      </Disclosure>,
    )
    expect(out).toMatch(/<details[^>]* open/)
  })

  it('draws its edge and icon from tokens, not a stylesheet', () => {
    const out = html(<Disclosure summary="Q">A</Disclosure>)
    expect(out).toMatch(/class="[^"]*_borderBottomWidth-1px/)
    expect(out).toContain('data-slot="disclosure-icon"')
    expect(out).toContain('aria-hidden="true"')
  })
})
