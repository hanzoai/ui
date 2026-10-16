// Every visitor opts in: before they allow Analytics the client sends no pageview,
// event or identify and writes nothing to the device; an error goes as a stranger.
// When they accept it takes up what the page arrived with and counts the view in hand.

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Transport, WireEvent } from './types'

const g = globalThis as Record<string, unknown>
const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
const put = (k: string, value: unknown) => Object.defineProperty(globalThis, k, { value, configurable: true, writable: true })

const AID = '01920000-0000-7000-8000-0000000000aa'

function browser(href: string, opts: { cookie?: string; gpc?: boolean; dnt?: string; store?: Record<string, string> } = {}) {
  const url = new URL(href)
  const store = new Map(Object.entries(opts.store ?? {}))
  const jar = new Map<string, string>(opts.cookie !== undefined ? [['__Host-hz_consent', opts.cookie], ['__Host-hz_consent_v', '2']] : [])
  const listeners = new Map<string, Array<() => void>>()
  const location = { href: url.href, hostname: url.hostname, protocol: url.protocol, pathname: url.pathname, search: url.search }
  g.Event = class {
    constructor(public type: string) {}
  }
  g.window = {
    location,
    history: {
      state: null,
      replaceState: (_s: unknown, _t: string, next: string) => {
        const u = new URL(next, url)
        location.href = u.href
        location.search = u.search
      },
    },
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    addEventListener: (t: string, f: () => void) => listeners.set(t, [...(listeners.get(t) ?? []), f]),
    dispatchEvent: (e: { type: string }) => listeners.get(e.type)?.forEach((f) => f()),
  }
  g.document = {
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
    },
    set cookie(line: string) {
      const [pair] = line.split(';')
      const i = pair.indexOf('=')
      jar.set(pair.slice(0, i), decodeURIComponent(pair.slice(i + 1)))
    },
    referrer: '',
    visibilityState: 'visible',
  }
  put('navigator', { globalPrivacyControl: opts.gpc === true, doNotTrack: opts.dnt, userAgent: 'UA' })
  return { store, jar }
}

class Tx implements Transport {
  all: WireEvent[] = []
  send(_u: string, body: string) {
    this.all.push(...(JSON.parse(body) as { batch: WireEvent[] }).batch)
  }
}

const load = async () => {
  vi.resetModules()
  const core = await import('./core')
  const consent = await import('./consent')
  return { ...core, ...consent }
}

afterEach(() => {
  for (const k of ['window', 'document', 'Event']) delete g[k]
  if (nav) Object.defineProperty(globalThis, 'navigator', nav)
})

const LANDING = `https://hanzo.ai/pricing?utm_source=hanzo&utm_medium=email&utm_campaign=again&hz_aid=${AID}`

