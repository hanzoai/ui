// The tag manager: the region's rule decides what loads before a choice and what a
// choice changes, and an event reaches each platform under one id and the names the
// platform table gives.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const g = globalThis as Record<string, unknown>
const original = {
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  Intl: Object.getOwnPropertyDescriptor(globalThis, 'Intl'),
}
const put = (k: string, value: unknown) => Object.defineProperty(globalThis, k, { value, configurable: true, writable: true })

const TAGS = {
  tags: [
    { platform: 'ga4', type: 'ga', id: 'G-TEST' },
    { platform: 'google-ads', type: 'gads', id: 'AW-1', events: { order_completed: 'AW-1/abc' } },
    { platform: 'meta', type: 'meta', id: '111' },
    { platform: 'linkedin', type: 'linkedin', id: '555', events: { order_completed: '9876' } },
    { platform: 'x', type: 'x', id: 'o1abc', events: { order_completed: 'tw-o1abc-buy' } },
    { platform: 'tiktok', type: 'tiktok', id: 'TT1' },
  ],
}

function browser(zone: string, jar = new Map<string, string>()) {
  const scripts: string[] = []
  const listeners = new Map<string, Array<() => void>>()
  const requests: string[] = []
  put('navigator', { globalPrivacyControl: false, userAgent: 'UA' })
  put('Intl', { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: zone }) }) })
  g.Event = class {
    constructor(public type: string) {}
  }
  g.window = {
    location: { hostname: 'hanzo.ai', protocol: 'https:', search: '', href: 'https://hanzo.ai/' },
    dispatchEvent: (e: { type: string }) => listeners.get(e.type)?.forEach((f) => f()),
    addEventListener: (t: string, f: () => void) => listeners.set(t, [...(listeners.get(t) ?? []), f]),
    removeEventListener: () => undefined,
  }
  g.addEventListener = (g.window as { addEventListener: unknown }).addEventListener
  g.removeEventListener = () => undefined
  g.document = {
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
    },
    set cookie(line: string) {
      const [pair] = line.split(';')
      const i = pair.indexOf('=')
      jar.set(pair.slice(0, i), decodeURIComponent(pair.slice(i + 1)))
    },
    createElement: () => ({}) as Record<string, unknown>,
    head: { appendChild: (s: { src: string; onload?: () => void }) => (scripts.push(s.src), setTimeout(() => s.onload?.(), 0)) },
  }
  put('fetch', async (url: string) => {
    requests.push(url)
    return { ok: true, json: async () => TAGS }
  })
  let n = 0
  put('crypto', { randomUUID: () => `id-${++n}` })
  return { jar, scripts, requests }
}

beforeEach(() => vi.resetModules())
afterEach(() => {
  for (const k of ['window', 'document', 'Event', 'addEventListener', 'removeEventListener', 'fetch', 'crypto']) delete g[k]
  for (const [k, d] of Object.entries(original)) if (d) Object.defineProperty(globalThis, k, d)
})

const tick = () => new Promise((r) => setTimeout(r, 10))

/** The cookie jar of a visitor who accepted everything. */
const accepted = () => new Map([['__Host-hz_consent', 'analytics,marketing,ads'], ['__Host-hz_consent_v', '2']])

/** Cloud answers the tag set under one region's rule. */
const under = (b: ReturnType<typeof browser>, mode: string, o: Record<string, unknown> = {}) =>
  put('fetch', async (url: string) => {
    b.requests.push(url)
    return { ok: true, json: async () => ({ ...TAGS, consent: { region: '', mode, version: 3, floor: 2, refused: false, defaults: {}, ...o } }) }
  })
const layer = () => ((g.window as { dataLayer?: IArguments[] }).dataLayer ?? []).map((a) => Array.from(a))
const fbq = () => ((g.window as { fbq?: { queue: IArguments[] } }).fbq?.queue ?? []).map((a) => Array.from(a))
const hosts = (b: ReturnType<typeof browser>) => b.scripts.map((s) => new URL(s).hostname).sort()
const consents = () => layer().filter((a) => a[0] === 'consent')
const views = () => fbq().filter((a) => a[0] === 'track' && a[1] === 'PageView').length
const EVERY = ['analytics.tiktok.com', 'connect.facebook.net', 'snap.licdn.com', 'static.ads-twitter.com', 'www.googletagmanager.com'].sort()
const OPT_OUT = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

