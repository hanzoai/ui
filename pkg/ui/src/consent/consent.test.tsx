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
    // A visitor who has chosen, so is not asked until they open the choices.
    document.cookie = 'hz_consent=analytics; Path=/'
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
    document.cookie = 'hz_consent=; Max-Age=0; Path=/'
  })
})

describe('Consent, on a first visit', () => {
  const mount = async (node: React.ReactNode) => {
    const { createRoot } = await import('react-dom/client')
    const { act } = await import('react')
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          {node}
        </GuiProvider>,
      )
    })
    return {
      host,
      act,
      done: async () => {
        await act(async () => root.unmount())
        host.remove()
      },
    }
  }

  it('asks every visitor, whatever the clock says, and Reject stores a refusal', async () => {
    const zone = Intl.DateTimeFormat.prototype.resolvedOptions
    const us = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...zone.call(this), timeZone: 'America/Los_Angeles' }
    })
    const m = await mount(<Consent brand="Lux" />)
    const bar = m.host.querySelector('[data-slot="consent"]')
    expect(bar, 'a US clock is asked too').not.toBeNull()
    const reject = [...m.host.querySelectorAll('button')].find((b) => b.textContent === 'Reject all')!
    await m.act(async () => reject.click())
    expect(document.cookie).toMatch(/hz_consent=(;|$)/)
    expect(m.host.querySelector('[data-slot="consent"]')).toBeNull()
    await m.done()
    document.cookie = 'hz_consent=; Max-Age=0; Path=/'
    us.mockRestore()
  })

  it('does not ask a browser that sends Global Privacy Control, and locks every switch', async () => {
    const gpc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'globalPrivacyControl')
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true, configurable: true })
    const { openConsent } = await import('./Consent')
    const m = await mount(<Consent brand="Zoo" />)
    expect(m.host.querySelector('[data-slot="consent"]')).toBeNull()
    await m.act(async () => openConsent())
    expect(m.host.textContent).toContain('Choose what Zoo may measure')
    const switches = [...m.host.querySelectorAll('[role="switch"]')]
    expect(switches.length).toBe(3)
    for (const sw of switches) expect(sw.getAttribute('aria-checked')).toBe('false')
    await m.done()
    if (gpc) Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', gpc)
    else delete (Navigator.prototype as { globalPrivacyControl?: boolean }).globalPrivacyControl
  })
})
