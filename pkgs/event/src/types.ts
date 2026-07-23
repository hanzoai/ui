// Public types for the Hanzo Event client.

/** The event kinds — the closed set the server understands. An error is just
 *  another event on the one stream (Cloud stamps type:'error' → event_type='error',
 *  the key the error-tracking lens filters on). */
export type EventKind = 'pageview' | 'event' | 'identify' | 'group' | 'error'

/** A captured exception. Carried on a `type:'error'` event's top-level `error`
 *  field; Cloud folds it into properties.$exception and lenses the event into the
 *  error-tracking view (sentry.hanzo.ai). */
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

/** One event as sent on the wire — the canonical Hanzo Cloud event. Maps 1:1 to
 *  the cloud `CaptureEvent` (camelCase JSON keys); a batch of these is POSTed to
 *  the ONE front door `/v1/event` as `{ batch: [WireEvent, …] }`. tenant/org is
 *  NEVER a field here — the server stamps it from the validated session/key. */
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
  /** Set on `type:'error'` events — the captured exception. Cloud lifts it into
   *  properties.$exception (foldException) for the error-tracking lens. */
  error?: Exception
  properties?: Record<string, unknown>
  library?: string
  libraryVersion?: string
}

/** Injectable transports — overridden in tests; the default in core.ts uses fetch
 *  (keepalive) and sendBeacon. A bearer JWT or a publishable pk_ key rides
 *  Authorization on fetch; on a headerless beacon a publishable key rides the
 *  ?ingest_key query. */
export interface Transport {
  /** Durable POST usable during page unload (fetch keepalive / sendBeacon). */
  send(url: string, body: string, opts: { beacon: boolean; token?: string; ingestKey?: string }): void
}

export interface AnalyticsConfig {
  /** Cloud base URL. Defaults to "https://api.hanzo.ai" (the one edge). Set to
   *  same-origin ("") for cookie-auth apps served behind the same edge
   *  (console/admin/chat), so the browser rides the session cookie. */
  host?: string
  /** Emitting surface: console | chat | app | site | admin. */
  product: string
  /** Bearer token provider for token-auth apps. Omit for cookie/session apps
   *  (the client then relies on same-origin credentials). */
  getToken?: () => string | undefined | null
  /** Publishable ingest key (pk_…). When set, the client authenticates to the ONE
   *  front door `/v1/event` with this key instead of a bearer/cookie: it rides
   *  Authorization: Bearer pk_… on fetch and ?ingest_key=pk_… on a headerless
   *  page-unload beacon, so ALL THREE lenses (web + product + error) light up with
   *  no bearer and unload beacons work anonymously. The key is write-only (cannot
   *  read) and safe to ship in a bundle; mint one per org via POST /v1/ingest/keys.
   *  Recommended for marketing/public pages and the full sentry-subsuming setup. */
  ingestKey?: string
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
