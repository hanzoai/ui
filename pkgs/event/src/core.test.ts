import { describe, it, expect, beforeEach } from 'vitest'
import { Analytics, VERSION } from './core'
import { EVENTS, PAGEVIEW } from './events'
import type { Transport, WireEvent } from './types'
import pkg from '../package.json' with { type: 'json' }

// VERSION is stamped on every event as `libraryVersion`, and it is the only way
// to tell from the warehouse which build emitted a row. It is hand-maintained
// (it lives alone to keep sentry.ts from importing core.ts), so it silently fell
// a release behind: 0.3.4 shipped stamping "0.3.3", making its rows
// indistinguishable from the previous release's. Every other assertion compares
// VERSION to itself and so cannot catch that. This one pins it to the version
// actually published.
describe('VERSION', () => {
  it('matches the published package version', () => {
    expect(VERSION).toBe(pkg.version)
  })
})

interface Sent {
  url: string
  beacon: boolean
  token?: string
  ingestKey?: string
  contentType?: string
  raw: string
  batch: WireEvent[]
}

// FakeTransport records the EXACT bytes the client would put on the wire, so the
// tests assert the real POST /v1/event body shape ({ batch: [...] }), not a mock.
// The error plane puts a newline-delimited Sentry envelope on the same transport,
// which is deliberately NOT JSON — it is recorded raw, with an empty batch.
class FakeTransport implements Transport {
  sent: Sent[] = []
  send(
    url: string,
    body: string,
    opts: { beacon: boolean; token?: string; ingestKey?: string; contentType?: string },
  ) {
    let batch: WireEvent[] = []
    try {
      batch = (JSON.parse(body) as { batch: WireEvent[] }).batch ?? []
    } catch {
      /* a Sentry envelope — not JSON by design */
    }
    this.sent.push({
      url,
      beacon: opts.beacon,
      token: opts.token,
      ingestKey: opts.ingestKey,
      contentType: opts.contentType,
      raw: body,
      batch,
    })
  }
  get all(): WireEvent[] {
    return this.sent.flatMap((s) => s.batch)
  }
  /** Sends on the error plane — the envelope content type is the discriminator. */
  get envelopes(): Sent[] {
    return this.sent.filter((s) => s.contentType === 'application/x-sentry-envelope')
  }
  /** Sends on the event stream. */
  get streams(): Sent[] {
    return this.sent.filter((s) => s.contentType !== 'application/x-sentry-envelope')
  }
}

