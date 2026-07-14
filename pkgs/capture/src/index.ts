// @hanzo/analytics — framework-agnostic entry.
//
//   import { createAnalytics, EVENTS } from '@hanzo/analytics'
//   const a = createAnalytics({ product: 'console' })  // same-origin, cookie auth
//   a.pageview(); a.capture(EVENTS.SIGNUP_COMPLETED)
//
// React apps use the './react' entry for the provider + hooks.

export { Analytics, createAnalytics, VERSION, getCohort, getFirstTouch } from './core'
export { EVENTS, PAGEVIEW } from './events'
export type { EventName } from './events'
export { GOALS, COHORTS } from './goals'
export type { GoalDef, CohortDef } from './goals'
export {
  parseAttribution,
  deriveChannel,
  hasAttribution,
  hostOf,
  isoWeek,
} from './attribution'
export type {
  AnalyticsConfig,
  Attribution,
  Cohort,
  EventKind,
  Transport,
  WireEvent,
} from './types'
