// The stream is first party: every visitor's page views, events, identifies and
// errors go, under the anonymous id, the session and the visit's attribution,
// whatever they chose and under Global Privacy Control or Do Not Track alike. Each
// states the grants it was sent under, narrowed when one is withdrawn; consent
// governs the third parties alone.

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

describe('the stream', () => {
  it.each([
    ['no choice', {}],
    ['a refusal', { cookie: '' }],
    ['Global Privacy Control', { gpc: true, cookie: 'analytics,marketing,ads' }],
    ['Do Not Track', { dnt: '1', cookie: 'analytics,marketing,ads' }],
  ] as const)('sends everything with %s, as the visitor, forwardable under nothing', async (_name, opts) => {
    const b = browser(LANDING, opts)
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    a.pageview()
    a.capture('pricing_viewed', { plan: 'pro' })
    a.identify('sub-1', { plan: 'pro' })
    a.captureError(new TypeError('x is undefined'))
    a.flush()
    expect(tx.all.map((e) => e.type)).toEqual(['pageview', 'event', 'identify', 'error'])
    for (const e of tx.all) {
      expect(e.anonymousId).toBe(AID)
      expect(e.sessionId).toBeTruthy()
      expect(e.properties?.consent).toBe('')
    }
    expect(tx.all[0].utm).toMatchObject({ source: 'hanzo', campaign: 'again' })
    expect(tx.all[3].distinctId).toBe('sub-1')
    // The link is adopted and taken off the address; the visitor is carried on.
    expect((g.window as { location: { search: string } }).location.search).not.toContain('hz_aid')
    expect(a.link('https://hanzo.id/login')).toContain(AID)
    expect(b.jar.has('iam-anon-id') || b.store.has('iam-anon-id')).toBe(true)
  })

  it('states the grants each event was sent under', async () => {
    browser(LANDING, { cookie: 'analytics,marketing' })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.capture('pricing_viewed')
    a.flush()
    expect(tx.all[0].properties?.consent).toBe('analytics,marketing')
  })
})

describe('a withdrawal', () => {
  it('keeps the stream and the visitor, and narrows what was queued to what is still allowed', async () => {
    const b = browser(LANDING, { cookie: 'analytics,marketing,ads' })
    const { Analytics, save } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.init()
    a.capture('checkout_started')
    save({ analytics: true, marketing: false, ads: false })
    a.capture('order_completed')
    a.flush()
    expect(tx.all.map((e) => [e.event, e.properties?.consent])).toEqual([
      ['checkout_started', 'analytics'],
      ['order_completed', 'analytics'],
    ])
    expect(tx.all.every((e) => e.anonymousId === AID)).toBe(true)
    expect(b.jar.has('iam-anon-id') || b.store.has('iam-anon-id')).toBe(true)
  })

  it('made in another tab narrows what this one queued', async () => {
    const b = browser(LANDING, { cookie: 'analytics,marketing' })
    const { Analytics } = await load()
    const tx = new Tx()
    const a = new Analytics({ product: 'site', host: '', transport: tx, flushIntervalMs: 999999 })
    a.capture('checkout_started')
    b.jar.set('__Host-hz_consent', '')
    a.flush()
    expect(tx.all.map((e) => [e.event, e.properties?.consent])).toEqual([['checkout_started', '']])
  })
})
