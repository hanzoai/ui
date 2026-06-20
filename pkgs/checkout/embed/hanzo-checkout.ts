/**
 * @hanzo/checkout - Embed Script
 *
 * Drop-in checkout button/widget for any website
 * Similar to Stripe's checkout.js
 *
 * Usage:
 * <script src="https://js.hanzo.ai/checkout.js"></script>
 * <button data-hanzo-checkout data-hanzo-key="pk_live_xxx" data-hanzo-amount="1999" data-hanzo-currency="usd">
 *   Pay $19.99
 * </button>
 */

import { HanzoCheckout } from '../client'
import type { CheckoutOptions, CreateSessionParams } from '../types'

interface HanzoCheckoutEmbed {
  /** Initialize with API key */
  init: (apiKey: string, options?: Partial<CheckoutOptions>) => void

  /** Create checkout session and redirect */
  checkout: (params: CreateSessionParams) => Promise<void>

  /** Open checkout in popup */
  popup: (params: CreateSessionParams) => Promise<Window | null>

  /** Create checkout client */
  createClient: (options: CheckoutOptions) => HanzoCheckout
}

declare global {
  interface Window {
    HanzoCheckout: HanzoCheckoutEmbed
  }
}

// Global state
let globalClient: HanzoCheckout | null = null
let globalApiKey: string | null = null
let globalOptions: Partial<CheckoutOptions> = {}

const HanzoCheckoutEmbed: HanzoCheckoutEmbed = {
  init(apiKey: string, options: Partial<CheckoutOptions> = {}) {
    globalApiKey = apiKey
    globalOptions = options
    globalClient = new HanzoCheckout({ apiKey, ...options })

    // Auto-bind buttons with data attributes
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', bindCheckoutButtons)
      // Also bind immediately if DOM is ready
      if (document.readyState !== 'loading') {
        bindCheckoutButtons()
      }
    }
  },

  async checkout(params: CreateSessionParams) {
    if (!globalClient) {
      throw new Error('HanzoCheckout not initialized. Call HanzoCheckout.init(apiKey) first.')
    }

    const session = await globalClient.createSession(params)
    globalClient.redirectToCheckout(session.id)
  },

  async popup(params: CreateSessionParams) {
    if (!globalClient) {
      throw new Error('HanzoCheckout not initialized. Call HanzoCheckout.init(apiKey) first.')
    }

    const session = await globalClient.createSession(params)
    return globalClient.openPopup(session.id)
  },

  createClient(options: CheckoutOptions) {
    return new HanzoCheckout(options)
  }
}

/**
 * Bind click handlers to elements with data-hanzo-checkout attribute
 */
function bindCheckoutButtons() {
  const buttons = document.querySelectorAll('[data-hanzo-checkout]')

  buttons.forEach(button => {
    if (button.getAttribute('data-hanzo-bound')) return
    button.setAttribute('data-hanzo-bound', 'true')

    button.addEventListener('click', async (e) => {
      e.preventDefault()

      const el = e.currentTarget as HTMLElement

      // Get config from data attributes
      const apiKey = el.getAttribute('data-hanzo-key') || globalApiKey
      if (!apiKey) {
        console.error('HanzoCheckout: No API key provided')
        return
      }

      // Parse line items from data attributes
      const amount = parseInt(el.getAttribute('data-hanzo-amount') || '0', 10)
      const currency = el.getAttribute('data-hanzo-currency') || 'usd'
      const name = el.getAttribute('data-hanzo-name') || 'Purchase'
      const description = el.getAttribute('data-hanzo-description') || undefined
      const imageUrl = el.getAttribute('data-hanzo-image') || undefined
      const productId = el.getAttribute('data-hanzo-product') || undefined
      const sku = el.getAttribute('data-hanzo-sku') || undefined
      const quantity = parseInt(el.getAttribute('data-hanzo-quantity') || '1', 10)

      // Success/cancel URLs
      const successUrl = el.getAttribute('data-hanzo-success-url') || undefined
      const cancelUrl = el.getAttribute('data-hanzo-cancel-url') || undefined

      // Popup mode
      const usePopup = el.hasAttribute('data-hanzo-popup')

      // Create or use existing client
      const client = globalClient || new HanzoCheckout({
        apiKey,
        ...globalOptions
      })

      try {
        // Disable button
        el.setAttribute('disabled', 'true')
        const originalText = el.textContent
        el.textContent = 'Loading...'

        const session = await client.createSession({
          lineItems: [{
            productId,
            sku,
            name,
            description,
            imageUrl,
            quantity,
            unitPrice: amount,
            currency
          }],
          successUrl,
          cancelUrl,
          currency
        })

        if (usePopup) {
          client.openPopup(session.id)
          el.removeAttribute('disabled')
          el.textContent = originalText
        } else {
          client.redirectToCheckout(session.id)
        }
      } catch (error) {
        console.error('HanzoCheckout error:', error)
        el.removeAttribute('disabled')
        el.textContent = 'Error - Try Again'
      }
    })
  })
}

// Export for bundler usage
export { HanzoCheckoutEmbed }

// Attach to window for script tag usage
if (typeof window !== 'undefined') {
  window.HanzoCheckout = HanzoCheckoutEmbed
}

export default HanzoCheckoutEmbed
