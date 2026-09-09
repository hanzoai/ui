/**
 * @hanzo/commerce/metering
 *
 * The ONE way every Hanzo product meters usage to commerce — the single
 * billing source of truth — so that everything (not only the LLM/cloud path)
 * can be paid for. This is the TypeScript counterpart of
 * github.com/hanzoai/go-sdk/metering; the two share an identical wire contract.
 *
 * It provides two operations against commerce's canonical billing API:
 *
 *   - authorize(): a pre-request balance gate. Fail-closed by default — if the
 *     balance cannot be determined the request is denied, exactly like the
 *     gateway's prepaid-balance gate. With tierAware it consults the effective
 *     balance (prepaid + included plan allotment, e.g. the free-tier daily
 *     credit) so included usage is honored before prepaid funds.
 *
 *   - record(): a post-request usage write that debits the user's balance.
 *
 * Composition over duplication: this wraps the existing {@link Commerce}
 * client (GET /v1/billing/balance, GET /v1/billing/tier, POST /v1/billing/usage)
 * rather than re-implementing the HTTP layer.
 *
 * Auth is the commerce service token (admin-scoped S2S), sent as
 * `Authorization: Bearer <token>` plus the tenant org as `X-Org-Id`. The
 * token is a secret and MUST come from KMS (the operator wires it into
 * COMMERCE_SERVICE_TOKEN); this module never reads it from disk.
 *
 * @example
 * ```ts
 * import { Metering } from '@hanzo/commerce/metering'
 *
 * const meter = Metering.fromEnv()  // COMMERCE_URL + COMMERCE_SERVICE_TOKEN (KMS) + COMMERCE_SERVICE_ORG
 *
 * // Pre-request gate (fail-closed).
 * const gate = await meter.authorize({ user: 'hanzo/alice' })
 * if (!gate.allowed) {
 *   res.status(gate.reason === 'insufficient_balance' ? 402 : 503).end()
 *   return
 * }
 *
 * // ... do the work, compute cost ...
 *
 * // Post-request record (best-effort).
 * await meter.record({ user: 'hanzo/alice', amount: 5, provider: 'search' })
 * ```
 */

import { Commerce, CommerceApiError } from './client'

/** Canonical in-cluster commerce address (matches the gateway default). */
export const DEFAULT_COMMERCE_URL = 'http://commerce.hanzo.svc.cluster.local:8001'

export type MeteringConfig = {
  /**
   * Commerce base URL (no /v1 suffix). When empty the meter is in
   * "not configured" mode: authorize allows and record is a no-op.
   */
  baseUrl?: string
  /** Commerce service token (admin-scoped S2S). MUST be KMS-sourced. */
  token?: string
  /** Default tenant org slug sent as X-Org-Id (default "hanzo"). */
  org?: string
  /**
   * Gate on the tier-aware effective balance (prepaid + included plan
   * allotment) instead of the bare prepaid balance. Default false.
   */
  tierAware?: boolean
  /**
   * Allow-on-error. Default false (fail-closed, like the gateway). Set true
   * only where availability outranks billing.
   */
  failOpen?: boolean
  /** Request timeout in ms. Default 5000 (the gateway's value). */
  timeoutMs?: number
  /**
   * Send every call to commerce's TEST ledger (org.Live=false), so balances and
   * debits hit the sandbox books rather than real money. The Go meter spells
   * this the same way; a product opts in with METERING_TEST.
   */
  test?: boolean
}

/** Who to authorize / charge. user is the IAM "org/sub" identity. */
export type MeteringIdentity = {
  user: string
  org?: string
  currency?: string
}

/** One usage event to record. Mirrors commerce's usageRequest one-for-one. */
export type UsageEvent = {
  user: string
  org?: string
  /** Cost to debit, in cents. */
  amount: number
  currency?: string
  model?: string
  provider?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  requestId?: string
  premium?: boolean
  stream?: boolean
  status?: string
  clientIp?: string
}

