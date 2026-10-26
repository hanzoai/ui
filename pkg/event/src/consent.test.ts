// Consent: the visitor's region is the rule (eu, us_privacy, global); GPC and DNT refuse.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_COOKIE as BARE, CONSENT_VERSION_COOKIE as BARE_V, acceptAll, asks, notice, noticed, policy, read, rejectAll, save, serve } from './consent'
import { touch, capture } from './touch'

// On a secure page the choice is kept under names only the host may write.
const CONSENT_COOKIE = `__Host-${BARE}`
const CONSENT_VERSION_COOKIE = `__Host-${BARE_V}`

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
  return { jar, fired, window: g.window }
}

afterEach(() => {
  serve(null)
  for (const k of ['window', 'document', 'Event']) delete g[k]
  for (const [k, d] of Object.entries(original)) if (d) Object.defineProperty(globalThis, k, d)
  vi.restoreAllMocks()
})

const rule = (mode: string, o: Record<string, unknown> = {}) => ({ region: '', mode, version: 3, floor: 2, refused: false, defaults: {}, ...o })
const NONE = { analytics: false, marketing: false, ads: false }
const ALL = { analytics: true, marketing: true, ads: true }

describe('the rule before cloud answers', () => {
  it.each(['Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', ''])('is eu in %s: the clock decides nothing', (zone) => {
    browser(zone)
    expect(policy()).toEqual({ mode: 'eu', refused: false, version: 3, region: '' })
    expect(read()).toEqual(NONE)
    expect(asks()).toBe(true)
  })

  it('is the one cloud last served this tab, at once', async () => {
    const b = browser('America/Los_Angeles')
    const tab = new Map<string, string>()
    ;(b.window as Record<string, unknown>).sessionStorage = { getItem: (k: string) => tab.get(k) ?? null, setItem: (k: string, v: string) => void tab.set(k, v) }
    serve(rule('us_privacy', { region: 'US-CA' }))
    serve(null)
    vi.resetModules()
    const next = await import('./consent')
    expect(next.policy()).toEqual({ mode: 'us_privacy', refused: false, version: 3, region: 'US-CA' })
    expect(next.read()).toEqual(ALL)
  })

  it('a tab whose store refuses reads eu', () => {
    const b = browser('America/Chicago')
    ;(b.window as Record<string, unknown>).sessionStorage = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    expect(() => serve(rule('global'))).not.toThrow()
    serve(null)
    expect(policy().mode).toBe('eu')
  })
})

describe('eu', () => {
  it('allows nothing before a choice, and asks', () => {
    browser('Europe/Paris')
    serve(rule('eu', { region: 'FR' }))
    expect(read()).toEqual(NONE)
    expect(asks()).toBe(true)
  })

  it('Global Privacy Control refuses everything, and the visitor is not asked', () => {
    browser('Europe/Paris', { gpc: true })
    serve(rule('eu'))
    expect(read()).toEqual(NONE)
    expect(policy().refused).toBe(true)
    expect(asks()).toBe(false)
  })

  it('Do Not Track refuses everything, and the visitor is not asked', () => {
    browser('Europe/Paris', { dnt: '1' })
    expect(read()).toEqual(NONE)
    expect(asks()).toBe(false)
  })

  it('GPC and DNT win over a stored yes', () => {
    browser('Europe/Paris', { gpc: true, cookie: 'analytics,marketing,ads' })
    expect(read()).toEqual(NONE)
    browser('Europe/Paris', { dnt: '1', cookie: 'analytics,marketing,ads' })
    expect(read()).toEqual(NONE)
  })

  it('an unknown mode is eu', () => {
    browser('America/New_York')
    serve(rule('opt-out'))
    expect(policy().mode).toBe('eu')
    expect(asks()).toBe(true)
  })

  it('a closed notice grants nothing', () => {
    const b = browser('Europe/Paris')
    b.jar.set('__Host-hz_consent_notice', '1')
    serve(rule('eu'))
    expect(read()).toEqual(NONE)
    expect(asks()).toBe(true)
  })
})

