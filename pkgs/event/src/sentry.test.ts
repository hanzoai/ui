import { describe, it, expect } from 'vitest'
import { Analytics } from './core'
import { parseDsn, buildEnvelope, buildSentryEvent, stackFrames, ingestUrlWithKey } from './sentry'
import type { Transport } from './types'

const UUID = '11111111-2222-4333-8444-555555555555'
const DSN = `https://7:deadbeefcafe@sentry.hanzo.ai/v1/sentry/${UUID}`
const INGEST = `https://sentry.hanzo.ai/v1/sentry/${UUID}/envelope/?sentry_key=7%3Adeadbeefcafe`

/** Captures the raw POST body (an envelope), unlike the analytics FakeTransport. */
class RawTransport implements Transport {
  sent: Array<{ url: string; body: string; beacon: boolean; token?: string }> = []
  send(url: string, body: string, opts: { beacon: boolean; token?: string }) {
    this.sent.push({ url, body, beacon: opts.beacon, token: opts.token })
  }
}

const lines = (body: string) => body.split('\n').filter(Boolean)
const payloadOf = (body: string) => JSON.parse(lines(body)[2])

describe('parseDsn', () => {
  it('parses a Hanzo Sentry DSN into key + project + clean ingest url (no /api/)', () => {
    const d = parseDsn(DSN)!
    expect(d).not.toBeNull()
    expect(d.publicKey).toBe('7:deadbeefcafe')
    expect(d.host).toBe('sentry.hanzo.ai')
    expect(d.projectId).toBe(UUID)
    expect(d.ingestUrl).toBe(`https://sentry.hanzo.ai/v1/sentry/${UUID}/envelope/`)
  })

  it('appends the public key as the ?sentry_key auth param', () => {
    expect(ingestUrlWithKey(parseDsn(DSN)!)).toBe(INGEST)
  })

  it('fails closed (null) for empty, garbage, or a non-UUID project', () => {
    expect(parseDsn(undefined)).toBeNull()
    expect(parseDsn('')).toBeNull()
    expect(parseDsn('not a url')).toBeNull()
    expect(parseDsn(`https://7:x@sentry.hanzo.ai/v1/sentry/not-a-uuid`)).toBeNull()
  })
})

describe('stackFrames', () => {
  it('parses a JS stack oldest-first with the crash site last', () => {
    const stack = [
      'TypeError: boom',
      '    at inner (https://app.hanzo.ai/a.js:10:5)',
      '    at outer (https://app.hanzo.ai/b.js:20:1)',
    ].join('\n')
    const frames = stackFrames(stack)
    expect(frames).toHaveLength(2)
    expect(frames[0].function).toBe('outer') // oldest first
    expect(frames[1].function).toBe('inner') // crash site last
    expect(frames[1].filename).toBe('https://app.hanzo.ai/a.js')
    expect(frames[1].lineno).toBe(10)
    expect(frames[1].colno).toBe(5)
    expect(frames[1].in_app).toBe(true)
  })

  it('handles a frame with no function and marks node_modules not-in-app', () => {
    expect(stackFrames(undefined)).toEqual([])
    expect(stackFrames('    at https://app.hanzo.ai/p.js:1:1')[0].function).toBe('<anonymous>')
    expect(stackFrames('    at f (/app/node_modules/x/i.js:1:1)')[0].in_app).toBe(false)
  })
})

describe('buildSentryEvent + buildEnvelope', () => {
  it('builds a Sentry event with exception values, tags, user, sdk', () => {
    const ev = buildSentryEvent(
      { type: 'TypeError', message: 'boom', stack: 'TypeError: boom\n    at f (https://app/a.js:1:2)', handled: false },
      {
        sessionId: 'sess-1',
        distinctId: 'user-9',
        product: 'app',
        release: 'v1.2.3',
        environment: 'production',
        sdk: { name: '@hanzo/event', version: '0.3.0' },
      },
    )
    expect(ev.platform).toBe('javascript')
    expect(ev.level).toBe('error')
    expect(ev.exception.values[0].type).toBe('TypeError')
    expect(ev.exception.values[0].value).toBe('boom')
    expect(ev.exception.values[0].stacktrace?.frames).toHaveLength(1)
    expect(ev.tags?.session).toBe('sess-1')
    expect(ev.tags?.product).toBe('app')
    expect(ev.tags?.handled).toBe('false')
    expect(ev.user?.id).toBe('user-9')
    expect(ev.release).toBe('v1.2.3')
    expect(ev.environment).toBe('production')
    expect(ev.sdk.name).toBe('@hanzo/event')
    expect(ev.event_id).toMatch(/^[0-9a-f]{32}$/)
  })

  it('frames the envelope: header line + item header + payload', () => {
    const ev = buildSentryEvent({ message: 'x' }, { sdk: { name: '@hanzo/event', version: '0.3.0' } })
    const env = buildEnvelope(DSN, ev)
    const parts = lines(env)
    expect(parts).toHaveLength(3)
    const hdr = JSON.parse(parts[0])
    expect(hdr.event_id).toBe(ev.event_id)
    expect(hdr.dsn).toBe(DSN)
    expect(hdr.sent_at).toBeTruthy()
    expect(JSON.parse(parts[1])).toEqual({ type: 'event' })
    expect(JSON.parse(parts[2]).exception.values[0].value).toBe('x')
  })
})

describe('Analytics with a Sentry DSN routes errors to /v1/sentry', () => {
  function mk(overrides = {}) {
    const tx = new RawTransport()
    const a = new Analytics({ product: 'app', transport: tx, sentryDsn: DSN, flushIntervalMs: 999999, ...overrides })
    return { a, tx }
  }

  it('captureError POSTs a Sentry envelope to the DSN ingest url (keepalive, sentry_key)', () => {
    const { a, tx } = mk()
    a.captureError(new TypeError('kaboom'))
    expect(tx.sent).toHaveLength(1)
    expect(tx.sent[0].url).toBe(INGEST)
    expect(tx.sent[0].beacon).toBe(false)
    const p = payloadOf(tx.sent[0].body)
    expect(p.exception.values[0].type).toBe('TypeError')
    expect(p.exception.values[0].value).toBe('kaboom')
  })

  it('does NOT also enqueue an analytics event (no double-send)', () => {
    const { a, tx } = mk()
    a.captureError(new Error('once'))
    a.flush() // draining the analytics queue reveals nothing was queued
    expect(tx.sent).toHaveLength(1)
    expect(tx.sent[0].url).toContain('/v1/sentry/')
    expect(tx.sent.some((s) => s.url.includes('/v1/analytics'))).toBe(false)
  })

  it('carries the same identity as analytics (one identity)', () => {
    const { a, tx } = mk()
    a.identify('user-42') // sets personId; enqueued analytics identify stays buffered
    a.captureError(new Error('boom'))
    const p = payloadOf(tx.sent[tx.sent.length - 1].body)
    expect(p.user.id).toBe('user-42')
    expect(p.tags.handled).toBe('true')
  })

  it('de-dupes repeated identical errors (one ingest)', () => {
    const { a, tx } = mk()
    const err = new Error('flap')
    a.captureError(err)
    a.captureError(err)
    expect(tx.sent).toHaveLength(1)
  })

  it('only errors divert — analytics events still POST to /v1/analytics', () => {
    const { a, tx } = mk()
    a.capture('feature_used')
    a.flush()
    expect(tx.sent[0].url).toBe('/v1/analytics')
  })
})
