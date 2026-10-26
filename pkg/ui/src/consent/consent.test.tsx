// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import { serveConsent } from '@hanzo/event'

import config from '../gui-config'
import { Consent, ConsentLink, openConsent } from './Consent'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

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
  const button = (name: string) => [...host.querySelectorAll('button')].find((b) => b.textContent === name || b.getAttribute('aria-label') === name)!
  const key = (k: string, shiftKey = false) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true }))
  return {
    host,
    act,
    button,
    key,
    sheet: () => host.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]'),
    bar: () => host.querySelector<HTMLElement>('[role="dialog"]:not([aria-modal])'),
    done: async () => {
      await act(async () => root.unmount())
      host.remove()
    },
  }
}

/** A visitor who has chosen, so is not asked until they open the choices. */
const chosen = () => {
  document.cookie = 'hz_consent=analytics; Path=/'
  document.cookie = 'hz_consent_v=2; Path=/'
}

afterEach(() => {
  serveConsent(null)
  document.cookie = 'hz_consent=; Max-Age=0; Path=/'
  document.cookie = 'hz_consent_v=; Max-Age=0; Path=/'
})

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
    chosen()
    const m = await mount(<Consent />)
    expect(m.host.querySelector('[data-slot="consent"]')).toBeNull()
    await m.act(async () => openConsent())
    expect(m.host.querySelector('[data-slot="consent"]')).not.toBeNull()
    // cloud's rule lands after the panel opened (a page opened at #choices)
    await m.act(async () => window.dispatchEvent(new Event('hzpolicy')))
    expect(m.host.querySelector('[data-slot="consent"]'), 'the policy closed what the visitor opened').not.toBeNull()
    await m.done()
  })

  it('is a labelled modal: focus moves in, Tab stays in, Escape closes and gives focus back', async () => {
    chosen()
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const m = await mount(<Consent />)
    await m.act(async () => openConsent())
    const sheet = m.sheet()!
    expect(sheet, 'role=dialog with aria-modal').not.toBeNull()
    const title = document.getElementById(sheet.getAttribute('aria-labelledby')!)
    expect(title?.textContent).toBe('Cookie Preferences')
    expect(title?.tagName).toBe('H2')
    expect(sheet.contains(document.activeElement), 'focus moved into the sheet').toBe(true)
    const all = [...sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
    all[all.length - 1]!.focus()
    await m.act(async () => m.key('Tab'))
    expect(document.activeElement, 'Tab from the last control wraps to the first').toBe(all[0])
    await m.act(async () => m.key('Tab', true))
    expect(document.activeElement, 'Shift+Tab from the first wraps to the last').toBe(all[all.length - 1])
    await m.act(async () => m.key('Escape'))
    expect(m.sheet(), 'Escape closes it').toBeNull()
    expect(document.activeElement, 'focus returns to what opened it').toBe(opener)
    await m.done()
    opener.remove()
  })

  it('names the policies, keeps Strictly Necessary always on, and opens each section from a button', async () => {
    chosen()
    const m = await mount(<Consent brand="Lux" cookies="https://lux.network/cookies" privacy="https://lux.network/privacy" terms="https://lux.network/terms" />)
    await m.act(async () => openConsent())
    const sheet = m.sheet()!
    const links = [...sheet.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')])
    expect(links).toEqual([
      ['Cookie Policy', 'https://lux.network/cookies'],
      ['Privacy Policy', 'https://lux.network/privacy'],
      ['Terms of Service', 'https://lux.network/terms'],
    ])
    const sections = [...sheet.querySelectorAll('[data-slot="consent-section"]')]
    expect(sections.map((s) => s.querySelector('h3')?.textContent)).toEqual([
      'Strictly Necessary Cookies',
      'Performance Cookies',
      'Marketing Cookies',
      'Sell, Share, or Use Your Data for Targeted Advertising',
    ])
    expect(sections[0]!.querySelector('[role="switch"]'), 'no switch for what cannot be turned off').toBeNull()
    expect(sections[0]!.textContent).toContain('Always Active')
    const switches = [...sheet.querySelectorAll('[role="switch"]')]
    expect(switches.map((s) => s.getAttribute('aria-label'))).toEqual(['Performance Cookies', 'Marketing Cookies', 'Sell, Share, or Use Your Data for Targeted Advertising'])
    expect(switches.map((s) => s.getAttribute('aria-checked')), 'the stored choice').toEqual(['true', 'false', 'false'])
    const toggle = sections[1]!.querySelector<HTMLElement>('h3 button')!
    const body = document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(getComputedStyle(body).display).toBe('none')
    await m.act(async () => toggle.click())
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(getComputedStyle(body).display).not.toBe('none')
    expect(body.textContent).toContain('so Lux can measure')
    const foot = [...sheet.querySelectorAll('button')].slice(-2).map((x) => x.textContent)
    expect(foot, 'Accept all and Save preferences, and no Reject all').toEqual(['Accept all', 'Save preferences'])
    expect(sheet.textContent).not.toContain('Reject')
    await m.done()
  })

  it('Save preferences stores what the switches say', async () => {
    chosen()
    const m = await mount(<Consent />)
    await m.act(async () => openConsent())
    const marketing = m.sheet()!.querySelector<HTMLElement>('[role="switch"][aria-label="Marketing Cookies"]')!
    await m.act(async () => marketing.click())
    await m.act(async () => m.button('Save preferences').click())
    expect(m.sheet()).toBeNull()
    expect(document.cookie).toMatch(/hz_consent=analytics%2Cmarketing(;|$)/)
    await m.done()
  })

  it('opens from a link to #choices, and from #choices on arrival', async () => {
    chosen()
    const m = await mount(<Consent />)
    const a = document.createElement('a')
    a.href = '#choices'
    document.body.appendChild(a)
    await m.act(async () => a.click())
    expect(m.sheet(), 'a link to #choices opens the sheet').not.toBeNull()
    await m.act(async () => m.button('Close').click())
    expect(m.sheet()).toBeNull()
    // A modified press keeps its meaning (a new tab), and another site's #choices is that site's.
    const press = (el: Element, init: MouseEventInit = {}) => {
      const e = new MouseEvent('click', { bubbles: true, cancelable: true, ...init })
      el.dispatchEvent(e)
      return e
    }
    let e = press(a, { ctrlKey: true })
    expect(e.defaultPrevented).toBe(false)
    e = press(a, { metaKey: true })
    expect(e.defaultPrevented).toBe(false)
    a.target = '_blank'
    e = press(a)
    expect(e.defaultPrevented, 'a link that opens a new tab').toBe(false)
    a.removeAttribute('target')
    a.setAttribute('download', '')
    e = press(a)
    expect(e.defaultPrevented, 'a download').toBe(false)
    a.removeAttribute('download')
    a.href = 'https://example.com/#choices'
    e = press(a)
    expect(e.defaultPrevented).toBe(false)
    expect(m.sheet(), 'none of those open the sheet').toBeNull()
    // An SVG link's `.href` is not a string; a press on one is not an error.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const link = document.createElementNS('http://www.w3.org/2000/svg', 'a')
    link.setAttribute('href', '#choices')
    svg.appendChild(link)
    document.body.appendChild(svg)
    await m.act(async () => void press(link))
    expect(m.sheet(), 'an SVG link to #choices opens it too').not.toBeNull()
    svg.remove()
    a.remove()
    await m.done()
    history.replaceState({ router: 'kept' }, '', '/pricing#choices')
    const n = await mount(<Consent />)
    expect(n.sheet(), 'a page opened at #choices opens the sheet').not.toBeNull()
    expect(window.location.hash, 'and drops the hash').toBe('')
    expect(history.state, "and keeps the router's entry state").toEqual({ router: 'kept' })
    await n.done()
  })
})

