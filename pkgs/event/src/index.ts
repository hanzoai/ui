// @hanzo/event — framework-agnostic entry. The ONE telemetry client.
//
//   import { createAnalytics, EVENTS } from '@hanzo/event'
//   const a = createAnalytics({ product: 'console' })  // same-origin, cookie auth
//   a.pageview(); a.capture(EVENTS.SIGNUP_COMPLETED)
//   a.captureError(err)            // errors are events too — one stream
//
// With a Sentry DSN configured, captured errors POST a Sentry envelope to
// /v1/sentry (the wire-level @sentry replacement); without one they ride the
// analytics stream as `type:'error'` events. React apps use the './react' entry
// for the provider + hooks + error boundary.

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
export {
  parseDsn,
  ingestUrlWithKey,
  buildSentryEvent,
  buildEnvelope,
  stackFrames,
  SentryReporter,
} from './sentry'
export type {
  Dsn,
  SentryFrame,
  SentryExceptionValue,
  SentryEnvelopeEvent,
  SentryContext,
} from './sentry'
export type {
  AnalyticsConfig,
  Attribution,
  Cohort,
  EventKind,
  Exception,
  Transport,
  WireEvent,
} from './types'