describe('us_privacy', () => {
  it('runs everything by default and never asks', () => {
    browser('America/Los_Angeles')
    serve(rule('us_privacy', { region: 'US-CA' }))
    expect(read()).toEqual(ALL)
    expect(asks()).toBe(false)
  })

  it('Ads saved off is the opt-out: Google’s ad cookies go, Meta’s and Google Analytics’ stay', () => {
    const b = browser('America/Los_Angeles')
    for (const k of ['_ga', '_fbp', '_fbc', '_gcl_au', '_gac_UA_1']) b.jar.set(k, 'x')
    serve(rule('us_privacy'))
    save({ ...ALL, ads: false })
    expect(read()).toEqual({ analytics: true, marketing: true, ads: false })
    expect(['_ga', '_fbp', '_fbc'].every((k) => b.jar.has(k))).toBe(true)
    expect(b.jar.has('_gcl_au') || b.jar.has('_gac_UA_1')).toBe(false)
  })

  it.each([{ gpc: true }, { dnt: '1' }])('%o is the opt-out: Ads off, Google Analytics and Meta kept', (o) => {
    browser('America/Los_Angeles', o)
    serve(rule('us_privacy'))
    expect(read()).toEqual({ analytics: true, marketing: true, ads: false })
    expect(policy().refused).toBe(true)
    expect(asks()).toBe(false)
  })

  it('a refusal cloud saw is the opt-out too, over a stored yes', () => {
    const b = browser('America/Denver', { cookie: 'analytics,marketing,ads' })
    serve(rule('us_privacy', { refused: true }))
    expect(read()).toEqual({ analytics: true, marketing: true, ads: false })
    expect(b.jar.get(CONSENT_COOKIE)).toBe('analytics,marketing')
  })
})