describe('before the visitor allows Analytics', () => {
  it('sends no pageview, event or identify, and writes nothing to the device', async () => {
    const b = browser(LANDING)
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    a.pageview()
    a.capture('pricing_viewed', { plan: 'pro' })
    a.identify('sub-1', { email: 'ada@example.com' })
    a.setCohort({ signupWeek: '2026-W42' })
    a.flush()
    expect(tx.all).toEqual([])
    expect([...b.store.keys()]).toEqual([])
    expect([...b.jar.keys()]).toEqual([])
    // The link is taken off the address, and nothing is carried to another host.
    expect((g.window as { location: { search: string } }).location.search).not.toContain('hz_aid')
    expect(a.link('https://hanzo.id/login')).toBe('https://hanzo.id/login')
  })

  it('sends an error as a stranger: an id for this page alone, no session, no attribution', async () => {
    const b = browser(LANDING)
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.captureError(new TypeError('x is undefined'))
    a.captureError(new TypeError('y is undefined'))
    expect(tx.all.map((e) => e.type)).toEqual(['error', 'error'])
    const [e1, e2] = tx.all
    expect(e1.distinctId).toBe(e2.distinctId)
    expect(e1.distinctId).not.toBe(AID)
    expect(e1.sessionId).toBeUndefined()
    expect(e1.utm).toBeUndefined()
    expect(e1.lastUtm).toBeUndefined()
    expect(e1.properties?.consent).toBe('')
    expect(e1.url, 'a stranger names the page, never its query').toBe('https://hanzo.ai/pricing')
    const boom = new TypeError('z is undefined')
    boom.stack = 'TypeError: z is undefined\n    at f (https://hanzo.ai/pricing?gclid=G1&utm_source=x:10:20)'
    a.captureError(boom)
    const e3 = tx.all[2]
    expect(e3.error?.stack).not.toContain('gclid')
    expect(e3.error?.stack).toContain('https://hanzo.ai/pricing:10:20')
    expect(JSON.stringify(e3.error?.frames)).not.toContain('gclid')
    expect([...b.store.keys()]).toEqual([])
    expect([...b.jar.keys()]).toEqual([])
  })

  it('on Accept, takes up the visit and counts the view in hand, once', async () => {
    const b = browser(LANDING)
    const { Analytics, acceptAll } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    a.pageview()
    a.identify('sub-1')
    acceptAll()
    a.pageview()
    a.flush()
    expect(tx.all.map((e) => e.type)).toEqual(['identify', 'pageview'])
    const view = tx.all[1]
    expect(view.anonymousId).toBe(AID)
    expect(view.personId).toBe('sub-1')
    expect(view.utm).toMatchObject({ source: 'hanzo', campaign: 'again' })
    expect(view.lastUtm).toMatchObject({ source: 'hanzo', medium: 'email', campaign: 'again' })
    expect(view.properties?.consent).toBe('analytics,marketing,ads')
    expect(b.store.has('hz_first_touch')).toBe(true)
    expect(b.store.has('hz_last_touch')).toBe(true)
  })

  it('on Reject, sends nothing still', async () => {
    browser(LANDING)
    const { Analytics, rejectAll } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    a.pageview()
    rejectAll()
    a.capture('pricing_viewed')
    a.flush()
    expect(tx.all).toEqual([])
  })

  it.each([
    ['Global Privacy Control', { gpc: true }],
    ['Do Not Track', { dnt: '1' }],
  ])('%s refuses even a stored yes', async (_name, refusal) => {
    const b = browser(LANDING, { cookie: 'analytics,marketing,ads', ...refusal })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.pageview()
    a.capture('pricing_viewed')
    a.flush()
    expect(tx.all).toEqual([])
    expect([...b.store.keys()]).toEqual([])
  })
})

describe('a withdrawal', () => {
  it('sends nothing after it, not even what was queued, and forgets the visitor', async () => {
    const b = browser(LANDING)
    const { Analytics, acceptAll, rejectAll } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    acceptAll()
    a.identify('sub-1')
    a.flush()
    const before = tx.all.length
    a.capture('pricing_viewed')
    rejectAll()
    a.capture('plan_picked')
    a.identify('sub-1')
    a.flush()
    expect(tx.all.slice(before)).toEqual([])
    expect(b.jar.get('iam-anon-id'), 'the anonymous id is forgotten').toBeFalsy()
  })

  it.each([
    ['Global Privacy Control', { gpc: true }],
    ['Do Not Track', { dnt: '1' }],
  ])('by %s over a stored yes forgets what the yes kept, and sends nothing', async (_name, refusal) => {
    const b = browser(LANDING, { cookie: 'analytics,marketing,ads', ...refusal, store: { 'iam-anon-id': AID, hz_first_touch: '{}' } })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    a.identify('sub-3')
    a.pageview()
    a.flush()
    expect(tx.all).toEqual([])
    expect(b.jar.get('__Host-hz_consent')).toBe('')
    expect([...b.store.keys()]).toEqual([])
  })

  it('of Marketing alone keeps the visitor and what was queued', async () => {
    browser(LANDING)
    const { Analytics, acceptAll, save } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    acceptAll()
    a.capture('one')
    a.flush()
    const anon = tx.all[0].anonymousId
    a.capture('two')
    save({ analytics: true, marketing: false, ads: false })
    a.flush()
    expect(tx.all.map((e) => e.event)).toEqual(['one', 'two'])
    a.capture('three')
    a.flush()
    expect(tx.all.at(-1)!.anonymousId).toBe(anon)
    expect(tx.all.at(-1)!.properties?.consent).toBe('analytics')
  })

  it('forgets the visitor this page held, so a later yes is a new one', async () => {
    browser(LANDING)
    const { Analytics, acceptAll, rejectAll } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    acceptAll()
    a.capture('one')
    a.flush()
    const first = tx.all[0].anonymousId
    rejectAll()
    acceptAll()
    a.capture('two')
    a.flush()
    expect(tx.all.at(-1)!.anonymousId).toBeDefined()
    expect(tx.all.at(-1)!.anonymousId).not.toBe(first)
  })
})

