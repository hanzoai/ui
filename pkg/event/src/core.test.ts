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
}

let tx: FakeTransport
// Default to same-origin (host:'') so path assertions read the bare /v1/event path;
// tests that care about the edge host pass it explicitly.
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
    // The body is the canonical { batch: [...] } envelope, exactly one entry point.
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
    // ONE POST, ONE endpoint, ONE batched envelope.
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

    // A share link keeps its secret in the fragment, which a browser never sends
    // to a server. Stamped from window.location.href, it reached /v1/event on
    // every event of the page, and a 43-character base64url secret matches no
    // other secret shape. The fragment is dropped from every stamped location.
    it('never sends a fragment', () => {
      const secret = 'Zq3LwX0p-Tf9_aB7kQmN2rS8vY1cD4eF6gH5jK0lMnO'
      withLocation('https://hanzo.ai/chat/shared#' + secret, 'https://hanzo.ai/login#' + secret, () => {
        const a = mk()
        a.pageview()
        a.capture('$click')
        a.flush()
        for (const e of tx.all) {
          expect(JSON.stringify(e)).not.toContain(secret)
          expect(e.url).toBe('https://hanzo.ai/chat/shared')
          expect(e.referrer).toBe('https://hanzo.ai/login')
        }
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
    // for a logged-out visitor, the edge refuses the write, and the page shows no
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

  it('stays keyless when neither config nor env names a key — no baked literal', () => {
    // The key comes from ONE live source (config or the KMS-sourced env); nothing
    // is hardcoded, so a surface that provides neither is honestly keyless.
    const a = mk({ host: 'https://api.hanzo.ai' })
    a.capture('x')
    a.flush(true)
    expect(tx.sent[0].ingestKey).toBeUndefined()
  })

  it('a signed-in page sends the key AND the bearer; the bearer never replaces the key', () => {
    // The person is the bearer and the project is the key. The server files the event
    // under the key's project only when it belongs to the bearer's own org, so a key
    // from the build env cannot re-file a person's events under another org.
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY = 'pk-live-one-org'
    try {
      const a = mk({ getToken: () => 'jwt-of-a-real-person' })
      a.capture('x')
      a.flush()
      expect(tx.sent[0].token).toBe('jwt-of-a-real-person')
      expect(tx.sent[0].ingestKey).toBe('pk-live-one-org')
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

describe('error capture', () => {
  it('is ONE type:error event on the one endpoint, not a second plane', () => {
    const a = mk({ host: 'https://api.hanzo.ai', release: 'r1', environment: 'production' })
    a.captureError(new TypeError('boom'))
    expect(tx.sent).toHaveLength(1)
    expect(tx.sent[0].url).toBe('https://api.hanzo.ai/v1/event')
    expect(tx.all).toHaveLength(1)
    const e = tx.all[0]
    expect(e.type).toBe('error')
    expect(e.event).toBeUndefined()
    expect(e.error?.type).toBe('TypeError')
    expect(e.error?.message).toBe('boom')
    expect(e.error?.stack).toBeTruthy()
    expect(Array.isArray(e.error?.frames)).toBe(true)
    expect(e.error?.handled).toBe(true)
    expect(e.level).toBe('error')
    expect(e.release).toBe('r1')
    expect(e.environment).toBe('production')
    expect(e.product).toBe('test-app')
    expect((e as Record<string, unknown>).tenant).toBeUndefined()
  })

  it('never sends a Sentry envelope or a $exception event', () => {
    const a = mk()
    a.captureError(new Error('x'))
    expect(tx.sent.every((s) => s.contentType === undefined)).toBe(true)
    expect(tx.all.some((e) => e.event === '$exception')).toBe(false)
  })

  it('normalizes a thrown string into an exception', () => {
    const a = mk()
    a.captureError('plain failure')
    expect(tx.all[0].error?.message).toBe('plain failure')
  })

  it('an unhandled error is fatal and carries caller properties', () => {
    const a = mk()
    a.captureError(new Error('unhandled'), { handled: false, properties: { source: 'onerror' } })
    const e = tx.all[0]
    expect(e.error?.handled).toBe(false)
    expect(e.level).toBe('fatal')
    expect((e.properties as Record<string, unknown>).source).toBe('onerror')
  })

  it('circular properties do not lose the report', () => {
    const a = mk()
    const loop: Record<string, unknown> = {}
    loop.self = loop
    a.captureError(new Error('x'), { properties: loop })
    expect(tx.sent).toHaveLength(1)
    expect(tx.all[0].error?.message).toBe('x')
  })
})

describe('a driven browser', () => {
  const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const drive = (webdriver: boolean) =>
    Object.defineProperty(globalThis, 'navigator', { value: { webdriver, userAgent: 'UA' }, configurable: true, writable: true })

  it('marks every event internal, so cloud keeps it off ad platforms and out of real traffic', () => {
    drive(true)
    try {
      const a = mk()
      a.capture(EVENTS.SIGNUP_COMPLETED, { plan: 'pro' })
      a.capture('landing_viewed')
      a.flush()
      expect(tx.all.map((e) => e.properties?.internal)).toEqual([true, true])
      expect(tx.all[0].properties?.plan).toBe('pro')
    } finally {
      if (nav) Object.defineProperty(globalThis, 'navigator', nav)
    }
  })

  it('marks the events of a browser cloud named the team’s', async () => {
    drive(false)
    const jar = new Map<string, string>()
    const g = globalThis as Record<string, unknown>
    g.window = {
      location: { hostname: 'hanzo.ai', protocol: 'https:', search: '', href: 'https://hanzo.ai/' },
      addEventListener: () => undefined,
    }
    g.document = {
      get cookie() {
        return [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
      },
      set cookie(line: string) {
        const [pair] = line.split(';')
        const i = pair.indexOf('=')
        jar.set(pair.slice(0, i), pair.slice(i + 1))
      },
    }
    try {
      const { mark } = await import('./automated')
      mark()
      const a = mk()
      a.capture(EVENTS.SIGNUP_COMPLETED, { plan: 'pro' })
      a.flush()
      expect(tx.all[0].properties?.internal).toBe(true)
    } finally {
      delete g.window
      delete g.document
      if (nav) Object.defineProperty(globalThis, 'navigator', nav)
    }
  })

  it('leaves a person’s events unmarked', () => {
    drive(false)
    try {
      const a = mk()
      a.capture(EVENTS.SIGNUP_COMPLETED, { plan: 'pro' })
      a.flush()
      expect(tx.all[0].properties).toEqual({ plan: 'pro' })
    } finally {
      if (nav) Object.defineProperty(globalThis, 'navigator', nav)
    }
  })
})
