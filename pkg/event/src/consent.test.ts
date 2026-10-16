// Consent: every visitor opts in, wherever they are; GPC and DNT refuse everything.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_COOKIE, CONSENT_VERSION_COOKIE, acceptAll, asks, policy, read, region, rejectAll, save, serve } from './consent'
import { touch, capture } from './touch'

const g = globalThis as Record<string, unknown>
const original = {
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  Intl: Object.getOwnPropertyDescriptor(globalThis, 'Intl'),
}
const put = (k: string, value: unknown) => Object.defineProperty(globalThis, k, { value, configurable: true, writable: true })

function browser(zone: string, opts: { gpc?: boolean; dnt?: string; cookie?: string; href?: string } = {}) {
  const jar = new Map<string, string>()
  if (opts.cookie !== undefined) {
    jar.set(CONSENT_COOKIE, opts.cookie)
    jar.set(CONSENT_VERSION_COOKIE, '2')
  }
  const fired: string[] = []
  const url = new URL(opts.href ?? 'https://hanzo.ai/')
  g.window = {
    location: { hostname: url.hostname, protocol: url.protocol, search: url.search, href: url.href },
    dispatchEvent: (e: { type: string }) => void fired.push(e.type),
  }
  g.Event = class {
    constructor(public type: string) {}
  }
  put('navigator', { globalPrivacyControl: opts.gpc === true, doNotTrack: opts.dnt })
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
  serve(null)
  for (const k of ['window', 'document', 'Event']) delete g[k]
  for (const [k, d] of Object.entries(original)) if (d) Object.defineProperty(globalThis, k, d)
  vi.restoreAllMocks()
})

describe('region', () => {
  it.each(['Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Tokyo', ''])(
    '%s is opt-in: the clock decides nothing',
    (zone) => {
      browser(zone)
      expect(region()).toBe('opt-in')
    },
  )
})

describe('the default before a choice', () => {
  it.each(['Europe/Paris', 'America/Chicago', 'America/Los_Angeles', 'Asia/Tokyo'])('allows nothing in %s and asks', (zone) => {
    browser(zone)
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
    expect(asks()).toBe(true)
  })

  it('Global Privacy Control refuses everything, and the visitor is not asked', () => {
    browser('America/Denver', { gpc: true })
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
    expect(asks()).toBe(false)
  })

  it('Do Not Track refuses everything, and the visitor is not asked', () => {
    browser('Europe/Paris', { dnt: '1' })
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
    expect(asks()).toBe(false)
  })

  it('GPC wins over a stored yes', () => {
    browser('America/Denver', { gpc: true, cookie: 'analytics,marketing,ads' })
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
  })

  it('DNT wins over a stored yes', () => {
    browser('America/Denver', { dnt: '1', cookie: 'analytics,marketing,ads' })
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
  })
})