describe("a stranger's error", () => {
  it('names no query in its message or stack, a colon in the query included', async () => {
    browser(LANDING)
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    const boom = new Error('load failed: https://hanzo.ai/a.js?token=T1 then WSS://hanzo.ai/s?k=1 and /pricing?email=ada%40corp.com')
    boom.stack = 'Error: x\n    at f (https://hanzo.ai/a.js?next=https://x.io&gclid=G1&t=12:30:12:34)\n    at g (/static/b.js?v=2:3:4)'
    a.captureError(boom, { properties: { email: 'ada@corp.com' } })
    const e = tx.all[0]
    expect(e.error?.message).toBe('load failed: https://hanzo.ai/a.js then WSS://hanzo.ai/s and /pricing')
    expect(e.error?.stack).toBe('Error: x\n    at f (https://hanzo.ai/a.js:30:12:34)\n    at g (/static/b.js:3:4)')
    expect(e.properties).toEqual({ consent: '' })
  })
})

describe('the last touch', () => {
  it('is the most recent visit that arrived with a campaign; the first touch stays', async () => {
    const first = { utm: { source: 'google', medium: 'cpc', campaign: 'launch' }, channel: 'paid' }
    const b = browser('https://hanzo.ai/signup?utm_source=hanzo&utm_medium=email&utm_campaign=again', {
      cookie: 'analytics',
      store: { hz_first_touch: JSON.stringify(first) },
    })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.capture('signup_completed')
    a.flush()
    expect(tx.all[0].utm).toMatchObject({ campaign: 'launch' })
    expect(tx.all[0].lastUtm).toMatchObject({ source: 'hanzo', campaign: 'again' })
    expect(JSON.parse(b.store.get('hz_last_touch')!).utm.campaign).toBe('again')
  })

  it('is kept across a visit with no campaign, and lapses after 90 days', async () => {
    const at = Date.now() - 10 * 86_400_000
    browser('https://hanzo.ai/pricing', {
      cookie: 'analytics',
      store: { hz_last_touch: JSON.stringify({ utm: { source: 'hanzo', campaign: 'again' }, at }) },
    })
    let { Analytics } = await load()
    let tx = new Tx()
    const kept = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    kept.capture('x')
    kept.flush()
    expect(tx.all.at(-1)?.lastUtm).toMatchObject({ campaign: 'again' })

    browser('https://hanzo.ai/pricing', {
      cookie: 'analytics',
      store: { hz_last_touch: JSON.stringify({ utm: { source: 'hanzo', campaign: 'again' }, at: Date.now() - 91 * 86_400_000 }) },
    })
    ;({ Analytics } = await load())
    tx = new Tx()
    const lapsed = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    lapsed.capture('x')
    lapsed.flush()
    expect(tx.all[0].lastUtm).toBeUndefined()
  })
})

describe('a client a copy built before opt-in left on the page', () => {
  it('is never handed to this copy', async () => {
    browser(LANDING, { cookie: 'analytics' })
    const { createAnalytics, Analytics } = await load()
    const old = new Analytics({ product: 'site', host: '', flushIntervalMs: 999999 })
    const slot = Symbol.for('hanzo.event.clients')
    ;(globalThis as Record<symbol, unknown>)[slot] = new Map([['\0site', old]])
    expect(createAnalytics({ product: 'site', host: '' })).not.toBe(old)
    delete (globalThis as Record<symbol, unknown>)[slot]
  })
})
