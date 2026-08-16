// The DEFAULT transport — what every surface that does not supply its own gets,
// exercised through the real `Analytics` rather than a stub, because the two
// properties below are properties of the shipped object and nothing else.
//
// Both are invisible to a test that reads the batch: the body is identical either
// way. What decides whether the batch ARRIVES is the beacon's content type (which
// decides whether the browser sends it at all) and what the code does with
// sendBeacon's answer (which decides whether a refusal is retried or dropped).

import { describe, it, expect } from 'vitest'
import { Analytics } from './core'

/** One thing navigator.sendBeacon was handed. */
interface Beaconed {
  url: string
  type: string
  body: string
}

/** One thing fetch was handed. */
interface Fetched {
  url: string
  headers: Record<string, string>
  body: string
}

// The three CORS-safelisted request content types. A POST whose body carries one
// of these is a SIMPLE request and is sent immediately; anything else is
// PREFLIGHTED, and an unloading document never gets the preflight's second round
// trip — so cross-origin, a non-safelisted beacon is not delayed, it is lost.
const CORS_SAFELISTED = new Set([
  'text/plain',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
])

/** Runs ONE unload flush of the real DefaultTransport against a stub browser.
 *  `queued` is what navigator.sendBeacon answers — true when the agent accepts the
 *  batch, false when it refuses (a body past the beacon size limit, or a full
 *  queue). Globals are DEFINED and restored: Node ships a real `navigator` whose
 *  descriptor has no setter, so a plain assignment throws. */
function unloadFlush(queued: boolean): { beacons: Beaconed[]; fetches: Fetched[] } {
  const beacons: Beaconed[] = []
  const fetches: Fetched[] = []
  const g = globalThis as Record<string, unknown>
  const names = ['window', 'document', 'navigator', 'Blob', 'fetch']
  const saved = names.map((n) => [n, Object.getOwnPropertyDescriptor(g, n)] as const)
  const define = (name: string, value: unknown) =>
    Object.defineProperty(g, name, { value, configurable: true, writable: true })

  define('window', {
    location: { href: 'https://acme.test/checkout', pathname: '/checkout', search: '' },
    addEventListener: () => {},
  })
  define('document', { referrer: '', visibilityState: 'visible' })
  define('navigator', {
    sendBeacon: (url: string, blob: { type: string; body: string }) => {
      beacons.push({ url, type: blob.type, body: blob.body })
      return queued
    },
  })
  define(
    'Blob',
    class {
      type: string
      body: string
      constructor(parts: string[], opts?: { type?: string }) {
        this.body = parts.join('')
        this.type = opts?.type ?? ''
      }
    },
  )
  define('fetch', (url: string, init: { headers: Record<string, string>; body: string }) => {
    fetches.push({ url, headers: init.headers, body: init.body })
    return Promise.resolve({ ok: true, status: 200 })
  })

  try {
    // No `transport`, so the client builds the real DefaultTransport. The key is
    // explicit rather than inherited from the build env, so the assertions below
    // are about this batch and not about the machine running them.
    const a = new Analytics({ product: 'test', ingestKey: 'pk-abc123', captureErrors: false })
    a.capture('checkout_started')
    a.flush(true)
  } finally {
    for (const [n, d] of saved) {
      if (d) Object.defineProperty(g, n, d)
      else delete g[n]
    }
  }
  return { beacons, fetches }
}

describe('the unload beacon', () => {
  it('is a CORS-simple request, so an unloading document actually sends it', () => {
    const { beacons, fetches } = unloadFlush(true)
    expect(beacons).toHaveLength(1)

    // The load-bearing assertion. A non-safelisted type preflights, and there is
    // no second round trip during unload.
    expect(CORS_SAFELISTED.has(beacons[0].type)).toBe(true)

    // The other half of what makes it simple: a beacon can set no headers, so the
    // credential rides the query. An Authorization header would preflight whatever
    // the body's type is.
    expect(beacons[0].url).toBe('https://api.hanzo.ai/v1/event?ingest_key=pk-abc123')

    // A queued batch is sent ONCE. Falling through here would double-count every
    // unload event in the warehouse.
    expect(fetches).toHaveLength(0)
  })

  it('falls through to the keepalive fetch when the agent refuses to queue it', () => {
    const { beacons, fetches } = unloadFlush(false)

    // Offered to the beacon first...
    expect(beacons).toHaveLength(1)

    // ...and, refused, carried by the fetch sitting behind it rather than dropped.
    expect(fetches).toHaveLength(1)
    const batch = (JSON.parse(fetches[0].body) as { batch: { event?: string }[] }).batch
    expect(batch.map((e) => e.event)).toContain('checkout_started')
    expect(fetches[0].headers.Authorization).toBe('Bearer pk-abc123')
  })
})
