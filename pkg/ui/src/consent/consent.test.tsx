// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import { noticed, serveConsent } from '@hanzo/event'
import { I18nProvider } from '@hanzo/i18n/react'

import config from '../gui-config'
import { Consent, ConsentLink, openConsent } from './Consent'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

/** Every mounted root, unmounted after each test even when it failed, so none leaves listeners behind. */
const live = new Set<() => Promise<void>>()

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
  const done = async () => {
    if (!live.delete(done)) return
    await act(async () => root.unmount())
    host.remove()
  }
  live.add(done)
  return {
    host,
    act,
    button,
    key,
    sheet: () => host.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]'),
    bar: () => host.querySelector<HTMLElement>('[role="dialog"]:not([aria-modal])'),
    done,
  }
}

/** A visitor who has chosen, so is not asked until they open the choices. */
const chosen = () => {
  document.cookie = 'hz_consent=analytics; Path=/'
  document.cookie = 'hz_consent_v=2; Path=/'
}

/** Cloud's answer: the rule the visitor is under. */
const rule = (mode: 'eu' | 'us_privacy' | 'global', more: Record<string, unknown> = {}) =>
  serveConsent({ region: 'XX', mode, version: 2, refused: false, defaults: {}, ...more })

/** The browser's Global Privacy Control, on until the test ends, failed or not. */
const gpcWas = Object.getOwnPropertyDescriptor(Navigator.prototype, 'globalPrivacyControl')
const sendGPC = () => Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true, configurable: true })

/** Whether @hanzo/event holds the sheet open (its page slot, which `consentSheet` writes). */
const consentOpen = () => (globalThis as unknown as Record<symbol, { sheet?: boolean } | undefined>)[Symbol.for('hanzo.event.consent')]?.sheet === true

/** A frame or two: the component looks for the page's own links once a frame. */
const frames = () => new Promise((done) => setTimeout(done, 40))

afterEach(async () => {
  for (const done of [...live]) await done()
  vi.useRealTimers()
  vi.restoreAllMocks()
  if (gpcWas) Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', gpcWas)
  else delete (Navigator.prototype as { globalPrivacyControl?: boolean }).globalPrivacyControl
  serveConsent(null)
  try {
    sessionStorage.clear()
  } catch {
    /* no storage */
  }
  for (const c of document.cookie.split('; ')) if (c) document.cookie = `${c.slice(0, c.indexOf('='))}=; Max-Age=0; Path=/`
})

describe('Consent', () => {
  it('draws nothing until the visitor is asked', () => {
    expect(html(<Consent />)).not.toMatch(/data-slot="consent"/)
  })
  it('the footer link reads Your Privacy Choices, beside California’s privacy options icon', () => {
    const out = html(<ConsentLink />)
    expect(out).toMatch(/data-slot="consent-link"/)
    expect(out).toMatch(/Your Privacy Choices/)
    expect(out).toMatch(/<svg[^>]*viewBox="0 0 30 14"[^>]*aria-hidden="true"/)
  })
})

describe('Consent, before cloud answers', () => {
  it('draws nothing, then the strict eu bar when no rule has come in 1.5s', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const m = await mount(<Consent />)
    expect(m.host.querySelector('[data-slot="consent"]'), 'nothing while cloud is asked').toBeNull()
    expect(m.host.querySelector('[data-slot="consent-choices"]')).toBeNull()
    await m.act(async () => void vi.advanceTimersByTime(1600))
    expect(m.bar()?.getAttribute('aria-label'), 'no answer is the strict answer').toBe('Cookie preferences')
    vi.useRealTimers()
    await m.done()
  })

  it('a tab already served a rule uses it at once', async () => {
    rule('us_privacy')
    serveConsent(null)
    const m = await mount(<Consent />)
    await m.act(frames)
    expect(m.bar(), 'no bar under us_privacy').toBeNull()
    expect(m.host.querySelector('[data-slot="consent-choices"]'), 'the way to the choices, at once').not.toBeNull()
    await m.done()
  })

  it('draws the rule cloud serves the moment it arrives', async () => {
    const m = await mount(<Consent />)
    expect(m.host.querySelector('[aria-label="Cookie notice"]')).toBeNull()
    await m.act(async () => void rule('global'))
    expect(m.host.querySelector('[aria-label="Cookie notice"]')).not.toBeNull()
    await m.done()
  })
})

