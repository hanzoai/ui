/**
 * Canonical first-party funnel semantics for Hanzo Analytics (`analytics.hanzo.ai`).
 *
 * Maps vocabulary event names to normalized first-party funnel stages (`standard`)
 * and marks events carrying authoritative monetary value (`money`) that only a
 * server peer or secret key may state.
 *
 * Third-party ad network mappings and Conversions API adapters live exclusively
 * on the private server side — never in open-source client packages.
 */

export type PlatformName = 'standard'

export type StandardName =
  | 'page_view'
  | 'view_content'
  | 'search'
  | 'select_item'
  | 'add_to_cart'
  | 'start_checkout'
  | 'add_payment_info'
  | 'lead'
  | 'signup'
  | 'login'
  | 'purchase'

export interface Platforms {
  standard?: StandardName
  /** The event states a settled monetary amount. Only the server may state one. */
  money?: boolean
}

export const PLATFORMS: Readonly<Record<string, Platforms>> = {
  // ── Identity ───────────────────────────────────────────────────
  signup_viewed: { standard: 'view_content' },
  signup_submitted: { standard: 'lead' },
  signup_completed: { standard: 'signup' },
  login_completed: { standard: 'login' },

  // ── Commerce ───────────────────────────────────────────────────
  pricing_viewed: { standard: 'view_content' },
  plan_clicked: { standard: 'select_item' },
  plan_selected: { standard: 'add_to_cart' },
  checkout_viewed: { standard: 'view_content' },
  checkout_started: { standard: 'start_checkout' },
  payment_info_added: { standard: 'add_payment_info' },
  order_completed: { standard: 'purchase', money: true },
  subscription_changed: { standard: 'purchase', money: true },
  order_refunded: { money: true },

  // ── Leads ──────────────────────────────────────────────────────
  sales_contacted: { standard: 'lead' },
  waitlist_joined: { standard: 'lead' },
  referral_used: { standard: 'lead' },
  newsletter_subscribed: { standard: 'lead' },
  beta_submitted: { standard: 'lead' },
  research_access_applied: { standard: 'lead' },

  // ── Content & Discovery ────────────────────────────────────────
  product_viewed: { standard: 'view_content' },
  search_performed: { standard: 'search' },
}

/** Normalized first-party stage names for an event (`[]` when unclassified). */
export function namesOn(event: string, platform: PlatformName = 'standard'): readonly string[] {
  if (platform !== 'standard') return []
  const n = PLATFORMS[event]?.standard
  return n === undefined ? [] : [n]
}
