/**
 * @hanzo/commerce/client
 *
 * TypeScript client for the Hanzo Commerce API.
 * Handles billing, subscriptions, payments, usage, plans — all commerce operations.
 *
 * @example
 * ```ts
 * import { Commerce } from '@hanzo/commerce'
 *
 * const commerce = new Commerce({
 *   commerceUrl: 'https://commerce.hanzo.ai',
 *   token: iamAccessToken,
 * })
 *
 * // Balance
 * const balance = await commerce.getBalance('hanzo/alice')
 *
 * // Usage
 * await commerce.addUsageRecord({ user: 'hanzo/alice', amount: 150, model: 'claude-opus-4-6' })
 *
 * // Subscribe
 * await commerce.subscribe({ planId: 'growth', userId: 'hanzo/alice' })
 *
 * // Charge
 * await commerce.charge(orderId)
 * ```
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type CommerceClientConfig = {
  /** Commerce API base URL (e.g. "https://commerce.hanzo.ai"). */
  commerceUrl: string
  /** Optional IAM access token for authenticated requests. */
  token?: string
}


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Balance = {
  balance: number
  holds: number
  available: number
}

export type Transaction = {
  id?: string
  owner?: string
  type: 'hold' | 'hold-removed' | 'transfer' | 'deposit' | 'withdraw'
  destinationId?: string
  destinationKind?: string
  sourceId?: string
  sourceKind?: string
  currency: string
  amount: number
  tags?: string[]
  expiresAt?: string
  metadata?: Record<string, unknown>
  createdAt?: string
}

export type Subscription = {
  id?: string
  planId?: string
  userId?: string
  status?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | string
  billingType?: 'charge_automatically' | 'send_invoice'
  periodStart?: string
  periodEnd?: string
  trialStart?: string
  trialEnd?: string
  quantity?: number
  createdAt?: string
}

export type Plan = {
  slug?: string
  name?: string
  description?: string
  price?: number
  currency?: string
  interval?: 'monthly' | 'yearly' | string
  intervalCount?: number
  trialPeriodDays?: number
  metadata?: Record<string, unknown>
}

export type Payment = {
  id?: string
  orderId?: string
  userId?: string
  amount?: number
  amountRefunded?: number
  fee?: number
  currency?: string
  status?: 'cancelled' | 'credit' | 'disputed' | 'failed' | 'fraudulent' | 'paid' | 'refunded' | 'unpaid' | string
  captured?: boolean
  live?: boolean
  createdAt?: string
}

export type UsageRecord = {
  user: string
  currency?: string
  amount: number
  model?: string
  provider?: string
  tokens?: number
  promptTokens?: number
  completionTokens?: number
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 10_000

export class Commerce {
  private readonly baseUrl: string
  private token: string | undefined

  constructor(config: CommerceClientConfig) {
    this.baseUrl = config.commerceUrl.replace(/\/+$/, '')
    this.token = config.token
  }

  /** Update the auth token (e.g. after IAM token refresh). */
  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    path: string,
    opts?: {
      method?: string
      body?: unknown
      token?: string
      params?: Record<string, string>
    },
  ): Promise<T> {
    const url = new URL(path, this.baseUrl)
    if (opts?.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        url.searchParams.set(k, v)
      }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    const headers: Record<string, string> = { Accept: 'application/json' }
    const authToken = opts?.token ?? this.token
    if (authToken) headers.Authorization = `Bearer ${authToken}`
    if (opts?.body) headers['Content-Type'] = 'application/json'

    try {
      const res = await fetch(url.toString(), {
        method: opts?.method ?? 'GET',
        headers,
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new CommerceApiError(res.status, `${res.statusText}: ${text}`.trim())
      }

      return (await res.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  // -----------------------------------------------------------------------
  // Balance
  // -----------------------------------------------------------------------

  async getBalance(user: string, currency = 'usd', token?: string): Promise<Balance> {
    return this.request<Balance>('/api/v1/billing/balance', {
      params: { user, currency }, token,
    })
  }

  async getAllBalances(user: string, token?: string): Promise<Record<string, Balance>> {
    return this.request<Record<string, Balance>>('/api/v1/billing/balance/all', {
      params: { user }, token,
    })
  }

  // -----------------------------------------------------------------------
  // Usage
  // -----------------------------------------------------------------------

  async addUsageRecord(record: UsageRecord, token?: string): Promise<Transaction> {
    return this.request<Transaction>('/api/v1/billing/usage', {
      method: 'POST', body: record, token,
    })
  }

  async getUsageRecords(user: string, currency = 'usd', token?: string): Promise<Transaction[]> {
    return this.request<Transaction[]>('/api/v1/billing/usage', {
      params: { user, currency }, token,
    })
  }

  // -----------------------------------------------------------------------
  // Deposits / Credits
  // -----------------------------------------------------------------------

  async addDeposit(
    params: { user: string; currency?: string; amount: number; notes?: string; tags?: string[]; expiresIn?: string },
    token?: string,
  ): Promise<Transaction> {
    return this.request<Transaction>('/api/v1/billing/deposit', {
      method: 'POST', body: params, token,
    })
  }

  async grantStarterCredit(user: string, token?: string): Promise<Transaction> {
    return this.request<Transaction>('/api/v1/billing/credit', {
      method: 'POST', body: { user }, token,
    })
  }

  // -----------------------------------------------------------------------
  // Subscriptions
  // -----------------------------------------------------------------------

  async subscribe(params: { planId: string; userId: string; paymentToken?: string }, token?: string): Promise<Subscription> {
    return this.request<Subscription>('/api/v1/subscribe', {
      method: 'POST', body: params, token,
    })
  }

  async getSubscription(subscriptionId: string, token?: string): Promise<Subscription | null> {
    try {
      return await this.request<Subscription>(`/api/v1/subscribe/${subscriptionId}`, { token })
    } catch { return null }
  }

  async updateSubscription(subscriptionId: string, update: Partial<Subscription>, token?: string): Promise<Subscription> {
    return this.request<Subscription>(`/api/v1/subscribe/${subscriptionId}`, {
      method: 'PATCH', body: update, token,
    })
  }

  async cancelSubscription(subscriptionId: string, token?: string): Promise<void> {
    await this.request<void>(`/api/v1/subscribe/${subscriptionId}`, {
      method: 'DELETE', token,
    })
  }

  // -----------------------------------------------------------------------
  // Checkout / Payments
  // -----------------------------------------------------------------------

  async authorize(orderId: string, token?: string): Promise<Payment> {
    return this.request<Payment>(`/api/v1/authorize/${orderId}`, { method: 'POST', token })
  }

  async capture(orderId: string, token?: string): Promise<Payment> {
    return this.request<Payment>(`/api/v1/capture/${orderId}`, { method: 'POST', token })
  }

  async charge(orderId: string, token?: string): Promise<Payment> {
    return this.request<Payment>(`/api/v1/charge/${orderId}`, { method: 'POST', token })
  }

  async refund(paymentId: string, token?: string): Promise<Payment> {
    return this.request<Payment>(`/api/v1/refund/${paymentId}`, { method: 'POST', token })
  }

  // -----------------------------------------------------------------------
  // Plans
  // -----------------------------------------------------------------------

  async getPlans(token?: string): Promise<Plan[]> {
    return this.request<Plan[]>('/api/v1/plan', { token })
  }

  async getPlan(planId: string, token?: string): Promise<Plan | null> {
    try {
      return await this.request<Plan>(`/api/v1/plan/${planId}`, { token })
    } catch { return null }
  }
}


// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class CommerceApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'CommerceApiError'
    this.status = status
  }
}
