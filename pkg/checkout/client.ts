/**
 * @hanzo/checkout - Client
 *
 * Hanzo Checkout API client - similar to Stripe.js
 */

import type {
  CheckoutOptions,
  CheckoutSession,
  CreateSessionParams,
  CheckoutResult,
  CheckoutError,
  CheckoutAddress,
  CheckoutPaymentMethod
} from './types'

const DEFAULT_API_ENDPOINT = 'https://api.hanzo.ai/v1'
const SANDBOX_API_ENDPOINT = 'https://sandbox.hanzo.ai/v1'

export class HanzoCheckout {
  private apiKey: string
  private apiEndpoint: string
  private mode: 'production' | 'sandbox'
  private options: CheckoutOptions

  constructor(options: CheckoutOptions) {
    if (!options.apiKey) {
      throw new Error('Hanzo Checkout: apiKey is required')
    }

    this.apiKey = options.apiKey
    this.mode = options.mode ?? 'production'
    this.apiEndpoint = options.apiEndpoint ??
      (this.mode === 'sandbox' ? SANDBOX_API_ENDPOINT : DEFAULT_API_ENDPOINT)
    this.options = options
  }

  /**
   * Create a new checkout session
   */
  async createSession(params: CreateSessionParams): Promise<CheckoutSession> {
    const response = await this.request<CheckoutSession>('POST', '/checkout/sessions', {
      line_items: params.lineItems.map(item => ({
        product_id: item.productId,
        sku: item.sku,
        name: item.name,
        description: item.description,
        image_url: item.imageUrl,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency: item.currency ?? 'usd',
        metadata: item.metadata
      })),
      customer: params.customer ? {
        email: params.customer.email,
        name: params.customer.name,
        phone: params.customer.phone
      } : undefined,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      currency: params.currency ?? 'usd',
      metadata: params.metadata,
      shipping: params.shipping ?? true,
      collect_phone: params.collectPhone ?? false,
      payment_methods: params.paymentMethods ?? ['card'],
      promo_code: params.promoCode
    })

    return this.normalizeSession(response)
  }

  /**
   * Retrieve an existing checkout session
   */
  async retrieveSession(sessionId: string): Promise<CheckoutSession> {
    const response = await this.request<CheckoutSession>('GET', `/checkout/sessions/${sessionId}`)
    return this.normalizeSession(response)
  }

  /**
   * Update shipping address
   */
  async updateShipping(sessionId: string, address: CheckoutAddress): Promise<CheckoutSession> {
    const response = await this.request<CheckoutSession>(
      'PATCH',
      `/checkout/sessions/${sessionId}/shipping`,
      {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country
      }
    )
    return this.normalizeSession(response)
  }

  /**
   * Update billing address
   */
  async updateBilling(sessionId: string, address: CheckoutAddress): Promise<CheckoutSession> {
    const response = await this.request<CheckoutSession>(
      'PATCH',
      `/checkout/sessions/${sessionId}/billing`,
      {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country
      }
    )
    return this.normalizeSession(response)
  }

  /**
   * Apply a promo code
   */
  async applyPromoCode(sessionId: string, code: string): Promise<CheckoutSession> {
    const response = await this.request<CheckoutSession>(
      'POST',
      `/checkout/sessions/${sessionId}/promo`,
      { code }
    )
    return this.normalizeSession(response)
  }

  /**
   * Process payment
   */
  async confirmPayment(
    sessionId: string,
    paymentMethod: {
      type: 'card'
      card: {
        number: string
        expMonth: number
        expYear: number
        cvc: string
      }
    } | {
      type: 'crypto'
      crypto: {
        currency: string
        network: string
      }
    } | {
      type: 'apple_pay' | 'google_pay'
      token: string
    }
  ): Promise<CheckoutResult> {
    const response = await this.request<{
      session_id: string
      order_id: string
      status: 'success' | 'pending'
      payment_intent_id?: string
      customer_id?: string
      receipt_url?: string
    }>('POST', `/checkout/sessions/${sessionId}/confirm`, {
      payment_method: paymentMethod
    })

    const result: CheckoutResult = {
      sessionId: response.session_id,
      orderId: response.order_id,
      status: response.status,
      paymentIntentId: response.payment_intent_id,
      customerId: response.customer_id,
      receiptUrl: response.receipt_url
    }

    if (this.options.onSuccess && result.status === 'success') {
      this.options.onSuccess(result)
    }

    return result
  }