describe('Consent, when cloud answers after the sheet opened', () => {
  it('a new policy version turns off the switches an old choice filled', async () => {
    chosen()
    const m = await mount(<Consent />)
    await m.act(async () => openConsent())
    const on = () => [...m.sheet()!.querySelectorAll('[role="switch"]')].map((x) => x.getAttribute('aria-checked'))
    expect(on(), 'the stored choice, under v2').toEqual(['true', 'false', 'false'])
    await m.act(async () => serveConsent({ region: 'DE', mode: 'opt-in', version: 3, refused: false, defaults: {} }))
    expect(on(), 'v3 asks again: nothing is pre-ticked').toEqual(['false', 'false', 'false'])
    await m.done()
  })

  it('a refusal cloud saw (Sec-GPC) locks an open sheet', async () => {
    const m = await mount(<Consent />)
    await m.act(async () => m.button('Manage preferences').click())
    expect(m.sheet()!.querySelector('[role="switch"][disabled]')).toBeNull()
    await m.act(async () => serveConsent({ region: 'US', mode: 'opt-in', version: 2, refused: true, defaults: {} }))
    for (const sw of m.sheet()!.querySelectorAll('[role="switch"]')) expect(sw.hasAttribute('disabled')).toBe(true)
    expect(m.sheet()!.textContent).toContain('Your browser asks sites not to track you')
    await m.done()
  })

  it('opening it again keeps what the visitor switched and where focus returns', async () => {
    chosen()
    const m = await mount(<Consent />)
    await m.act(async () => openConsent())
    const marketing = m.sheet()!.querySelector<HTMLElement>('[role="switch"][aria-label="Marketing Cookies"]')!
    await m.act(async () => marketing.click())
    await m.act(async () => openConsent())
    expect(marketing.getAttribute('aria-checked'), 'the unsaved switch').toBe('true')
    await m.done()
  })
})

