// Insights goals + cohorts, defined once as data so the console/insights UI and
// every product agree on what "a Signup", "a Sale", and "upgrade intent" mean.
// This is the machine-readable spec — the shared source of truth a sync step can
// push into Insights, and what TAXONOMY.md documents.
//
// A goal answers "what counts as a conversion". A funnel answers "by what path".
// The paths live in funnels.ts and a goal REFERENCES one by id: the steps are
// written down exactly once.

import { EVENTS } from './events'
import { eventsOf, type FunnelId } from './funnels'

export interface GoalDef {
  /** Human label shown in Insights. */
  label: string
  /** The event whose occurrence counts as the goal conversion. */
  event: string
  /** The funnel leading to the goal — an id into FUNNELS (see funnels.ts). */
  funnelId?: FunnelId
  /** The ordered event names of `funnelId`, derived — never hand-written. */
  funnel?: string[]
  /** Optional property equality filter that qualifies the conversion. */
  filter?: { property: string; equals: string }
}

export const GOALS: Record<'signup' | 'sale' | 'upgradeIntent' | 'activation', GoalDef> = {
  // Signup: the conversion is signup_completed, along the site signup funnel.
  signup: {
    label: 'Signup',
    event: EVENTS.SIGNUP_COMPLETED,
    funnelId: 'signup',
    funnel: eventsOf('signup'),
  },
  // Sale: a completed order qualified as a plan purchase (kind=plan).
  sale: {
    label: 'Sale',
    event: EVENTS.ORDER_COMPLETED,
    funnelId: 'upgrade',
    funnel: eventsOf('upgrade'),
    filter: { property: 'kind', equals: 'plan' },
  },
  // Upgrade intent: a plan click; pricing_viewed is the top of its funnel.
  upgradeIntent: {
    label: 'Upgrade Intent',
    event: EVENTS.PLAN_CLICKED,
    funnelId: 'upgrade',
    funnel: eventsOf('upgrade'),
  },
  // Activation: the ONE north-star conversion — an account that did the first
  // valuable thing (a successful API call, a live app, a chat answer).
  activation: {
    label: 'Activation',
    event: EVENTS.FIRST_ACTION,
    funnelId: 'apiActivation',
    funnel: eventsOf('apiActivation'),
  },
}

export interface CohortDef {
  /** The hanzo.events column the cohort dimension maps to. */
  field: string
  label: string
}

export const COHORTS: Record<'signupWeek' | 'channel' | 'refCode', CohortDef> = {
  signupWeek: { field: 'signup_week', label: 'Signup week' },
  channel: { field: 'channel', label: 'Acquisition channel' },
  refCode: { field: 'ref_code', label: 'Referral code' },
}
