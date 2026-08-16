// @vitest-environment jsdom
//
// One page, one stream. The shape under test is the one hanzo.ai serves: the
// component library mounts its telemetry, the app mounts its own provider, and
// each asks for a client for the same (host, product). Measured on production,
// that page put two batches on api.hanzo.ai/v1/event in the same frame — one
// carrying the publishable key (200, accepted 2) and one carrying no
// Authorization at all (401, ingest_key_required) — because the library asked
// first and had no key. Both batches held a $pageview for the same page.
import { describe, it, expect, beforeEach } from 'vitest'
import { Analytics, createAnalytics } from './core'
import { PAGEVIEW } from './events'
import type { Transport, WireEvent } from './types'

const HOST = 'https://api.hanzo.ai'
const KEY = 'pk-CmfLA2K6kvsP'

interface Sent {
  token?: string
  ingestKey?: string
  batch: WireEvent[]
}

class FakeTransport implements Transport {
  sent: Sent[] = []
  send(_url: string, body: string, opts: { token?: string; ingestKey?: string }) {
    this.sent.push({
      token: opts.token,
      ingestKey: opts.ingestKey,
      batch: (JSON.parse(body) as { batch: WireEvent[] }).batch ?? [],
    })
  }
  get all(): WireEvent[] {
    return this.sent.flatMap((s) => s.batch)
  }
  get pageviews(): WireEvent[] {
    return this.all.filter((e) => e.event === PAGEVIEW)
  }
}

let tx: FakeTransport

/** The library's ask: product from the hostname, no key — the env that carries
 *  one is not set on this build. It asks FIRST, as it does in the tree. */
const library = () =>
  createAnalytics({ product: 'site', host: HOST, transport: tx, flushIntervalMs: 999999 })

/** The app's ask: the same stream, with the credential. */
const app = () =>
  createAnalytics({
    product: 'site',
    host: HOST,
    getToken: () => KEY,
    transport: new FakeTransport(),
    flushIntervalMs: 999999,
  })

beforeEach(() => {
  tx = new FakeTransport()
  delete (globalThis as unknown as Record<symbol, unknown>)[Symbol.for('hanzo.event.clients')]
  window.history.replaceState(null, '', '/pricing')
})

describe('one stream, one client', () => {
  it('hands both callers the same client', () => {
    expect(app()).toBe(library())
  })

  it('sends one batch, not two', () => {
    library().pageview('/pricing')
    app().capture('pricing_viewed')
    app().flush()
    expect(tx.sent).toHaveLength(1)
    expect(tx.all).toHaveLength(2)
  })

  it('carries the credential even though the caller without one asked first', () => {
    library().pageview('/pricing')
    app().flush()
    expect(tx.sent).toHaveLength(1)
    expect(tx.sent[0].token).toBe(KEY)
  })

  it('brings up the error plane on the key it adopts', () => {
    const a = createAnalytics({ product: 'console', host: HOST, transport: tx })
    expect(a.errorPlaneEnabled).toBe(false)
    createAnalytics({ product: 'console', host: HOST, ingestKey: KEY })
    expect(a.errorPlaneEnabled).toBe(true)
  })

  it('keeps the first credential rather than overwriting it', () => {
    createAnalytics({ product: 'site', host: HOST, ingestKey: KEY, transport: tx })
    createAnalytics({ product: 'site', host: HOST, ingestKey: 'pk-second' }).capture('x')
    createAnalytics({ product: 'site', host: HOST }).flush()
    expect(tx.sent[0].ingestKey).toBe(KEY)
  })

  it('keeps separate streams separate', () => {
    expect(createAnalytics({ product: 'chat', host: HOST })).not.toBe(
      createAnalytics({ product: 'site', host: HOST }),
    )
    expect(createAnalytics({ product: 'site', host: '' })).not.toBe(
      createAnalytics({ product: 'site', host: HOST }),
    )
  })

  it('leaves new Analytics outside the registry', () => {
    const own = new Analytics({ product: 'site', host: HOST })
    expect(createAnalytics({ product: 'site', host: HOST })).not.toBe(own)
  })

  // The package publishes two entries and the react one carries its own copy of
  // this module, so on a page that imports both there are two module scopes. A
  // registry held in module scope is per-copy and would not dedupe the only case
  // that matters. Two distinct instances of this module, one client.
  it('holds one registry across separate copies of this module', async () => {
    const one = (await import('./core?copy=1')) as typeof import('./core')
    const two = (await import('./core?copy=2')) as typeof import('./core')
    expect(one).not.toBe(two)
    expect(one.createAnalytics({ product: 'site', host: HOST })).toBe(
      two.createAnalytics({ product: 'site', host: HOST, ingestKey: KEY }),
    )
  })
})

describe('one pageview per view', () => {
  it('counts a page once when two emitters both count the first view', () => {
    library().pageview('/pricing') // the library's route hook, on mount
    app().pageview() // the app provider's autoPageview, same frame
    app().flush()
    expect(tx.pageviews).toHaveLength(1)
  })

  it('counts a page once even through one client', () => {
    const a = library()
    a.pageview('/pricing')
    a.pageview('/pricing')
    a.flush()
    expect(tx.pageviews).toHaveLength(1)
  })

  it('counts a route change', () => {
    const a = library()
    a.pageview('/pricing')
    window.history.pushState(null, '', '/docs')
    a.pageview('/docs')
    a.flush()
    expect(tx.pageviews.map((e) => e.path)).toEqual(['/pricing', '/docs'])
  })

  it('counts a return to a page already seen', () => {
    const a = library()
    a.pageview('/pricing')
    a.pageview('/docs')
    a.pageview('/pricing')
    a.flush()
    expect(tx.pageviews).toHaveLength(3)
  })

  it('counts a query change on one path', () => {
    const a = library()
    window.history.replaceState(null, '', '/search?q=a')
    a.pageview('/search')
    window.history.replaceState(null, '', '/search?q=b')
    a.pageview('/search')
    a.flush()
    expect(tx.pageviews).toHaveLength(2)
  })
})
