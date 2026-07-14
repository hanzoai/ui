// The ONE product-analytics vocabulary. Every Hanzo surface emits these exact
// names so funnels, goals, and cohorts line up across console/chat/app/site/admin.
// Pageviews use the reserved "$pageview" name (emitted by analytics.pageview()),
// matching the server read lens.

export const EVENTS = {
  // Signup funnel: view -> submit -> verify -> completed -> first action.
  SIGNUP_VIEWED: 'signup_viewed',
  SIGNUP_SUBMITTED: 'signup_submitted',
  SIGNUP_VERIFIED: 'signup_verified',
  SIGNUP_COMPLETED: 'signup_completed',
  FIRST_ACTION: 'first_action',

  // Waitlist + referral.
  WAITLIST_JOINED: 'waitlist_joined',
  WAITLIST_SHARED: 'waitlist_shared',
  REFERRAL_USED: 'referral_used',
  REFERRAL_CLAIMED: 'referral_claimed',

  // Upgrade-intent + purchase.
  PRICING_VIEWED: 'pricing_viewed',
  PLAN_CLICKED: 'plan_clicked',
  CHECKOUT_STARTED: 'checkout_started',
  ORDER_COMPLETED: 'order_completed',

  // Feature usage — generic + the common key surfaces across products.
  FEATURE_USED: 'feature_used',
  API_KEY_CREATED: 'api_key_created',
  APP_CREATED: 'app_created',
  DEPLOY_STARTED: 'deploy_started',
  PROJECT_CREATED: 'project_created',
  AGENT_CREATED: 'agent_created',
  CHAT_STARTED: 'chat_started',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

/** The reserved event name a pageview is stored under (server + read lens). */
export const PAGEVIEW = '$pageview'
