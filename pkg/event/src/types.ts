// Public types for the Hanzo Event client.

/** The event kinds — the closed set the server understands. `error` is a captured
 *  exception; the server files it on the error plane. */
export type EventKind = 'pageview' | 'event' | 'identify' | 'group' | 'error'

/** A captured exception, as the `error` field of a `type:'error'` event. */
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
  /** The structured stack, oldest first. */
  frames?: { function?: string; file?: string; line?: number; column?: number }[]
}

/** One stack frame as Error Tracking renders it. The key names are the product's
 *  POST-symbolication vocabulary (`mangled_name`/`source`/`line`/`column`), which
 *  is what the issue view reads straight off `$exception_list`. */
export interface ExceptionFrame {
  /** "<hash>/<part>" — stable per code location; the frame's identity. */
  raw_id: string
  /** The function name as it appears in the shipped bundle. */
  mangled_name: string
  /** File/URL the frame is in. */
  source: string
  line: number
  column: number
  /** First-party code. Frames without this are hidden by default in the product. */
  in_app: boolean
  lang: string
  /** Whether a symbol set mapped this frame back to original source. */
  resolved: boolean
  resolve_failure?: string
  resolved_name?: string | null
  module?: string | null
}

/** One exception in `$exception_list`. */
export interface ExceptionEntry {
  id: string
  type: string
  value: string
  mechanism?: {
    type: 'generic'
    handled: boolean
    synthetic?: boolean
  }
  /** `type` MUST be 'resolved' — the renderer draws frames on no other value. */
  stacktrace?: { type: 'resolved'; frames: ExceptionFrame[] }
}

/** The `$exception_*` property bag Error Tracking reads off a `$exception` event. */
export interface ExceptionProperties {
  $exception_list: ExceptionEntry[]
  /** Issue grouping key. An event without one is dropped by the issue query. */
  $exception_fingerprint: string
  $exception_fingerprint_record: { type: 'manual' }[]
  $exception_type: string
  $exception_message: string
  $exception_level: SentryLevel
  $exception_handled: boolean
  $exception_synthetic: boolean
  $exception_types: string[]
  $exception_values: string[]
  $exception_sources: string[]
  $exception_functions: string[]
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
 *  the ONE entry point `/v1/event` as `{ batch: [WireEvent, …] }`. tenant/org is
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
   *  properties.$exception (foldException) for the event warehouse. The
   *  server files it on the error plane. */
  error?: Exception
  level?: string
  release?: string
  environment?: string
  site?: string
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
   *  `contentType` names the FETCH request's Content-Type — it defaults to
   *  application/json, and the error plane sets application/x-sentry-envelope. A
   *  beacon body carries a CORS-safelisted type so the POST stays a simple request;
   *  that is a property of the transport, not a caller's choice. */
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
   *  ONE entry point `/v1/event` with this key instead of a bearer/cookie: it rides
   *  Authorization: Bearer pk-… on fetch and ?ingest_key=pk-… on a headerless
   *  page-unload beacon, so ANONYMOUS traffic is attributed and unload beacons work
   *  without a bearer. The key is write-only — it attributes a write and never mints
   *  a reading principal — so it is safe to ship in a bundle. Mint one per org with
   *  POST /v1/keys {"type":"publishable"}.
   *
   *  Omit it and the client reads NEXT_PUBLIC_PUBLISHABLE_KEY from the inlined
   *  build env, That is the ONE spelling
   *  the fleet already carries: KMS holds deploy/PUBLISHABLE_KEY, and each
   *  Dockerfile takes PUBLISHABLE_KEY as a build-arg and re-exports it with the
   *  NEXT_PUBLIC_ prefix that makes Next inline it.
   *
   *  A surface with no key at all still reports for whoever is SIGNED IN (the
   *  session credential attributes them), and drops every logged-out visitor: the
   *  edge refuses an unattributable write rather than filing it where its owner
   *  cannot read it. That failure is invisible from the page, which is why the key
   *  belongs in the env next to the DSN and not in a checklist.
   */
  ingestKey?: string
  /** Max events buffered before an automatic flush. */
  batchSize?: number
  /** Auto-flush cadence in ms. */
  flushIntervalMs?: number
  /** Turn the client off entirely (e.g. opt-out / DNT). Defaults to enabled. */
  enabled?: boolean
  /** Auto-capture unhandled errors + promise rejections (window.onerror,
   *  unhandledrejection). Browser-only, defaults to enabled. */
  captureErrors?: boolean
  /** Override the transport (tests). */
  transport?: Transport
  /** Debug logging. */
  debug?: boolean

  /** Release stamped on error events (a git SHA / app version). */
  release?: string
  /** Deployment environment for error events (production | staging | …). */
  environment?: string
  /** Retain end-user PII (emails/IPs) in error text. Default false = scrub
   *  client-side before anything leaves the device (the server scrubs again). */
  capturePII?: boolean
}

// ── stack frame and level types ──────────────────────────────────────────────

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

/** Options for Analytics.captureError. */
export interface CaptureErrorOptions {
  /** false => uncaught (window.onerror / unhandledrejection / render crash). */
  handled?: boolean
  /** Severity + free-form context; merged into the event's tags. */
  properties?: Record<string, unknown>
  /** Override the event level (default: error, or fatal when handled === false). */
  level?: SentryLevel
}
