import { describe, it, expect, beforeEach } from 'vitest'
import { Analytics } from './core'
import { EVENTS, PAGEVIEW } from './events'
import type { Transport, WireEvent } from './types'

interface Sent {
  url: string
  beacon: boolean
  token?: string
  batch: WireEvent[]
}

class FakeTransport implements Transport {
  sent: Sent[] = []
  send(url: string, body: string, opts: { beacon: boolean; token?: string }) {
    const parsed = JSON.parse(body) as { batch: WireEvent[] }
    this.sent.push({ url, beacon: opts.beacon, token: opts.token, batch: parsed.batch })
  }
  get all(): WireEvent[] {
    return this.sent.flatMap((s) => s.batch)
  }
}

let tx: FakeTransport
function mk(overrides = {}) {
  tx = new FakeTransport()
  return new Analytics({ product: 'console', transport: tx, flushIntervalMs: 999999, ...overrides })
}

describe('Analytics capture', () => {
  beforeEach(() => {
    tx = new FakeTransport()
  })

  it('flushes an event as a {batch:[...]} with product + name, no tenant/org field', () => {
    const a = mk()
    a.capture(EVENTS.SIGNUP_COMPLETED, { plan: 'pro' })
    a.flush()
    expect(tx.sent).toHaveLength(1)
    expect(tx.sent[0].url).toBe('/v1/analytics')
    const e = tx.all[0]
    expect(e.type).toBe('event')
    expect(e.event).toBe('signup_completed')
    expect(e.product).toBe('console')
    expect(e.properties).toEqual({ plan: 'pro' })
    // The client must never send a tenant/org — the server stamps it.
    expect((e as Record<string, unknown>).tenant).toBeUndefined()
    expect((e as Record<string, unknown>).org).toBeUndefined()
    expect((e as Record<string, unknown>).tenantId).toBeUndefined()
  })

  it('pageview emits the reserved $pageview name', () => {
    const a = mk()
    a.pageview('/pricing')
    a.flush()
    const e = tx.all[0]
    expect(e.type).toBe('pageview')
    expect(e.event).toBe(PAGEVIEW)
    expect(e.path).toBe('/pricing')
  })

  it('auto-flushes when the batch size is reached', () => {
    const a = mk({ batchSize: 3 })
    a.capture('a')
    a.capture('b')
    expect(tx.sent).toHaveLength(0) // under threshold, buffered
    a.capture('c')
    expect(tx.sent).toHaveLength(1) // threshold hit → flushed
    expect(tx.all).toHaveLength(3)
  })

  it('identify binds personId to subsequent distinctId', () => {
    const a = mk()
    a.capture('anon_event')
    a.identify('user-42')
    a.capture('known_event')
    a.flush()
    const anon = tx.all.find((e) => e.event === 'anon_event')!
    const known = tx.all.find((e) => e.event === 'known_event')!
    expect(known.personId).toBe('user-42')
    expect(known.distinctId).toBe('user-42')
    // the pre-identify event has no personId
    expect(anon.personId).toBeUndefined()
  })

  it('carries commerce fields on order events', () => {
    const a = mk()
    a.capture(EVENTS.ORDER_COMPLETED, { kind: 'plan' }, { productId: 'plan_pro', revenue: 49, quantity: 1, currency: 'usd' })
    a.flush()
    const e = tx.all[0]
    expect(e.productId).toBe('plan_pro')
    expect(e.revenue).toBe(49)
    expect(e.quantity).toBe(1)
    expect(e.currency).toBe('usd')
  })

  it('a disabled client emits nothing', () => {
    const a = mk({ enabled: false })
    a.capture('x')
    a.pageview()
    a.flush()
    expect(tx.sent).toHaveLength(0)
  })

  it('token apps send Authorization and never beacon (headerless) on unload flush', () => {
    const a = mk({ getToken: () => 'jwt-abc' })
    a.capture('x')
    a.flush(true) // beacon requested…
    expect(tx.sent[0].token).toBe('jwt-abc')
    expect(tx.sent[0].beacon).toBe(false) // …but a token forces keepalive fetch
    expect(tx.sent[0].url).toBe('/v1/analytics')
  })

  it('cookie apps beacon to the tracker route on unload flush', () => {
    const a = mk() // no token
    a.capture('x')
    a.flush(true)
    expect(tx.sent[0].beacon).toBe(true)
    expect(tx.sent[0].url).toBe('/v1/tracker')
  })

  it('setCohort rides subsequent events', () => {
    const a = mk()
    a.setCohort({ signupWeek: '2026-W29', channel: 'paid', refCode: 'REF9' })
    a.capture('x')
    a.flush()
    const e = tx.all[0]
    expect(e.signupWeek).toBe('2026-W29')
    expect(e.channel).toBe('paid')
    expect(e.refCode).toBe('REF9')
  })

  it('prefixes the configured host onto the path', () => {
    const a = mk({ host: 'https://api.hanzo.ai' })
    a.capture('x')
    a.flush()
    expect(tx.sent[0].url).toBe('https://api.hanzo.ai/v1/analytics')
  })

  it('stamps every event with the @hanzo/event library id', () => {
    const a = mk()
    a.capture('x')
    a.flush()
    expect(tx.all[0].library).toBe('@hanzo/event')
  })
})

describe('Event error capture', () => {
  it('captureError emits a type:error event with the exception, and flushes at once', () => {
    const a = mk()
    a.captureError(new TypeError('boom'))
    // captureError flushes promptly — no explicit flush() needed.
    expect(tx.sent).toHaveLength(1)
    const e = tx.all[0]
    expect(e.type).toBe('error')
    expect(e.event).toBe('boom')
    expect(e.error?.type).toBe('TypeError')
    expect(e.error?.message).toBe('boom')
    expect(e.error?.stack).toBeTruthy()
    expect(e.error?.handled).toBe(true) // a caught, manually-reported error
  })

  it('normalizes a thrown string into an exception', () => {
    const a = mk()
    a.captureError('plain failure')
    const e = tx.all[0]
    expect(e.type).toBe('error')
    expect(e.error?.message).toBe('plain failure')
  })

  it('marks handled=false for unhandled/global errors and carries properties', () => {
    const a = mk()
    a.captureError(new Error('unhandled'), { handled: false, properties: { source: 'onerror' } })
    const e = tx.all[0]
    expect(e.error?.handled).toBe(false)
    expect(e.properties).toEqual({ source: 'onerror' })
  })

  it('captureException is an alias of captureError', () => {
    const a = mk()
    a.captureException(new Error('via alias'))
    const e = tx.all[0]
    expect(e.type).toBe('error')
    expect(e.error?.message).toBe('via alias')
  })

  it('an error is still an event on the ONE stream — same route + product', () => {
    const a = mk({ host: 'https://api.hanzo.ai' })
    a.captureError(new Error('x'))
    // Same batched route as any other event — one pipe, not a second SDK.
    expect(tx.sent[0].url).toBe('https://api.hanzo.ai/v1/analytics')
    expect(tx.all[0].product).toBe('console')
    // never the tenant — the server stamps it, errors included.
    expect((tx.all[0] as Record<string, unknown>).tenant).toBeUndefined()
  })
})