describe('a browser that refuses', () => {
  it.each([
    ['eu', { gpc: true }],
    ['eu', { dnt: '1' }],
    ['us_privacy', { gpc: true }],
    ['us_privacy', { dnt: '1' }],
    ['global', { gpc: true }],
  ])('%s %o loads no platform, Google Analytics included, even over a stored yes', async (mode, o: { gpc?: boolean; dnt?: string }) => {
    const b = browser('America/New_York', accepted())
    put('navigator', { globalPrivacyControl: o.gpc === true, doNotTrack: o.dnt, userAgent: 'UA' })
    under(b, mode)
    const { startTags, track } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    track(undefined, 'order_completed', { order_id: 'o-1', value: 5 })
    expect(b.scripts).toEqual([])
    expect(layer()).toEqual([])
    expect(fbq()).toEqual([])
  })

  it('a refusal cloud saw loads nothing either', async () => {
    const b = browser('America/Los_Angeles')
    under(b, 'us_privacy', { refused: true })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.scripts).toEqual([])
  })
})

describe('eu', () => {
  it.each([['no choice', {}]])('%s: Google Analytics loads cookieless, Meta is held revoked, nothing else is fetched', async () => {
    const b = browser('America/New_York')
    under(b, 'eu')
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(hosts(b)).toEqual(['www.googletagmanager.com'])
    expect(consents()[0]).toEqual(['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 }])
    expect(consents().every((a) => Object.values(a[2] as object).every((v) => v !== 'granted'))).toBe(true)
    const q = fbq()
    expect(q.findIndex((a) => a[0] === 'consent' && a[1] === 'revoke')).toBe(0)
    expect(q.findIndex((a) => a[0] === 'init')).toBeGreaterThan(0)
    expect(views()).toBe(0)
  })

  it('a visitor cloud does not answer for is eu', async () => {
    const b = browser('America/Los_Angeles')
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(hosts(b)).toEqual(['www.googletagmanager.com'])
    expect(fbq()[0]).toEqual(['consent', 'revoke'])
  })

  it('accepting upgrades Google, grants Meta, fetches fbevents and sends one PageView, with no reload', async () => {
    const b = browser('Europe/Berlin')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    under(b, 'eu', { region: 'DE' })
    const { startTags, acceptAll } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    acceptAll()
    await tick()
    expect(consents().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' }])
    const q = fbq()
    expect(q.findIndex((a) => a[0] === 'consent' && a[1] === 'grant')).toBeGreaterThan(q.findIndex((a) => a[0] === 'init'))
    expect(views()).toBe(1)
    expect(hosts(b)).toEqual(EVERY)
    expect(reload).not.toHaveBeenCalled()
  })

  it('a moment before the answer waits for it; after a refusal it reaches Google Analytics, cookieless, and never Meta', async () => {
    const b = browser('Europe/Berlin')
    under(b, 'eu')
    const { startTags, track, rejectAll } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    track(undefined, 'order_completed', { order_id: 'o-1', value: 5 })
    expect(layer().filter((a) => a[0] === 'event')).toEqual([])
    rejectAll()
    await tick()
    expect(layer().filter((a) => a[0] === 'event').map((a) => (a[2] as { send_to: string }).send_to)).toEqual(['G-TEST'])
    expect(fbq().filter((a) => a[0] === 'track' || a[0] === 'trackCustom')).toEqual([])
  })

  it('a caller naming Meta itself reaches it only under Marketing', async () => {
    const b = browser('Europe/Berlin')
    under(b, 'eu')
    const { startTags, mirror } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    mirror('order_completed', { value: 5 }, 'e-1', 'ga,meta')
    expect(fbq().filter((a) => a[0] === 'track' || a[0] === 'trackCustom')).toEqual([])
  })
})

describe('us_privacy', () => {
  it('everything loads at once under Consent Mode granted, Meta live, no banner', async () => {
    const b = browser('America/Los_Angeles')
    under(b, 'us_privacy', { region: 'US-CA' })
    const { startTags, asks } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(hosts(b)).toEqual(EVERY)
    expect(consents()[0]).toEqual(['consent', 'default', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' }])
    expect(fbq().some((a) => a[0] === 'consent' || a[0] === 'dataProcessingOptions')).toBe(false)
    expect(views()).toBe(1)
    expect(asks()).toBe(false)
  })

  it('the opt-out is exactly LDU and the three ad flags denied, with no reload; opting back in lifts both', async () => {
    const b = browser('America/Los_Angeles')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    under(b, 'us_privacy')
    const { startTags, saveConsent, acceptAll } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    saveConsent({ analytics: true, marketing: true, ads: false })
    await tick()
    expect(fbq().at(-1)).toEqual(['dataProcessingOptions', ['LDU'], 0, 0])
    expect(consents().at(-1)).toEqual(['consent', 'update', OPT_OUT])
    expect(fbq().some((a) => a[0] === 'consent')).toBe(false)
    expect(reload).not.toHaveBeenCalled()
    acceptAll()
    await tick()
    expect(fbq().at(-1)).toEqual(['dataProcessingOptions', []])
    expect(consents().at(-1)?.[2]).toEqual({ ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' })
  })

  it('a stored opt-out is the opt-out from the first call', async () => {
    const b = browser('America/Denver', new Map([['__Host-hz_consent', 'analytics,marketing'], ['__Host-hz_consent_v', '3'], ['__Host-hz_consent_rule', 'us_privacy']]))
    under(b, 'us_privacy', { region: 'US-CO' })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(hosts(b)).toEqual(EVERY)
    expect(fbq().findIndex((a) => a[0] === 'dataProcessingOptions')).toBeLessThan(fbq().findIndex((a) => a[0] === 'init'))
    expect(fbq().find((a) => a[0] === 'dataProcessingOptions')).toEqual(['dataProcessingOptions', ['LDU'], 0, 0])
    expect(consents()[1]).toEqual(['consent', 'update', OPT_OUT])
    expect(views()).toBe(1)
  })
})

describe('global', () => {
  it('everything loads at once, as in us_privacy', async () => {
    const b = browser('Asia/Tokyo')
    under(b, 'global', { region: 'JP' })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(hosts(b)).toEqual(EVERY)
    expect(views()).toBe(1)
  })

  it('Analytics saved off stops Google Analytics and reloads; Marketing saved off revokes Meta', async () => {
    const b = browser('Asia/Tokyo')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    under(b, 'global')
    const { startTags, saveConsent } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    saveConsent({ analytics: false, marketing: false, ads: true })
    await tick()
    expect((g.window as Record<string, unknown>)['ga-disable-G-TEST']).toBe(true)
    expect(fbq()).toContainEqual(['consent', 'revoke'])
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('a withdrawal made while the sheet is open reloads once, when it closes', async () => {
    const b = browser('Asia/Tokyo')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    under(b, 'global')
    const { startTags, saveConsent, consentSheet } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    consentSheet(true)
    saveConsent({ analytics: false, marketing: true, ads: true })
    await tick()
    saveConsent({ analytics: false, marketing: false, ads: true })
    await tick()
    expect(reload).not.toHaveBeenCalled()
    expect((g.window as Record<string, unknown>)['ga-disable-G-TEST']).toBe(true)
    consentSheet(false)
    await tick()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('a switch turned off and on again before the sheet closes reloads nothing', async () => {
    const b = browser('Asia/Tokyo')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    under(b, 'global')
    const { startTags, saveConsent, consentSheet } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    consentSheet(true)
    saveConsent({ analytics: true, marketing: false, ads: true })
    await tick()
    saveConsent({ analytics: true, marketing: true, ads: true })
    await tick()
    consentSheet(false)
    await tick()
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('before consent', () => {
  it('a visitor who accepted loads every tag', async () => {
    const b = browser('America/New_York', accepted())
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(hosts(b)).toEqual(EVERY)
  })
})

describe('a driven browser', () => {
  it('loads no platform even for a visitor who accepted', async () => {
    const b = browser('America/New_York', accepted())
    put('navigator', { globalPrivacyControl: false, userAgent: 'UA', webdriver: true })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.requests.some((u) => u.includes('/v1/project/tags'))).toBe(true)
    expect(b.scripts).toEqual([])
  })
})

describe('a teammate’s browser', () => {
  it('?hz_internal=1 keeps the mark, loads Google tagged internal, and no ad pixel', async () => {
    const b = browser('America/New_York', accepted())
    ;(g.window as { location: { search: string } }).location.search = '?hz_internal=1'
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.jar.get('hz_internal')).toBe('1')
    expect(b.scripts.every((s) => s.includes('googletagmanager.com'))).toBe(true)
    expect(b.scripts.length).toBeGreaterThan(0)
    const layer = (g.window as { dataLayer: IArguments[] }).dataLayer.map((a) => Array.from(a))
    const config = layer.filter((a) => a[0] === 'config')
    expect(config.length).toBeGreaterThan(0)
    for (const c of config) expect(c[2]).toMatchObject({ traffic_type: 'internal' })
  })
})

describe('the audience cloud names', () => {
  const answering = (b: { requests: string[] }, body: Record<string, unknown>, seen: Array<RequestInit | undefined> = []) =>
    put('fetch', async (url: string, init?: RequestInit) => {
      b.requests.push(url)
      seen.push(init)
      return { ok: true, json: async () => ({ ...TAGS, ...body }) }
    })

  it('a bot loads nothing, even for a visitor who accepted', async () => {
    const b = browser('America/New_York', accepted())
    answering(b, { audience: 'bot' })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.scripts).toEqual([])
  })

  it('the team loads Google alone, tagged internal, and the browser stays marked', async () => {
    const b = browser('America/New_York', accepted())
    answering(b, { audience: 'internal' })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.scripts.length).toBeGreaterThan(0)
    expect(b.scripts.every((s) => s.includes('googletagmanager.com'))).toBe(true)
    const config = (g.window as { dataLayer: IArguments[] }).dataLayer.map((a) => Array.from(a)).filter((a) => a[0] === 'config')
    expect(config.length).toBeGreaterThan(0)
    for (const c of config) expect(c[2]).toMatchObject({ traffic_type: 'internal' })
    expect(b.jar.get('hz_internal')).toBe('1')
  })

  it('a person loads every tag, untagged, and is not marked', async () => {
    const b = browser('America/New_York', accepted())
    answering(b, { audience: 'person' })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.scripts.map((s) => new URL(s).hostname)).toContain('connect.facebook.net')
    const config = (g.window as { dataLayer: IArguments[] }).dataLayer.map((a) => Array.from(a)).filter((a) => a[0] === 'config')
    for (const c of config) expect(c[2]).not.toHaveProperty('traffic_type')
    expect(b.jar.has('hz_internal')).toBe(false)
  })

  it('sends the site’s IAM token as the bearer, and nothing without one', async () => {
    const b = browser('America/New_York', accepted())
    const seen: Array<RequestInit | undefined> = []
    answering(b, {}, seen)
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x', token: () => 'jwt-abc' })
    await tick()
    expect(seen[0]).toEqual({ headers: { Authorization: 'Bearer jwt-abc' } })

    vi.resetModules()
    const c = browser('America/New_York', accepted())
    const none: Array<RequestInit | undefined> = []
    answering(c, {}, none)
    const again = await import('./index')
    again.startTags({ key: 'pk-x', token: () => undefined })
    await tick()
    expect(none).toEqual([undefined])
  })

  it('a refused bearer asks again as a stranger', async () => {
    const b = browser('America/New_York', accepted())
    const seen: Array<RequestInit | undefined> = []
    put('fetch', async (url: string, init?: RequestInit) => {
      seen.push(init)
      if (init) throw new TypeError('Failed to fetch')
      b.requests.push(url)
      return { ok: true, json: async () => TAGS }
    })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x', token: () => 'jwt-abc' })
    await tick()
    expect(seen).toEqual([{ headers: { Authorization: 'Bearer jwt-abc' } }, undefined])
    expect(b.scripts.map((s) => new URL(s).hostname)).toContain('www.googletagmanager.com')
  })
})

describe('after accepting', () => {
  it('loads Google, Meta, LinkedIn, X and TikTok with no reload', async () => {
    const b = browser('Europe/Berlin')
    const { startTags, acceptAll } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    acceptAll()
    await tick()
    expect(b.scripts).toHaveLength(5)
  })

  it('sets Consent Mode v2 denied before any Google script, then updates it', async () => {
    const b = browser('Europe/Berlin')
    const { startTags, acceptAll } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    acceptAll()
    await tick()
    const layer = (g.window as { dataLayer: IArguments[] }).dataLayer.map((a) => Array.from(a))
    const dflt = layer.findIndex((a) => a[0] === 'consent' && a[1] === 'default')
    const js = layer.findIndex((a) => a[0] === 'js')
    expect(dflt).toBeGreaterThanOrEqual(0)
    expect(dflt).toBeLessThan(js)
    expect(layer[dflt][2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    const update = layer.filter((a) => a[0] === 'consent' && a[1] === 'update').at(-1)
    expect(update?.[2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' })
  })

  it('a withdrawal tells Google and Meta at once and reloads, so nothing loaded under it runs on', async () => {
    const b = browser('Europe/Berlin')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    const { startTags, acceptAll, rejectAll } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    acceptAll()
    await tick()
    const fbq = (g.window as { fbq: { queue: IArguments[] } }).fbq
    rejectAll()
    await tick()
    const layer = (g.window as { dataLayer: IArguments[] }).dataLayer.map((a) => Array.from(a))
    const last = layer.filter((a) => a[0] === 'consent').at(-1)
    expect(last?.[1]).toBe('update')
    expect(last?.[2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    expect(fbq.queue.map((a) => Array.from(a))).toContainEqual(['consent', 'revoke'])
    expect(reload).toHaveBeenCalledTimes(1)
    expect(b.scripts).toHaveLength(5)
  })

  it('a withdrawal made in another tab is acted on when this page is shown again', async () => {
    const b = browser('Europe/Berlin')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    ;(g.document as Record<string, unknown>).visibilityState = 'visible'
    const { startTags, acceptAll } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    acceptAll()
    await tick()
    b.jar.set('__Host-hz_consent', '')
    ;(g.window as { dispatchEvent: (e: { type: string }) => void }).dispatchEvent({ type: 'visibilitychange' })
    await tick()
    expect(reload).toHaveBeenCalledTimes(1)
    expect((g.window as Record<string, unknown>)['ga-disable-AW-1']).toBe(true)
    expect((g.window as Record<string, unknown>)['ga-disable-G-TEST']).toBeUndefined()
  })

  it('withdrawing Personalized ads alone keeps Meta, under Limited Data Use', async () => {
    browser('Europe/Berlin')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    const { startTags, acceptAll, saveConsent } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    acceptAll()
    await tick()
    saveConsent({ analytics: true, marketing: true, ads: false })
    await tick()
    const fbq = (g.window as { fbq: { queue: IArguments[] } }).fbq
    expect(fbq.queue.map((a) => Array.from(a)).at(-1)).toEqual(['dataProcessingOptions', ['LDU'], 0, 0])
    expect(reload).not.toHaveBeenCalled()
  })

  it('a choice that withdraws nothing loaded neither reloads nor revokes', async () => {
    browser('Europe/Berlin')
    const reload = vi.fn()
    ;(g.window as { location: Record<string, unknown> }).location.reload = reload
    const { startTags, saveConsent, rejectAll } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    rejectAll()
    await tick()
    saveConsent({ analytics: true, marketing: false, ads: false })
    await tick()
    saveConsent({ analytics: true, marketing: false, ads: true })
    await tick()
    expect(reload).not.toHaveBeenCalled()
  })

  it('analytics alone loads only Google, cookieless for ads', async () => {
    const b = browser('Europe/Berlin')
    const { startTags, saveConsent } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    saveConsent({ analytics: true, marketing: false, ads: false })
    await tick()
    expect(b.scripts.map((s) => new URL(s).hostname)).toEqual(['www.googletagmanager.com'])
  })
})

describe('a moment before the visitor answers', () => {
  const view = async (answer: 'accept' | 'reject') => {
    browser('Europe/Berlin')
    const { startTags, track, acceptAll, rejectAll } = await import('./index')
    const captured: Array<Record<string, unknown>> = []
    startTags({ key: 'pk-x' })
    await tick()
    track({ capture: (_: string, props: Record<string, unknown>) => captured.push(props) } as never, 'pricing_viewed', { currency: 'USD' })
    await tick()
    expect(captured, 'nothing goes out while the banner asks').toEqual([])
    if (answer === 'accept') acceptAll()
    else rejectAll()
    await tick()
    return captured
  }

  it('goes out on Accept, carrying the consent given', async () => {
    const captured = await view('accept')
    expect(captured).toHaveLength(1)
    expect(captured[0].consent).toBe('analytics,marketing,ads')
  })

  it('goes out on Reject, carrying no consent', async () => {
    const captured = await view('reject')
    expect(captured).toHaveLength(1)
    expect(captured[0].consent).toBe('')
  })
})

describe('one event, every tag', () => {
  it('sends purchase under one id to each platform, with the names the table gives', async () => {
    browser('America/New_York', accepted())
    const { startTags, track } = await import('./index')
    const captured: Array<{ name: string; props: Record<string, unknown> }> = []
    startTags({ key: 'pk-x' })
    await tick()
    const w = g.window as unknown as Record<string, unknown>
    const gtag: unknown[][] = []
    const fbq: unknown[][] = []
    const ttq: unknown[][] = []
    const twq: unknown[][] = []
    const lintrk: unknown[][] = []
    w.gtag = (...a: unknown[]) => gtag.push(a)
    w.fbq = (...a: unknown[]) => fbq.push(a)
    w.ttq = { track: (...a: unknown[]) => ttq.push(a) }
    w.twq = (...a: unknown[]) => twq.push(a)
    w.lintrk = (...a: unknown[]) => lintrk.push(a)
    const items = [{ item_id: 'dev', item_name: 'Dev', price: 19, quantity: 1 }]
    track({ capture: (name: string, props: Record<string, unknown>) => captured.push({ name, props }) } as never, 'order_completed', {
      order_id: 'ord-1', value: 19, currency: 'USD', items,
    })
    await tick()

    expect(captured).toHaveLength(1)
    const id = captured[0].props.event_id
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-/)
    expect(String(captured[0].props.tags).split(',').sort()).toEqual(['ga', 'gads', 'linkedin', 'meta', 'tiktok', 'x'])

    const ga = gtag.find((a) => a[0] === 'event' && a[1] === 'purchase')
    expect(ga?.[2]).toMatchObject({ transaction_id: 'ord-1', event_id: id, items, value: 19 })
    expect(gtag.find((a) => a[1] === 'conversion')?.[2]).toMatchObject({ send_to: 'AW-1/abc', value: 19 })
    expect(fbq.map((a) => [a[0], a[1], (a[3] as { eventID: string }).eventID])).toEqual([
      ['track', 'Purchase', id],
      ['track', 'Subscribe', id],
    ])
    expect(ttq[0][0]).toBe('CompletePayment')
    expect(ttq[0][2]).toEqual({ event_id: id })
    expect(twq[0][1]).toBe('tw-o1abc-buy')
    expect(lintrk[0]).toEqual(['track', { conversion_id: 9876 }])
  })

  it('the audience moments reach each platform by the names the table gives, a search naming what was asked', async () => {
    browser('America/New_York', accepted())
    const { startTags, track } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    const w = g.window as unknown as Record<string, unknown>
    const gtag: unknown[][] = []
    const fbq: unknown[][] = []
    const ttq: unknown[][] = []
    w.gtag = (...a: unknown[]) => gtag.push(a)
    w.fbq = (...a: unknown[]) => fbq.push(a)
    w.ttq = { track: (...a: unknown[]) => ttq.push(a) }
    const stream = { capture: () => undefined } as never
    track(stream, 'product_viewed', { content_type: 'model', items: [{ item_id: 'enso', item_name: 'Enso' }] })
    track(stream, 'search_performed', { search_string: 'gpu pricing', from: 'palette' })
    track(stream, 'cta_clicked', { cta: 'try_hanzo', page: '/' })
    for (const name of ['newsletter_subscribed', 'beta_submitted', 'research_access_applied']) track(stream, name, {})
    await tick()

    expect(gtag.filter((a) => a[0] === 'event').map((a) => a[1])).toEqual([
      'view_item', 'search', 'cta_click', 'generate_lead', 'generate_lead', 'generate_lead',
    ])
    expect(gtag.find((a) => a[1] === 'search')?.[2]).toMatchObject({ search_string: 'gpu pricing' })
    expect(fbq.map((a) => [a[0], a[1]])).toEqual([
      ['track', 'ViewContent'], ['track', 'Search'], ['trackCustom', 'CTAClicked'],
      ['track', 'Lead'], ['track', 'Lead'], ['track', 'Lead'],
    ])
    expect(fbq[0][2]).toMatchObject({ content_ids: ['enso'], content_name: 'Enso' })
    expect(fbq[1][2]).toMatchObject({ search_string: 'gpu pricing' })
    expect(ttq.map((a) => a[0])).toEqual(['ViewContent', 'Search', 'ClickButton', 'SubmitForm', 'SubmitForm', 'SubmitForm'])
    expect(ttq[1][1]).toMatchObject({ query: 'gpu pricing' })
  })

  it('a test order is debug traffic', async () => {
    browser('America/New_York', accepted())
    const { startTags, mirror } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    const w = g.window as unknown as Record<string, unknown>
    const gtag: unknown[][] = []
    w.gtag = (...a: unknown[]) => gtag.push(a)
    mirror('order_completed', { test: true, order_id: 'o', value: 19, items: [{ item_id: 'dev', price: 19 }] }, 'id-9', 'ga')
    const sent = gtag.find((a) => a[1] === 'purchase')?.[2] as { value: number; items: Array<{ price: number }> }
    expect(sent).toMatchObject({ debug_mode: true, value: 0 })
    expect(sent.items[0].price).toBe(0)
  })
})

describe('a paid order the server also states', () => {
  it('fires the pixels under the order id and does not touch our stream', async () => {
    browser('America/New_York', accepted())
    const { startTags, track } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    const w = g.window as unknown as Record<string, unknown>
    const fbq: unknown[][] = []
    const captured: unknown[] = []
    w.gtag = () => undefined
    w.fbq = (...a: unknown[]) => fbq.push(a)
    track({ capture: (...a: unknown[]) => captured.push(a) } as never, 'order_completed', { event_id: 'sub_1', order_id: 'sub_1', value: 19 }, 'tags')
    await tick()
    expect(captured).toEqual([])
    expect(fbq.map((a) => (a[3] as { eventID: string }).eventID)).toEqual(['sub_1', 'sub_1'])
  })
})

describe('every Meta pixel', () => {
  it.each([
    [['1790308611893001', '758250658033751', '366194547064903']],
    [['111']],
  ])('%j: fbevents once, each pixel init\'ed, one PageView, one track per event', async (ids) => {
    const b = browser('America/New_York', accepted())
    put('fetch', async (url: string) => {
      b.requests.push(url)
      return { ok: true, json: async () => ({ tags: ids.map((id) => ({ platform: 'meta', type: 'meta', id })) }) }
    })
    const { startTags, track } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    const fbq = (g.window as { fbq: { queue: unknown[][] } }).fbq
    const calls = () => fbq.queue.map((a) => Array.from(a as ArrayLike<unknown>))
    expect(b.scripts.filter((s) => s.includes('fbevents'))).toHaveLength(1)
    expect(calls().filter((a) => a[0] === 'init').map((a) => a[1])).toEqual(ids)
    expect(calls().filter((a) => a[0] === 'track' && a[1] === 'PageView')).toHaveLength(1)
    expect(calls().findIndex((a) => a[0] === 'track')).toBeGreaterThan(calls().map((a) => a[0]).lastIndexOf('init'))
    track({ capture: () => undefined } as never, 'signup_completed', {})
    await tick()
    const sent = calls().filter((a) => a[0] === 'track' && a[1] !== 'PageView')
    expect(sent).toHaveLength(1)
    expect((sent[0][3] as { eventID: string }).eventID).toBeTruthy()
  })

  it('states Limited Data Use once, before the first init', async () => {
    const b = browser('America/New_York', new Map([['__Host-hz_consent', 'analytics,marketing'], ['__Host-hz_consent_v', '2']]))
    put('fetch', async (url: string) => {
      b.requests.push(url)
      return { ok: true, json: async () => ({ tags: ['1', '2', '3'].map((id) => ({ platform: 'meta', type: 'meta', id })) }) }
    })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    const calls = (g.window as { fbq: { queue: unknown[][] } }).fbq.queue.map((a) => Array.from(a as ArrayLike<unknown>))
    expect(calls.filter((a) => a[0] === 'dataProcessingOptions')).toHaveLength(1)
    expect(calls.findIndex((a) => a[0] === 'dataProcessingOptions')).toBeLessThan(calls.findIndex((a) => a[0] === 'init'))
  })
})
