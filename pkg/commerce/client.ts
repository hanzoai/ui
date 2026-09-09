/**
 * @hanzo/commerce/client — the Commerce and Billing API, as the document
 * describes it.
 *
 * GENERATED from `cloud/openapi.yaml`. Do not hand-edit: a method here exists
 * because an operation exists, and it is named by that operation's own id. The
 * previous client was written by hand and eleven of its twenty-six addresses had
 * stopped existing, which nothing reported until a call 404'd.
 *
 * Two surfaces, orthogonal and both here because a store needs both: `commerce`
 * is the storefront — cart, catalog, product, variant, discount, store — and
 * `billing` is the ledger — balance, credits, invoices, methods, subscriptions,
 * usage. They share one noun, `plans`.
 *
 *   const commerce = new Commerce({ baseUrl: 'https://api.hanzo.ai', token })
 *   const balance = await commerce.getBillingBalance()
 */

/** Where to reach the API, and as whom. */
export interface CommerceClientConfig {
  baseUrl?: string
  token?: string
  /** Milliseconds before a request is abandoned. Default 30s. */
  timeoutMs?: number
}

/**
 * A refusal, carrying what the service said about it.
 *
 * RFC 9457 problem documents are what this API answers with, so `detail` is the
 * member to read; `status` is the code. The raw body is kept because a problem
 * document may carry extension members this class does not name.
 */
export class CommerceApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly body: unknown,
  ) {
    super(detail || `commerce: ${status}`)
    this.name = 'CommerceApiError'
  }
}

export const DEFAULT_BASE_URL = 'https://api.hanzo.ai'

/** From the document. */
export interface Transaction {
  amount?: number
  createdAt?: string
  currency?: string
  expiresAt?: string
  id?: string
  metadata?: unknown
  notes?: string
  tags?: string
  type?: string
}

/** From the document. */
export interface Subscription {
  cancelAtPeriodEnd?: boolean
  canceledAt?: string
  createdAt?: string
  currentPeriodEnd?: string
  currentPeriodStart?: string
  defaultPaymentMethod?: string
  endedAt?: string
  id?: string
  mrrCents?: number
  plan?: SubscriptionPlan
  planId?: string
  providerType?: string
  quantity?: number
  status?: string
  trialEnd?: string
  trialStart?: string
  updatedAt?: string
  userId?: string
}

/** From the document. */
export interface CreditGrant {
  active?: boolean
  amountCents?: number
  createdAt?: string
  currency?: string
  effectiveAt?: string
  expiresAt?: string
  id?: string
  name?: string
  priority?: number
  remainingCents?: number
  tags?: string
  userId?: string
  voided?: boolean
}

/** From the document. */
export interface SubscriptionPlan {
  currency?: string
  id?: string
  interval?: string
  name?: string
  price?: number
}

export class Commerce {
  private readonly baseUrl: string
  private token: string | undefined
  private readonly timeoutMs: number

  constructor(config: CommerceClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    this.token = config.token
    this.timeoutMs = config.timeoutMs ?? 30_000
  }

  /** Use this token from now on — after a sign-in, or a refresh. */
  setToken(token: string): void {
    this.token = token
  }

  /**
   * One request, one place.
   *
   * A per-call token overrides the client's, which is what a server rendering
   * for one user among many needs: the client is shared, the identity is not.
   *
   * Public because a few addresses this API serves are in neither document.
   * Everything the documents DO describe has a method below; reach for this only
   * when nothing there fits, and say why at the call site.
   */
  async request<T>(
    method: string,
    path: string,
    opts: {
      query?: Record<string, string | number | boolean | undefined>
      body?: unknown
      token?: string
      headers?: Record<string, string>
    } = {},
  ): Promise<T> {
    const url = new URL(this.baseUrl + path)
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }

    const token = opts.token ?? this.token
    const timer = AbortSignal.timeout(this.timeoutMs)
    const res = await fetch(url, {
      method,
      signal: timer,
      headers: {
        accept: 'application/json',
        ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    })

    if (res.status === 204) return undefined as T
    const text = await res.text()
    const body = text ? safeJson(text) : undefined

    if (!res.ok) {
      const d = body as { detail?: string; title?: string; msg?: string } | undefined
      throw new CommerceApiError(res.status, d?.detail ?? d?.title ?? d?.msg ?? text.slice(0, 200), body)
    }
    // The /v1 envelope carries the value under `data`; a typed body is itself.
    const env = body as { status?: string; data?: unknown } | undefined
    return (env && typeof env === 'object' && 'data' in env ? env.data : body) as T
  }