describe('Consent, under us_privacy', () => {
  beforeEach(() => void rule('us_privacy'))

  it('asks nothing, and draws Your Privacy Choices where the page has no link of its own', async () => {
    const m = await mount(<Consent brand="Lux" />)
    await m.act(frames)
    expect(m.bar(), 'no banner').toBeNull()
    const own = m.host.querySelector('[data-slot="consent-choices"]')!
    expect(own.textContent).toBe('Your Privacy Choices')
    expect(own.querySelector('svg')?.getAttribute('viewBox'), 'with the privacy options icon').toBe('0 0 30 14')
    await m.act(async () => m.button('Your Privacy Choices').click())
    const sheet = m.sheet()!
    expect(sheet.textContent, 'says what runs by default').toContain('Google Analytics and the Meta pixel run on this site by default')
    expect(sheet.textContent).toContain('turn this off to opt out')
    expect([...sheet.querySelectorAll('[role="switch"]')].map((x) => x.getAttribute('aria-checked')), 'on until turned off').toEqual(['true', 'true', 'true'])
    await m.done()
  })

  it('opting out of the sale and sharing saves as the switch moves, and the link reads the same after', async () => {
    const m = await mount(<Consent />)
    await m.act(frames)
    await m.act(async () => m.button('Your Privacy Choices').click())
    const ads = m.sheet()!.querySelector<HTMLElement>('[role="switch"][aria-label="Sell, Share, or Use Your Data for Targeted Advertising"]')!
    await m.act(async () => ads.click())
    expect(document.cookie, 'saved at once: no Save step').toMatch(/hz_consent=analytics%2Cmarketing(;|$)/)
    expect([...m.sheet()!.querySelectorAll('button')].map((b) => b.textContent).slice(-1), 'nothing left to save').toEqual(['Done'])
    await m.act(async () => m.button('Done').click())
    await m.act(frames)
    expect(m.sheet()).toBeNull()
    expect(m.host.querySelector('[data-slot="consent-choices"]')?.textContent).toBe('Your Privacy Choices')
    await m.done()
  })

  it('draws no second link where the page mounts ConsentLink, or links to #choices', async () => {
    const m = await mount(
      <>
        <Consent />
        <ConsentLink />
      </>,
    )
    await m.act(frames)
    expect(m.host.querySelectorAll('[data-slot="consent-choices"]').length).toBe(0)
    expect([...m.host.querySelectorAll('button')].filter((b) => b.textContent === 'Your Privacy Choices').length, 'one link').toBe(1)
    await m.done()
    const a = document.createElement('a')
    a.href = '#choices'
    document.body.appendChild(a)
    const n = await mount(<Consent />)
    await n.act(frames)
    expect(n.host.querySelector('[data-slot="consent-choices"]'), "a footer's link to #choices is the page's own").toBeNull()
    a.remove()
    await n.act(frames)
    expect(n.host.querySelector('[data-slot="consent-choices"]'), 'and the component draws its own once that is gone').not.toBeNull()
    await n.done()
  })

  it('an opt-out outlives the page', async () => {
    const m = await mount(<Consent />)
    await m.act(frames)
    await m.act(async () => m.button('Your Privacy Choices').click())
    await m.act(async () => m.sheet()!.querySelector<HTMLElement>('[role="switch"][aria-label="Sell, Share, or Use Your Data for Targeted Advertising"]')!.click())
    await m.done()
    const n = await mount(<Consent />)
    await n.act(frames)
    await n.act(async () => n.button('Your Privacy Choices').click())
    expect(n.sheet()!.querySelector('[role="switch"][aria-label="Sell, Share, or Use Your Data for Targeted Advertising"]')!.getAttribute('aria-checked')).toBe('false')
    await n.done()
  })

  it('tells @hanzo/event the sheet is open, so a withdrawal waits for it to close', async () => {
    const m = await mount(<Consent />)
    await m.act(frames)
    await m.act(async () => m.button('Your Privacy Choices').click())
    expect(consentOpen(), 'open').toBe(true)
    await m.act(async () => m.button('Done').click())
    expect(consentOpen(), 'closed').toBe(false)
    await m.done()
  })

  it('closing the sheet gives focus back to the link that opened it', async () => {
    const m = await mount(<Consent />)
    await m.act(frames)
    const link = m.button('Your Privacy Choices')
    link.focus()
    await m.act(async () => link.click())
    expect(m.sheet()).not.toBeNull()
    await m.act(async () => m.key('Escape'))
    expect(m.sheet()).toBeNull()
    expect(document.activeElement, 'the same link, still mounted').toBe(link)
    await m.done()
  })

  it("another site's #choices is not this page's link", async () => {
    const a = document.createElement('a')
    a.href = 'https://example.com/#choices'
    document.body.appendChild(a)
    const m = await mount(<Consent />)
    await m.act(frames)
    expect(m.host.querySelector('[data-slot="consent-choices"]')).not.toBeNull()
    a.remove()
    await m.done()
  })

  it('Global Privacy Control holds every switch off here too', async () => {
    const m = await mount(<Consent />)
    await m.act(async () => void rule('us_privacy', { refused: true }))
    await m.act(async () => openConsent())
    const sheet = m.sheet()!
    const switches = [...sheet.querySelectorAll('[role="switch"]')]
    expect(switches.map((x) => x.hasAttribute('disabled')), 'every switch, under every rule').toEqual([true, true, true])
    expect(switches.map((x) => x.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false'])
    expect(sheet.textContent).toContain('so all of these stay off')
    expect(sheet.textContent, 'and claims nothing runs by default').not.toContain('run on this site by default')
    await m.done()
  })
})

describe('Consent, under global', () => {
  beforeEach(() => void rule('global'))

  it('shows the notice with no choice to make, and its × records it as seen', async () => {
    const m = await mount(<Consent />)
    await m.act(frames)
    const bar = m.host.querySelector<HTMLElement>('[role="region"][aria-label="Cookie notice"]')!
    expect(bar.textContent).toContain('We use cookies to improve your experience. By continuing to browse, you agree.')
    expect([...bar.querySelectorAll('button')].map((b) => b.textContent || b.getAttribute('aria-label'))).toEqual(['Your Privacy Choices', 'Close'])
    expect(m.host.textContent).not.toContain('Accept all')
    await m.act(async () => m.button('Close').click())
    await m.act(frames)
    expect(noticed(), 'the notice is recorded as seen').toBe(true)
    expect(document.cookie, 'and grants or refuses nothing').not.toMatch(/hz_consent=/)
    expect(m.host.querySelector('[aria-label="Cookie notice"]')).toBeNull()
    expect(m.host.querySelector('[data-slot="consent-choices"]'), 'the choices stay one press away').not.toBeNull()
    await m.done()
  })

  it('shows a browser that sends Global Privacy Control no notice, only the way to its choices', async () => {
    sendGPC()
    const m = await mount(<Consent />)
    await m.act(frames)
    expect(m.host.querySelector('[aria-label="Cookie notice"]'), 'it agreed to nothing by browsing').toBeNull()
    expect(m.host.querySelector('[data-slot="consent-choices"]')).not.toBeNull()
    await m.done()
  })

  it('opens the opt-out sheet from the notice', async () => {
    const m = await mount(<Consent />)
    await m.act(frames)
    await m.act(async () => m.button('Your Privacy Choices').click())
    expect(m.sheet()!.textContent).toContain('Google Analytics and the Meta pixel run on this site by default')
    await m.done()
  })
})

describe('Consent, opened by the visitor', () => {
  beforeEach(() => void rule('eu'))

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
    expect(body.textContent).toContain('Google Analytics: lets Google measure visits to Lux')
    // Strictly Necessary names the brand's own first-party analytics; the copy names
    // Google and Meta and no other platform, and claims nothing it does not do.
    expect(sheet.textContent).toContain("Lux's own first-party analytics")
    expect(sheet.textContent).toContain('never sold or shared')
    expect(sheet.textContent).toContain('The Meta pixel')
    expect(sheet.textContent, 'opt-in: off until turned on').toContain('it stays off unless you turn it on')
    for (const w of ['LinkedIn', 'TikTok', 'Pinterest', 'Reddit', 'aggregated']) expect(sheet.textContent).not.toContain(w)
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
  it('a rule that changes under the open sheet redraws its switches and its words', async () => {
    // A first page opened at #choices: the sheet opens before cloud has answered.
    history.replaceState(null, '', '/#choices')
    const m = await mount(<Consent />)
    const on = () => [...m.sheet()!.querySelectorAll('[role="switch"]')].map((x) => x.getAttribute('aria-checked'))
    expect(on(), 'the strict rule meanwhile').toEqual(['false', 'false', 'false'])
    await m.act(async () => void rule('us_privacy'))
    expect(on(), "us_privacy's defaults, not eu's").toEqual(['true', 'true', 'true'])
    expect(m.sheet()!.textContent).toContain('run on this site by default')
    expect([...m.sheet()!.querySelectorAll('button')].map((b) => b.textContent).slice(-1)).toEqual(['Done'])
    await m.done()
  })

  it('a switch moved before an opt-out rule arrives keeps the move and the rule decides the rest', async () => {
    history.replaceState(null, '', '/#choices')
    const m = await mount(<Consent />)
    const marketing = () => m.sheet()!.querySelector<HTMLElement>('[role="switch"][aria-label="Marketing Cookies"]')!
    await m.act(async () => marketing().click())
    await m.act(async () => void rule('global'))
    expect(document.cookie, 'no opt-out the visitor never made').toMatch(/hz_consent=analytics%2Cmarketing%2Cads(;|$)/)
    await m.done()
  })

  it('an opt-out sheet that turns eu arrives with nothing pre-ticked, the opt-out kept', async () => {
    rule('us_privacy')
    serveConsent(null)
    const m = await mount(<Consent />)
    await m.act(frames)
    await m.act(async () => m.button('Your Privacy Choices').click())
    const on = () => [...m.sheet()!.querySelectorAll('[role="switch"]')].map((x) => x.getAttribute('aria-checked'))
    expect(on()).toEqual(['true', 'true', 'true'])
    await m.act(async () => m.sheet()!.querySelector<HTMLElement>('[role="switch"][aria-label="Sell, Share, or Use Your Data for Targeted Advertising"]')!.click())
    await m.act(async () => void rule('eu'))
    expect(on(), 'eu asks: nothing pre-ticked').toEqual(['false', 'false', 'false'])
    expect([...m.sheet()!.querySelectorAll('button')].map((b) => b.textContent).slice(-2)).toEqual(['Accept all', 'Save preferences'])
    await m.done()
  })

  it('a new policy version turns off the switches an old choice filled', async () => {
    rule('eu')
    chosen()
    const m = await mount(<Consent />)
    await m.act(async () => openConsent())
    const on = () => [...m.sheet()!.querySelectorAll('[role="switch"]')].map((x) => x.getAttribute('aria-checked'))
    expect(on(), 'the stored choice, under v2').toEqual(['true', 'false', 'false'])
    await m.act(async () => void rule('eu', { version: 4, floor: 4 }))
    expect(on(), 'a newer policy asks again: nothing is pre-ticked').toEqual(['false', 'false', 'false'])
    await m.done()
  })

  it('a refusal cloud saw (Sec-GPC) locks an open sheet', async () => {
    rule('eu')
    const m = await mount(<Consent />)
    await m.act(async () => m.button('Manage preferences').click())
    expect(m.sheet()!.querySelector('[role="switch"][disabled]')).toBeNull()
    await m.act(async () => void rule('eu', { refused: true }))
    for (const sw of m.sheet()!.querySelectorAll('[role="switch"]')) expect(sw.hasAttribute('disabled')).toBe(true)
    expect(m.sheet()!.textContent).toContain('Your browser asks sites not to track you')
    await m.done()
  })

  it('opening it again keeps what the visitor switched and where focus returns', async () => {
    rule('eu')
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
  beforeEach(() => void rule('eu'))

  it('asks every visitor, whatever the clock says, and the × stores essential cookies only', async () => {
    const zone = Intl.DateTimeFormat.prototype.resolvedOptions
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (this: Intl.DateTimeFormat) {
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
    expect(document.cookie).toMatch(/hz_consent_v=3/)
    expect(m.host.querySelector('[data-slot="consent"]')).toBeNull()
    await m.done()
  })

  it('Manage preferences opens the sheet with everything off, and closing it asks again', async () => {
    const m = await mount(<Consent />)
    await m.act(async () => m.button('Manage preferences').click())
    expect(m.sheet(), 'the sheet opens over the bar').not.toBeNull()
    for (const sw of m.sheet()!.querySelectorAll('[role="switch"]')) expect(sw.getAttribute('aria-checked'), 'nothing optional before a choice').toBe('false')
    await m.act(async () => m.button('Close').click())
    expect(m.sheet()).toBeNull()
    expect(m.bar(), 'no choice was made, so the bar asks again').not.toBeNull()
    expect(document.activeElement, 'focus lands on Manage preferences').toBe(m.button('Manage preferences'))
    expect(document.cookie).not.toMatch(/hz_consent=/)
    await m.done()
  })

  it('does not ask a browser that sends Global Privacy Control, and locks every switch', async () => {
    sendGPC()
    const m = await mount(<Consent brand="Zoo" />)
    expect(m.host.querySelector('[data-slot="consent"]')).toBeNull()
    await m.act(async () => openConsent())
    expect(m.host.textContent).toContain('measure visits to Zoo')
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
  })

  it('asks in the reader’s language, the brand kept', async () => {
    const FR: Record<string, string> = {
      'Cookie preferences': 'Préférences de cookies',
      'Essential cookies keep {brand} running. With your OK, optional cookies help us measure performance and ads.':
        'Les cookies essentiels font fonctionner {brand}. Avec votre accord, des cookies facultatifs nous aident à mesurer les performances et les publicités.',
      'Manage preferences': 'Gérer les préférences',
      'Accept all': 'Tout accepter',
      'Close and use essential cookies only': 'Fermer et n’utiliser que les cookies essentiels',
      'Cookie Preferences': 'Préférences de cookies',
      'Save preferences': 'Enregistrer les préférences',
    }
    const m = await mount(
      <I18nProvider userId="reader" initialLocale="fr" loadCatalog={async () => FR}>
        <Consent brand="Lux" />
      </I18nProvider>,
    )
    await m.act(async () => new Promise((r) => setTimeout(r, 0)))
    const bar = m.bar()!
    expect(bar.getAttribute('aria-label')).toBe('Préférences de cookies')
    expect(bar.textContent).toContain('Les cookies essentiels font fonctionner Lux.')
    expect([...bar.querySelectorAll('button')].map((b) => b.textContent || b.getAttribute('aria-label'))).toEqual([
      'Gérer les préférences',
      'Tout accepter',
      'Fermer et n’utiliser que les cookies essentiels',
    ])
    await m.act(async () => m.button('Gérer les préférences').click())
    // A sentence the catalog lacks stays English; the brand stays itself.
    expect(m.sheet()!.textContent).toContain('Préférences de cookies')
    expect(m.sheet()!.textContent).toContain('measure visits to Lux')
    await m.done()
  })
})
