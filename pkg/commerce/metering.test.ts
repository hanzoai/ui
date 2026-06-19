/**
 * Contract tests for @hanzo/commerce/metering.
 *
 * Self-contained: mocks global fetch and asserts the exact commerce wire
 * contract, mirroring github.com/hanzoai/go-sdk/metering's tests so the two
 * clients gate on the identical balance source. Runnable standalone with:
 *
 *   npx -y -p typescript@5.9.3 -p tsx tsx pkg/commerce/metering.test.ts
 *
 * It uses no test-runner dependency (the package ships none); a tiny harness
 * below prints PASS/FAIL and exits non-zero on failure.
 */

import { Metering, identityFromHeaders } from './metering'

// ---- tiny assert harness ----
let failures = 0
let count = 0
function test(name: string, fn: () => Promise<void> | void) {
  count++
  Promise.resolve()
    .then(fn)
    .then(() => console.log(`ok   - ${name}`))
    .catch((err) => {
      failures++
      console.error(`FAIL - ${name}\n       ${err?.message ?? err}`)
    })
}
function eq(actual: unknown, expected: unknown, msg = '') {
  if (actual !== expected) throw new Error(`${msg} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}
function ok(cond: boolean, msg = '') {
  if (!cond) throw new Error(msg || 'expected true')
}

// ---- fetch mock ----
type Captured = { url: string; method: string; headers: Record<string, string>; body: unknown }
function mockFetch(status: number, json: unknown): { restore: () => void; last: () => Captured | null } {
  const original = globalThis.fetch
  let last: Captured | null = null
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const hdrs: Record<string, string> = {}
    const h = init?.headers as Record<string, string> | undefined
    if (h) for (const [k, v] of Object.entries(h)) hdrs[k.toLowerCase()] = v as string
    last = {
      url: input.toString(),
      method: init?.method ?? 'GET',
      headers: hdrs,
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    }
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: `HTTP ${status}`,
      json: async () => json,
      text: async () => JSON.stringify(json),
    } as Response
  }) as typeof fetch
  return { restore: () => { globalThis.fetch = original }, last: () => last }
}

const BASE = 'http://commerce.test'

test('authorize allows when available > 0 and hits the canonical contract', async () => {
  const fx = mockFetch(200, { user: 'hanzo/alice', currency: 'usd', balance: 5000, holds: 0, available: 5000 })
  const meter = new Metering({ baseUrl: BASE, token: 'svc-token', org: 'hanzo' })
  const d = await meter.authorize({ user: 'hanzo/alice' })
  fx.restore()

  ok(d.allowed, 'should allow')
  eq(d.available, 5000, 'available')
  const c = fx.last()!
  eq(c.method, 'GET', 'method')
  ok(c.url.startsWith(`${BASE}/v1/billing/balance?`), `url=${c.url}`)
  ok(c.url.includes('user=hanzo%2Falice'), `url must url-encode user: ${c.url}`)
  ok(c.url.includes('currency=usd'), `url must carry currency: ${c.url}`)
  eq(c.headers['authorization'], 'Bearer svc-token', 'bearer')
  eq(c.headers['x-iam-org-id'], 'hanzo', 'org header')
})

test('authorize denies (insufficient) when available == 0', async () => {
  const fx = mockFetch(200, { available: 0 })
  const meter = new Metering({ baseUrl: BASE, token: 't', org: 'hanzo' })
  const d = await meter.authorize({ user: 'hanzo/alice' })
  fx.restore()
  ok(!d.allowed, 'should deny')
  eq(d.reason, 'insufficient_balance', 'reason')
})

test('authorize fail-closed on commerce error (503/unavailable)', async () => {
  const fx = mockFetch(500, { error: 'boom' })
  const meter = new Metering({ baseUrl: BASE, token: 't', org: 'hanzo' })
  const d = await meter.authorize({ user: 'hanzo/alice' })
  fx.restore()
  ok(!d.allowed, 'fail-closed must deny on 500')
  eq(d.reason, 'balance_unavailable', 'reason')
})

test('authorize fail-open allows on commerce error when configured', async () => {
  const fx = mockFetch(503, { error: 'down' })
  const meter = new Metering({ baseUrl: BASE, token: 't', org: 'hanzo', failOpen: true })
  const d = await meter.authorize({ user: 'hanzo/alice' })
  fx.restore()
  ok(d.allowed, 'fail-open must allow')
})

test('authorize not-configured allows', async () => {
  const meter = new Metering({}) // no baseUrl
  ok(!meter.enabled, 'enabled should be false')
  const d = await meter.authorize({ user: 'hanzo/alice' })
  ok(d.allowed, 'not-configured must allow')
})

test('tier-aware authorize uses effectiveAvailable and hits /v1/billing/tier', async () => {
  const fx = mockFetch(200, { user: 'hanzo/alice', tier: { name: 'free' }, balance: { currency: 'usd', prepaidAvailable: 0, dailyRemaining: 100, effectiveAvailable: 100 } })
  const meter = new Metering({ baseUrl: BASE, token: 't', org: 'hanzo', tierAware: true })
  const d = await meter.authorize({ user: 'hanzo/alice' })
  fx.restore()
  ok(d.allowed, 'included allotment should allow')
  eq(d.available, 100, 'effective available')
  ok(fx.last()!.url.startsWith(`${BASE}/v1/billing/tier?`), `tier url=${fx.last()!.url}`)
})

test('tier-aware authorize denies when effectiveAvailable == 0', async () => {
  const fx = mockFetch(200, { balance: { effectiveAvailable: 0, prepaidAvailable: 0, dailyRemaining: 0, currency: 'usd' } })
  const meter = new Metering({ baseUrl: BASE, token: 't', org: 'hanzo', tierAware: true })
  const d = await meter.authorize({ user: 'hanzo/alice' })
  fx.restore()
  ok(!d.allowed && d.reason === 'insufficient_balance', 'exhausted must deny insufficient')
})

test('per-call org overrides default', async () => {
  const fx = mockFetch(200, { available: 1 })
  const meter = new Metering({ baseUrl: BASE, token: 't', org: 'hanzo' })
  await meter.authorize({ user: 'zoo/bob', org: 'zoo' })
  fx.restore()
  eq(fx.last()!.headers['x-iam-org-id'], 'zoo', 'per-call org override')
})

test('record posts canonical payload', async () => {
  const fx = mockFetch(201, { transactionId: 'tx_123', user: 'hanzo/alice', amount: 250, currency: 'usd', type: 'withdraw' })
  const meter = new Metering({ baseUrl: BASE, token: 'svc-token', org: 'hanzo' })
  const res = await meter.record({ user: 'hanzo/alice', amount: 250, provider: 'search', requestId: 'req-9', status: 'success' })
  fx.restore()

  ok(res !== null && res.transactionId === 'tx_123' && res.amount === 250, 'record result')
  const c = fx.last()!
  eq(c.method, 'POST', 'method')
  eq(c.url, `${BASE}/v1/billing/usage`, 'usage url')
  eq(c.headers['authorization'], 'Bearer svc-token', 'bearer')
  eq(c.headers['x-iam-org-id'], 'hanzo', 'org header')
  const b = c.body as Record<string, unknown>
  eq(b.user, 'hanzo/alice', 'body.user')
  eq(b.amount, 250, 'body.amount')
  eq(b.currency, 'usd', 'body.currency defaulted')
  eq(b.provider, 'search', 'body.provider')
  eq(b.requestId, 'req-9', 'body.requestId')
  ok(!('org' in b), 'org must not leak into the body')
})

test('record zero-amount is a no-op (no fetch)', async () => {
  const fx = mockFetch(200, {})
  const meter = new Metering({ baseUrl: BASE, token: 't', org: 'hanzo' })
  const res = await meter.record({ user: 'hanzo/alice', amount: 0 })
  fx.restore()
  ok(res === null, 'zero-amount returns null')
  ok(fx.last() === null, 'zero-amount must not call commerce')
})

test('record not-configured is a no-op', async () => {
  const meter = new Metering({})
  const res = await meter.record({ user: 'hanzo/alice', amount: 100 })
  ok(res === null, 'not-configured returns null')
})

test('fromEnv applies defaults and reads KMS-sourced token', () => {
  const meter = Metering.fromEnv({ COMMERCE_SERVICE_TOKEN: 'kms-token', METERING_TIER_AWARE: 'true' })
  ok(meter.enabled, 'fromEnv default base URL enables the meter')
})

test('fromEnv honors METERING_DISABLED', () => {
  const meter = Metering.fromEnv({ METERING_DISABLED: 'true', COMMERCE_URL: BASE })
  ok(!meter.enabled, 'disabled must not be enabled')
})

test('identityFromHeaders builds org/sub from gateway headers', () => {
  const id = identityFromHeaders({ 'x-org-id': 'zoo', 'x-user-id': 'bob' })
  eq(id.user, 'zoo/bob', 'user')
  eq(id.org, 'zoo', 'org')
})

// summary
setTimeout(() => {
  if (failures > 0) {
    console.error(`\n${failures}/${count} tests FAILED`)
    process.exit(1)
  }
  console.log(`\nall ${count} tests passed`)
}, 200)
