// The ONE product-analytics vocabulary. Every Hanzo surface emits these exact
// names so funnels, goals, and cohorts line up across console/chat/app/site/admin.
// Pageviews use the reserved "$pageview" name (emitted by analytics.pageview()),
// matching the server read lens.
//
// Naming is a closed convention, not a style preference (see TAXONOMY.md):
//   • snake_case, `<object>_<verb-in-past-tense>` — signup_completed, plan_clicked.
//   • Names are CONSTANTS, never interpolated. A dimension (framework, model,
//     plan, source) is a PROPERTY, never part of the name. `deploy_succeeded`
//     with {framework:'static'} — never `deploy_static_succeeded`.
//   • One name per user-visible moment, shared by every surface. The surface is
//     already on the wire as `product`, so a name is never product-prefixed.

export const EVENTS = {
  // Signup funnel: view -> submit -> verify -> completed -> first action.
  SIGNUP_VIEWED: 'signup_viewed',
  SIGNUP_SUBMITTED: 'signup_submitted',
  SIGNUP_VERIFIED: 'signup_verified',
  SIGNUP_COMPLETED: 'signup_completed',
  /** A RETURNING user authenticated — the non-signup half of the IAM callback.
   *  Keeping it distinct is what stops returning logins from inflating signups. */
  LOGIN_COMPLETED: 'login_completed',
  /** Activation: the first moment of real value. ONE event for every product —
   *  the product-specific moment is the `action` property (api_call, app_live,
   *  chat_reply), never a new event name. */
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
  PROJECT_CREATED: 'project_created',
  AGENT_CREATED: 'agent_created',
  CHAT_STARTED: 'chat_started',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  /** The user switched model/endpoint — the single strongest quality signal a
   *  chat surface emits (a switch usually follows a bad answer). */
  MODEL_SWITCHED: 'model_switched',
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',

  // Build → ship. `build_*` is a MODEL producing an artifact; `deploy_*` is that
  // artifact going live. Intent (build_started) is never the same event as the
  // artifact existing (app_created) — conflating them makes the funnel lie.
  BUILD_STARTED: 'build_started',
  /** A model finished producing an artifact (an app build, a chat reply, an agent
   *  run). Carries `durationMs` — the outcome event owns its own duration, so no
   *  paired start event is needed. */
  GENERATION_COMPLETED: 'generation_completed',
  GENERATION_FAILED: 'generation_failed',
  DEPLOY_STARTED: 'deploy_started',
  DEPLOY_SUCCEEDED: 'deploy_succeeded',
  DEPLOY_FAILED: 'deploy_failed',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

/** The reserved event name a pageview is stored under (server + read lens). */
export const PAGEVIEW = '$pageview'

/** The reserved name every captured exception is emitted under. Error Tracking
 *  reads exactly this name; an exception emitted under its own message instead
 *  makes every distinct message a permanent entry in the event taxonomy. */
export const EXCEPTION = '$exception'