describe('a stored choice', () => {
  it('is what is read, and stops the asking', () => {
    browser('Europe/Paris', { cookie: 'analytics' })
    expect(read()).toEqual({ analytics: true, marketing: false, ads: false })
    expect(asks()).toBe(false)
  })

  it('accepting stores all three and tells the page', () => {
    const b = browser('America/New_York')
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
    expect(asks()).toBe(false)
  })

  it('saving under GPC stores a refusal', () => {
    const b = browser('Europe/Paris', { gpc: true })
    save({ analytics: true, marketing: true, ads: true })
    expect(b.jar.get(CONSENT_COOKIE)).toBe('')
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

describe('the policy cloud serves', () => {
  const rule = (version = 1, mode = 'opt-in') => ({
    region: 'US',
    mode,
    version,
    refused: false,
    defaults: { analytics: true, marketing: true, ads: true },
  })

  it('presumes nothing, whatever mode or defaults an answer names', () => {
    browser('America/New_York')
    serve(rule(1, 'opt-out'))
    expect(region()).toBe('opt-in')
    expect(asks()).toBe(true)
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
    expect(policy()?.defaults).toEqual({ analytics: false, marketing: false, ads: false })
  })

  it('tells the page when it arrives, so a banner drawn early redraws', () => {
    const b = browser('Europe/Berlin')
    serve(rule())
    expect(b.fired).toContain('hzpolicy')
  })

  it('a choice made under an older policy is asked again', () => {
    const b = browser('Europe/Berlin', { cookie: 'analytics' })
    b.jar.set(CONSENT_VERSION_COOKIE, '1')
    serve(rule(1))
    expect(asks()).toBe(false)
    serve(rule(2))
    expect(asks()).toBe(true)
    expect(read().analytics).toBe(false)
  })

  it('a choice is stored with the version it was made under', () => {
    const b = browser('Europe/Berlin')
    serve(rule(3))
    acceptAll()
    expect(b.jar.get(CONSENT_VERSION_COOKIE)).toBe('3')
    expect(asks()).toBe(false)
  })

  it('every copy of this module reads the one the page was served', async () => {
    browser('Europe/Berlin', { cookie: 'analytics' })
    serve(rule(4))
    vi.resetModules()
    const copy = await import('./consent')
    expect(copy.policy()?.version).toBe(4)
    expect(copy.asks()).toBe(true)
  })

  it('ignores an answer that is not a policy', () => {
    browser('Europe/Berlin')
    serve({ tags: [] })
    expect(policy()).toBeUndefined()
  })
})

describe('where the choice is kept', () => {
  it.each([
    ['https://hanzo.ai/', 'Domain=.hanzo.ai'],
    ['https://chat.hanzo.ai/', 'Domain=.hanzo.ai'],
    ['https://lux.id/', 'Domain=.lux.id'],
    ['https://tenant-a.hanzo.app/', ''],
    ['https://shop.co.uk/', ''],
    ['https://me.github.io/', ''],
  ])('%s keeps it %s', (href, want) => {
    const lines: string[] = []
    browser('Europe/Paris', { href })
    const doc = g.document as { cookie: string }
    const desc = Object.getOwnPropertyDescriptor(doc, 'cookie')!
    Object.defineProperty(doc, 'cookie', {
      get: desc.get,
      set(line: string) {
        lines.push(line)
        desc.set!.call(doc, line)
      },
      configurable: true,
    })
    acceptAll()
    const line = lines.find((l) => l.startsWith(`${CONSENT_COOKIE}=`))!
    if (want) expect(line).toContain(want)
    else expect(line).not.toContain('Domain=')
  })
})

describe('the policy version before cloud answers', () => {
  it('a choice made under an older version counts for nothing in the meantime', () => {
    const b = browser('Europe/Paris', { cookie: 'analytics,marketing,ads' })
    b.jar.set(CONSENT_VERSION_COOKIE, '1')
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
    expect(asks()).toBe(true)
  })

  it('a choice made before cloud answers is kept under the version in force', () => {
    const b = browser('Europe/Paris')
    acceptAll()
    expect(b.jar.get(CONSENT_VERSION_COOKIE)).toBe('2')
    serve({ region: 'DE', mode: 'opt-in', version: 2, refused: false, defaults: {} })
    expect(asks()).toBe(false)
  })
})

describe('a refusal cloud saw', () => {
  it('counts when the page cannot see it', () => {
    browser('Europe/Paris', { cookie: 'analytics,marketing,ads' })
    serve({ region: 'DE', mode: 'opt-in', version: 2, refused: true, defaults: {} })
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
    expect(asks()).toBe(false)
  })
})

describe('withdrawing', () => {
  it('forgets what each withdrawn category kept', () => {
    const b = browser('Europe/Paris', { cookie: 'analytics,marketing,ads' })
    for (const k of ['iam-anon-id', 'hz_cid', '_ga', '_ga_ABC', 'hz_touch', '_fbp', '_fbc', '_gcl_au']) b.jar.set(k, 'x')
    const store = new Map([['hz_session', '{}'], ['hz_first_touch', '{}'], ['iam-anon-id', 'x'], ['other', 'y']])
    ;(g.window as Record<string, unknown>).localStorage = { removeItem: (k: string) => store.delete(k) }
    save({ analytics: true, marketing: false, ads: false })
    expect([...b.jar.keys()].sort()).toEqual(['_ga', '_ga_ABC', 'hz_cid', 'hz_consent', 'hz_consent_v', 'iam-anon-id'].sort())
    rejectAll()
    expect([...b.jar.keys()].sort()).toEqual(['hz_consent', 'hz_consent_v'])
    expect([...store.keys()]).toEqual(['other'])
  })
})
