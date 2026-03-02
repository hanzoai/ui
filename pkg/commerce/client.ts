/**
 * @hanzo/commerce/client
 *
 * Universal TypeScript client for the Hanzo Commerce API.
 * Works in browser, Node.js, and edge runtimes — no backend required.
 * Covers billing, subscriptions, payments, checkout, coupons,
 * referrals, affiliates, usage, and plans.
 *
 * @example
 * ```ts
 * import { Commerce } from '@hanzo/commerce/client'
 *
 * const commerce = new Commerce({ baseUrl: 'https://api.hanzo.ai', token: iamToken })
 *
 * // Validate a coupon before checkout
 * const coupon = await commerce.validateCoupon('LAUNCH50')
 *
 * // Create a checkout session
 * const session = await commerce.createCheckoutSession({
 *   items: [{ id: 'plan_pro', quantity: 1 }],
 *   couponCode: 'LAUNCH50',
 *   referrerId: 'ref_abc123',
 *   successUrl: 'https://app.example.com/success',
 *   cancelUrl: 'https://app.example.com/cancel',
 * })
 * window.location.href = session.checkoutUrl
 *
 * // Tokenize a card (S2S — no external SDK required)
 * const token = await commerce.tokenizeCard({
 *   number: '4242424242424242',
 *   expiryMonth: '12',
 *   expiryYear: '2027',
 *   cvc: '123',
 *   name: 'Jane Smith',
 * })
 *
 * // Subscribe
 * const sub = await commerce.subscribe({ planId: 'pro', userId: 'user_xyz' })
 * ```
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type CommerceClientConfig = {
  /**
   * Commerce API base URL.
   * Defaults to https://api.hanzo.ai
   */
  baseUrl?: string
  /** @deprecated use baseUrl */
  commerceUrl?: string
  /** IAM access token for authenticated requests. */
  token?: string
  /** Request timeout in milliseconds. Default 15 000. */
  timeoutMs?: number
}

// ---------------------------------------------------------------------------
// Core types
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
  customerId?: string
  status?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | string
  billingType?: 'charge_automatically' | 'send_invoice'
  periodStart?: string
  periodEnd?: string
  trialStart?: string
  trialEnd?: string
  quantity?: number
  createdAt?: string
  cancelAtPeriodEnd?: boolean
  currentPeriodEnd?: string
}

