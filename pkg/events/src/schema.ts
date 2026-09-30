/**
 * What each event MEANS and what it CARRIES.
 *
 * `names.ts` says which events exist. This says what they are — one entry per
 * name, a sentence a human can read and a property list a machine can check.
 *
 * Two rules keep this honest, and both matter more than completeness:
 *
 * 1. A property is listed only where there is EVIDENCE for it — a docstring in
 *    the vocabulary, or a live `capture()` call in a Hanzo surface. An invented
 *    property is worse than an absent one: it teaches a wrong shape to whoever
 *    reads this next, and to anything trained on the corpus.
 *
 * 2. Every event is OPEN. The wire accepts free-form properties and always has,
 *    so `props` is what we know an event carries, never the exhaustive set. A
 *    property absent here is undocumented, not forbidden — which is why the
 *    server records an unknown one rather than refusing it.
 *
 * The dimensions of an event are properties, never part of its name:
 * `deploy_succeeded` with `{framework:'static'}`, never `deploy_static_succeeded`.
 * That is what makes a funnel line up across surfaces, and it is why this file
 * can exist at all.
 */

/** A property's type, as it travels on the wire. */
export type PropType = 'string' | 'number' | 'boolean'

export interface PropSpec {
  type: PropType
  /** What it means. Written for someone reading a chart, not a type signature. */
  doc: string
  /** The values seen in practice. Advisory — the wire accepts others. */
  values?: readonly string[]
}

export interface EventSpec {
  /** One sentence: the user-visible moment this records. */
  summary: string
  /** Properties we have evidence for. Never exhaustive — see rule 2 above. */
  props: Readonly<Record<string, PropSpec>>
}

const NONE: Readonly<Record<string, PropSpec>> = {}

/** What a plan step carries; every commerce event also carries GA4-shaped `items`. */
const PLAN: Readonly<Record<string, PropSpec>> = {
  plan: { type: 'string', doc: 'The plan id.', values: ['free', 'dev', 'max', 'team_standard', 'team_premium'] },
  interval: { type: 'string', doc: 'Billing interval.', values: ['monthly', 'annual'] },
  seats: { type: 'number', doc: 'Seats; 1 for an individual plan.' },
}

/**
 * The catalog, keyed by the wire name (the value in EVENTS, not the constant).
 * Keying by the wire name is deliberate: it is what arrives at the endpoint, what
 * lands in the warehouse, and therefore what anything reading this has in hand.
 */