  /** Answers the caller's billing accounts: the org itself, its currency, when it was opened, and the caller's own standing in it. */
  getBillingAccounts<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/accounts`, opts)
  }
  /** Answers one billing account's roster. */
  getBillingAccountsByIdMembers<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/accounts/${encodeURIComponent(id)}/members`, opts)
  }
  /** Lists this org's spend caps: the ceiling, its scope, whether it enforces, and how much of it has been spent this period. */
  getBillingAlerts<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/alerts`, opts)
  }
  /** Opens a spend cap on the caller's own org. */
  postBillingAlerts<T = unknown>(opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/alerts`, opts)
  }
  /** Answers whether one proposed spend fits inside this org's caps. */
  getBillingAlertsAuthorize<T = unknown>(opts: { query?: Record<string, string | number | boolean | undefined>; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/alerts/authorize`, opts)
  }
  /** Removes one of the caller's spend caps and answers 204. */
  deleteBillingAlertsById<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/billing/alerts/${encodeURIComponent(id)}`, opts)
  }
  /** Changes one spend cap: raise or lower the ceiling, flip enforcement, retune the rate limit. */
  patchBillingAlertsById<T = unknown>(id: string, opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/billing/alerts/${encodeURIComponent(id)}`, opts)
  }
  /** Prepaid credit the caller's org can still spend */
  getBillingBalance<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/balance`, opts)
  }
  /** Answers what the caller can spend right now, one entry per currency. */
  getBillingCreditBalance<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/credit-balance`, opts)
  }
  /** Answers that same spendable credit split by grant tag, with the earliest expiry under each and the total across all of them. */
  getBillingCreditBalanceBreakdown<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/credit-balance/breakdown`, opts)
  }
  /** Lists the caller's credit grants — every one of them, spent and lapsed and voided included. */
  getBillingCredits<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/credits`, opts)
  }
  /** Issues a deposit address the caller can send crypto to, on the asset they ask for. */
  postBillingCryptoDeposit<T = unknown>(opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/crypto/deposit`, opts)
  }
  /** Reads one of the caller's own deposit intents back — pending, confirming, or succeeded. */
  getBillingCryptoDepositById<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/crypto/deposit/${encodeURIComponent(id)}`, opts)
  }
  /** Answers which chains and tokens the crypto rail accepts — what an asset picker renders. */
  getBillingCryptoOptions<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/crypto/options`, opts)
  }
  /** Lists the caller's invoices, newest first, with the count beside them. */
  getBillingInvoices<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/invoices`, opts)
  }
  /** Raise a draft invoice against a customer */
  raiseInvoice<T = unknown>(opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/invoices`, opts)
  }
  /** Read one invoice */
  getInvoice<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/invoices/${encodeURIComponent(id)}`, opts)
  }
  /** Collect an issued invoice from credits, balance, then card */
  collectInvoice<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/invoices/${encodeURIComponent(id)}/collect`, opts)
  }
  /** Issue a draft invoice, making it collectible */
  issueInvoice<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/invoices/${encodeURIComponent(id)}/issue`, opts)
  }
  /** Download one invoice as a PDF */
  getBillingInvoicesByIdPdf<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/invoices/${encodeURIComponent(id)}/pdf`, opts)
  }
  /** Void a draft or issued invoice */
  voidInvoice<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/invoices/${encodeURIComponent(id)}/void`, opts)
  }
  /** Answers the org's own postings inside `range=`, each as a signed entry: a DEPOSIT CREDITS the wallet (positive, account `credits:<org>`) and every other posting DEBITS it (negative, account `usage:<org>`), described by its notes or its tags. */
  getBillingLedger<T = unknown>(opts: { query?: Record<string, string | number | boolean | undefined>; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/ledger`, opts)
  }
  /** Cards and accounts on file for the caller */
  getBillingMethods<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/methods`, opts)
  }
  /** Save a card or account for the caller */
  postBillingMethods<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/methods`, opts)
  }
  /** Removes one card or account the caller has saved. */
  deleteBillingMethodsById<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/billing/methods/${encodeURIComponent(id)}`, opts)
  }
  /** Moves this org between sandbox money and real money. */
  postBillingMode<T = unknown>(opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/mode`, opts)
  }
  /** Answers the org's outbound payouts, newest first — amount, destination, status, and the failure reason where one applies. */
  getBillingPayouts<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/payouts`, opts)
  }
  /** The plan catalog, priced with whatever offer is in force */
  getBillingPlans<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/plans`, opts)
  }
  /** Cards and accounts on file for the caller */
  getBillingPortalMethods<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/portal/methods`, opts)
  }
  /** Save a card or account for the caller */
  postBillingPortalMethods<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/portal/methods`, opts)
  }
  /** DetachPortalMethod is DetachMethod at the address a hosted checkout addresses it by. */
  deleteBillingPortalMethodsById<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/billing/portal/methods/${encodeURIComponent(id)}`, opts)
  }
  /** Reads the caller's auto-reload rule: top the balance up by `amountCents` whenever it falls below `thresholdCents`, charging the card on file off-session. */
  getBillingRecharge<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/recharge`, opts)
  }
  /** Sets the caller's auto-reload rule, and answers with the rule as stored. */
  putBillingRecharge<T = unknown>(opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/billing/recharge`, opts)
  }
  /** Sweeps every org's auto-recharge and answers what it did. */
  postBillingRechargeRunAll<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/recharge/run-all`, opts)
  }
  /** Answers the PUBLIC half of this org's processor configuration — the ids a browser needs to tokenize a card, and the environment it must tokenize against. */
  getBillingSettings<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/settings`, opts)
  }
  /** Buy a plan with a card */
  postBillingSubscribeCard<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/subscribe/card`, opts)
  }
  /** Lists the plans the caller holds, with the count beside them. */
  getBillingSubscriptions<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/subscriptions`, opts)
  }
  /** End a subscription */
  cancelSubscription<T = unknown>(id: string, opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, opts)
  }
  /** Put a canceled subscription back on its plan */
  reactivateSubscription<T = unknown>(id: string, opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/subscriptions/${encodeURIComponent(id)}/reactivate`, opts)
  }
  /** Answers which tier the caller is on, what it allows, and what is left to spend. */
  getBillingTier<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/tier`, opts)
  }
  /** Charges a card the caller already saved and credits the balance. */
  postBillingTopup<T = unknown>(opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/topup`, opts)
  }
  /** Charges a single-use card token and credits the caller's balance. */
  postBillingTopupToken<T = unknown>(opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/billing/topup/token`, opts)
  }
  /** Answers one page of the caller's own ledger, newest first: what moved, how much, when, and what it was tagged with. */
  getBillingTransactions<T = unknown>(opts: { query?: Record<string, string | number | boolean | undefined>; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/transactions`, opts)
  }
  /** Reads one ledger entry by its id. */
  getBillingTransactionsById<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/transactions/${encodeURIComponent(id)}`, opts)
  }
  /** Every billed call the caller's org made, attributed to a product */
  getBillingUsage<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/usage`, opts)
  }
  /** Answers per-account totals for the linked provider accounts the gateway ROUTED this caller's traffic through — requests, prompt and completion tokens, recorded cost — plus their honest sum. */
  getBillingUsageAccounts<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/usage/accounts`, opts)
  }
  /** Answers the caller's month: what their plan includes, what has been consumed against it, and the wallet beside it. */
  getBillingUsageRollup<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/usage/rollup`, opts)
  }
  /** Answers where to send a wire top-up: the receiving bank details, with the caller's own payment reference. */
  getBillingWire<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/billing/wire`, opts)
  }
  /** The catalog projection with cost and margin included */
  getCommerceAdminCatalog<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/admin/catalog`, opts)
  }
  /** Open a cart for a shopper to fill */
  openCart<T = unknown>(opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/cart`, opts)
  }
  /** Read one cart with its lines and totals */
  getCart<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/cart/${encodeURIComponent(id)}`, opts)
  }
  /** Discard a cart the shopper abandoned */
  discardCart<T = unknown>(id: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/cart/${encodeURIComponent(id)}/discard`, opts)
  }
  /** Set one item's quantity in a cart; zero removes it */
  setCartItem<T = unknown>(id: string, opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/cart/${encodeURIComponent(id)}/item`, opts)
  }
  /** The public product catalog projection for a brand */
  getCommerceCatalog<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/catalog`, opts)
  }
  /** The raw catalog entries, including the unpublished ones */
  getCommerceCatalogEntries<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/catalog/entries`, opts)
  }
  /** Add a catalog entry */
  postCommerceCatalogEntries<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/catalog/entries`, opts)
  }
  /** Land a syncer's view of the model catalog: upstream costs and machine facts */
  postCommerceCatalogModels<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/catalog/models`, opts)
  }
  /** Refresh the model catalog by reading the upstream provider */
  postCommerceCatalogModelsRefresh<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/catalog/models/refresh`, opts)
  }
  /** Seed the embedded catalog, without disturbing edits already made */
  postCommerceCatalogSeed<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/catalog/seed`, opts)
  }
  /** List your org's collections, as a page */
  getCommerceCollection<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/collection/`, opts)
  }
  /** Create a collection */
  postCommerceCollection<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/collection/`, opts)
  }
  /** Delete a collection, keeping a recoverable copy */
  deleteCommerceCollectionByCollectionid<T = unknown>(collectionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/collection/${encodeURIComponent(collectionid)}`, opts)
  }
  /** Fetch one collection */
  getCommerceCollectionByCollectionid<T = unknown>(collectionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/collection/${encodeURIComponent(collectionid)}`, opts)
  }
  /** Change part of a collection */
  patchCommerceCollectionByCollectionid<T = unknown>(collectionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/collection/${encodeURIComponent(collectionid)}`, opts)
  }
  /** Method-override tunnel for a collection — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceCollectionByCollectionid<T = unknown>(collectionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/collection/${encodeURIComponent(collectionid)}`, opts)
  }
  /** Replace a collection outright */
  putCommerceCollectionByCollectionid<T = unknown>(collectionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/collection/${encodeURIComponent(collectionid)}`, opts)
  }
  /** The reference currency list the price and settings pickers render */
  getCommerceCurrencies<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/currencies`, opts)
  }
  /** Read the crypto deposit watcher's runtime state, asset by asset */
  getCommerceDeposits<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/deposits`, opts)
  }
  /** List your org's disclosures, as a page */
  getCommerceDisclosure<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/disclosure/`, opts)
  }
  /** Create a disclosure */
  postCommerceDisclosure<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/disclosure/`, opts)
  }
  /** Delete a disclosure, keeping a recoverable copy */
  deleteCommerceDisclosureByDisclosureid<T = unknown>(disclosureid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/disclosure/${encodeURIComponent(disclosureid)}`, opts)
  }
  /** Fetch one disclosure */
  getCommerceDisclosureByDisclosureid<T = unknown>(disclosureid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/disclosure/${encodeURIComponent(disclosureid)}`, opts)
  }
  /** Change part of a disclosure */
  patchCommerceDisclosureByDisclosureid<T = unknown>(disclosureid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/disclosure/${encodeURIComponent(disclosureid)}`, opts)
  }
  /** Method-override tunnel for a disclosure — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceDisclosureByDisclosureid<T = unknown>(disclosureid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/disclosure/${encodeURIComponent(disclosureid)}`, opts)
  }
  /** Replace a disclosure outright */
  putCommerceDisclosureByDisclosureid<T = unknown>(disclosureid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/disclosure/${encodeURIComponent(disclosureid)}`, opts)
  }
  /** List your org's discounts, as a page */
  getCommerceDiscount<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/discount/`, opts)
  }
  /** Create a discount */
  postCommerceDiscount<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/discount/`, opts)
  }
  /** Delete a discount, keeping a recoverable copy */
  deleteCommerceDiscountByDiscountid<T = unknown>(discountid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/discount/${encodeURIComponent(discountid)}`, opts)
  }
  /** Fetch one discount */
  getCommerceDiscountByDiscountid<T = unknown>(discountid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/discount/${encodeURIComponent(discountid)}`, opts)
  }
  /** Change part of a discount */
  patchCommerceDiscountByDiscountid<T = unknown>(discountid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/discount/${encodeURIComponent(discountid)}`, opts)
  }
  /** Method-override tunnel for a discount — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceDiscountByDiscountid<T = unknown>(discountid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/discount/${encodeURIComponent(discountid)}`, opts)
  }
  /** Replace a discount outright */
  putCommerceDiscountByDiscountid<T = unknown>(discountid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/discount/${encodeURIComponent(discountid)}`, opts)
  }
  /** Answers ok whenever the commerce subsystem is mounted. */
  getCommerceHealth<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/health`, opts)
  }
  /** List your org's movies, as a page */
  getCommerceMovie<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/movie/`, opts)
  }
  /** Create a movie */
  postCommerceMovie<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/movie/`, opts)
  }
  /** Delete a movie, keeping a recoverable copy */
  deleteCommerceMovieByMovieid<T = unknown>(movieid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/movie/${encodeURIComponent(movieid)}`, opts)
  }
  /** Fetch one movie */
  getCommerceMovieByMovieid<T = unknown>(movieid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/movie/${encodeURIComponent(movieid)}`, opts)
  }
  /** Change part of a movie */
  patchCommerceMovieByMovieid<T = unknown>(movieid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/movie/${encodeURIComponent(movieid)}`, opts)
  }
  /** Method-override tunnel for a movie — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceMovieByMovieid<T = unknown>(movieid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/movie/${encodeURIComponent(movieid)}`, opts)
  }
  /** Replace a movie outright */
  putCommerceMovieByMovieid<T = unknown>(movieid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/movie/${encodeURIComponent(movieid)}`, opts)
  }
  /** List your org's notes, as a page */
  getCommerceNote<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/note/`, opts)
  }
  /** Create a note */
  postCommerceNote<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/note/`, opts)
  }
  /** Delete a note, keeping a recoverable copy */
  deleteCommerceNoteByNoteid<T = unknown>(noteid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/note/${encodeURIComponent(noteid)}`, opts)
  }
  /** Fetch one note */
  getCommerceNoteByNoteid<T = unknown>(noteid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/note/${encodeURIComponent(noteid)}`, opts)
  }
  /** Change part of a note */
  patchCommerceNoteByNoteid<T = unknown>(noteid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/note/${encodeURIComponent(noteid)}`, opts)
  }
  /** Method-override tunnel for a note — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceNoteByNoteid<T = unknown>(noteid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/note/${encodeURIComponent(noteid)}`, opts)
  }
  /** Replace a note outright */
  putCommerceNoteByNoteid<T = unknown>(noteid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/note/${encodeURIComponent(noteid)}`, opts)
  }
  /** The public org configuration a checkout page boots from */
  getCommerceOrg<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/org`, opts)
  }
  /** The raw plan authority rows */
  getCommercePlansEntries<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/plans/entries`, opts)
  }
  /** Add a subscription plan */
  postCommercePlansEntries<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/plans/entries`, opts)
  }
  /** Remove a plan from the authority */
  deleteCommercePlansEntriesBySlug<T = unknown>(slug: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/plans/entries/${encodeURIComponent(slug)}`, opts)
  }
  /** Edit a plan, leaving the fields you omit alone */
  putCommercePlansEntriesBySlug<T = unknown>(slug: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/plans/entries/${encodeURIComponent(slug)}`, opts)
  }
  /** Seed the embedded plan catalog, without overwriting administrative edits */
  postCommercePlansSeed<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/plans/seed`, opts)
  }
  /** List your org's products, as a page */
  getCommerceProduct<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/product/`, opts)
  }
  /** Create a product */
  postCommerceProduct<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/product/`, opts)
  }
  /** Delete a product, keeping a recoverable copy */
  deleteCommerceProductByProductid<T = unknown>(productid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/product/${encodeURIComponent(productid)}`, opts)
  }
  /** Fetch one product */
  getCommerceProductByProductid<T = unknown>(productid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/product/${encodeURIComponent(productid)}`, opts)
  }
  /** Change part of a product */
  patchCommerceProductByProductid<T = unknown>(productid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/product/${encodeURIComponent(productid)}`, opts)
  }
  /** Method-override tunnel for a product — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceProductByProductid<T = unknown>(productid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/product/${encodeURIComponent(productid)}`, opts)
  }
  /** Replace a product outright */
  putCommerceProductByProductid<T = unknown>(productid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/product/${encodeURIComponent(productid)}`, opts)
  }
  /** List what one unit of each metered thing costs */
  getCommerceRatesEntries<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/rates/entries`, opts)
  }
  /** Add a rate */
  postCommerceRatesEntries<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/rates/entries`, opts)
  }
  /** Remove a rate outright */
  deleteCommerceRatesEntriesByProductByMeter<T = unknown>(product: string, meter: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/rates/entries/${encodeURIComponent(product)}/${encodeURIComponent(meter)}`, opts)
  }
  /** Edit a rate, and mark it as operator-set */
  putCommerceRatesEntriesByProductByMeter<T = unknown>(product: string, meter: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/rates/entries/${encodeURIComponent(product)}/${encodeURIComponent(meter)}`, opts)
  }
  /** Load the published price document, reconciling rather than replacing */
  postCommerceRatesImport<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/rates/import`, opts)
  }
  /** List your org's returns, as a page */
  getCommerceReturn<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/return/`, opts)
  }
  /** Create a return */
  postCommerceReturn<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/return/`, opts)
  }
  /** Delete a return, keeping a recoverable copy */
  deleteCommerceReturnByReturnid<T = unknown>(returnid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/return/${encodeURIComponent(returnid)}`, opts)
  }
  /** Fetch one return */
  getCommerceReturnByReturnid<T = unknown>(returnid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/return/${encodeURIComponent(returnid)}`, opts)
  }
  /** Change part of a return */
  patchCommerceReturnByReturnid<T = unknown>(returnid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/return/${encodeURIComponent(returnid)}`, opts)
  }
  /** Method-override tunnel for a return — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceReturnByReturnid<T = unknown>(returnid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/return/${encodeURIComponent(returnid)}`, opts)
  }
  /** Replace a return outright */
  putCommerceReturnByReturnid<T = unknown>(returnid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/return/${encodeURIComponent(returnid)}`, opts)
  }
  /** List your org's sales channels, as a page */
  getCommerceSaleschannel<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/saleschannel/`, opts)
  }
  /** Create a sales channel */
  postCommerceSaleschannel<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/saleschannel/`, opts)
  }
  /** Delete a sales channel, keeping a recoverable copy */
  deleteCommerceSaleschannelBySaleschannelid<T = unknown>(saleschannelid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/saleschannel/${encodeURIComponent(saleschannelid)}`, opts)
  }
  /** Fetch one sales channel */
  getCommerceSaleschannelBySaleschannelid<T = unknown>(saleschannelid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/saleschannel/${encodeURIComponent(saleschannelid)}`, opts)
  }
  /** Change part of a sales channel */
  patchCommerceSaleschannelBySaleschannelid<T = unknown>(saleschannelid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/saleschannel/${encodeURIComponent(saleschannelid)}`, opts)
  }
  /** Method-override tunnel for a sales channel — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceSaleschannelBySaleschannelid<T = unknown>(saleschannelid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/saleschannel/${encodeURIComponent(saleschannelid)}`, opts)
  }
  /** Replace a sales channel outright */
  putCommerceSaleschannelBySaleschannelid<T = unknown>(saleschannelid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/saleschannel/${encodeURIComponent(saleschannelid)}`, opts)
  }
  /** List your org's stock locations, as a page */
  getCommerceStocklocation<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/stocklocation/`, opts)
  }
  /** Create a stock location */
  postCommerceStocklocation<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/stocklocation/`, opts)
  }
  /** Delete a stock location, keeping a recoverable copy */
  deleteCommerceStocklocationByStocklocationid<T = unknown>(stocklocationid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/stocklocation/${encodeURIComponent(stocklocationid)}`, opts)
  }
  /** Fetch one stock location */
  getCommerceStocklocationByStocklocationid<T = unknown>(stocklocationid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/stocklocation/${encodeURIComponent(stocklocationid)}`, opts)
  }
  /** Change part of a stock location */
  patchCommerceStocklocationByStocklocationid<T = unknown>(stocklocationid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/stocklocation/${encodeURIComponent(stocklocationid)}`, opts)
  }
  /** Method-override tunnel for a stock location — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceStocklocationByStocklocationid<T = unknown>(stocklocationid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/stocklocation/${encodeURIComponent(stocklocationid)}`, opts)
  }
  /** Replace a stock location outright */
  putCommerceStocklocationByStocklocationid<T = unknown>(stocklocationid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/stocklocation/${encodeURIComponent(stocklocationid)}`, opts)
  }
  /** List your org's storefronts as a page */
  getCommerceStore<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/`, opts)
  }
  /** Create a storefront */
  postCommerceStore<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/`, opts)
  }
  /** Whether a store is entitled to trade, and why */
  getCommerceStoreAccess<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/access`, opts)
  }
  /** Resolve your org's active storefront without naming an id */
  getCommerceStoreCurrent<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/current`, opts)
  }
  /** Mint your org's least-privilege storefront read key */
  postCommerceStoreToken<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/token`, opts)
  }
  /** Delete a storefront, keeping a recoverable copy */
  deleteCommerceStoreByStoreid<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/store/${encodeURIComponent(storeid)}`, opts)
  }
  /** Fetch one storefront */
  getCommerceStoreByStoreid<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/${encodeURIComponent(storeid)}`, opts)
  }
  /** Change part of a storefront */
  patchCommerceStoreByStoreid<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/store/${encodeURIComponent(storeid)}`, opts)
  }
  /** Method-override tunnel for clients that cannot send PUT, PATCH or DELETE */
  postCommerceStoreByStoreid<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}`, opts)
  }
  /** Replace a storefront outright */
  putCommerceStoreByStoreid<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/store/${encodeURIComponent(storeid)}`, opts)
  }
  /** Authorize a new order against a storefront, holding the funds without settling them */
  postCommerceStoreByStoreidAuthorize<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/authorize`, opts)
  }
  /** Authorize an order that already exists, holding the funds without settling them */
  postCommerceStoreByStoreidAuthorizeByOrderid<T = unknown>(storeid: string, orderid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/authorize/${encodeURIComponent(orderid)}`, opts)
  }
  /** Fetch a bundle as this storefront sells it */
  getCommerceStoreByStoreidBundleByKey<T = unknown>(storeid: string, key: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/${encodeURIComponent(storeid)}/bundle/${encodeURIComponent(key)}`, opts)
  }
  /** Capture a previously authorized order and settle the payment */
  postCommerceStoreByStoreidCaptureByOrderid<T = unknown>(storeid: string, orderid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/capture/${encodeURIComponent(orderid)}`, opts)
  }
  /** Authorize and capture a new order in one call */
  postCommerceStoreByStoreidCharge<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/charge`, opts)
  }
  /** Authorize a new order against a storefront, holding the funds — the checkout spelling */
  postCommerceStoreByStoreidCheckoutAuthorize<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/checkout/authorize`, opts)
  }
  /** Authorize an existing order, holding the funds — the checkout spelling */
  postCommerceStoreByStoreidCheckoutAuthorizeByOrderid<T = unknown>(storeid: string, orderid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/checkout/authorize/${encodeURIComponent(orderid)}`, opts)
  }
  /** Capture a previously authorized order and settle it — the checkout spelling */
  postCommerceStoreByStoreidCheckoutCaptureByOrderid<T = unknown>(storeid: string, orderid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/checkout/capture/${encodeURIComponent(orderid)}`, opts)
  }
  /** Authorize and capture a new order in one call — the checkout spelling */
  postCommerceStoreByStoreidCheckoutCharge<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/checkout/charge`, opts)
  }
  /** PayPal cancel by pay key — refuses, exactly as the unprefixed address does */
  postCommerceStoreByStoreidCheckoutPaypalCancelByPaykey<T = unknown>(storeid: string, payKey: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/checkout/paypal/cancel/${encodeURIComponent(payKey)}`, opts)
  }
  /** PayPal confirm by pay key — refuses, exactly as the unprefixed address does */
  postCommerceStoreByStoreidCheckoutPaypalConfirmByPaykey<T = unknown>(storeid: string, payKey: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/checkout/paypal/confirm/${encodeURIComponent(payKey)}`, opts)
  }
  /** Start a PayPal authorization for a new order — the checkout spelling */
  postCommerceStoreByStoreidCheckoutPaypalPay<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/checkout/paypal/pay`, opts)
  }
  /** The storefront's whole listing override map */
  getCommerceStoreByStoreidListing<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/${encodeURIComponent(storeid)}/listing`, opts)
  }
  /** Remove a listing override */
  deleteCommerceStoreByStoreidListingByKey<T = unknown>(storeid: string, key: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/store/${encodeURIComponent(storeid)}/listing/${encodeURIComponent(key)}`, opts)
  }
  /** Fetch one listing override, by item id or by its slug or SKU */
  getCommerceStoreByStoreidListingByKey<T = unknown>(storeid: string, key: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/${encodeURIComponent(storeid)}/listing/${encodeURIComponent(key)}`, opts)
  }
  /** Confirm a listing override exists and re-save the store */
  patchCommerceStoreByStoreidListingByKey<T = unknown>(storeid: string, key: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/store/${encodeURIComponent(storeid)}/listing/${encodeURIComponent(key)}`, opts)
  }
  /** Add a listing override under a new key */
  postCommerceStoreByStoreidListingByKey<T = unknown>(storeid: string, key: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/listing/${encodeURIComponent(key)}`, opts)
  }
  /** Upsert a listing override */
  putCommerceStoreByStoreidListingByKey<T = unknown>(storeid: string, key: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/store/${encodeURIComponent(storeid)}/listing/${encodeURIComponent(key)}`, opts)
  }
  /** PayPal cancel by pay key — refuses, because a pay key alone does not identify the order */
  postCommerceStoreByStoreidPaypalCancelByPaykey<T = unknown>(storeid: string, payKey: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/paypal/cancel/${encodeURIComponent(payKey)}`, opts)
  }
  /** PayPal confirm by pay key — refuses, because a pay key alone does not identify the order */
  postCommerceStoreByStoreidPaypalConfirmByPaykey<T = unknown>(storeid: string, payKey: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/paypal/confirm/${encodeURIComponent(payKey)}`, opts)
  }
  /** Start a PayPal authorization for a new order */
  postCommerceStoreByStoreidPaypalPay<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/paypal/pay`, opts)
  }
  /** Fetch a product as this storefront sells it */
  getCommerceStoreByStoreidProductByKey<T = unknown>(storeid: string, key: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/${encodeURIComponent(storeid)}/product/${encodeURIComponent(key)}`, opts)
  }
  /** Start this store's no-card trial on the entry plan */
  postCommerceStoreByStoreidTrial<T = unknown>(storeid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/store/${encodeURIComponent(storeid)}/trial`, opts)
  }
  /** Fetch a variant as this storefront sells it */
  getCommerceStoreByStoreidVariantByKey<T = unknown>(storeid: string, key: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/store/${encodeURIComponent(storeid)}/variant/${encodeURIComponent(key)}`, opts)
  }
  /** List your org's submissions, as a page */
  getCommerceSubmission<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/submission/`, opts)
  }
  /** Create a submission */
  postCommerceSubmission<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/submission/`, opts)
  }
  /** Delete a submission, keeping a recoverable copy */
  deleteCommerceSubmissionBySubmissionid<T = unknown>(submissionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/submission/${encodeURIComponent(submissionid)}`, opts)
  }
  /** Fetch one submission */
  getCommerceSubmissionBySubmissionid<T = unknown>(submissionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/submission/${encodeURIComponent(submissionid)}`, opts)
  }
  /** Change part of a submission */
  patchCommerceSubmissionBySubmissionid<T = unknown>(submissionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/submission/${encodeURIComponent(submissionid)}`, opts)
  }
  /** Method-override tunnel for a submission — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceSubmissionBySubmissionid<T = unknown>(submissionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/submission/${encodeURIComponent(submissionid)}`, opts)
  }
  /** Replace a submission outright */
  putCommerceSubmissionBySubmissionid<T = unknown>(submissionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/submission/${encodeURIComponent(submissionid)}`, opts)
  }
  /** List your org's subscribers, as a page */
  getCommerceSubscriber<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/subscriber/`, opts)
  }
  /** Create a subscriber */
  postCommerceSubscriber<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/subscriber/`, opts)
  }
  /** Delete a subscriber, keeping a recoverable copy */
  deleteCommerceSubscriberBySubscriberid<T = unknown>(subscriberid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/subscriber/${encodeURIComponent(subscriberid)}`, opts)
  }
  /** Fetch one subscriber */
  getCommerceSubscriberBySubscriberid<T = unknown>(subscriberid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/subscriber/${encodeURIComponent(subscriberid)}`, opts)
  }
  /** Change part of a subscriber */
  patchCommerceSubscriberBySubscriberid<T = unknown>(subscriberid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/subscriber/${encodeURIComponent(subscriberid)}`, opts)
  }
  /** Method-override tunnel for a subscriber — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceSubscriberBySubscriberid<T = unknown>(subscriberid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/subscriber/${encodeURIComponent(subscriberid)}`, opts)
  }
  /** Replace a subscriber outright */
  putCommerceSubscriberBySubscriberid<T = unknown>(subscriberid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/subscriber/${encodeURIComponent(subscriberid)}`, opts)
  }
  /** List your org's token transactions, as a page */
  getCommerceTokentransaction<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/tokentransaction/`, opts)
  }
  /** Create a token transaction */
  postCommerceTokentransaction<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/tokentransaction/`, opts)
  }
  /** Delete a token transaction, keeping a recoverable copy */
  deleteCommerceTokentransactionByTokentransactionid<T = unknown>(tokentransactionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/tokentransaction/${encodeURIComponent(tokentransactionid)}`, opts)
  }
  /** Fetch one token transaction */
  getCommerceTokentransactionByTokentransactionid<T = unknown>(tokentransactionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/tokentransaction/${encodeURIComponent(tokentransactionid)}`, opts)
  }
  /** Change part of a token transaction */
  patchCommerceTokentransactionByTokentransactionid<T = unknown>(tokentransactionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/tokentransaction/${encodeURIComponent(tokentransactionid)}`, opts)
  }
  /** Method-override tunnel for a token transaction — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceTokentransactionByTokentransactionid<T = unknown>(tokentransactionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/tokentransaction/${encodeURIComponent(tokentransactionid)}`, opts)
  }
  /** Replace a token transaction outright */
  putCommerceTokentransactionByTokentransactionid<T = unknown>(tokentransactionid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/tokentransaction/${encodeURIComponent(tokentransactionid)}`, opts)
  }
  /** List your org's transfers, as a page */
  getCommerceTransfer<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/transfer/`, opts)
  }
  /** Create a transfer */
  postCommerceTransfer<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/transfer/`, opts)
  }
  /** Delete a transfer, keeping a recoverable copy */
  deleteCommerceTransferByTransferid<T = unknown>(transferid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/transfer/${encodeURIComponent(transferid)}`, opts)
  }
  /** Fetch one transfer */
  getCommerceTransferByTransferid<T = unknown>(transferid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/transfer/${encodeURIComponent(transferid)}`, opts)
  }
  /** Change part of a transfer */
  patchCommerceTransferByTransferid<T = unknown>(transferid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/transfer/${encodeURIComponent(transferid)}`, opts)
  }
  /** Method-override tunnel for a transfer — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceTransferByTransferid<T = unknown>(transferid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/transfer/${encodeURIComponent(transferid)}`, opts)
  }
  /** Replace a transfer outright */
  putCommerceTransferByTransferid<T = unknown>(transferid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/transfer/${encodeURIComponent(transferid)}`, opts)
  }
  /** List your org's variants, as a page */
  getCommerceVariant<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/variant/`, opts)
  }
  /** Create a variant */
  postCommerceVariant<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/variant/`, opts)
  }
  /** Delete a variant, keeping a recoverable copy */
  deleteCommerceVariantByVariantid<T = unknown>(variantid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/variant/${encodeURIComponent(variantid)}`, opts)
  }
  /** Fetch one variant */
  getCommerceVariantByVariantid<T = unknown>(variantid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/variant/${encodeURIComponent(variantid)}`, opts)
  }
  /** Change part of a variant */
  patchCommerceVariantByVariantid<T = unknown>(variantid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/variant/${encodeURIComponent(variantid)}`, opts)
  }
  /** Method-override tunnel for a variant — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceVariantByVariantid<T = unknown>(variantid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/variant/${encodeURIComponent(variantid)}`, opts)
  }
  /** Replace a variant outright */
  putCommerceVariantByVariantid<T = unknown>(variantid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/variant/${encodeURIComponent(variantid)}`, opts)
  }
  /** List your org's wallets, as a page */
  getCommerceWallet<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/wallet/`, opts)
  }
  /** Create a wallet */
  postCommerceWallet<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/wallet/`, opts)
  }
  /** Delete a wallet, keeping a recoverable copy */
  deleteCommerceWalletByWalletid<T = unknown>(walletid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/wallet/${encodeURIComponent(walletid)}`, opts)
  }
  /** Fetch one wallet */
  getCommerceWalletByWalletid<T = unknown>(walletid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/wallet/${encodeURIComponent(walletid)}`, opts)
  }
  /** Change part of a wallet */
  patchCommerceWalletByWalletid<T = unknown>(walletid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/wallet/${encodeURIComponent(walletid)}`, opts)
  }
  /** Method-override tunnel for a wallet — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceWalletByWalletid<T = unknown>(walletid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/wallet/${encodeURIComponent(walletid)}`, opts)
  }
  /** Replace a wallet outright */
  putCommerceWalletByWalletid<T = unknown>(walletid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/wallet/${encodeURIComponent(walletid)}`, opts)
  }
  /** List your org's watchlists, as a page */
  getCommerceWatchlist<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/watchlist/`, opts)
  }
  /** Create a watchlist */
  postCommerceWatchlist<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/watchlist/`, opts)
  }
  /** Delete a watchlist, keeping a recoverable copy */
  deleteCommerceWatchlistByWatchlistid<T = unknown>(watchlistid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/watchlist/${encodeURIComponent(watchlistid)}`, opts)
  }
  /** Fetch one watchlist */
  getCommerceWatchlistByWatchlistid<T = unknown>(watchlistid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/watchlist/${encodeURIComponent(watchlistid)}`, opts)
  }
  /** Change part of a watchlist */
  patchCommerceWatchlistByWatchlistid<T = unknown>(watchlistid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/watchlist/${encodeURIComponent(watchlistid)}`, opts)
  }
  /** Method-override tunnel for a watchlist — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceWatchlistByWatchlistid<T = unknown>(watchlistid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/watchlist/${encodeURIComponent(watchlistid)}`, opts)
  }
  /** Replace a watchlist outright */
  putCommerceWatchlistByWatchlistid<T = unknown>(watchlistid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/watchlist/${encodeURIComponent(watchlistid)}`, opts)
  }
  /** List your org's webhooks, as a page */
  getCommerceWebhook<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/webhook/`, opts)
  }
  /** Create a webhook */
  postCommerceWebhook<T = unknown>(opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/webhook/`, opts)
  }
  /** Delete a webhook, keeping a recoverable copy */
  deleteCommerceWebhookByWebhookid<T = unknown>(webhookid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('DELETE', `/v1/commerce/webhook/${encodeURIComponent(webhookid)}`, opts)
  }
  /** Fetch one webhook */
  getCommerceWebhookByWebhookid<T = unknown>(webhookid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('GET', `/v1/commerce/webhook/${encodeURIComponent(webhookid)}`, opts)
  }
  /** Change part of a webhook */
  patchCommerceWebhookByWebhookid<T = unknown>(webhookid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PATCH', `/v1/commerce/webhook/${encodeURIComponent(webhookid)}`, opts)
  }
  /** Method-override tunnel for a webhook — for clients that cannot send PUT, PATCH or DELETE */
  postCommerceWebhookByWebhookid<T = unknown>(webhookid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/webhook/${encodeURIComponent(webhookid)}`, opts)
  }
  /** Replace a webhook outright */
  putCommerceWebhookByWebhookid<T = unknown>(webhookid: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('PUT', `/v1/commerce/webhook/${encodeURIComponent(webhookid)}`, opts)
  }
  /** Payment-provider webhook intake for settlement and subscription lifecycle events */
  postCommerceWebhooksByProvider<T = unknown>(provider: string, opts: { token?: string; headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>('POST', `/v1/commerce/webhooks/${encodeURIComponent(provider)}`, opts)
  }
}

/** A body that is not JSON is still evidence; keep it rather than throwing. */
function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

let shared: Commerce | undefined

/**
 * The process-wide client.
 *
 * One instance because the base url and the timeout are properties of the
 * deployment, not of a call. Pass a token per call where the identity varies.
 */
export function hanzoCommerce(config: CommerceClientConfig = {}): Commerce {
  if (!shared) shared = new Commerce(config)
  return shared
}