describe('Consent, on a first visit', () => {
  it('asks every visitor, whatever the clock says, and the × stores essential cookies only', async () => {
    const zone = Intl.DateTimeFormat.prototype.resolvedOptions
    const us = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...zone.call(this), timeZone: 'America/Los_Angeles' }
    })
    const m = await mount(<Consent brand="Lux" />)
    const bar = m.bar()
    expect(bar, 'a US clock is asked too').not.toBeNull()
    expect(bar!.getAttribute('aria-label')).toBe('Cookie preferences')
    expect(bar!.textContent).toContain('Essential cookies keep Lux running.')
    expect(bar!.querySelector('a'), 'the policies are named in the sheet, not the bar').toBeNull()
    expect([...bar!.querySelectorAll('button')].map((b) => b.textContent || b.getAttribute('aria-label'))).toEqual([
      'Manage preferences',
      'Accept all',
      'Close and use essential cookies only',
    ])
    expect(m.host.textContent, 'no Reject all: the × is the refusal').not.toContain('Reject')
    await m.act(async () => m.button('Close and use essential cookies only').click())
    expect(document.cookie, 'the × is a choice: essential only, stored').toMatch(/hz_consent=(;|$)/)
    expect(document.cookie).toMatch(/hz_consent_v=2/)
    expect(m.host.querySelector('[data-slot="consent"]')).toBeNull()
    await m.done()
    us.mockRestore()
  })

  it('Manage preferences opens the sheet with everything off, and closing it asks again', async () => {
    const m = await mount(<Consent />)
    await m.act(async () => m.button('Manage preferences').click())
    expect(m.bar(), 'the sheet replaces the bar').toBeNull()
    for (const sw of m.sheet()!.querySelectorAll('[role="switch"]')) expect(sw.getAttribute('aria-checked'), 'nothing optional before a choice').toBe('false')
    await m.act(async () => m.button('Close').click())
    expect(m.sheet()).toBeNull()
    expect(m.bar(), 'no choice was made, so the bar asks again').not.toBeNull()
    expect(document.activeElement, 'focus lands on Manage preferences').toBe(m.button('Manage preferences'))
    expect(document.cookie).not.toMatch(/hz_consent=/)
    await m.done()
  })

  it('does not ask a browser that sends Global Privacy Control, and locks every switch', async () => {
    const gpc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'globalPrivacyControl')
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true, configurable: true })
    const m = await mount(<Consent brand="Zoo" />)
    expect(m.host.querySelector('[data-slot="consent"]')).toBeNull()
    await m.act(async () => openConsent())
    expect(m.host.textContent).toContain('so Zoo can measure')
    expect(m.host.textContent).toContain('Your browser asks sites not to track you')
    const switches = [...m.host.querySelectorAll('[role="switch"]')]
    expect(switches.length).toBe(3)
    for (const sw of switches) {
      expect(sw.getAttribute('aria-checked')).toBe('false')
      expect(sw.hasAttribute('disabled')).toBe(true)
    }
    expect(m.sheet()!.textContent, 'nothing to accept: the browser refused').not.toContain('Accept all')
    await m.act(async () => m.button('Save preferences').click())
    expect(document.cookie, 'saving under GPC stores a refusal').toMatch(/hz_consent=(;|$)/)
    await m.done()
    if (gpc) Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', gpc)
    else delete (Navigator.prototype as { globalPrivacyControl?: boolean }).globalPrivacyControl
  })
})