/** Result of a usage write. */
export type RecordResult = {
  transactionId: string
  user: string
  amount: number
  currency: string
  type: string
}

/** Outcome of an authorize() gate. */
export type AuthDecision = {
  allowed: boolean
  /** 'insufficient_balance' -> 402 ; 'balance_unavailable' -> 503 (fail-closed). */
  reason?: 'insufficient_balance' | 'balance_unavailable'
  /** Spendable balance in cents that the decision was based on (when known). */
  available?: number
}

/**
 * Metering is the server-side hook a product uses to charge for usage. It is
 * safe to share a single instance across requests.
 */
export class Metering {
  private readonly commerce: Commerce | null
  private readonly org: string
  private readonly tierAware: boolean
  private readonly failOpen: boolean
  private readonly test: boolean

  constructor(config: MeteringConfig = {}) {
    const baseUrl = (config.baseUrl ?? '').replace(/\/+$/, '')
    this.commerce = baseUrl
      ? new Commerce({ baseUrl, token: config.token, timeoutMs: config.timeoutMs ?? 5000 })
      : null
    this.org = (config.org ?? '').trim()
    this.tierAware = config.tierAware ?? false
    this.failOpen = config.failOpen ?? false
    this.test = config.test ?? false
  }

  /**
   * Build a Metering instance from the canonical environment variables. This
   * is the one-liner products use at startup. Honors METERING_DISABLED for
   * local dev.
   */
  static fromEnv(env: Record<string, string | undefined> = readEnv()): Metering {
    if (truthy(env.METERING_DISABLED)) return new Metering({})
    return new Metering({
      baseUrl: (env.COMMERCE_URL ?? '').trim() || DEFAULT_COMMERCE_URL,
      token: env.COMMERCE_SERVICE_TOKEN,
      org: (env.COMMERCE_SERVICE_ORG ?? '').trim() || 'hanzo',
      tierAware: truthy(env.METERING_TIER_AWARE),
      failOpen: truthy(env.METERING_FAIL_OPEN),
      test: truthy(env.METERING_TEST),
    })
  }

  /** Whether a commerce base URL is configured. */
  get enabled(): boolean {
    return this.commerce !== null
  }

  /** The headers every call carries: which org, and which ledger. */
  private wire(org?: string): Record<string, string> | undefined {
    const h = { ...orgHeader(org ?? this.org), ...(this.test ? { 'X-Hanzo-Test': 'true' } : {}) }
    return Object.keys(h).length ? h : undefined
  }

  /**
   * Pre-request balance gate. Never throws — returns a decision so callers map
   * it to a status code. When not configured it always allows.
   *
   * Outcomes (matching the gateway):
   *   { allowed: true }                                    -> allow.
   *   { allowed: false, reason: 'insufficient_balance' }   -> 402 (out of funds).
   *   { allowed: false, reason: 'balance_unavailable' }    -> 503 (fail-closed).
   */
  async authorize(id: MeteringIdentity): Promise<AuthDecision> {
    if (!this.commerce) return { allowed: true }

    const user = (id.user ?? '').trim()
    if (!user) {
      return this.failOpen ? { allowed: true } : { allowed: false, reason: 'balance_unavailable' }
    }

    const headers = this.wire(id.org)
    try {
      const available = this.tierAware
        ? (await this.commerce.getBillingTier<{ balance: { effectiveAvailable: number } }>({ headers })).balance.effectiveAvailable
        : (await this.commerce.getBillingBalance<{ available: number }>({ headers })).available

      if (available > 0) return { allowed: true, available }
      return { allowed: false, reason: 'insufficient_balance', available }
    } catch {
      // Balance unknown (commerce unreachable / non-2xx).
      if (this.failOpen) return { allowed: true }
      return { allowed: false, reason: 'balance_unavailable' }
    }
  }

