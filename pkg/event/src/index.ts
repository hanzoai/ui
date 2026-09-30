// @hanzo/event — framework-agnostic entry. The ONE telemetry client.
//
//   import { createAnalytics, EVENTS } from '@hanzo/event'
//   const a = createAnalytics({ product: 'console' })  // same-origin, cookie auth
//   a.pageview(); a.capture(EVENTS.SIGNUP_COMPLETED)
//   a.captureError(err)            // errors are events too — one stream
//
// React apps use the './react' entry for the provider + hooks + error boundary.

export {
  Analytics,
  createAnalytics,
  resetClients,
  VERSION,
  getCohort,
  getFirstTouch,
} from './core'
export { framesFromStack } from './throwable'
export { uuidv7, uuidv7Time } from './uid'
export { linkUrl, readLink, stripLink, LINK_PARAMS } from './link'
export type { LinkState } from './link'
export { scrubText, redactSecrets, scrubPII } from './scrub'
export { EVENTS, EXCEPTION, PAGEVIEW } from './events'
export { exceptionEntry, exceptionProperties, fingerprint, digest } from './exception'
export type { EventName } from './events'
export {
  CONSENT_COOKIE, CONSENT_EVENT, CONSENT_VERSION_COOKIE, POLICY_EVENT, acceptAll, asks, gpc, notices, policy as consentPolicy, serve as serveConsent, read as readConsent, refused, region,
  rejectAll, render as renderConsent, save as saveConsent, stored as storedConsent,
} from './consent'
export type { Choice, Policy as ConsentRule, Region } from './consent'
export { CLICK_IDS, capture as captureClick, touch } from './touch'
export { start as startTags, ready as tagsReady, track, mirror, reach, visit } from './tags'
export type { Audience, BrowserTag, TagOptions } from './tags'
export { commerceItem, worth } from './items'
export type { CommerceItem, PlanLine } from './items'
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
  EventKind,
  Exception,
  ExceptionEntry,
  ExceptionFrame,
  ExceptionProperties,
  SentryFrame,
  SentryLevel,
  Transport,
  WireEvent,
} from './types'

/** Which org owns a host's telemetry — the resolution that lets a surface report
 *  correctly while configuring nothing. `keyFor` takes an optional keyring so a
 *  runtime that receives one (hanzo.id serves every brand from one image) resolves
 *  through this same function rather than a second copy of it. */
export { ORG_DOMAIN, ORG_KEY, SITE_KEY, siteKey, orgOf, keyFor, keyForPage } from './org'
export type { Keyring } from './org'