  /**
   * Cancel session
   */
  async cancelSession(sessionId: string): Promise<void> {
    await this.request('POST', `/checkout/sessions/${sessionId}/cancel`)
    this.options.onCancel?.()
  }

  /**
   * Redirect to hosted checkout page
   */
  redirectToCheckout(sessionId: string): void {
    const host = this.mode === 'sandbox' ? 'sandbox.hanzo.ai' : 'checkout.hanzo.ai'
    window.location.href = `https://${host}/c/${sessionId}`
  }

  /**
   * Open checkout in a popup
   */
  openPopup(sessionId: string): Window | null {
    const host = this.mode === 'sandbox' ? 'sandbox.hanzo.ai' : 'checkout.hanzo.ai'
    const url = `https://${host}/c/${sessionId}?popup=true`
    const width = 450
    const height = 700
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2

    return window.open(
      url,
      'HanzoCheckout',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )
  }

  /**
   * Make API request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.apiEndpoint}${path}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Hanzo-Client': 'checkout-js/1.0.0'
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const checkoutError: CheckoutError = {
        code: error.code ?? 'unknown_error',
        message: error.message ?? 'An unexpected error occurred',
        details: error.details
      }

      if (this.options.onError) {
        this.options.onError(checkoutError)
      }

      throw checkoutError
    }

    return response.json()
  }

  /**
   * Normalize API response to CheckoutSession
   */
  private normalizeSession(data: CheckoutSession | Record<string, unknown>): CheckoutSession {
    return {
      id: data.id as string,
      status: data.status as CheckoutSession['status'],
      lineItems: (data.line_items as Array<Record<string, unknown>> ?? []).map(item => ({
        id: item.id as string,
        productId: item.product_id as string,
        sku: item.sku as string | undefined,
        name: item.name as string,
        description: item.description as string | undefined,
        imageUrl: item.image_url as string | undefined,
        quantity: item.quantity as number,
        unitPrice: item.unit_price as number,
        totalPrice: item.total_price as number,
        currency: item.currency as string,
        metadata: item.metadata as Record<string, string> | undefined
      })),
      subtotal: data.subtotal as number,
      tax: data.tax as number,
      shipping: data.shipping as number,
      total: data.total as number,
      currency: data.currency as string,
      customer: data.customer ? {
        id: (data.customer as Record<string, unknown>).id as string | undefined,
        email: (data.customer as Record<string, unknown>).email as string,
        name: (data.customer as Record<string, unknown>).name as string | undefined,
        phone: (data.customer as Record<string, unknown>).phone as string | undefined
      } : undefined,
      shippingAddress: data.shipping_address ? this.normalizeAddress(data.shipping_address as Record<string, unknown>) : undefined,
      billingAddress: data.billing_address ? this.normalizeAddress(data.billing_address as Record<string, unknown>) : undefined,
      paymentMethod: data.payment_method as CheckoutPaymentMethod | undefined,
      metadata: data.metadata as Record<string, string> | undefined,
      successUrl: data.success_url as string | undefined,
      cancelUrl: data.cancel_url as string | undefined,
      expiresAt: data.expires_at as string | undefined,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string
    }
  }

  private normalizeAddress(data: Record<string, unknown>): CheckoutAddress {
    return {
      line1: data.line1 as string,
      line2: data.line2 as string | undefined,
      city: data.city as string,
      state: data.state as string | undefined,
      postalCode: data.postal_code as string,
      country: data.country as string
    }
  }
}

/**
 * Create a new Hanzo Checkout instance
 */
export function createCheckout(options: CheckoutOptions): HanzoCheckout {
  return new HanzoCheckout(options)
}

export default HanzoCheckout