export const SCHEMA: Readonly<Record<string, EventSpec>> = {
  // ── Signup funnel ────────────────────────────────────────────────
  signup_viewed: { summary: 'The signup form was shown.', props: NONE },
  signup_submitted: { summary: 'The signup form was submitted.', props: NONE },
  signup_verified: { summary: 'The address on a signup was verified.', props: NONE },
  signup_completed: { summary: 'A new account exists and is usable.', props: NONE },
  login_completed: {
    summary:
      'A RETURNING user authenticated. Distinct from signup_completed on purpose — ' +
      'folding the two makes every returning login inflate the signup count.',
    props: NONE,
  },
  logout_completed: { summary: 'The session ended and the visitor is signed out.', props: NONE },
  first_action: {
    summary:
      'Activation: the first moment of real value. ONE event for every product — ' +
      'which moment it was is the `action` property, never a new event name.',
    props: {
      action: {
        type: 'string',
        doc: 'The product-specific moment that counted as activation.',
        values: ['api_call', 'app_live', 'chat_reply'],
      },
    },
  },

  // ── Waitlist and referral ────────────────────────────────────────
  waitlist_joined: { summary: 'Someone joined a waitlist.', props: NONE },
  waitlist_shared: { summary: 'Someone shared their waitlist position.', props: NONE },
  referral_used: { summary: 'A referral code was applied.', props: NONE },
  referral_claimed: { summary: 'A referral reward was claimed.', props: NONE },

  // ── Upgrade intent and purchase ──────────────────────────────────
  pricing_viewed: { summary: 'The pricing surface was shown.', props: NONE },
  plan_clicked: {
    summary: 'A specific plan was chosen from pricing.',
    props: {
      plan: { type: 'string', doc: 'The plan name as the catalog spells it.' },
      interval: { type: 'string', doc: 'Billing interval.', values: ['monthly', 'annual'] },
      from: { type: 'string', doc: 'Where the plan was pressed.' },
    },
  },
  checkout_started: {
    summary: 'The billing form was shown with a total.',
    props: PLAN,
  },
  order_completed: {
    summary: 'Payment succeeded and the order exists. Stated by the server on payment confirmation.',
    props: {
      order_id: { type: 'string', doc: 'The processor reference; the browser and server copies share it.' },
      value: { type: 'number', doc: 'What the card was charged, in major units.' },
      currency: { type: 'string', doc: 'ISO 4217 code.' },
      plan: { type: 'string', doc: 'The plan bought.' },
      seats: { type: 'number', doc: 'Seats bought; 1 for an individual plan.' },
    },
  },
  plan_selected: {
    summary: 'Checkout opened on a plan.',
    props: PLAN,
  },
  plan_skipped: { summary: 'The visitor chose to stay on the free plan.', props: NONE },
  plan_changed: {
    summary: 'In checkout the plan was swapped, monthly and annual were switched, or seats were adjusted.',
    props: {
      from: { type: 'string', doc: 'The plan or interval before the change.' },
      to: { type: 'string', doc: 'The plan or interval after the change.' },
      field: { type: 'string', doc: 'What changed.', values: ['plan', 'interval', 'seats'] },
    },
  },
  upgrade_clicked: {
    summary: 'An upgrade entry inside a product was pressed.',
    props: { from: { type: 'string', doc: 'The entry: pill, menu, settings, limit.' } },
  },
  payment_info_added: {
    summary: 'The card was tokenized by the payment form. No card data leaves the form.',
    props: PLAN,
  },
  checkout_failed: {
    summary: 'Checkout ended in a decline or an error.',
    props: { reason: { type: 'string', doc: 'A short reason code, never card data.' } },
  },
  subscription_changed: {
    summary: 'A subscription was upgraded, downgraded or its seats changed after purchase.',
    props: {
      from: { type: 'string', doc: 'The plan before.' },
      to: { type: 'string', doc: 'The plan after.' },
    },
  },
  subscription_canceled: {
    summary: 'A subscription was canceled.',
    props: { plan: { type: 'string', doc: 'The plan canceled.' } },
  },
  order_refunded: {
    summary: 'An order was refunded.',
    props: { order_id: { type: 'string', doc: 'The order the refund belongs to.' } },
  },
  sales_contacted: {
    summary: 'The enterprise or buying-specialist form was sent.',
    props: NONE,
  },

  // ── Onboarding ───────────────────────────────────────────────────
  usage_selected: {
    summary: 'The person said how they will use the product.',
    props: { use: { type: 'string', doc: 'How it will be used.', values: ['personal', 'team', 'enterprise'] } },
  },
  team_created: { summary: 'A team organization was created.', props: NONE },
  first_chat_notice_accepted: {
    summary: 'The notice before the first chat was accepted.',
    props: { train_opt_in: { type: 'boolean', doc: 'Whether chats may train Zen models.' } },
  },
  name_set: { summary: 'The person told us what to call them.', props: NONE },
  role_selected: {
    summary: 'The person picked the kind of work they do.',
    props: { role: { type: 'string', doc: 'The role as the list spells it.' } },
  },
  starter_prompt_used: {
    summary: 'A starter prompt card opened a chat.',
    props: {
      role: { type: 'string', doc: 'The role the card belongs to.' },
      prompt: { type: 'string', doc: 'The card label.' },
    },
  },
  own_topic_chosen: { summary: 'The person chose to start with their own topic.', props: NONE },


  // ── Feature usage ────────────────────────────────────────────────
  feature_used: {
    summary: 'The generic usage event, for a surface with no dedicated name yet.',
    props: NONE,
  },
  api_key_created: { summary: 'An API key was minted.', props: NONE },
  app_created: {
    summary: 'An app now exists.',
    props: { source: { type: 'string', doc: 'Where the app came from — a template, an import, or empty.' } },
  },
  project_created: { summary: 'A project now exists.', props: NONE },
  agent_created: { summary: 'An agent was defined.', props: NONE },
  chat_started: { summary: 'A conversation began.', props: NONE },
  chat_message_sent: {
    summary: 'A turn was sent in a conversation.',
    props: { hasImages: { type: 'boolean', doc: 'Whether the turn carried image attachments.' } },
  },
  model_switched: {
    summary:
      'The user changed model or endpoint — the strongest quality signal a chat ' +
      'surface emits, because a switch usually follows a bad answer.',
    props: NONE,
  },
  task_started: { summary: 'A task began.', props: NONE },
  task_completed: { summary: 'A task finished.', props: NONE },

  // ── Build → ship ─────────────────────────────────────────────────
  // `build_*` is a model producing an artifact; `deploy_*` is that artifact
  // going live. Intent is never the same event as the artifact existing.
  build_started: {
    summary: 'A build was requested.',
    props: {
      mode: { type: 'string', doc: 'How the build was invoked.' },
      withBase: { type: 'boolean', doc: 'Whether the build provisions a Base alongside the app.' },
    },
  },
  generation_completed: {
    summary:
      'A model finished producing an artifact — an app build, a chat reply, an ' +
      'agent run. It carries its own duration, so no paired start event is needed.',
    props: { durationMs: { type: 'number', doc: 'Wall-clock milliseconds the generation took.' } },
  },
  generation_failed: { summary: 'A model failed to produce its artifact.', props: NONE },
  deploy_started: {
    summary: 'A deploy was requested.',
    props: {
      framework: { type: 'string', doc: 'The framework detected or declared for the deploy.' },
      update: { type: 'boolean', doc: 'Whether this replaces an existing deployment.' },
      source: { type: 'string', doc: 'What triggered the deploy.' },
    },
  },
  deploy_succeeded: { summary: 'The artifact is live.', props: NONE },
  deploy_failed: { summary: 'The deploy did not reach live.', props: NONE },
}
