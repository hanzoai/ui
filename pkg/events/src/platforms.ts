/**
 * What each event is called on every ad and analytics platform.
 *
 * ONE table, two readers. The browser tag loader in @hanzo/event reads it to
 * fire each platform's pixel under the event's own id, and cloud's server-side
 * forwarder reads it (as `platforms` in catalog.json) to send the same event
 * to each platform's conversion API. Because both read this file, a browser
 * copy and its server copy carry the same name and the platform counts one.
 *
 * An event absent from a platform's column is not sent there. A value that is
 * an array sends each name in order, under the same event id: the first is the
 * event, the rest are what the platform also wants for the same moment.
 *
 * LinkedIn and X do not name events in the pixel: an advertiser creates one
 * conversion rule per kind, and the pixel is told which rule fired. Their
 * column names the KIND (`sign_up`, `purchase`, `lead`, `begin_checkout`); the
 * rule ids for each kind are tag configuration, never code.
 *
 * `standard` is the normalized name cloud's adapters that do not name events
 * (Google Ads, Pinterest, Reddit) key on. `ads` marks the moments Google Ads
 * (and so YouTube ads) counts as conversions.
 */

export type PlatformName = 'ga4' | 'meta' | 'linkedin' | 'x' | 'tiktok'

export type StandardName =
  | 'page_view'
  | 'view_content'
  | 'view_item_list'
  | 'select_item'
  | 'lead'
  | 'signup'
  | 'login'
  | 'start_checkout'
  | 'add_to_cart'
  | 'purchase'
  | 'contact'

type Name = string | readonly string[]

export interface Platforms {
  standard?: StandardName
  ga4?: Name
  meta?: Name
  linkedin?: Name
  x?: Name
  tiktok?: Name
  ads?: boolean
}

export const PLATFORMS: Readonly<Record<string, Platforms>> = {
  // ── Sign-up ────────────────────────────────────────────────────
  signup_viewed: { standard: 'view_content', ga4: 'view_item', meta: 'ViewContent', tiktok: 'ViewContent' },
  signup_submitted: { standard: 'lead', ga4: 'generate_lead', meta: 'Lead' },
  signup_completed: {
    standard: 'signup',
    ga4: 'sign_up',
    meta: 'CompleteRegistration',
    linkedin: 'sign_up',
    x: 'sign_up',
    tiktok: 'CompleteRegistration',
    ads: true,
  },
  login_completed: { standard: 'login', ga4: 'login' },
  first_action: { ga4: 'first_message' },

  // ── Plans and checkout: the commerce funnel ────────────────────
  pricing_viewed: { standard: 'view_item_list', ga4: 'view_item_list', meta: 'ViewContent', tiktok: 'ViewContent' },
  plan_clicked: { standard: 'select_item', ga4: 'select_item', meta: 'PlanClicked', tiktok: 'ClickButton' },
  plan_selected: { standard: 'add_to_cart', ga4: 'add_to_cart', meta: 'AddToCart', x: 'add_to_cart', tiktok: 'AddToCart' },
  plan_changed: { ga4: ['remove_from_cart', 'add_to_cart'], meta: 'CustomizeProduct' },
  plan_skipped: { ga4: 'plan_skipped', meta: 'PlanSkipped' },
  upgrade_clicked: { ga4: 'select_promotion', meta: 'UpgradeClicked' },
  checkout_started: {
    standard: 'start_checkout',
    ga4: 'begin_checkout',
    meta: 'InitiateCheckout',
    linkedin: 'begin_checkout',
    x: 'begin_checkout',
    tiktok: 'InitiateCheckout',
    ads: true,
  },
  payment_info_added: { ga4: 'add_payment_info', meta: 'AddPaymentInfo', tiktok: 'AddPaymentInfo' },
  checkout_failed: { ga4: 'checkout_failed', meta: 'CheckoutFailed' },
  order_completed: {
    standard: 'purchase',
    ga4: 'purchase',
    meta: ['Purchase', 'Subscribe'],
    linkedin: 'purchase',
    x: 'purchase',
    tiktok: 'CompletePayment',
    ads: true,
  },
  subscription_changed: { ga4: 'purchase', meta: 'Subscribe' },
  subscription_canceled: { ga4: 'subscription_canceled', meta: 'SubscriptionCanceled' },
  order_refunded: { ga4: 'refund', meta: 'OrderRefunded' },

  // ── Leads ──────────────────────────────────────────────────────
  sales_contacted: {
    standard: 'lead',
    ga4: 'generate_lead',
    meta: 'Lead',
    linkedin: 'lead',
    x: 'lead',
    tiktok: 'SubmitForm',
    ads: true,
  },
  waitlist_joined: { standard: 'lead', ga4: 'generate_lead', meta: 'Lead', linkedin: 'lead', x: 'lead', tiktok: 'SubmitForm' },
  referral_used: { standard: 'lead' },
}

/** The names an event goes by on a platform: [] when the platform is not sent it. */
export function namesOn(event: string, platform: PlatformName): readonly string[] {
  const n = PLATFORMS[event]?.[platform]
  return n === undefined ? [] : typeof n === 'string' ? [n] : n
}
