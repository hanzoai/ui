/**
 * What goes on the wire, asserted from the wire.
 *
 * Every check here reads the request commerce would actually receive, because
 * the failure this pins is invisible from the inside: commerce selects the org
 * as stashed-org -> `X-Org-Id` -> `COMMERCE_SERVICE_ORG` -> `"hanzo"` and never
 * refuses (middleware/accesstoken.go:110,167-173). A name it does not know is
 * not an error — it bills the house org for every tenant, quietly, until someone
 * reads the ledger. Asserting the header the meter MEANT to send would have
 * passed the whole time it was sending one commerce ignores.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Metering } from './metering'

type Seen = { url: string; method: string; headers: Record<string, string>; body?: unknown }

/** Stand in for commerce, and keep what it was asked. */
function listen(reply: unknown = { status: 'ok', data: { available: 500 } }, status = 200) {
  const seen: Seen[] = []
  vi.stubGlobal('fetch', async (input: URL | string, init?: RequestInit) => {
    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries((init?.headers ?? {}) as Record<string, string>)) {
      headers[k.toLowerCase()] = v
    }
    seen.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    })
    return new Response(JSON.stringify(reply), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  })
  return seen
}

const meter = (over: Record<string, unknown> = {}) =>
  new Metering({ baseUrl: 'http://commerce.test', token: 'svc', org: 'acme', ...over })

afterEach(() => vi.unstubAllGlobals())

describe('the org travels under the name commerce reads', () => {
  it('names the org X-Org-Id', async () => {
    const seen = listen()
    await meter().authorize({ user: 'acme/alice' })
    expect(seen[0].headers['x-org-id']).toBe('acme')
  })

  it('does not send X-IAM-Org-Id, which commerce reads nowhere', async () => {
    const seen = listen()
    await meter().authorize({ user: 'acme/alice' })
    expect(seen[0].headers).not.toHaveProperty('x-iam-org-id')
  })

  it('lets a per-call org outrank the default, so one meter serves many tenants', async () => {
    const seen = listen()
    await meter().authorize({ user: 'other/bob', org: 'other' })
    expect(seen[0].headers['x-org-id']).toBe('other')
  })

  it('carries the org on the debit too, not only the gate', async () => {
    const seen = listen({ status: 'ok', data: { transactionId: 't1' } })
    await meter().record({ user: 'acme/alice', org: 'other', amount: 5 })
    expect(seen[0].headers['x-org-id']).toBe('other')
  })
})

describe('the ledger is chosen deliberately', () => {
  it('stays on the live books unless asked otherwise', async () => {
    const seen = listen()
    await meter().authorize({ user: 'acme/alice' })
    expect(seen[0].headers).not.toHaveProperty('x-hanzo-test')
  })

  it('opts into the sandbox books when told to', async () => {
    const seen = listen()
    await meter({ test: true }).authorize({ user: 'acme/alice' })
    expect(seen[0].headers['x-hanzo-test']).toBe('true')
  })
})

describe('the gate is closed when the answer is unknown', () => {
  it('denies with 503-shaped reason when commerce cannot answer', async () => {
    listen({ detail: 'nope' }, 500)
    expect(await meter().authorize({ user: 'acme/alice' })).toEqual({
      allowed: false,
      reason: 'balance_unavailable',
    })
  })

  it('denies with 402-shaped reason when the balance is spent', async () => {
    listen({ status: 'ok', data: { available: 0 } })
    const d = await meter().authorize({ user: 'acme/alice' })
    expect(d.allowed).toBe(false)
    expect(d.reason).toBe('insufficient_balance')
  })

  it('opens only where a product said availability outranks revenue', async () => {
    listen({ detail: 'nope' }, 500)
    expect((await meter({ failOpen: true }).authorize({ user: 'acme/alice' })).allowed).toBe(true)
  })

  it('allows everything when no commerce is configured, so local dev needs no token', async () => {
    const seen = listen()
    expect((await new Metering({}).authorize({ user: 'acme/alice' })).allowed).toBe(true)
    expect(seen).toHaveLength(0)
  })
})

describe('the addresses are the ones the API serves', () => {
  it('gates on the balance, and on the tier when asked', async () => {
    const bare = listen()
    await meter().authorize({ user: 'acme/alice' })
    expect(bare[0].url).toContain('/v1/billing/balance')

    vi.unstubAllGlobals()
    const tiered = listen({ status: 'ok', data: { balance: { effectiveAvailable: 10 } } })
    await meter({ tierAware: true }).authorize({ user: 'acme/alice' })
    expect(tiered[0].url).toContain('/v1/billing/tier')
  })

  it('debits by POST, with the org outside the body', async () => {
    const seen = listen({ status: 'ok', data: { transactionId: 't1' } })
    await meter().record({ user: 'acme/alice', amount: 5, model: 'zen' })
    expect(seen[0].method).toBe('POST')
    expect(seen[0].url).toContain('/v1/billing/usage')
    expect(seen[0].body).toMatchObject({ user: 'acme/alice', amount: 5 })
    expect(seen[0].body).not.toHaveProperty('org')
  })

  it('writes nothing for usage that costs nothing', async () => {
    const seen = listen()
    expect(await meter().record({ user: 'acme/alice', amount: 0 })).toBeNull()
    expect(seen).toHaveLength(0)
  })
})
