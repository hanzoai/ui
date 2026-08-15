// The ONE funnel registry. A funnel is DATA — an ordered list of event names —
// so the products, the read lens and the docs can never drift: every step is a
// name from EVENTS (test/funnels.mjs fails the build otherwise), and a GOAL that
// has a funnel points AT one of these rather than restating the steps.
//
// It lives beside the vocabulary rather than in the client because the read lens
// is Go and cannot import TypeScript. The catalog already ships as JSON for that
// reader, so the funnels ride the same file: one definition, two readers, and no
// second place a step could be named.

import { EVENTS, PAGEVIEW } from './names.js'

/** The emitting surfaces — the closed set of `AnalyticsConfig.product` values.
 *  `product` is on every event, so a funnel scopes by product instead of every
 *  surface prefixing its event names. */
export const PRODUCTS = [
  'site',
  'app',
  'chat',
  'console',
  'admin',
  'cloud',
  'id',
  'billing',
  'pay',
  'commerce',
] as const
export type ProductId = (typeof PRODUCTS)[number]

export interface FunnelStep {
  /** An EVENTS value (or PAGEVIEW). */
  event: string
  /** Human label for the step. */
  label: string
  /** The surface this step is emitted from, when the SAME event name marks two
   *  different moments on two surfaces — `checkout_started` on billing is
   *  leaving for the checkout, and on pay it is arriving at the card form. The
   *  gap between them is a real drop-off, and without this they would collapse
   *  into one step and hide it. Unset means any product the funnel names. */
  product?: ProductId
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
   *                  person across surfaces). Legitimate when every surface
   *                  shares the anonymous id, which is a first-party cookie on
   *                  the REGISTRABLE DOMAIN: www, billing and pay under
   *                  hanzo.ai are one person; hanzo.id is not, it is a domain of
   *                  its own and mints an id of its own.
   *  • 'aggregate' — steps are emitted on DIFFERENT registrable domains by a
   *                  LOGGED-OUT visitor, so there is no shared id. Read these as
   *                  step-over-step COUNTS, never as a per-person conversion.
   *                  Honest by construction.
   */
  join: 'person' | 'aggregate'
  steps: FunnelStep[]
}

const s = (
  event: string,
  label: string,
  extra?: Pick<FunnelStep, 'product' | 'where'>,
): FunnelStep => ({ event, label, ...(extra ?? {}) })

export const FUNNELS = {
  /** Land on hanzo.ai → account created. hanzo.id hosts the form and is its own
   *  registrable domain, so the middle of this journey is a different identity
   *  space from the ends: AGGREGATE, and read step over step. Those two id steps
   *  are the part that used to be dark — everything between "we sent them to
   *  sign up" and "they came back" happened where nothing was counted. */
  signup: {
    label: 'Signup',
    products: ['site', 'id'],
    join: 'aggregate',
    steps: [
      s(PAGEVIEW, 'Landed', { product: 'site' }),
      s(EVENTS.SIGNUP_VIEWED, 'Opened signup', { product: 'site' }),
      s(EVENTS.SIGNUP_SUBMITTED, 'Redirected to Hanzo ID', { product: 'site' }),
      s(EVENTS.SIGNUP_VIEWED, 'Saw the form', { product: 'id' }),
      s(EVENTS.SIGNUP_SUBMITTED, 'Submitted the form', { product: 'id' }),
      s(EVENTS.SIGNUP_COMPLETED, 'Account created', { product: 'site' }),
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
        where: { property: 'action', equals: 'api_call' },
      }),
    ],
  },

  /** Upgrade intent → revenue, and the whole path is under one registrable
   *  domain (www, billing and pay are all hanzo.ai), so it joins per PERSON.
   *  The two checkout steps are two surfaces: billing hands off to pay, and a
   *  buyer lost in that hop is the drop-off nobody could see. */
  upgrade: {
    label: 'Upgrade',
    products: ['site', 'app', 'console', 'billing', 'pay'],
    join: 'person',
    steps: [
      s(EVENTS.PRICING_VIEWED, 'Viewed pricing'),
      s(EVENTS.PLAN_CLICKED, 'Chose a plan'),
      s(EVENTS.CHECKOUT_STARTED, 'Left for checkout', { product: 'billing' }),
      s(EVENTS.CHECKOUT_STARTED, 'Reached the card form', { product: 'pay' }),
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
        product: 'site',
        where: { property: 'source', equals: 'composer' },
      }),
      s(EVENTS.CHAT_STARTED, 'Landed in hanzo.chat', {
        product: 'chat',
        where: { property: 'referrerProduct', equals: 'site' },
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
