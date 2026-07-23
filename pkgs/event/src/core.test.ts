import { describe, it, expect, beforeEach } from 'vitest'
import { Analytics, VERSION } from './core'
import { EVENTS, PAGEVIEW } from './events'
import type { Transport, WireEvent } from './types'

interface Sent {
  url: string
  beacon: boolean
  token?: string
  ingestKey?: string
  raw: string
  batch: WireEvent[]
}

// FakeTransport records the EXACT bytes the client would put on the wire, so the
// tests assert the real POST /v1/event body shape ({ batch: [...] }), not a mock.
class FakeTransport implements Transport {
  sent: Sent[] = []
  send(url: string, body: string, opts: { beacon: boolean; token?: string; ingestKey?: string }) {
    const parsed = JSON.parse(body) as { batch: WireEvent[] }
    this.sent.push({
      url,
      beacon: opts.beacon,
      token: opts.token,
      ingestKey: opts.ingestKey,
      raw: body,
      batch: parsed.batch,
    })
  }
  get all(): WireEvent[] {
    return this.sent.flatMap((s) => s.batch)
  }
}

let tx: FakeTransport
// Default to same-origin (host:'') so path assertions read the bare /v1/event door;
// tests that care about the edge host pass it explicitly.
function mk(overrides = {}) {
  tx = new FakeTransport()
  return new Analytics({ product: 'console', host: '', transport: tx, flushIntervalMs: 999999, ...overrides })
}

describe('Analytics capture', () => {
  beforeEach(() => {
    tx = new FakeTransport()
  })

  it('flushes an event as { batch:[…] } to /v1/event, no tenant/org field', () => {
    const a = mk()
    a.capture(EVENTS.SIGNUP_COMPLETED, { plan: 'pro' })
    a.flush()
    expect(tx.sent).toHaveLength(1)
    expect(tx.sent[0].url).toBe('/v1/event')
    // The body is the canonical { batch: [...] } envelope, exactly one door.
    const parsed = JSON.parse(tx.sent[0].raw)
    expect(Array.isArray(parsed.batch)).toBe(true)
    const e = tx.all[0]
    expect(e.type).toBe('event')
    expect(e.event).toBe('signup_completed')
    expect(e.product).toBe('console')
    expect(e.properties).toEqual({ plan: 'pro' })
    // The client must NEVER send a tenant/org — the server stamps it.
    expect((e as Record<string, unknown>).tenant).toBeUndefined()
    expect((e as Record<string, unknown>).org).toBeUndefined()
    expect((e as Record<string, unknown>).tenantId).toBeUndefined()
  })

  it('the wire is the canonical /v1/event Event: only known cloud fields, no tenant', () => {
    const a = mk({ host: 'https://api.hanzo.ai' })
    a.identify('user-9')
    a.capture(EVENTS.ORDER_COMPLETED, { kind: 'plan' }, { productId: 'plan_pro', revenue: 49, quantity: 1, currency: 'usd' })
    a.flush()
    // ONE POST, ONE door, ONE batched envelope.
    expect(tx.sent).toHaveLength(1)
    expect(tx.sent[0].url).toBe('https://api.hanzo.ai/v1/event')
    const parsed = JSON.parse(tx.sent[0].raw) as { batch: WireEvent[] }
    expect(Object.keys(parsed)).toEqual(['batch'])
    // Every field the client emits is a known cloud CaptureEvent field — no tenant.
    const allowed = new Set([
      'messageId', 'type', 'event', 'timestamp', 'distinctId', 'anonymousId',
      'personId', 'sessionId', 'product', 'url', 'path', 'referrer', 'utm',
      'refCode', 'channel', 'groupId', 'signupWeek', 'productId', 'quantity',
      'revenue', 'currency', 'error', 'properties', 'library', 'libraryVersion',
    ])
    for (const ev of parsed.batch) {
      for (const k of Object.keys(ev)) expect(allowed.has(k)).toBe(true)
      expect((ev as Record<string, unknown>).tenant).toBeUndefined()
      expect((ev as Record<string, unknown>).tenantId).toBeUndefined()
      expect(ev.library).toBe('@hanzo/event')
      expect(ev.libraryVersion).toBe(VERSION)
    }
    const order = parsed.batch.find((e) => e.event === EVENTS.ORDER_COMPLETED)!
    expect(order.productId).toBe('plan_pro')
    expect(order.revenue).toBe(49)
    expect(order.quantity).toBe(1)
    expect(order.currency).toBe('usd')
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
    expect(tx.sent[0].beacon).toBe(false) // …but a JWT forces keepalive fetch
    expect(tx.sent[0].url).toBe('/v1/event')
  })

  it('cookie apps beacon to /v1/event on unload flush', () => {
    const a = mk() // no token, no key
    a.capture('x')
    a.flush(true)
    expect(tx.sent[0].beacon).toBe(true)
    expect(tx.sent[0].token).toBeUndefined()
    expect(tx.sent[0].url).toBe('/v1/event')
  })

  it('publishable-key apps ride ingestKey and still beacon on unload', () => {
    const a = mk({ ingestKey: 'pk_live_123' })
    a.capture('x')
    a.flush(true)
    // The key is offered to the transport (rides ?ingest_key on the beacon), and
    // a publishable key does NOT block the unload beacon.
    expect(tx.sent[0].ingestKey).toBe('pk_live_123')
    expect(tx.sent[0].token).toBeUndefined()
    expect(tx.sent[0].beacon).toBe(true)
    expect(tx.sent[0].url).toBe('/v1/event')
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
    expect(tx.sent[0].url).toBe('https://api.hanzo.ai/v1/event')
  })

  it('stamps every event with the @hanzo/event library id + version', () => {
    const a = mk()
    a.capture('x')
    a.flush()
    expect(tx.all[0].library).toBe('@hanzo/event')
    expect(tx.all[0].libraryVersion).toBe(VERSION)
  })
})

describe('Event error capture', () => {
  it('captureError emits a type:error event carrying a TOP-LEVEL exception, flushed at once', () => {
    const a = mk()
    a.captureError(new TypeError('boom'))
    // captureError flushes promptly — no explicit flush() needed.
    expect(tx.sent).toHaveLength(1)
    const e = tx.all[0]
    // type:'error' is the field Cloud folds to event_type='error' → sentry lens.
    expect(e.type).toBe('error')
    expect(e.event).toBe('boom')
    // The exception rides the TOP-LEVEL `error` field (what cloud foldException
    // reads), NOT properties — a properties-only exception would not be lensed.
    expect(e.error?.type).toBe('TypeError')
    expect(e.error?.message).toBe('boom')
    expect(e.error?.stack).toBeTruthy()
    expect(e.error?.handled).toBe(true) // a caught, manually-reported error
    expect((e.properties ?? {})).not.toHaveProperty('$exception')
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

  it('an error is still an event on the ONE stream — same /v1/event door + product', () => {
    const a = mk({ host: 'https://api.hanzo.ai' })
    a.captureError(new Error('x'))
    // Same batched door as any other event — one pipe, not a second SDK.
    expect(tx.sent[0].url).toBe('https://api.hanzo.ai/v1/event')
    expect(tx.sent[0].raw.startsWith('{"batch":')).toBe(true)
    expect(tx.all[0].product).toBe('console')
    // never the tenant — the server stamps it, errors included.
    expect((tx.all[0] as Record<string, unknown>).tenant).toBeUndefined()
  })
})