  /**
   * Record a usage event, debiting the user's balance. No-op when not
   * configured or amount <= 0 (commerce treats zero-cost usage as skipped).
   * Decoupled from gating: the work already happened, so balance is not
   * re-checked here. Returns null on no-op.
   */
  async record(usage: UsageEvent): Promise<RecordResult | null> {
    if (!this.commerce || usage.amount <= 0) return null
    if (!usage.user?.trim()) throw new Error('metering: record requires a user')

    const headers = this.wire(usage.org)
    // Commerce's usageRequest field names map one-for-one; org travels via the
    // header, never the body.
    const body = {
      user: usage.user,
      currency: usage.currency ?? 'usd',
      amount: usage.amount,
      model: usage.model,
      provider: usage.provider,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      requestId: usage.requestId,
      premium: usage.premium,
      stream: usage.stream,
      status: usage.status,
      clientIp: usage.clientIp,
    }
    const tx = await this.commerce.request<RecordResult>('POST', '/v1/billing/usage', { body, headers })
    // Commerce returns { transactionId, user, amount, currency, type }.
    return tx as unknown as RecordResult
  }

  /**
   * Convenience for products that prefer to throw on denial. Throws a
   * {@link CommerceApiError} with status 402 (insufficient) or 503 (unknown).
   */
  async authorizeOrThrow(id: MeteringIdentity): Promise<void> {
    const decision = await this.authorize(id)
    if (decision.allowed) return
    if (decision.reason === 'insufficient_balance') {
      throw new CommerceApiError(402, 'Insufficient balance. Please add credits at console.hanzo.ai', undefined)
    }
    throw new CommerceApiError(503, 'Billing temporarily unavailable', undefined)
  }
}

// ---------------------------------------------------------------------------
// Identity from gateway-minted headers (the trust boundary)
// ---------------------------------------------------------------------------

/** Gateway-minted identity headers. */
export const HEADER_USER_ID = 'x-user-id'
export const HEADER_ORG_ID = 'x-org-id'

/**
 * Build a {@link MeteringIdentity} from gateway-minted identity headers. The
 * user is "{org}/{sub}" (commerce's iam-user form) when both are present.
 * Accepts a header bag with string | string[] | undefined values (Node http,
 * Next.js, fetch Headers via Object.fromEntries).
 */
export function identityFromHeaders(
  headers: Record<string, string | string[] | undefined> | Headers,
): MeteringIdentity {
  const get = (k: string): string => {
    if (typeof (headers as Headers).get === 'function') {
      return ((headers as Headers).get(k) ?? '').trim()
    }
    const v = (headers as Record<string, string | string[] | undefined>)[k]
    return (Array.isArray(v) ? v[0] : v ?? '').trim()
  }
  const org = get(HEADER_ORG_ID)
  const sub = get(HEADER_USER_ID)
  const user = org && sub ? `${org}/${sub}` : sub
  return { user, org }
}

// ---------------------------------------------------------------------------
// internals
// ---------------------------------------------------------------------------

/**
 * The org this usage belongs to, under the one name commerce reads.
 *
 * `X-Org-Id`, and getting it wrong is SILENT. Commerce selects the org as
 * stashed-org -> `X-Org-Id` -> `COMMERCE_SERVICE_ORG` -> `"hanzo"` and never
 * refuses (middleware/accesstoken.go:110,167-173), so a name it does not know
 * is not an error — it debits the house org for every tenant. This sent
 * `X-IAM-Org-Id`, which commerce reads nowhere.
 *
 * `X-Hanzo-Org` is a real header but travels the other way: cloud stamps it on
 * responses as the acting org. Request header in, guardrail out.
 */
function orgHeader(org: string): Record<string, string> | undefined {
  const o = (org ?? '').trim()
  return o ? { 'X-Org-Id': o } : undefined
}

function truthy(v: string | undefined): boolean {
  const s = (v ?? '').trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

function readEnv(): Record<string, string | undefined> {
  // Node/edge: process.env when present, else empty (browser).
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  return g.process?.env ?? {}
}
