// The tag manager: nothing loads before consent, everything loads after, and an
// event reaches each platform under one id and the names the platform table gives.

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

describe('before consent', () => {
  it('an EU visitor makes no request to any platform', async () => {
    const b = browser('Europe/Berlin')
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.requests).toHaveLength(1)
    expect(b.requests[0]).toContain('/v1/project/tags')
    expect(b.scripts).toEqual([])
  })

  it('a US visitor is presumed to allow, and every tag loads', async () => {
    const b = browser('America/New_York')
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.scripts.map((s) => new URL(s).hostname).sort()).toEqual(
      ['analytics.tiktok.com', 'connect.facebook.net', 'snap.licdn.com', 'static.ads-twitter.com', 'www.googletagmanager.com'].sort(),
    )
  })
})

describe('a driven browser', () => {
  it('loads no platform even where the region presumes consent', async () => {
    const b = browser('America/New_York')
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
    const b = browser('America/New_York')
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

  it('a bot loads nothing, even where the region presumes consent', async () => {
    const b = browser('America/New_York')
    answering(b, { audience: 'bot' })
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x' })
    await tick()
    expect(b.scripts).toEqual([])
  })

  it('the team loads Google alone, tagged internal, and the browser stays marked', async () => {
    const b = browser('America/New_York')
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
    const b = browser('America/New_York')
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
    const b = browser('America/New_York')
    const seen: Array<RequestInit | undefined> = []
    answering(b, {}, seen)
    const { startTags } = await import('./index')
    startTags({ key: 'pk-x', token: () => 'jwt-abc' })
    await tick()
    expect(seen[0]).toEqual({ headers: { Authorization: 'Bearer jwt-abc' } })

    vi.resetModules()
    const c = browser('America/New_York')
    const none: Array<RequestInit | undefined> = []
    answering(c, {}, none)
    const again = await import('./index')
    again.startTags({ key: 'pk-x', token: () => undefined })
    await tick()
    expect(none).toEqual([undefined])
  })

  it('a refused bearer asks again as a stranger', async () => {
    const b = browser('America/New_York')
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
    expect(b.scripts).toEqual([])
    acceptAll()
    await tick()
    const layer = (g.window as { dataLayer: IArguments[] }).dataLayer.map((a) => Array.from(a))
    const dflt = layer.findIndex((a) => a[0] === 'consent' && a[1] === 'default')
    const js = layer.findIndex((a) => a[0] === 'js')
    expect(dflt).toBeGreaterThanOrEqual(0)
    expect(dflt).toBeLessThan(js)
    expect(layer[dflt][2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    const update = layer.find((a) => a[0] === 'consent' && a[1] === 'update')
    expect(update?.[2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' })
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

describe('one event, every tag', () => {
  it('sends purchase under one id to each platform, with the names the table gives', async () => {
    browser('America/New_York')
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

  it('a test order is debug traffic', async () => {
    browser('America/New_York')
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
    browser('America/New_York')
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
