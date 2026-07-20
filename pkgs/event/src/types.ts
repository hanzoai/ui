// Public types for the Hanzo Event client.

/** The event kinds — the closed set the server understands. An error is just
 *  another event on the one stream (lensed to the error-tracking view). */
export type EventKind = 'pageview' | 'event' | 'identify' | 'group' | 'error'

/** A captured exception. Carried on a `type:'error'` event; the server lenses it
 *  into the error-tracking view (sentry.hanzo.ai). */
export interface Exception {
  /** Constructor/class name, e.g. "TypeError". */
  type?: string
  /** The error message. */
  message: string
  /** Stack trace when available. */
  stack?: string
  /** false = an unhandled/global error (window.onerror, unhandledrejection);
   *  true = a caught error the app chose to report. Defaults true. */
  handled?: boolean
}

/** First-touch marketing attribution, parsed once and persisted. */
export interface Attribution {
  utm: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
  referrer?: string
  refCode?: string
  /** Derived acquisition channel: direct | organic | paid | social | referral. */
  channel?: string
}

/** Cohort dimensions carried on every event once known (see goals.ts COHORTS). */
export interface Cohort {
  /** ISO week the person first signed up, e.g. "2026-W28". */
  signupWeek?: string
  channel?: string
  refCode?: string
}

/** One event as sent on the wire. tenant/org is NEVER set here — the server
 *  stamps it from the validated session. */
export interface WireEvent {
  messageId: string
  type: EventKind
  event?: string
  timestamp: string
  distinctId?: string
  anonymousId?: string
  personId?: string
  sessionId?: string
  product?: string
  url?: string
  path?: string
  referrer?: string
  utm?: Attribution['utm']
  refCode?: string
  channel?: string
  groupId?: string
  signupWeek?: string
  productId?: string
  quantity?: number
  revenue?: number
  currency?: string
  /** Set on `type:'error'` events — the captured exception. */
  error?: Exception
  properties?: Record<string, unknown>
  library?: string
  libraryVersion?: string
}

/** Injectable transports — overridden in tests; default in core.ts uses fetch. */
export interface Transport {
  /** Durable POST usable during page unload (fetch keepalive / sendBeacon). */
  send(url: string, body: string, opts: { beacon: boolean; token?: string }): void
}

export interface AnalyticsConfig {
  /** Cloud base URL. Same-origin ("") for cookie-auth apps (console/admin);
   *  e.g. "https://api.hanzo.ai" for bearer apps (app/site). */
  host?: string
  /** Emitting surface: console | chat | app | site | admin. */
  product: string
  /** Bearer token provider for token-auth apps. Omit for cookie/session apps
   *  (the client then relies on same-origin credentials). */
  getToken?: () => string | undefined | null
  /** Max events buffered before an automatic flush. */
  batchSize?: number
  /** Auto-flush cadence in ms. */
  flushIntervalMs?: number
  /** Turn the client off entirely (e.g. opt-out / DNT). Defaults to enabled. */
  enabled?: boolean
  /** Auto-capture unhandled errors + promise rejections (window.onerror,
   *  unhandledrejection) as error events. Browser-only. Defaults to enabled —
   *  this is what makes the client a drop-in @sentry replacement. */
  captureErrors?: boolean
  /** Override the transport (tests). */
  transport?: Transport
  /** Debug logging. */
  debug?: boolean
}
