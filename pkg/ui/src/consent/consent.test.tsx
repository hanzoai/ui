// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
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
  it('the footer link is a labelled control that opens the cookie settings', () => {
    const out = html(<ConsentLink />)
    expect(out).toMatch(/data-slot="consent-link"/)
    expect(out).toMatch(/Cookie settings/)
  })
})

describe('Consent, opened by the visitor', () => {
  it('stays open when the policy arrives after it was asked for', async () => {
    // A US visitor, who is not asked until they open the choices: without this the
    // runner's own zone decides, and a UTC runner is an opt-in region.
    const zone = Intl.DateTimeFormat.prototype.resolvedOptions
    const us = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...zone.call(this), timeZone: 'America/New_York' }
    })
    const { createRoot } = await import('react-dom/client')
    const { act } = await import('react')
    const { openConsent } = await import('./Consent')
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <Consent />
        </GuiProvider>,
      )
    })
    expect(host.querySelector('[data-slot="consent"]')).toBeNull()
    await act(async () => openConsent())
    expect(host.querySelector('[data-slot="consent"]')).not.toBeNull()
    // cloud's rule lands after the panel opened (a page opened at #choices)
    await act(async () => window.dispatchEvent(new Event('hzpolicy')))
    expect(host.querySelector('[data-slot="consent"]'), 'the policy closed what the visitor opened').not.toBeNull()
    await act(async () => root.unmount())
    host.remove()
    us.mockRestore()
  })
})
