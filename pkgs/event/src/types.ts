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
  /** Durable POST usable during page unload (fetch keepalive / sendBeacon).
   *  `contentType` defaults to application/json; the error plane overrides it with
   *  application/x-sentry-envelope. */
  send(
    url: string,
    body: string,
    opts: { beacon: boolean; token?: string; ingestKey?: string; contentType?: string },
  ): void
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

  // ── error plane (Sentry envelope -> sentry.hanzo.ai) ──────────────────────

  /** Hanzo-minted Sentry DSN: "https://<version>:<hmac>@<host>/v1/sentry/<projectId>".
   *  Publishable — the key authorizes writes to ONE project and can read nothing,
   *  so it is safe in a browser bundle (same trust class as `ingestKey`). When
   *  absent the client reads NEXT_PUBLIC_HANZO_EVENT_DSN; when neither is set the
   *  error plane is inert (fail-safe: nothing sent, nothing thrown, analytics
   *  unaffected). Mint one per property: POST /v1/sentry/projects. */
  dsn?: string
  /** Release stamped on error events (a git SHA / app version). */
  release?: string
  /** Deployment environment for error events (production | staging | …). */
  environment?: string
  /** Retain end-user PII (emails/IPs) in error text. Default false = scrub
   *  client-side before anything leaves the device (the server scrubs again). */
  capturePII?: boolean
}

// ── Sentry envelope wire types (a from-scratch model of the PUBLIC, documented
//    Sentry ingest protocol — develop.sentry.dev; no upstream code) ───────────

export type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug'

export interface SentryFrame {
  filename?: string
  function?: string
  module?: string
  abs_path?: string
  lineno?: number
  colno?: number
  in_app?: boolean
}

export interface SentryExceptionValue {
  type?: string
  value?: string
  module?: string
  stacktrace?: { frames: SentryFrame[] }
}

export interface SentryUser {
  /** Stable subject id (OIDC sub / anon id). NEVER email/username/ip. */
  id?: string
}

export interface SentryEvent {
  event_id: string
  timestamp: number
  platform: 'javascript'
  level: SentryLevel
  logger?: string
  environment?: string
  release?: string
  transaction?: string
  fingerprint?: string[]
  message?: string
  exception?: { values: SentryExceptionValue[] }
  tags?: Record<string, string>
  user?: SentryUser
  contexts?: Record<string, Record<string, unknown>>
  sdk?: { name: string; version: string }
}

/** Parsed DSN — the public key + the derived ingest URL. */
export interface Dsn {
  /** "<version>:<hmac>" public key presented via ?sentry_key= (beacon-safe). */
  publicKey: string
  /** Ingest origin, e.g. "https://sentry.hanzo.ai". */
  origin: string
  /** Project id segment. */
  projectId: string
  /** Fully-derived envelope ingest URL incl. ?sentry_key=. */
  ingestUrl: string
}

/** Options for Analytics.captureError. */
export interface CaptureErrorOptions {
  /** false => uncaught (window.onerror / unhandledrejection / render crash). */
  handled?: boolean
  /** Severity + free-form context; merged into the event's tags. */
  properties?: Record<string, unknown>
  /** Override the event level (default: error, or fatal when handled === false). */
  level?: SentryLevel
}
