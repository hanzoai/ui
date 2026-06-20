/**
 * @hanzo/checkout - Type definitions
 *
 * Stripe-like checkout widget for Hanzo Commerce
 */

export interface CheckoutOptions {
  /** Hanzo API key (publishable key) */
  apiKey: string

  /** Environment: 'production' | 'sandbox' */
  mode?: 'production' | 'sandbox'

  /** Custom API endpoint */
  apiEndpoint?: string

  /** Locale for i18n */
  locale?: string

  /** Theme configuration */
  appearance?: CheckoutAppearance

  /** Callbacks */
  onSuccess?: (result: CheckoutResult) => void
  onError?: (error: CheckoutError) => void
  onCancel?: () => void

  /** Enable test mode */
  testMode?: boolean
}

export interface CheckoutAppearance {
  /** Theme: 'light' | 'dark' | 'auto' */
  theme?: 'light' | 'dark' | 'auto'

  /** Primary brand color */
  primaryColor?: string

  /** Background color */
  backgroundColor?: string

  /** Border radius */
  borderRadius?: string

  /** Font family */
  fontFamily?: string

  /** Custom CSS variables */
  variables?: Record<string, string>

  /** Custom CSS rules */
  rules?: Record<string, Record<string, string>>
}

export interface CheckoutSession {
  /** Session ID */
  id: string

  /** Session status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

  /** Line items */
  lineItems: CheckoutLineItem[]

  /** Subtotal in cents */
  subtotal: number

  /** Tax amount in cents */
  tax: number

  /** Shipping cost in cents */
  shipping: number

  /** Total in cents */
  total: number

  /** Currency code */
  currency: string

  /** Customer info */
  customer?: CheckoutCustomer

  /** Shipping address */
  shippingAddress?: CheckoutAddress

  /** Billing address */
  billingAddress?: CheckoutAddress

  /** Payment method */
  paymentMethod?: CheckoutPaymentMethod

  /** Metadata */
  metadata?: Record<string, string>

  /** URLs */
  successUrl?: string
  cancelUrl?: string

  /** Expiration */
  expiresAt?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

export interface CheckoutLineItem {
  /** Item ID */
  id: string

  /** Product ID */
  productId: string

  /** SKU */
  sku?: string

  /** Name */
  name: string

  /** Description */
  description?: string

  /** Image URL */
  imageUrl?: string

  /** Quantity */
  quantity: number

  /** Unit price in cents */
  unitPrice: number

  /** Total price in cents */
  totalPrice: number

  /** Currency */
  currency: string

  /** Metadata */
  metadata?: Record<string, string>
}

export interface CheckoutCustomer {
  /** Customer ID */
  id?: string

  /** Email */
  email: string

  /** Name */
  name?: string

  /** Phone */
  phone?: string
}

export interface CheckoutAddress {
  /** Address line 1 */
  line1: string

  /** Address line 2 */
  line2?: string

  /** City */
  city: string

  /** State/Province */
  state?: string

  /** Postal code */
  postalCode: string

  /** Country code (ISO 3166-1 alpha-2) */
  country: string
}

export interface CheckoutPaymentMethod {
  /** Payment method type */
  type: 'card' | 'crypto' | 'apple_pay' | 'google_pay' | 'bank_transfer'

  /** Card details (if type is 'card') */
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }

  /** Crypto details (if type is 'crypto') */
  crypto?: {
    currency: string
    network: string
    address: string
  }
}

export interface CheckoutResult {
  /** Session ID */
  sessionId: string

  /** Order ID */
  orderId: string

  /** Status */
  status: 'success' | 'pending'

  /** Payment intent ID */
  paymentIntentId?: string

  /** Customer ID */
  customerId?: string

  /** Receipt URL */
  receiptUrl?: string
}

export interface CheckoutError {
  /** Error code */
  code: string

  /** Error message */
  message: string

  /** Additional details */
  details?: Record<string, unknown>
}

export interface CreateSessionParams {
  /** Line items */
  lineItems: Array<{
    productId?: string
    sku?: string
    name: string
    description?: string
    imageUrl?: string
    quantity: number
    unitPrice: number
    currency?: string
    metadata?: Record<string, string>
  }>

  /** Customer info */
  customer?: {
    email: string
    name?: string
    phone?: string
  }

  /** Success URL */
  successUrl?: string

  /** Cancel URL */
  cancelUrl?: string

  /** Currency code */
  currency?: string

  /** Metadata */
  metadata?: Record<string, string>

  /** Enable shipping */
  shipping?: boolean

  /** Collect phone */
  collectPhone?: boolean

  /** Allowed payment methods */
  paymentMethods?: Array<'card' | 'crypto' | 'apple_pay' | 'google_pay'>

  /** Promo code */
  promoCode?: string
}

export interface ElementsOptions {
  /** Checkout session or session ID */
  session: CheckoutSession | string

  /** Appearance options */
  appearance?: CheckoutAppearance

  /** Locale */
  locale?: string
}

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation'

export interface CheckoutState {
  /** Current step */
  step: CheckoutStep

  /** Session data */
  session: CheckoutSession | null

  /** Loading state */
  isLoading: boolean

  /** Error state */
  error: CheckoutError | null

  /** Processing payment */
  isProcessing: boolean
}
