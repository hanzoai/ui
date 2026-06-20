/**
 * @hanzo/checkout
 *
 * Embeddable checkout widget for Hanzo Commerce
 * Similar to Stripe Checkout
 *
 * Usage:
 *
 * 1. React Integration:
 * ```tsx
 * import { CheckoutProvider, CheckoutForm, useCheckout } from '@hanzo/checkout'
 *
 * function App() {
 *   return (
 *     <CheckoutProvider options={{ apiKey: 'pk_live_xxx' }}>
 *       <CheckoutForm />
 *     </CheckoutProvider>
 *   )
 * }
 * ```
 *
 * 2. Vanilla JS / Redirect:
 * ```ts
 * import { createCheckout } from '@hanzo/checkout'
 *
 * const checkout = createCheckout({ apiKey: 'pk_live_xxx' })
 * const session = await checkout.createSession({
 *   lineItems: [{ name: 'Product', unitPrice: 1999, quantity: 1 }]
 * })
 * checkout.redirectToCheckout(session.id)
 * ```
 *
 * 3. Embed Script (no build step):
 * ```html
 * <script src="https://js.hanzo.ai/checkout.js"></script>
 * <button data-hanzo-checkout data-hanzo-key="pk_live_xxx" data-hanzo-amount="1999">
 *   Pay $19.99
 * </button>
 * <script>
 *   HanzoCheckout.init('pk_live_xxx')
 * </script>
 * ```
 */

// Types
export type {
  CheckoutOptions,
  CheckoutAppearance,
  CheckoutSession,
  CheckoutLineItem,
  CheckoutCustomer,
  CheckoutAddress,
  CheckoutPaymentMethod,
  CheckoutResult,
  CheckoutError,
  CreateSessionParams,
  ElementsOptions,
  CheckoutStep,
  CheckoutState
} from './types'

// Client
export { HanzoCheckout, createCheckout } from './client'

// Hooks
export { CheckoutProvider, useCheckout } from './hooks'
export type { CheckoutProviderProps } from './hooks'

// Elements
export { CheckoutForm } from './elements'
