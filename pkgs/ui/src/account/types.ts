/**
 * @hanzo/ui/account — shared types
 *
 * Every account-surface component is data-agnostic: it accepts these plain,
 * serializable shapes plus callbacks, and renders. No fetching, no store, no
 * app coupling. These are the contracts hanzo.app, hanzo.chat, and console all
 * map their own billing/usage/org data onto.
 */

/** ISO-4217 currency code (e.g. "USD"). Presentation-only; no FX is done here. */
export type CurrencyCode = string

/** Credit or dollar balance. `unit` picks how {@link CreditsMeter} renders numbers. */
export type MeterUnit = 'currency' | 'credits'

/** Recognized card networks; anything else falls back to a generic mark. */
export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay'
  | 'unknown'

/** Lifecycle of a single invoice. Drives the semantic status pill color. */
export type InvoiceStatus = 'paid' | 'open' | 'failed' | 'void' | 'refunded'

/** A member's authority within an org. Apps may narrow this to their own set. */
export type MemberRole = 'owner' | 'admin' | 'member' | 'billing' | 'viewer'

/** One selectable/purchasable plan tier. */
export interface Plan {
  id: string
  name: string
  /** Price per month in whole currency units (e.g. 20 = $20/mo). */
  priceMonthly: number
  currency?: CurrencyCode
  /** Short blurb under the price. */
  description?: string
  /** Bullet feature list rendered with checkmarks. */
  features: string[]
  /** Marks the tier as recommended (subtle emphasis, no hue). */
  highlighted?: boolean
  /** Free-form CTA label override (defaults to "Choose <name>"). */
  ctaLabel?: string
}

/** One line of a usage breakdown for a billing period. */
export interface UsageRow {
  id: string
  label: string
  /** Raw count of the metered unit (requests, tokens, GB…). */
  quantity: number
  /** Cost of this line in whole currency units. */
  cost: number
  /** Optional unit suffix shown after the quantity (e.g. "req", "GB"). */
  unit?: string
}

/** A stored payment instrument. Only display-safe fields — never a full PAN. */
export interface PaymentMethod {
  id: string
  brand: CardBrand
  /** Last four digits of the card. */
  last4: string
  expMonth?: number
  expYear?: number
  /** Whether this is the org's default instrument. */
  isDefault?: boolean
}

/** A billed invoice row. */
export interface Invoice {
  id: string
  /** Human/label number (e.g. "INV-2026-0417"). Falls back to `id`. */
  number?: string
  /** ISO date string or epoch ms — formatted for display. */
  date: string | number
  /** Amount in whole currency units. */
  amount: number
  currency?: CurrencyCode
  status: InvoiceStatus
  /** If present, a download button is rendered for this invoice. */
  downloadable?: boolean
}

/** An org/team member. */
export interface Member {
  id: string
  name?: string
  email: string
  role: MemberRole
  /** Emoji, image URL, or omitted (initials fallback). */
  avatarUrl?: string
  avatarEmoji?: string
  /** Pending invites render dimmed with a "Pending" pill. */
  pending?: boolean
}

/** Minimal org identity for the {@link OrgIdentityRow} header. */
export interface OrgIdentity {
  id: string
  name: string
  avatarUrl?: string
  avatarEmoji?: string
  /** Plan label shown as a neutral badge (e.g. "Pro", "Team"). */
  planLabel?: string
}
