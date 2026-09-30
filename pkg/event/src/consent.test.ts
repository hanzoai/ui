// Consent: opt-in outside the US, opt-out inside it, GPC always wins.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_COOKIE, acceptAll, asks, read, region, rejectAll, save } from './consent'
import { touch, capture } from './touch'

const g = globalThis as Record<string, unknown>
const original = {
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  Intl: Object.getOwnPropertyDescriptor(globalThis, 'Intl'),
}
const put = (k: string, value: unknown) => Object.defineProperty(globalThis, k, { value, configurable: true, writable: true })

function browser(zone: string, opts: { gpc?: boolean; cookie?: string; href?: string } = {}) {
  const jar = new Map<string, string>()
  if (opts.cookie !== undefined) jar.set(CONSENT_COOKIE, opts.cookie)
  const fired: string[] = []
  const url = new URL(opts.href ?? 'https://hanzo.ai/')
  g.window = {
    location: { hostname: url.hostname, protocol: url.protocol, search: url.search, href: url.href },
    dispatchEvent: (e: { type: string }) => void fired.push(e.type),
  }
  g.Event = class {
    constructor(public type: string) {}
  }
  put('navigator', { globalPrivacyControl: opts.gpc === true })
  put('Intl', { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: zone }) }) })
  g.document = {
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
    },
    set cookie(line: string) {
      const [pair] = line.split(';')
      const i = pair.indexOf('=')
      const name = pair.slice(0, i)
      const value = decodeURIComponent(pair.slice(i + 1))
      if (/Max-Age=0/.test(line)) jar.delete(name)
      else jar.set(name, value)
    },
  }
  return { jar, fired }
}

afterEach(() => {
  for (const k of ['window', 'document', 'Event']) delete g[k]
  for (const [k, d] of Object.entries(original)) if (d) Object.defineProperty(globalThis, k, d)
  vi.restoreAllMocks()
})

describe('region', () => {
  it.each([
    ['Europe/Berlin', 'opt-in'],
    ['Europe/London', 'opt-in'],
    ['Europe/Zurich', 'opt-in'],
    ['Asia/Tokyo', 'opt-in'],
    ['America/New_York', 'opt-out'],
    ['America/Los_Angeles', 'opt-out'],
    ['America/Indiana/Indianapolis', 'opt-out'],
    ['Pacific/Honolulu', 'opt-out'],
    ['', 'opt-in'],
  ])('%s is %s', (zone, want) => {
    browser(zone)
    expect(region()).toBe(want)
  })
})

describe('the default before a choice', () => {
  it('allows nothing in the EU and asks', () => {
    browser('Europe/Paris')
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
    expect(asks()).toBe(true)
  })

  it('allows everything in the US and does not ask', () => {
    browser('America/Chicago')
    expect(read()).toEqual({ analytics: true, marketing: true, ads: true })
    expect(asks()).toBe(false)
  })

  it('Global Privacy Control turns marketing off in the US', () => {
    browser('America/Denver', { gpc: true })
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
  })

  it('GPC wins over a stored yes', () => {
    browser('America/Denver', { gpc: true, cookie: 'analytics,marketing,ads' })
    expect(read()).toEqual({ analytics: true, marketing: false, ads: false })
  })
})

describe('a stored choice', () => {
  it('is what is read, and stops the asking', () => {
    browser('Europe/Paris', { cookie: 'analytics' })
    expect(read()).toEqual({ analytics: true, marketing: false, ads: false })
    expect(asks()).toBe(false)
  })

  it('accepting stores all three and tells the page', () => {
    const b = browser('Europe/Paris')
    acceptAll()
    expect(b.jar.get(CONSENT_COOKIE)).toBe('analytics,marketing,ads')
    expect(b.fired).toEqual(['hzconsent'])
    expect(read()).toEqual({ analytics: true, marketing: true, ads: true })
  })

  it('rejecting stores an empty choice, which is a choice', () => {
    const b = browser('America/New_York')
    rejectAll()
    expect(b.jar.get(CONSENT_COOKIE)).toBe('')
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
  })

  it('saving marketing under GPC stores none', () => {
    const b = browser('Europe/Paris', { gpc: true })
    save({ analytics: true, marketing: true, ads: true })
    expect(b.jar.get(CONSENT_COOKIE)).toBe('analytics')
  })
})

describe('click ids', () => {
  const href = (q: string) => `https://hanzo.ai/?${q}`

  it('keeps every platform click id and builds _fbc from fbclid', () => {
    const b = browser('America/New_York', {
      href: href('gclid=G1&gbraid=GB&wbraid=WB&fbclid=F1&li_fat_id=L1&twclid=T1&ttclid=K1'),
    })
    capture({ analytics: true, marketing: true, ads: true })
    const t = touch({ analytics: true, marketing: true, ads: true })
    expect(t).toMatchObject({ gclid: 'G1', gbraid: 'GB', wbraid: 'WB', fbclid: 'F1', li_fat_id: 'L1', twclid: 'T1', ttclid: 'K1' })
    expect(String(t.fbc)).toMatch(/^fb\.1\.\d+\.F1$/)
    expect(b.jar.get('hz_touch')).toContain('ttclid')
  })

  it('stores no click without marketing consent', () => {
    const b = browser('Europe/Paris', { href: href('gclid=G1') })
    capture({ analytics: true, marketing: false, ads: false })
    expect(b.jar.has('hz_touch')).toBe(false)
    expect(touch({ analytics: true, marketing: false, ads: false })).not.toHaveProperty('gclid')
  })
})
