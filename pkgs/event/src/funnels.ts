// The ONE funnel registry. A funnel is DATA — an ordered list of event names —
// so the products, the Insights UI, and the docs can never drift: every step is
// a name from EVENTS (funnels.test.ts fails the build otherwise), and a GOAL that
// has a funnel points AT one of these rather than restating the steps.
//
// Why here and not in Insights: the taxonomy is code that all three surfaces
// already import (`@hanzo/event`). A funnel defined in the read lens could name
// an event no surface emits; a funnel defined next to EVENTS cannot.

import { EVENTS, PAGEVIEW } from './events'

/** The emitting surfaces — the closed set of `AnalyticsConfig.product` values.
 *  `product` is on every event, so a funnel scopes by product instead of every
 *  surface prefixing its event names. */
export const PRODUCTS = ['site', 'app', 'chat', 'console', 'admin', 'cloud'] as const
export type ProductId = (typeof PRODUCTS)[number]

export interface FunnelStep {
  /** An EVENTS value (or PAGEVIEW). */
  event: string
  /** Human label for the Insights step. */
  label: string
  /** Property equality that qualifies the step, e.g. first_action{action:'api_call'}. */
  where?: { property: string; equals: string }
}

export interface FunnelDef {
  label: string
  /** Surface(s) the steps are emitted from — matched against the `product` field. */
  products: ProductId[]
  /**
   * How steps are joined:
   *  • 'person'    — steps join on distinctId (one browser, or one logged-in
   *                  person across surfaces). The normal case.
   *  • 'aggregate' — steps are emitted on DIFFERENT origins by a LOGGED-OUT
   *                  visitor, so there is no shared id: hanzo.ai, hanzo.app and
   *                  hanzo.chat each mint their own anonymousId in their own
   *                  storage. Read these as step-over-step COUNTS, never as a
   *                  per-person conversion. Honest by construction.
   */
  join: 'person' | 'aggregate'
  steps: FunnelStep[]
}

const s = (event: string, label: string, where?: FunnelStep['where']): FunnelStep => ({
  event,
  label,
  ...(where ? { where } : {}),
})

export const FUNNELS = {
  /** hanzo.ai: land → sign up. IAM hosts the form, so `signup_submitted` is the
   *  redirect INTO IAM and `signup_completed` is the return at /auth/callback. */
  signup: {
    label: 'Signup',
    products: ['site'],
    join: 'person',
    steps: [
      s(PAGEVIEW, 'Landed'),
      s(EVENTS.SIGNUP_VIEWED, 'Opened signup'),
      s(EVENTS.SIGNUP_SUBMITTED, 'Redirected to Hanzo ID'),
      s(EVENTS.SIGNUP_COMPLETED, 'Account created'),
      s(EVENTS.FIRST_ACTION, 'First action'),
    ],
  },

  /** The developer activation path: an account is worth nothing until a key has
   *  made a call. `first_action{action:'api_call'}` is emitted SERVER-SIDE by
   *  Cloud on an org's first successful /v1 request — a browser cannot see it. */
  apiActivation: {
    label: 'API activation',
    products: ['site', 'cloud'],
    join: 'person',
    steps: [
      s(EVENTS.SIGNUP_COMPLETED, 'Account created'),
      s(EVENTS.API_KEY_CREATED, 'Key minted'),
      s(EVENTS.FIRST_ACTION, 'First successful API call', {
        property: 'action',
        equals: 'api_call',
      }),
    ],
  },

  /** Upgrade intent → revenue. `order_completed{kind:'plan'}` is the Sale goal. */
  upgrade: {
    label: 'Upgrade',
    products: ['site', 'app', 'console'],
    join: 'person',
    steps: [
      s(EVENTS.PRICING_VIEWED, 'Viewed pricing'),
      s(EVENTS.PLAN_CLICKED, 'Chose a plan'),
      s(EVENTS.CHECKOUT_STARTED, 'Started checkout'),
      s(EVENTS.ORDER_COMPLETED, 'Paid'),
    ],
  },

  /** hanzo.app: describe → build → deploy → live URL. The whole product thesis
   *  in five steps; `deploy_succeeded` is the moment a live URL exists. */
  appShip: {
    label: 'Describe → ship',
    products: ['app'],
    join: 'person',
    steps: [
      s(PAGEVIEW, 'Landed'),
      s(EVENTS.BUILD_STARTED, 'Described an app'),
      s(EVENTS.GENERATION_COMPLETED, 'Got a working build'),
      s(EVENTS.DEPLOY_STARTED, 'Hit publish'),
      s(EVENTS.DEPLOY_SUCCEEDED, 'Live URL'),
    ],
  },

  /** hanzo.chat: visit → first message → answer. `generation_completed` is what
   *  separates "typed something" from "got value". */
  chatEngage: {
    label: 'Chat engagement',
    products: ['chat'],
    join: 'person',
    steps: [
      s(PAGEVIEW, 'Landed'),
      s(EVENTS.CHAT_STARTED, 'Started a conversation'),
      s(EVENTS.CHAT_MESSAGE_SENT, 'Sent a message'),
      s(EVENTS.GENERATION_COMPLETED, 'Got an answer'),
    ],
  },

  /** The cross-surface handoff: the hanzo.ai composer forwards its prompt to
   *  hanzo.chat. Two origins, two anonymousIds — so this is an AGGREGATE funnel.
   *  The join is the `referrerProduct` property hanzo.chat reads off `?hz_ref=`,
   *  which makes the drop-off measurable without any cross-domain identity. */
  siteToChat: {
    label: 'Site → Chat handoff',
    products: ['site', 'chat'],
    join: 'aggregate',
    steps: [
      s(EVENTS.CHAT_STARTED, 'Submitted the hanzo.ai composer', {
        property: 'source',
        equals: 'composer',
      }),
      s(EVENTS.CHAT_STARTED, 'Landed in hanzo.chat', {
        property: 'referrerProduct',
        equals: 'site',
      }),
      s(EVENTS.GENERATION_COMPLETED, 'Got an answer'),
    ],
  },
} as const satisfies Record<string, FunnelDef>

export type FunnelId = keyof typeof FUNNELS

/** eventsOf flattens a funnel to its ordered event names — what a goal's `funnel`
 *  field carries, so the steps are defined exactly once (here). */
export function eventsOf(id: FunnelId): string[] {
  return FUNNELS[id].steps.map((step) => step.event)
}