describe('global', () => {
  it('runs everything by default; the notice is open until closed, and closing it grants nothing new', () => {
    const b = browser('Asia/Tokyo')
    serve(rule('global', { region: 'JP' }))
    expect(read()).toEqual(ALL)
    expect(asks()).toBe(false)
    expect(noticed()).toBe(false)
    notice()
    expect(noticed()).toBe(true)
    expect(b.jar.get('__Host-hz_consent_notice')).toBe('1')
    expect(b.jar.has(CONSENT_COOKIE)).toBe(false)
    expect(b.fired).toContain('hzconsent')
  })

  it('any category saved off is an opt-out', () => {
    browser('Asia/Tokyo')
    serve(rule('global'))
    save({ analytics: false, marketing: true, ads: true })
    expect(read()).toEqual({ analytics: false, marketing: true, ads: true })
    rejectAll()
    expect(read()).toEqual(NONE)
  })

  it('GPC is the opt-out: Ads off', () => {
    browser('Asia/Tokyo', { gpc: true })
    serve(rule('global'))
    expect(read()).toEqual({ analytics: true, marketing: true, ads: false })
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
    expect(read()).toEqual(ALL)
  })

  it('rejecting stores an empty choice, which is a choice', () => {
    const b = browser('America/New_York')
    rejectAll()
    expect(b.jar.get(CONSENT_COOKIE)).toBe('')
    expect(read()).toEqual(NONE)
    expect(asks()).toBe(false)
  })

  it('saving under GPC stores what the refusal leaves', () => {
    const b = browser('Europe/Paris', { gpc: true })
    save(ALL)
    expect(b.jar.get(CONSENT_COOKIE)).toBe('')
    serve(rule('global'))
    save(ALL)
    expect(b.jar.get(CONSENT_COOKIE)).toBe('analytics,marketing')
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
  it('is the rule, exactly as the contract names it', () => {
    browser('America/New_York')
    serve(rule('us_privacy', { region: 'US-NY' }))
    expect(policy()).toEqual({ mode: 'us_privacy', refused: false, version: 3, region: 'US-NY' })
  })

  it('tells the page when it arrives, so a banner drawn early redraws', () => {
    const b = browser('Europe/Berlin')
    serve(rule('eu'))
    expect(b.fired).toContain('hzpolicy')
  })

  it('a choice made under the version before still counts: the bump kept the floor', () => {
    const b = browser('Europe/Berlin', { cookie: 'analytics' })
    expect(b.jar.get(CONSENT_VERSION_COOKIE)).toBe('2')
    serve(rule('eu'))
    expect(asks()).toBe(false)
    expect(read().analytics).toBe(true)
  })

  it('a choice under a version past the floor is asked again', () => {
    const b = browser('Europe/Berlin', { cookie: 'analytics' })
    b.jar.set(CONSENT_VERSION_COOKIE, '1')
    expect(asks()).toBe(true)
    b.jar.set(CONSENT_VERSION_COOKIE, '3')
    serve(rule('eu', { version: 4, floor: 4 }))
    expect(asks()).toBe(true)
    expect(read().analytics).toBe(false)
  })

  it('a policy older than the one this client was built under never revives a choice', () => {
    const b = browser('Europe/Berlin', { cookie: 'analytics' })
    b.jar.set(CONSENT_VERSION_COOKIE, '1')
    serve(rule('eu', { version: 1, floor: 1 }))
    b.jar.set(CONSENT_VERSION_COOKIE, '4')
    expect(asks()).toBe(true)
  })

  it('a choice is stored with the version in force', () => {
    const b = browser('Europe/Berlin')
    acceptAll()
    expect(b.jar.get(CONSENT_VERSION_COOKIE)).toBe('3')
    serve(rule('eu', { version: 4 }))
    acceptAll()
    expect(b.jar.get(CONSENT_VERSION_COOKIE)).toBe('4')
    expect(asks()).toBe(false)
  })

  it('every copy of this module reads the one the page was served', async () => {
    browser('Europe/Berlin', { cookie: 'analytics' })
    serve(rule('global', { version: 4, floor: 4 }))
    vi.resetModules()
    const copy = await import('./consent')
    expect(copy.policy().version).toBe(4)
    expect(copy.policy().mode).toBe('global')
    expect(copy.read()).toEqual(ALL)
  })

  it('ignores an answer that is not a policy', () => {
    browser('Europe/Berlin')
    serve({ tags: [] })
    expect(policy()).toEqual({ mode: 'eu', refused: false, version: 3, region: '' })
  })

  it('a refusal cloud saw counts in eu when the page cannot see it', () => {
    browser('Europe/Paris', { cookie: 'analytics,marketing,ads' })
    serve(rule('eu', { region: 'DE', refused: true }))
    expect(read()).toEqual(NONE)
    expect(asks()).toBe(false)
  })
})

describe('where the choice is kept', () => {
  const written = (href: string, act: () => void): string[] => {
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
    act()
    return lines
  }

  it.each(['https://hanzo.ai/', 'https://chat.hanzo.ai/', 'https://tenant-a.hanzo.app/', 'https://shop.co.uk/'])(
    'on %s only the host may write it: __Host-, no Domain, Secure',
    (href) => {
      const line = written(href, acceptAll).find((l) => l.startsWith(`${CONSENT_COOKIE}=`))!
      expect(line).toBeDefined()
      expect(line).not.toContain('Domain=')
      expect(line).toContain('Secure')
    },
  )

  it('on a plain-http page it is the bare name on the host', () => {
    const line = written('http://localhost:3000/', acceptAll).find((l) => l.startsWith(`${BARE}=`))!
    expect(line).toBeDefined()
    expect(line).not.toContain('Domain=')
  })

  it.each([
    ['https://hanzo.ai/?gclid=G1', 'Domain=.hanzo.ai'],
    ['https://chat.hanzo.ai/?gclid=G1', 'Domain=.hanzo.ai'],
    ['https://lux.id/?gclid=G1', 'Domain=.lux.id'],
    ['https://tenant-a.hanzo.app/?gclid=G1', ''],
    ['https://shop.co.uk/?gclid=G1', ''],
    ['https://me.github.io/?gclid=G1', ''],
  ])('the ad click on %s is kept %s', (href, want) => {
    const line = written(href, () => capture({ analytics: true, marketing: true, ads: true })).find((l) => l.startsWith('hz_touch='))!
    if (want) expect(line).toContain(want)
    else expect(line).not.toContain('Domain=')
  })

  it('a sibling cannot answer for this host: a bare hz_consent tossed from another subdomain counts for nothing', () => {
    const b = browser('Europe/Paris', { href: 'https://shop.hanzo.app/' })
    b.jar.set(BARE, 'analytics,marketing,ads')
    b.jar.set(BARE_V, '2')
    expect(read()).toEqual({ analytics: false, marketing: false, ads: false })
    expect(asks()).toBe(true)
  })
})

describe('withdrawing', () => {
  it("forgets what each withdrawn category's third party kept, and nothing of the first-party stream", () => {
    const b = browser('Europe/Paris', { cookie: 'analytics,marketing,ads' })
    for (const k of ['iam-anon-id', 'hz_cid', '_ga', '_ga_ABC', 'hz_touch', '_fbp', '_fbc', '_gcl_au', 'hz_internal']) b.jar.set(k, 'x')
    const store = new Map([['hz_session', '{}'], ['hz_first_touch', '{}'], ['iam-anon-id', 'x'], ['other', 'y']])
    ;(g.window as Record<string, unknown>).localStorage = { removeItem: (k: string) => store.delete(k) }
    save({ analytics: true, marketing: false, ads: false })
    expect([...b.jar.keys()].sort()).toEqual(['_ga', '_ga_ABC', 'hz_cid', 'hz_internal', CONSENT_COOKIE, CONSENT_VERSION_COOKIE, 'iam-anon-id'].sort())
    rejectAll()
    expect([...b.jar.keys()].sort()).toEqual(['hz_internal', CONSENT_COOKIE, CONSENT_VERSION_COOKIE, 'iam-anon-id'].sort())
    expect([...store.keys()].sort()).toEqual(['hz_first_touch', 'hz_session', 'iam-anon-id', 'other'].sort())
  })

  it("forgets every pixel's first-party cookie, on the host and every domain above it, and nothing spelled alike", () => {
    const b = browser('Europe/London', { cookie: 'analytics,marketing,ads', href: 'https://www.example.co.uk/' })
    const lines: string[] = []
    const d = g.document as { cookie: string }
    const own = Object.getOwnPropertyDescriptor(d, 'cookie')!
    Object.defineProperty(d, 'cookie', { get: own.get, set: (l: string) => (lines.push(l), own.set!.call(d, l)) })
    const measured = [
      '_ga', '_ga_ABC123', '_gid', '_gat', '_gat_UA_1', '_fbp', '_fbc', '_gcl_au', '_gac_UA_1', '_uetsid', '_uetvid', '_ttp', 'ttcsid', 'ttcsid_C4ABC',
      '_tt_enable_cookie', '_twclid', 'li_fat_id', '_pin_unauth', '_epik', '_derived_epik', '_rdt_uuid', '_rdt_cid',
    ]
    const alike = ['_gateway_session', '_gatekeeper', '_uetoken', 'ttcsid_app', '_gaming']
    for (const k of [...measured, ...alike]) b.jar.set(k, 'x')
    rejectAll()
    expect([...b.jar.keys()].sort()).toEqual([...alike, CONSENT_COOKIE, CONSENT_VERSION_COOKIE].sort())
    for (const scope of ['', '; Domain=.www.example.co.uk', '; Domain=.example.co.uk', '; Domain=.co.uk']) {
      expect(lines).toContain(`_ga=; Max-Age=0; Path=/${scope}`)
    }
  })

  it('never forgets what the site needs to work: sign-in, the choice itself, security and what a form holds', () => {
    const b = browser('Europe/Paris', { cookie: 'analytics,marketing,ads' })
    // IAM's session and federation binding, the signed-in-before hint, CSRF tokens, a cart.
    // The first-party stream's own id is essential too.
    const essential = ['__Host-hanzo_session', '__Host-hanzo_fed', 'hz_known', '__Host-csrf', 'csrf_token', 'hz_cart', 'iam-anon-id']
    const measured = ['_ga', '_ga_ABC', '_gid', '_gat_UA1', '_fbp', '_fbc', '_gcl_au', '_gcl_aw', '_uetsid', 'hz_touch']
    for (const k of [...essential, ...measured]) b.jar.set(k, 'x')
    const kept = ['hanzo_iam_access_token', 'hz_prompt', 'hz_cart', 'hz_session', 'hz_first_touch']
    const store = new Map(kept.map((k) => [k, 'x']))
    ;(g.window as Record<string, unknown>).localStorage = { removeItem: (k: string) => store.delete(k) }
    rejectAll()
    expect([...b.jar.keys()].sort()).toEqual([...essential, CONSENT_COOKIE, CONSENT_VERSION_COOKIE].sort())
    expect([...store.keys()].sort()).toEqual([...kept].sort())
  })
})
