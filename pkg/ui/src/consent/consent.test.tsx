// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { Consent, ConsentLink } from './Consent'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('Consent', () => {
  it('draws nothing until the visitor is asked', () => {
    expect(html(<Consent />)).not.toMatch(/data-slot="consent"/)
  })
  it('the footer link is a labelled control that names the opt-out', () => {
    const out = html(<ConsentLink />)
    expect(out).toMatch(/data-slot="consent-link"/)
    expect(out).toMatch(/Do not sell or share my personal information/)
  })
})
