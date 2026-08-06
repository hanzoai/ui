// @hanzo/event — framework-agnostic entry. The ONE telemetry client.
//
//   import { createAnalytics, EVENTS } from '@hanzo/event'
//   const a = createAnalytics({ product: 'console' })  // same-origin, cookie auth
//   a.pageview(); a.capture(EVENTS.SIGNUP_COMPLETED)
//   a.captureError(err)            // errors are events too — one stream
//
// React apps use the './react' entry for the provider + hooks + error boundary.

export { Analytics, createAnalytics, VERSION, getCohort, getFirstTouch } from './core'
export { parseDsn, buildSentryEvent, buildEnvelope, framesFromStack } from './sentry'
export { uuidv7, uuidv7Time } from './uid'
export { PRODUCT_PROJECT, dsnForProduct } from './dsn'
export type { ErrorIdentity } from './sentry'
export { scrubText, redactSecrets, scrubPII } from './scrub'
export { EVENTS, PAGEVIEW } from './events'
export type { EventName } from './events'
export { GOALS, COHORTS } from './goals'
export type { GoalDef, CohortDef } from './goals'
export { FUNNELS, PRODUCTS, eventsOf } from './funnels'
export type { FunnelDef, FunnelStep, FunnelId, ProductId } from './funnels'
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
  CaptureErrorOptions,
  Cohort,
  Dsn,
  EventKind,
  Exception,
  SentryEvent,
  SentryFrame,
  SentryLevel,
  Transport,
  WireEvent,
} from './types'
