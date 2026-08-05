// Public types for the Hanzo Event client.

/** The event kinds — the closed set the server understands. `error` marks the
 *  breadcrumb an exception leaves on the event stream (Cloud stamps
 *  event_type='error' for the warehouse, GET /v1/errors). It does NOT reach the
 *  Sentry dashboard — the envelope on the error plane does that. */
export type EventKind = 'pageview' | 'event' | 'identify' | 'group' | 'error'

/** A captured exception as it rides the EVENT STREAM — Cloud folds it into
 *  properties.$exception for the warehouse. The richer copy (parsed stack frames,
 *  grouping, release) travels on the error plane as a Sentry envelope; see
 *  AnalyticsConfig.dsn. */
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
   *  properties.$exception (foldException) for the event warehouse. Not a Sentry
   *  path: the envelope on the error plane is what feeds the dashboard. */
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
    opts: {
      beacon: boolean
      token?: string
      ingestKey?: string
      contentType?: string
      /** Surface non-OK / failed ingest on the console. Never on by default. */
      debug?: boolean
    },
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
  /** Publishable ingest key (pk-…). When set, the client attributes writes to the
   *  ONE front door `/v1/event` with this key instead of a bearer/cookie: it rides
   *  Authorization: Bearer pk-… on fetch and ?ingest_key=pk-… on a headerless
   *  page-unload beacon, so ANONYMOUS traffic is attributed and unload beacons work
   *  without a bearer. The key is write-only — it attributes a write and never mints
   *  a reading principal — so it is safe to ship in a bundle. Mint one per org with
   *  POST /v1/keys {"type":"publishable"}.
   *
   *  Omit it and the client reads NEXT_PUBLIC_PUBLISHABLE_KEY from the inlined
   *  build env, the same way `dsn` falls back — so a surface declares BOTH planes
   *  in its build and neither needs code to switch on. That is the ONE spelling
   *  the fleet already carries: KMS holds deploy/PUBLISHABLE_KEY, and each
   *  Dockerfile takes PUBLISHABLE_KEY as a build-arg and re-exports it with the
   *  NEXT_PUBLIC_ prefix that makes Next inline it.
   *
   *  A surface with no key at all still reports for whoever is SIGNED IN (the
   *  session credential attributes them), and drops every logged-out visitor: the
   *  door refuses an unattributable write rather than filing it where its owner
   *  cannot read it. That failure is invisible from the page, which is why the key
   *  belongs in the env next to the DSN and not in a checklist.
   *
   *  This attributes the EVENT STREAM only — the error plane authenticates
   *  independently with `dsn`, and one does not stand in for the other. */
  ingestKey?: string
  /** Max events buffered before an automatic flush. */
  batchSize?: number
  /** Auto-flush cadence in ms. */
  flushIntervalMs?: number
  /** Turn the client off entirely (e.g. opt-out / DNT). Defaults to enabled. */
  enabled?: boolean
  /** Auto-capture unhandled errors + promise rejections (window.onerror,
   *  unhandledrejection). Browser-only, defaults to enabled. Together with `dsn`
   *  this is what makes the client a drop-in @sentry replacement — without a
   *  `dsn` the captures never reach the Sentry dashboard. */
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