export type Plan = {
  id?: string
  slug?: string
  name?: string
  description?: string
  price?: number
  priceMonthly?: number
  priceAnnual?: number
  currency?: string
  interval?: 'monthly' | 'yearly' | string
  intervalCount?: number
  trialPeriodDays?: number
  features?: string[]
  popular?: boolean
  contactSales?: boolean
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
// Coupon / Discount types
// ---------------------------------------------------------------------------

export type CouponType = 'Percent' | 'Flat' | 'FreeShipping' | 'FreeItem'

export type Coupon = {
  id?: string
  code: string
  type: CouponType
  /** Amount: percentage (0-100) for Percent, cents for Flat */
  amount: number
  description?: string
  limit?: number
  used?: number
  startDate?: string
  endDate?: string
  enabled?: boolean
  /** Calculated discount in cents (returned by validateCoupon) */
  discountCents?: number
}

export type CouponValidateResult = {
  valid: boolean
  coupon?: Coupon
  error?: string
  /** Discount in cents for a given subtotal */
  discountCents?: number
}

export type Discount = {
  id?: string
  type: 'Percent' | 'Flat' | 'FreeShipping' | 'FreeItem' | 'Bulk'
  amount: number
  scope?: 'Product' | 'Variant' | 'Collection' | 'Store'
  enabled?: boolean
  startDate?: string
  endDate?: string
}

// ---------------------------------------------------------------------------
// Checkout types
// ---------------------------------------------------------------------------

export type CheckoutItem = {
  id: string
  quantity?: number
  /** Price override in cents */
  price?: number
  name?: string
  description?: string
  imageUrl?: string
  metadata?: Record<string, unknown>
}

export type CheckoutSessionRequest = {
  items: CheckoutItem[]
  successUrl: string
  cancelUrl: string
  couponCode?: string
  referrerId?: string
  affiliateId?: string
  currency?: string
  customer?: {
    email?: string
    name?: string
    address?: string
    city?: string
    zip?: string
  }
  metadata?: Record<string, unknown>
}

export type CheckoutSessionResponse = {
  checkoutUrl: string
  sessionId: string
  /** Original total in cents before discount */
  originalTotal?: number
  /** Final total in cents after discount */
  finalTotal?: number
  discount?: {
    code: string
    type: CouponType
    amount: number
    discountCents: number
  }
}

// ---------------------------------------------------------------------------
// Card tokenization (S2S — no provider SDK needed on the frontend)
// ---------------------------------------------------------------------------

export type CardTokenizeRequest = {
  number: string
  expiryMonth: string   // "01"–"12"
  expiryYear: string    // "2025"–"2099"
  cvc: string
  name?: string
  zip?: string
}

export type CardTokenizeResult = {
  token: string
  brand: string
  last4: string
  expiryMonth: string
  expiryYear: string
  provider: string
}

// ---------------------------------------------------------------------------
// Payment method types
// ---------------------------------------------------------------------------

export type PaymentMethodType = 'card' | 'bank_account' | 'balance' | 'crypto' | 'wire'

export type PaymentMethod = {
  id: string
  type: PaymentMethodType
  isDefault?: boolean
  customerId?: string
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  providerRef?: string
  providerType?: string
  createdAt?: string
}

// ---------------------------------------------------------------------------
// Referral / Affiliate types
// ---------------------------------------------------------------------------

export type Referral = {
  id?: string
  userId?: string
  referrerId?: string
  affiliateId?: string
  orderId?: string
  fee?: number
  createdAt?: string
}

export type Referrer = {
  id?: string
  userId?: string
  enabled?: boolean
  code?: string
  referrals?: Referral[]
}

export type Affiliate = {
  id?: string
  userId?: string
  enabled?: boolean
  commission?: number
  couponId?: string
  connectUrl?: string
}

// ---------------------------------------------------------------------------
// Credit grant
// ---------------------------------------------------------------------------

export type CreditGrant = {
  id?: string
  userId?: string
  amount: number
  currency: string
  expiresAt?: string
  tags?: string[]
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api.hanzo.ai'
const DEFAULT_TIMEOUT_MS = 15_000

export class Commerce {
  private readonly baseUrl: string
  private token: string | undefined
  private readonly timeoutMs: number

  constructor(config: CommerceClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? config.commerceUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.token = config.token
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  /** Update the auth token (e.g. after IAM token refresh). */
  setToken(token: string): void {
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
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    const headers: Record<string, string> = { Accept: 'application/json' }
    const authToken = opts?.token ?? this.token
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`
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
  // Plans
  // -----------------------------------------------------------------------

  async getPlans(token?: string): Promise<Plan[]> {
    return this.request<Plan[]>('/api/v1/billing/plans', { token })
  }

  async getPlan(planId: string, token?: string): Promise<Plan | null> {
    try {
      return await this.request<Plan>(`/api/v1/billing/plans/${planId}`, { token })
    } catch { return null }
  }

  // -----------------------------------------------------------------------
  // Subscriptions
  // -----------------------------------------------------------------------

  async subscribe(
    params: { planId: string; userId?: string; customerId?: string; paymentMethodId?: string; couponCode?: string; trialDays?: number },
    token?: string,
  ): Promise<Subscription> {
    return this.request<Subscription>('/api/v1/billing/subscriptions', {
      method: 'POST', body: params, token,
    })
  }

  async getSubscription(subscriptionId: string, token?: string): Promise<Subscription | null> {
    try {
      return await this.request<Subscription>(`/api/v1/billing/subscriptions/${subscriptionId}`, { token })
    } catch { return null }
  }

  async listSubscriptions(params?: { customerId?: string }, token?: string): Promise<Subscription[]> {
    return this.request<Subscription[]>('/api/v1/billing/subscriptions', {
      params: params as Record<string, string> | undefined, token,
    })
  }

  async updateSubscription(subscriptionId: string, update: Partial<Subscription>, token?: string): Promise<Subscription> {
    return this.request<Subscription>(`/api/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH', body: update, token,
    })
  }

  async cancelSubscription(subscriptionId: string, immediately = false, token?: string): Promise<Subscription> {
    return this.request<Subscription>(`/api/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST', body: { immediately }, token,
    })
  }

  async reactivateSubscription(subscriptionId: string, token?: string): Promise<Subscription> {
    return this.request<Subscription>(`/api/v1/billing/subscriptions/${subscriptionId}/reactivate`, {
      method: 'POST', token,
    })
  }

  // -----------------------------------------------------------------------
  // Checkout sessions
  // -----------------------------------------------------------------------

  /**
   * Create a hosted checkout session.
   * Returns a URL to redirect the customer to for payment.
   * Supports coupons, referral tracking, and multiple currencies.
   */
  async createCheckoutSession(
    params: CheckoutSessionRequest,
    token?: string,
  ): Promise<CheckoutSessionResponse> {
    return this.request<CheckoutSessionResponse>('/api/v1/checkout/sessions', {
      method: 'POST', body: params, token,
    })
  }

  // -----------------------------------------------------------------------
  // Card tokenization (S2S — no external SDK required)
  // -----------------------------------------------------------------------

  /**
   * Tokenize a payment card server-side.
   * No external SDK (Square.js, Stripe.js, etc.) is needed on the frontend.
   * The card data is sent to the Hanzo Commerce API over HTTPS, which
   * tokenizes via the configured payment provider (Stripe).
   */
  async tokenizeCard(card: CardTokenizeRequest, token?: string): Promise<CardTokenizeResult> {
    return this.request<CardTokenizeResult>('/api/v1/billing/card/tokenize', {
      method: 'POST',
      body: {
        number: card.number.replace(/\s/g, ''),
        expiry_month: card.expiryMonth,
        expiry_year: card.expiryYear,
        cvc: card.cvc,
        name: card.name,
        zip: card.zip,
      },
      token,
    })
  }

  // -----------------------------------------------------------------------
  // Payment methods
  // -----------------------------------------------------------------------

  async addPaymentMethod(
    params: {
      customerId: string
      type: PaymentMethodType
      token?: string          // from tokenizeCard
      providerRef?: string
      providerType?: string
    },
    token?: string,
  ): Promise<PaymentMethod> {
    return this.request<PaymentMethod>('/api/v1/billing/payment-methods', {
      method: 'POST', body: params, token,
    })
  }

  async listPaymentMethods(customerId: string, token?: string): Promise<PaymentMethod[]> {
    return this.request<PaymentMethod[]>('/api/v1/billing/payment-methods', {
      params: { customerId }, token,
    })
  }

  async removePaymentMethod(paymentMethodId: string, token?: string): Promise<void> {
    await this.request<void>(`/api/v1/billing/payment-methods/${paymentMethodId}`, {
      method: 'DELETE', token,
    })
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string, token?: string): Promise<PaymentMethod> {
    return this.request<PaymentMethod>(`/api/v1/billing/customers/${customerId}/default-payment-method`, {
      method: 'POST', body: { paymentMethodId }, token,
    })
  }

  // -----------------------------------------------------------------------
  // Coupons / Promo codes
  // -----------------------------------------------------------------------

  /**
   * Validate a coupon code.
   * Optionally pass a subtotalCents to get the calculated discount amount.
   */
  async validateCoupon(code: string, subtotalCents?: number, token?: string): Promise<CouponValidateResult> {
    try {
      const result = await this.request<Coupon>('/api/v1/coupon/validate', {
        method: 'POST',
        body: { code: code.toUpperCase().trim(), subtotalCents },
        token,
      })
      return { valid: true, coupon: result }
    } catch (err) {
      const msg = err instanceof CommerceApiError ? err.message : 'Invalid coupon'
      return { valid: false, error: msg }
    }
  }

  /**
   * Redeem a coupon for a user. Creates credit grant records.
   */
  async redeemCoupon(code: string, userId: string, token?: string): Promise<CreditGrant[]> {
    return this.request<CreditGrant[]>('/api/v1/coupon/redeem', {
      method: 'POST',
      body: { code: code.toUpperCase().trim(), userId },
      token,
    })
  }

  // -----------------------------------------------------------------------
  // Referrals & Affiliates
  // -----------------------------------------------------------------------

  /**
   * Get or create a referrer record for a user.
   * Returns the referral code/link the user can share.
   */
  async getOrCreateReferrer(userId: string, token?: string): Promise<Referrer> {
    return this.request<Referrer>('/api/v1/referrer', {
      method: 'POST', body: { userId }, token,
    })
  }

  async getReferrals(userId: string, token?: string): Promise<Referral[]> {
    return this.request<Referral[]>(`/api/v1/user/${userId}/referrals`, { token })
  }

  async getReferrers(userId: string, token?: string): Promise<Referrer[]> {
    return this.request<Referrer[]>(`/api/v1/user/${userId}/referrers`, { token })
  }

  /**
   * Get affiliate details for a user.
   */
  async getAffiliate(userId: string, token?: string): Promise<Affiliate | null> {
    try {
      return await this.request<Affiliate>(`/api/v1/user/${userId}/affiliate`, { token })
    } catch { return null }
  }

  /**
   * Create an affiliate account for a user.
   * After creation, user can connect their bank via the returnedconnectUrl.
   */
  async createAffiliate(userId: string, token?: string): Promise<Affiliate> {
    return this.request<Affiliate>('/api/v1/affiliate', {
      method: 'POST', body: { userId }, token,
    })
  }

  async getAffiliateReferrals(affiliateId: string, token?: string): Promise<Referral[]> {
    return this.request<Referral[]>(`/api/v1/affiliate/${affiliateId}/referrals`, { token })
  }

  async getAffiliateOrders(affiliateId: string, token?: string): Promise<unknown[]> {
    return this.request<unknown[]>(`/api/v1/affiliate/${affiliateId}/orders`, { token })
  }

  async getAffiliateTransactions(affiliateId: string, token?: string): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/api/v1/affiliate/${affiliateId}/transactions`, { token })
  }

  // -----------------------------------------------------------------------
  // Legacy checkout (order-based)
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

  async billingRefund(
    params: { user: string; amount: number; originalTransactionId: string; currency?: string; notes?: string },
    token?: string,
  ): Promise<Transaction> {
    return this.request<Transaction>('/api/v1/billing/refund', {
      method: 'POST', body: params, token,
    })
  }
}

// ---------------------------------------------------------------------------
// Standalone factory helpers — import these for quick setup
// ---------------------------------------------------------------------------

/**
 * Create a commerce client pre-configured for api.hanzo.ai.
 * Pass your IAM access token (read from localStorage or cookie).
 *
 * @example
 * ```ts
 * import { hanzoCommerce } from '@hanzo/commerce/client'
 * const commerce = hanzoCommerce(localStorage.getItem('hanzo-auth-token') ?? undefined)
 * const plans = await commerce.getPlans()
 * ```
 */
export function hanzoCommerce(token?: string): Commerce {
  return new Commerce({ token })
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
