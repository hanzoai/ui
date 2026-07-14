// Insights goals + cohorts, defined once as data so the console/insights UI and
// every product agree on what "a Signup", "a Sale", and "upgrade intent" mean.
// This is the machine-readable spec — the shared source of truth a sync step can
// push into Insights, and what the guide documents.

import { EVENTS } from './events'

export interface GoalDef {
  /** Human label shown in Insights. */
  label: string
  /** The event whose occurrence counts as the goal conversion. */
  event: string
  /** Optional ordered funnel leading to the goal (for funnel insights). */
  funnel?: string[]
  /** Optional property equality filter that qualifies the conversion. */
  filter?: { property: string; equals: string }
}

export const GOALS: Record<'signup' | 'sale' | 'upgradeIntent', GoalDef> = {
  // Signup: the conversion is signup_completed; the funnel is the four steps.
  signup: {
    label: 'Signup',
    event: EVENTS.SIGNUP_COMPLETED,
    funnel: [
      EVENTS.SIGNUP_VIEWED,
      EVENTS.SIGNUP_SUBMITTED,
      EVENTS.SIGNUP_VERIFIED,
      EVENTS.FIRST_ACTION,
    ],
  },
  // Sale: a completed order qualified as a plan purchase (kind=plan).
  sale: {
    label: 'Sale',
    event: EVENTS.ORDER_COMPLETED,
    filter: { property: 'kind', equals: 'plan' },
  },
  // Upgrade intent: a plan click; pricing_viewed is the top of its funnel.
  upgradeIntent: {
    label: 'Upgrade Intent',
    event: EVENTS.PLAN_CLICKED,
    funnel: [EVENTS.PRICING_VIEWED, EVENTS.PLAN_CLICKED, EVENTS.CHECKOUT_STARTED],
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