let tx: FakeTransport
// Default to same-origin (host:'') so path assertions read the bare /v1/event door;
// tests that care about the edge host pass it explicitly.
// `test-app` is deliberately NOT a product in the DSN registry (src/dsn.ts), so
// the default client here has no error plane and these tests exercise the client
// itself rather than whichever real products happen to be registered. Tests that
// want a live error plane pass `dsn:` explicitly; registry resolution is covered
// in dsn.test.ts.
function mk(overrides = {}) {
  tx = new FakeTransport()
  return new Analytics({ product: 'test-app', host: '', transport: tx, flushIntervalMs: 999999, ...overrides })
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
    expect(e.product).toBe('test-app')
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

  // Autocapture reaches the wire through capture(), which passes no location.
  // When only pageview() stamped one, every $click/$input/$change arrived with
  // an empty url and path — and an interaction with no page is exactly what a
  // heatmap cannot use.
  it('stamps the page onto every event, not just pageviews', () => {
    const g = globalThis as Record<string, unknown>
    const hadWindow = 'window' in g
    const hadDocument = 'document' in g
    // enqueue() inits lazily, and init() is browser-only, so both are needed.
    g.window = {
      location: { href: 'https://hanzo.chat/rooms/42?q=1', pathname: '/rooms/42', search: '?q=1' },
      addEventListener: () => {},
    }
    g.document = { referrer: '', visibilityState: 'visible' }
    try {
      const a = mk()
      a.capture('$click')
      a.pageview('/explicit')
      a.flush()

      const click = tx.all.find((e) => e.event === '$click')!
      expect(click.url).toBe('https://hanzo.chat/rooms/42?q=1')
      expect(click.path).toBe('/rooms/42')

      // A route change fires before window.location catches up, so an explicit
      // pageview path still has to win over the ambient one.
      const view = tx.all.find((e) => e.type === 'pageview')!
      expect(view.path).toBe('/explicit')
      expect(view.url).toBe('https://hanzo.chat/rooms/42?q=1')
    } finally {
      if (!hadWindow) delete g.window
      if (!hadDocument) delete g.document
    }
  })

  // Stamping the location on EVERY event multiplied an exposure that used to
  // cost one row per page load: a reset/invite/magic link carries a JWT in the
  // query and an address in `?email=`, so without scrubbing, every click on that
  // page ships both to the warehouse in cleartext. The error plane has always
  // scrubbed its free text; the location field is free text too.
  describe('location scrubbing', () => {
    const withLocation = (href: string, referrer: string, fn: () => void) => {
      const g = globalThis as Record<string, unknown>
      const hadWindow = 'window' in g
      const hadDocument = 'document' in g
      const u = new URL(href)
      g.window = {
        location: { href, pathname: u.pathname, search: u.search },
        addEventListener: () => {},
      }
      g.document = { referrer, visibilityState: 'visible' }
      try {
        fn()
      } finally {
        if (!hadWindow) delete g.window
        if (!hadDocument) delete g.document
      }
    }

    const SECRET_URL =
      'https://hanzo.ai/invite/accept?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.QWxnSWdub3JlZA&email=cfo@acme.com'

    it('redacts a secret and PII from the url of every event kind', () => {
      withLocation(SECRET_URL, '', () => {
        const a = mk()
        a.capture('$click')
        a.pageview()
        a.flush()

        // Both kinds, because pageview() reaches the wire through a different
        // branch than autocapture does.
        for (const e of tx.all) {
          expect(e.url).not.toContain('eyJhbGciOiJIUzI1NiJ9')
          expect(e.url).not.toContain('cfo@acme.com')
          expect(e.url).toContain('[redacted]')
          expect(e.url).toContain('[email]')
          // Scrubbed, not dropped — the page is still attributable, which is the
          // whole reason the field is stamped.
          expect(e.url).toContain('https://hanzo.ai/invite/accept')
        }
      })
    })

    // pageview() used to pass its own `url` through `...extra`, which merges
    // AFTER the field build() reads — so scrubbing only the read would have left
    // the highest-volume event emitting the raw location. The scrub runs on the
    // assembled record precisely so no call site can route around it.
    it('cannot be bypassed by a call site that supplies its own location', () => {
      withLocation(SECRET_URL, '', () => {
        const a = mk()
        a.pageview('/invite/accept?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.QWxnSWdub3JlZA')
        a.flush()
        const view = tx.all.find((e) => e.type === 'pageview')!
        expect(view.path).not.toContain('eyJhbGciOiJIUzI1NiJ9')
        expect(view.path).toContain('[redacted]')
      })
    })

    // document.referrer is the previous page's full URL and is stamped on every
    // event, so it leaks the same way the current location does.
    it('redacts the referrer', () => {
      withLocation('https://hanzo.ai/dashboard', SECRET_URL, () => {
        const a = mk()
        a.capture('$click')
        a.flush()
        expect(tx.all[0].referrer).not.toContain('eyJhbGciOiJIUzI1NiJ9')
        expect(tx.all[0].referrer).not.toContain('cfo@acme.com')
      })
    })

    // capturePII is an explicit opt-in for END-USER identifiers. It is NOT a
    // mode that ships credentials: there is no configuration under which a
    // secret leaves the browser.
    it('still redacts secrets when capturePII is enabled', () => {
      withLocation(SECRET_URL, '', () => {
        const a = mk({ capturePII: true })
        a.capture('$click')
        a.flush()
        expect(tx.all[0].url).not.toContain('eyJhbGciOiJIUzI1NiJ9')
        expect(tx.all[0].url).toContain('[redacted]')
        expect(tx.all[0].url).toContain('cfo@acme.com')
      })
    })

    // A redactor that mangles ordinary URLs would destroy the analytics it
    // exists to protect, so the common case must pass through byte-for-byte.
    it('leaves an ordinary url untouched', () => {
      withLocation('https://hanzo.ai/pricing?plan=pro&utm_source=x', '', () => {
        const a = mk()
        a.capture('$click')
        a.flush()
        expect(tx.all[0].url).toBe('https://hanzo.ai/pricing?plan=pro&utm_source=x')
        expect(tx.all[0].path).toBe('/pricing')
      })
    })
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

  it('reads the ingest key from the build env when config omits it', () => {
    // The failure this closes is silent: a surface with no key attributes nothing
    // for a logged-out visitor, the door refuses the write, and the page shows no
    // sign of it. The key must resolve from the env exactly as the DSN does.
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY = 'pk-live-from-env'
    try {
      const a = mk() // no key in config
      a.capture('x')
      a.flush(true)
      expect(tx.sent[0].ingestKey).toBe('pk-live-from-env')
    } finally {
      delete process.env.NEXT_PUBLIC_PUBLISHABLE_KEY
    }
  })

  it('prefers an explicit ingest key over the build env', () => {
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY = 'pk-live-from-env'
    try {
      const a = mk({ ingestKey: 'pk-live-explicit' })
      a.capture('x')
      a.flush(true)
      expect(tx.sent[0].ingestKey).toBe('pk-live-explicit')
    } finally {
      delete process.env.NEXT_PUBLIC_PUBLISHABLE_KEY
    }
  })

  it('stays keyless when neither config nor env names a key', () => {
    const a = mk()
    a.capture('x')
    a.flush(true)
    expect(tx.sent[0].ingestKey).toBeUndefined()
  })

  it('a signed-in bearer WINS over a key from the build env', () => {
    // The leak this closes: one console bundle is served to several brands, and a
    // pk- names ONE org. If an env-sourced key displaced the bearer, every
    // signed-in user's events would re-file under whichever org minted the key.
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY = 'pk-live-one-org'
    try {
      const a = mk({ getToken: () => 'jwt-of-a-real-person' })
      a.capture('x')
      a.flush()
      expect(tx.sent[0].token).toBe('jwt-of-a-real-person')
      expect(tx.sent[0].ingestKey).toBeUndefined()
    } finally {
      delete process.env.NEXT_PUBLIC_PUBLISHABLE_KEY
    }
  })

  it('an anonymous visitor still rides the key', () => {
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY = 'pk-live-one-org'
    try {
      const a = mk({ getToken: () => undefined })   // logged out
      a.capture('x')
      a.flush()
      expect(tx.sent[0].ingestKey).toBe('pk-live-one-org')
      expect(tx.sent[0].token).toBeUndefined()
    } finally {
      delete process.env.NEXT_PUBLIC_PUBLISHABLE_KEY
    }
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
    // type:'error' is the field Cloud folds to event_type='error' for the warehouse.
    expect(e.type).toBe('error')
    expect(e.event).toBe('boom')
    // The exception rides the TOP-LEVEL `error` field (what cloud foldException
    // reads), NOT properties — a properties-only exception would not be folded.
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
    expect(tx.all[0].product).toBe('test-app')
    // never the tenant — the server stamps it, errors included.
    expect((tx.all[0] as Record<string, unknown>).tenant).toBeUndefined()
  })
})

// ── the error plane ────────────────────────────────────────────────────────
//
// The regression these tests exist to prevent: @hanzo/event 0.3.1 documented
// errors as "lensed server-side into … error tracking (sentry)". No such
// server-side fan-out exists — POST /v1/event stores an event_type='error' row in
// the cloud warehouse and stops there. The result was that every Hanzo property
// silently reported ZERO errors to sentry.hanzo.ai. Reaching Sentry requires the
// client to emit a real Sentry ENVELOPE to the DSN's ingest URL, which is what
// these assert.

// A syntactically real Hanzo-minted DSN. The key is "<version>:<hmac>"; this hmac
// is a dummy (32 zero-bytes hex) — the shape is what the parser cares about, and
// no test performs network I/O.
const TEST_DSN =
  'https://1:' +
  '0'.repeat(64) +
  '@sentry.hanzo.ai/v1/sentry/019f9b1e-5785-7359-ad0b-f75db8e58c99'

describe('error plane', () => {
  it('is INERT without a DSN — nothing sent to sentry, event stream unaffected', () => {
    const a = mk()
    expect(a.errorPlaneEnabled).toBe(false)
    a.captureError(new Error('boom'))
    expect(tx.envelopes).toHaveLength(0)
    // fail-safe: the event stream still carries the error, analytics untouched.
    expect(tx.streams).toHaveLength(1)
    expect(tx.all[0].type).toBe('error')
  })

  it('with a DSN, an error POSTs a Sentry envelope to the DERIVED ingest URL', () => {
    const a = mk({ dsn: TEST_DSN })
    expect(a.errorPlaneEnabled).toBe(true)
    a.captureError(new TypeError('kaboom'))

    expect(tx.envelopes).toHaveLength(1)
    const env = tx.envelopes[0]
    // The exact route the o11y ingest registers, key on the query string.
    expect(env.url).toBe(
      'https://sentry.hanzo.ai/v1/sentry/019f9b1e-5785-7359-ad0b-f75db8e58c99/envelope/' +
        '?sentry_key=1%3A' + '0'.repeat(64),
    )
    expect(env.contentType).toBe('application/x-sentry-envelope')
    expect(a.errorIngestUrl).toBe(env.url)
  })

  it('never sends an /api/ path — Hanzo routes are /v1/ only', () => {
    const a = mk({ dsn: TEST_DSN })
    a.captureError(new Error('x'))
    for (const s of tx.sent) expect(s.url).not.toContain('/api/')
  })

  it('frames a VALID envelope: header / item-header / payload, byte length correct', () => {
    const a = mk({ dsn: TEST_DSN })
    a.captureError(new Error('framing'))
    const lines = tx.envelopes[0].raw.split('\n')
    const header = JSON.parse(lines[0]) as { event_id: string; dsn: string; sent_at: string }
    const item = JSON.parse(lines[1]) as { type: string; length: number }
    const payload = lines[2]

    expect(item.type).toBe('event')
    // The server reads the length-delimited framing first — it must be the UTF-8
    // byte length, not the JS string length.
    expect(item.length).toBe(new TextEncoder().encode(payload).length)
    expect(header.dsn).toBe(
      'https://sentry.hanzo.ai/v1/sentry/019f9b1e-5785-7359-ad0b-f75db8e58c99',
    )
    const ev = JSON.parse(payload) as {
      event_id: string
      exception: { values: { type: string; value: string }[] }
    }
    expect(ev.event_id).toBe(header.event_id)
    expect(ev.exception.values[0].type).toBe('Error')
    expect(ev.exception.values[0].value).toBe('framing')
  })

  it('carries the SAME session + subject identity as the event stream', () => {
    const a = mk({ dsn: TEST_DSN })
    a.identify('user-sub-123')
    a.captureError(new Error('correlate me'))
    const ev = JSON.parse(tx.envelopes[0].raw.split('\n')[2]) as {
      user: { id: string }
      tags: Record<string, string>
    }
    expect(ev.user.id).toBe('user-sub-123')
    const streamed = tx.all.find((e) => e.type === 'error')
    expect(ev.tags.session).toBe(streamed?.sessionId)
    expect(ev.tags.product).toBe('test-app')
  })

  it('an uncaught error is fatal; a reported one is error', () => {
    const a = mk({ dsn: TEST_DSN })
    a.captureError(new Error('uncaught'), { handled: false })
    a.captureError(new Error('reported'))
    const lvl = (i: number) =>
      (JSON.parse(tx.envelopes[i].raw.split('\n')[2]) as { level: string }).level
    expect(lvl(0)).toBe('fatal')
    expect(lvl(1)).toBe('error')
  })

  it('scrubs secrets and PII from the error message before it leaves the browser', () => {
    const a = mk({ dsn: TEST_DSN })
    a.captureError(new Error('login failed for tam@hanzo.ai with hk-' + 'a'.repeat(20)))
    const value = (
      JSON.parse(tx.envelopes[0].raw.split('\n')[2]) as {
        exception: { values: { value: string }[] }
      }
    ).exception.values[0].value
    expect(value).not.toContain('tam@hanzo.ai')
    expect(value).not.toContain('hk-aaaa')
    expect(value).toContain('[email]')
    expect(value).toContain('[redacted]')
  })

  it('does NOT attach the event-stream credential to the sentry request', () => {
    // The two planes authenticate independently: the DSN key rides ?sentry_key=,
    // so a publishable ingest key must not leak onto the error host.
    const a = mk({ dsn: TEST_DSN, ingestKey: 'pk_test.sig', getToken: () => 'jwt-abc' })
    a.captureError(new Error('x'))
    const env = tx.envelopes[0]
    expect(env.ingestKey).toBeUndefined()
    expect(env.token).toBeUndefined()
    expect(env.beacon).toBe(false)
  })

  it('ONE captureError feeds BOTH planes', () => {
    const a = mk({ dsn: TEST_DSN })
    a.captureError(new Error('both'))
    expect(tx.streams).toHaveLength(1)
    expect(tx.envelopes).toHaveLength(1)
  })

  it('a malformed DSN leaves the plane inert rather than throwing', () => {
    const a = mk({ dsn: 'not-a-dsn' })
    expect(a.errorPlaneEnabled).toBe(false)
    expect(() => a.captureError(new Error('x'))).not.toThrow()
    expect(tx.envelopes).toHaveLength(0)
  })

  it('never throws back into the host app when the transport fails', () => {
    const a = mk({ dsn: TEST_DSN })
    tx.send = () => {
      throw new Error('network down')
    }
    expect(() => a.captureError(new Error('x'))).not.toThrow()
  })
})

// ── plane independence under hostile input ─────────────────────────────────
//
// The regression: captureError ran enqueue()+flush() BEFORE sendError(), all in
// one try{}. `properties` is arbitrary caller data — hanzoai/app spreads
// ErrorContext.metadata straight in, and a DOM node, a React synthetic event or
// an axios error are all circular — so serializing the stream threw, the catch
// swallowed it, and the CRASH REPORT WAS NEVER SENT. Both planes went to zero on
// exactly the inputs a real app produces. They must not be able to starve each
// other.

describe('plane independence', () => {
  function circular(): Record<string, unknown> {
    const o: Record<string, unknown> = { name: 'node' }
    o.self = o
    return o
  }
  const throwingGetter = () =>
    Object.defineProperty({}, 'boom', {
      get() {
        throw new Error('getter exploded')
      },
      enumerable: true,
    }) as Record<string, unknown>

  it('circular properties: the error still reaches Sentry', () => {
    const a = mk({ dsn: TEST_DSN })
    a.captureError(new Error('circular payload'), { properties: circular() })
    expect(tx.envelopes).toHaveLength(1)
  })

  it('throwing getter in properties: the error still reaches Sentry', () => {
    const a = mk({ dsn: TEST_DSN })
    a.captureError(new Error('hostile getter'), { properties: throwingGetter() })
    expect(tx.envelopes).toHaveLength(1)
    // The exception survives even though the tag did not.
    const ev = JSON.parse(tx.envelopes[0].raw.split('\n')[2]) as {
      exception: { values: { value: string }[] }
    }
    expect(ev.exception.values[0].value).toBe('hostile getter')
  })

  it('a throwing event-stream transport does not stop the error plane', () => {
    const a = mk({ dsn: TEST_DSN })
    const real = tx.send.bind(tx)
    tx.send = (url, body, opts) => {
      if (opts.contentType !== 'application/x-sentry-envelope') throw new Error('stream down')
      real(url, body, opts)
    }
    a.captureError(new Error('stream is broken'))
    expect(tx.envelopes).toHaveLength(1)
  })

  it('a throwing error-plane transport does not stop the event stream', () => {
    const a = mk({ dsn: TEST_DSN })
    const real = tx.send.bind(tx)
    tx.send = (url, body, opts) => {
      if (opts.contentType === 'application/x-sentry-envelope') throw new Error('sentry down')
      real(url, body, opts)
    }
    a.captureError(new Error('sentry is broken'))
    expect(tx.streams).toHaveLength(1)
  })

  it('one poisoned event never discards previously buffered clean events', () => {
    const a = mk({ dsn: TEST_DSN })
    a.pageview('/one')
    a.capture('clean_event')
    // Now poison the buffer, then force a flush.
    a.capture('poisoned', circular())
    a.flush()
    const names = tx.all.map((e) => e.event)
    expect(names).toContain('$pageview')
    expect(names).toContain('clean_event')
    // The poisoned one is kept too — with its payload replaced, not silently lost.
    const bad = tx.all.find((e) => e.event === 'poisoned')
    expect(bad?.properties).toEqual({ $unserializable: true })
  })

  it('never throws into the host app on any of these', () => {
    const a = mk({ dsn: TEST_DSN })
    expect(() => a.captureError(new Error('x'), { properties: circular() })).not.toThrow()
    expect(() => a.captureError(new Error('y'), { properties: throwingGetter() })).not.toThrow()
  })
})
