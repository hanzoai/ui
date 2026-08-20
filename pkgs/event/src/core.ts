// The framework-agnostic event client. ONE API surface over TWO orthogonal
// planes, sharing one session and one identity:
//
//   1. EVENT STREAM — buffered pageview/event/identify/group, flushed as ONE
//      batch to the Hanzo Cloud front door:
//        POST {host}/v1/event   body: { batch: [Event, …] }  -> { accepted, dropped }
//      Cloud resolves the tenant server-side (validated session, or the signed
//      publishable key) and stamps it; the client NEVER sends the org.
//
//   2. ERROR PLANE — every captured exception is ALSO framed as a real Sentry
//      envelope and POSTed to the error host named by the DSN:
//        POST {dsn.base}/envelope/?sentry_key=…   ({base} = /v1/event/{projectId})
//      This is what reaches sentry.hanzo.ai (issues, grouping, stack frames).
//
// These are NOT the same pipe and one does NOT feed the other. The event stream
// stores a `type:'error'` row in the cloud event warehouse (readable via
// GET /v1/errors) — that is product signal, not error tracking. There is no
// server-side fan-out from /v1/event into Sentry; without the envelope below,
// nothing ever reaches sentry.hanzo.ai. An earlier revision of this file claimed
// the one door was "lensed server-side into … error tracking (sentry)". It was
// wrong, and it silently cost the fleet all of its error telemetry.
//
// The error plane is inert (fail-safe) when no DSN is configured: nothing is
// sent, nothing throws, and the event stream is unaffected.
//
// Auth is orthogonal — the SAME body to the SAME door, differing only in how the
// caller proves its tenant:
//
//   • cookie/session app (host:'')  — same-origin credentials ride the request.
//   • bearer app (getToken)         — Authorization: Bearer <jwt>.
//   • publishable-key app (ingestKey: 'pk-…') — ?ingest_key=pk-… on the query, on
//     the fetch and the beacon alike, with a text/plain body. Write-only and safe
//     to ship in a bundle; the door resolves it to an org server-side. The query
//     is the carrier neither send needs a header for, which is what keeps both
//     CORS-simple and therefore sendable from a customer's own origin.
//
// The wire is the canonical `Event` (== the cloud CaptureEvent): its `type` field
// is what Cloud folds to event_type='error', which is how the event WAREHOUSE
// classifies the row (GET /v1/errors). That is the extent of it — the fold does
// not forward anything to Sentry. The error dashboard is fed only by the envelope
// in plane 2 above, and only when a DSN is set.

import {
  parseAttribution,
  hasAttribution,
  deriveChannel,
} from './attribution'
import { dsnForProduct } from './dsn'
import { EXCEPTION, PAGEVIEW } from './events'
import { exceptionProperties } from './exception'
import { scrubText } from './scrub'
import {
  buildEnvelope,
  buildSentryEvent,
  normalizeError as normalizeThrowable,
  parseDsn,
  type ErrorIdentity,
} from './sentry'
import {
  anonId,
  sessionId,
  getFirstTouch,
  setFirstTouchOnce,
  getCohort,
  mergeCohort,
} from './storage'
import { uuidv7 } from './uid'
import type {
  AnalyticsConfig,
  Attribution,
  CaptureErrorOptions,
  Cohort,
  Dsn,
  EventKind,
  Exception,
  Transport,
  WireEvent,
} from './types'
import { VERSION } from './version'

export { VERSION }

const EVENT_PATH = '/v1/event' // the ONE canonical ingestion front door
const DEFAULT_HOST = 'https://api.hanzo.ai' // the one edge; cookie apps pass host:''
const ENVELOPE_CONTENT_TYPE = 'application/x-sentry-envelope'
// The beacon body's type. text/plain is CORS-SAFELISTED, which is the whole
// property: a safelisted type makes the POST a SIMPLE request, and a simple
// request needs no preflight. An unloading document does not get a second round
// trip, so cross-origin a preflighted beacon is never sent at all. The door reads
// the raw body and dispatches on its first non-space byte, so the type names the
// CORS class and nothing else.
const BEACON_CONTENT_TYPE = 'text/plain'

/** readEnvDsn resolves a DSN from the public env when config omits one, so an app
 *  gets the error plane by setting ONE build-time variable and nothing else.
 *  Next/Vite inline these at build; the access is guarded so it is safe in a bare
 *  browser and during SSR/prerender where `process` may not exist. */
function readEnvDsn(): string | undefined {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NEXT_PUBLIC_HANZO_EVENT_DSN || process.env.HANZO_EVENT_DSN || undefined
    }
  } catch {
    /* no process — browser without inlined env */
  }
  return undefined
}

/** readEnv reads an inlined build-time variable, guarded like readEnvDsn. */
function readEnv(name: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && process.env) return process.env[name] || undefined
  } catch {
    /* no process */
  }
  return undefined
}

/** appendQuery adds a single query param to a URL string — used to carry a
 *  publishable key on either send (?ingest_key=…). */
function appendQuery(url: string, key: string, value: string): string {
  return url + (url.includes('?') ? '&' : '?') + key + '=' + encodeURIComponent(value)
}

/** Normalize anything thrown (Error | string | unknown) into an Exception. */
/** normalizeError adapts the shared, hostile-input-safe normalizer (sentry.ts) to
 *  the event stream's Exception shape. ONE normalizer serves both planes: a thrown
 *  object may define `name`/`message`/`stack` as throwing getters, and when each
 *  plane rolled its own reader the stream still lost the report that the error
 *  plane had already survived. */
function normalizeError(err: unknown): Exception {
  const n = normalizeThrowable(err)
  return { type: n.name, message: n.message, stack: n.stack }
}

// React Native defines a `window` but no `document` (and no `window.location`),
// so `typeof window !== 'undefined'` alone took the browser path there and
// `init()` threw on `window.location.search`. Requiring `document` makes RN read
// as non-browser: `init()` returns early (skips attribution + the visibility/
// unload listeners RN doesn't have), while `capture()`/`flush()` — which are NOT
// gated on this and post through plain `fetch` — still emit. So the client is
// inert-safe under SSR/Node and live on RN, without a second transport.
const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

/** serializeBatch stringifies a batch, salvaging what it can. `properties` is
 *  arbitrary caller data — a DOM node, a React synthetic event, an axios error are
 *  all circular, and a getter on one can throw — so a whole batch must never be
 *  lost to a single poisoned event. Falls back to per-event serialization, then to
 *  keeping the event and dropping its properties. Returns null only when nothing
 *  at all survives. */
function serializeBatch(batch: WireEvent[]): string | null {
  try {
    return JSON.stringify({ batch })
  } catch {
    /* one bad event — salvage the rest below */
  }
  const parts: string[] = []
  for (const e of batch) {
    try {
      parts.push(JSON.stringify(e))
    } catch {
      try {
        // Keep the event (identity, session, type all matter); drop the payload
        // that could not be serialized, and say so rather than lying by omission.
        parts.push(JSON.stringify({ ...e, properties: { $unserializable: true } }))
      } catch {
        /* unsalvageable — drop this ONE event, never the batch */
      }
    }
  }
  return parts.length > 0 ? '{"batch":[' + parts.join(',') + ']}' : null
}

/** DefaultTransport: fetch(keepalive) for authenticated/normal sends;
 *  navigator.sendBeacon for page-unload beacons.
 *
 *  A publishable key rides the ?ingest_key query on BOTH, which is what keeps
 *  both CORS-simple: the query is the one carrier neither send needs a header
 *  for, and a simple request leaves the browser from any origin — permission is
 *  asked to READ a cross-origin response, never to send one. That is what lets a
 *  bundled client run on a customer's own page. A JWT is first-party by
 *  construction, so it keeps Authorization and the session it travels with.
 *
 *  `contentType` names the FETCH request's Content-Type (the error plane sets the
 *  envelope type there, and keeps the header carrier with it). The beacon body is
 *  always BEACON_CONTENT_TYPE: its type is a CORS class, not a payload
 *  description, and a beacon that is not a simple request is never sent. */
class DefaultTransport implements Transport {
  send(
    url: string,
    body: string,
    opts: {
      beacon: boolean
      token?: string
      ingestKey?: string
      contentType?: string
      debug?: boolean
    },
  ): void {
    if (opts.beacon && isBrowser() && typeof navigator.sendBeacon === 'function') {
      const beaconUrl = opts.ingestKey ? appendQuery(url, 'ingest_key', opts.ingestKey) : url
      try {
        // The answer is whether the agent QUEUED the batch — false for a body past
        // the beacon size limit, or a full queue. Only a queued batch ends the
        // send; a refused one falls through to the keepalive fetch below.
        const queued = navigator.sendBeacon(
          beaconUrl,
          new Blob([body], { type: BEACON_CONTENT_TYPE }),
        )
        if (queued) return
        if (opts.debug) console.warn('[event] beacon refused, falling back to fetch')
      } catch {
        /* fall through to fetch */
      }
    }
    if (typeof fetch !== 'function') return
    // A publishable key makes the send a CORS SIMPLE request: the key rides the
    // query, the body is text/plain, and nothing asks for credentials. That is what
    // lets a bundled client run on a customer's own page — every send from there is
    // cross-origin, and an Authorization header or a JSON type preflights the POST
    // for an origin that cannot pass one. A JWT is first-party by construction, so
    // it keeps the header and the session it travels with, and so does the error
    // plane, which names its own envelope type.
    const simple = opts.ingestKey !== undefined && opts.contentType === undefined
    const headers: Record<string, string> = {
      'Content-Type': simple ? BEACON_CONTENT_TYPE : (opts.contentType ?? 'application/json'),
    }
    const bearer = simple ? undefined : (opts.ingestKey ?? opts.token)
    if (bearer) headers.Authorization = `Bearer ${bearer}`
    void fetch(simple ? appendQuery(url, 'ingest_key', opts.ingestKey!) : url, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
      credentials: simple ? 'omit' : 'include',
    })
      .then((res) => {
        // Telemetry loss never throws into the app — but silence is how this
        // client lost the fleet's errors in the first place. Under `debug`, say
        // so. A rejected ingest (the CORS allowlist 403s non-production origins,
        // so local dev NEVER reports) is otherwise indistinguishable from success.
        if (!res.ok && opts.debug) {
          console.warn('[event] ingest rejected', res.status, url.split('?')[0])
        }
      })
      .catch((e: unknown) => {
        if (opts.debug) console.warn('[event] ingest failed', url.split('?')[0], e)
      })
  }
}

export class Analytics {
  private cfg: Required<
    Pick<AnalyticsConfig, 'product' | 'batchSize' | 'flushIntervalMs' | 'enabled' | 'captureErrors'>
  > &
    AnalyticsConfig
  private transport: Transport
  private queue: WireEvent[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private personId?: string
  private attribution: Attribution = { utm: {} }
  private cohort: Cohort = {}
  private started = false
  /** The view pageview() last counted — path + location. */
  private counted?: string
  /** Parsed error-plane DSN, or null when the plane is inert. */
  private dsn: Dsn | null
  /** Guards against an error thrown *inside* the error path re-entering it. */
  private reentrant = false

  constructor(config: AnalyticsConfig) {
    this.cfg = {
      host: DEFAULT_HOST,
      batchSize: 20,
      flushIntervalMs: 5000,
      enabled: true,
      captureErrors: true,
      ...config,
      // The publishable key resolves from ONE live source, never a literal baked
      // beside the code. Most specific first:
      //   1. an explicit `ingestKey` in config;
      //   2. NEXT_PUBLIC_PUBLISHABLE_KEY, the inlined build-time env the fleet
      //      carries end to end — KMS `deploy/PUBLISHABLE_KEY` -> the PUBLISHABLE_KEY
      //      build-arg -> the NEXT_PUBLIC_ prefix Next inlines.
      //
      // A surface that provides neither has no key, and its anonymous traffic
      // files under `$public` (which drops track/identify/group and answers 200);
      // the fix is to give it the KMS-sourced env, not to hardcode the org key
      // here. The key is a credential-class value: its home is KMS, and the ONE
      // build reads it from there.
      ingestKey: config.ingestKey ?? readEnv('NEXT_PUBLIC_PUBLISHABLE_KEY'),
    }
    this.transport = config.transport ?? new DefaultTransport()
    // Error plane, most specific source first: an explicit DSN wins, then the
    // inlined build-time env (a per-deploy override), then the product registry —
    // whose DSN carries the SAME resolved key (not a baked one), so declaring
    // `product` + providing the key is enough to report errors. Malformed or
    // absent => null => inert, never throwing into the host app.
    this.dsn = parseDsn(
      config.dsn ?? readEnvDsn() ?? dsnForProduct(this.cfg.product, this.cfg.ingestKey)
    )
  }

  /** adopt gives this client a credential it does not have. The key belongs to
   *  the stream, not to whichever caller happened to ask for the handle first,
   *  so a later caller carrying one hands it over. The error plane derives from
   *  the key, so it comes up here too when it was inert for want of one.
   *  Present fields are never overwritten: the first caller's key stays. */
  adopt(config: AnalyticsConfig): void {
    if (config.ingestKey && !this.cfg.ingestKey) this.cfg.ingestKey = config.ingestKey
    if (config.getToken && !this.cfg.getToken) this.cfg.getToken = config.getToken
    if (!this.dsn) {
      this.dsn = parseDsn(
        config.dsn ?? readEnvDsn() ?? dsnForProduct(this.cfg.product, this.cfg.ingestKey),
      )
    }
  }

  /** errorPlaneEnabled reports whether captured exceptions can actually reach the
   *  error host. False means a DSN was never configured — the documented
   *  fail-safe. Exposed so an app (or a test) can assert its wiring instead of
   *  discovering months later that nothing was ever reported. */
  get errorPlaneEnabled(): boolean {
    return this.dsn !== null
  }

  /** errorIngestUrl is the fully-derived envelope endpoint, or undefined when the
   *  plane is inert. Diagnostics only. */
  get errorIngestUrl(): string | undefined {
    return this.dsn?.ingestUrl
  }

  /** init is idempotent and browser-only for its side effects: capture first-touch
   *  attribution, hydrate cohort, register the unload flush, and (unless opted out)
   *  auto-capture unhandled errors. Safe to call from a React effect on every
   *  render. */
  init(): void {
    if (this.started || !this.cfg.enabled) return
    this.started = true
    if (!isBrowser()) return

    const parsed = parseAttribution(window.location.search, document.referrer)
    this.attribution = hasAttribution(parsed)
      ? setFirstTouchOnce(parsed)
      : getFirstTouch() ?? parsed
    this.cohort = mergeCohort({
      channel: this.attribution.channel ?? deriveChannel(this.attribution),
      refCode: this.attribution.refCode,
    })

    const flushHidden = () => {
      if (document.visibilityState === 'hidden') this.flush(true)
    }
    window.addEventListener('visibilitychange', flushHidden)
    window.addEventListener('pagehide', () => this.flush(true))

    // Auto error capture — the drop-in @sentry replacement. Unhandled errors and
    // rejected promises are reported on BOTH planes: a Sentry envelope to the DSN
    // host (what reaches the error dashboard — requires a DSN) and a type:'error'
    // event on the stream (product signal in the warehouse).
    if (this.cfg.captureErrors) {
      window.addEventListener('error', (e: ErrorEvent) => {
        this.captureError(e.error ?? e.message, { handled: false })
      })
      window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        this.captureError(e.reason, { handled: false })
      })
    }
  }

  /** identify binds the current visitor to a stable person id (post-login). */
  identify(personId: string, traits?: Record<string, unknown>): void {
    this.personId = personId
    this.enqueue('identify', undefined, { properties: traits })
  }

  /** group associates the visitor with an org/team (analytics grouping, not the
   *  server tenant — the server still derives tenant from the session). */
  group(groupId: string, traits?: Record<string, unknown>): void {
    this.enqueue('group', undefined, { groupId, properties: traits })
  }

  /** pageview records a $pageview for the current (or given) location, once per
   *  view. A view is the path plus the full location, so a query or hash change
   *  is a new one and a repeat call for the same place is not. */
  pageview(path?: string, properties?: Record<string, unknown>): void {
    // No `url` here: build() reads window.location.href for every event, in the
    // same tick, so this recomputed it to the identical value. Only `path` is
    // passed, because a route change fires before window.location has caught up
    // and the caller's value has to win.
    const p = path ?? (isBrowser() ? window.location.pathname : undefined)
    // Counting a page once is the client's rule, not each caller's. A page holds
    // several emitters that each correctly believe they count the first view —
    // the provider's autoPageview, a router hook, a nav autocapture — and per
    // emitter state cannot see the others. On the stream they are one page.
    const view = (p ?? '') + '\0' + (isBrowser() ? window.location.href : '')
    if (view === this.counted) return
    this.counted = view
    this.enqueue('pageview', PAGEVIEW, { path: p, properties })
  }

  /** capture records a named product event with optional properties. Commerce
   *  fields (productId/quantity/revenue/currency) may be passed for order events. */
  capture(
    event: string,
    properties?: Record<string, unknown>,
    commerce?: Pick<WireEvent, 'productId' | 'quantity' | 'revenue' | 'currency'>,
  ): void {
    this.enqueue('event', event, { properties, ...commerce })
  }

  /** track is an alias of capture (Segment familiarity). */
  track = this.capture.bind(this)

  /** captureError reports a caught error, an unhandled rejection, a React render
   *  error, or a manual report to BOTH planes, from one call:
   *
   *    - the ERROR PLANE — a real Sentry envelope to the DSN host. This is the one
   *      that produces an issue in sentry.hanzo.ai (grouping, stack frames, AST).
   *      Inert when no DSN is configured.
   *    - the EVENT STREAM — a `type:'error'` row in the cloud event warehouse, so
   *      an error stays correlated with the session's pageviews for product
   *      analysis (readable via GET /v1/errors).
   *
   *  Both carry the SAME session and subject id, so an error and the pageview
   *  before it join up. Never throws back into the app; errors are higher-signal
   *  than pageviews, so both planes flush promptly (a crash may unload the page
   *  moments later). */
  captureError(err: unknown, context?: CaptureErrorOptions): void {
    // A failure inside the error path must not recurse through the global handlers.
    if (this.reentrant) return
    this.reentrant = true
    try {
      // ERROR PLANE FIRST, in its own try. The planes are independent, so neither
      // may be able to starve the other: `properties` is arbitrary caller data
      // (a DOM node, a React synthetic event, an axios error — all circular and
      // all common), and serializing it on the event stream can throw. When the
      // stream ran first, that throw escaped to the outer catch and the crash
      // report was never sent — silently losing exactly the signal this client
      // exists to deliver. Order and isolation are the fix.
      try {
        this.sendError(err, context)
      } catch {
        /* the error plane must never take the event stream down with it */
      }

      try {
        const handled = context?.handled ?? true
        const ex = normalizeError(err)
        ex.handled = handled
        // NAME: the reserved '$exception', never the message. The message was the
        // name until 0.3.20, which put every distinct error string — one per failed
        // chunk id, per ResizeObserver notification — permanently into the event
        // taxonomy, and left Error Tracking (which reads this exact name) at zero.
        //
        // TYPE 'event', not 'error'. `type` alone picks the storage plane: 'error'
        // routes to the error plane, which the product-event projection does not
        // read, so an exception filed there is invisible to Error Tracking however
        // well-formed it is. The full error record still reaches the error plane as
        // a Sentry envelope above — this row is the product-analytics breadcrumb,
        // which is what keeps a crash correlated with the session's pageviews.
        //
        // `error` is still carried: the server folds it into properties.$exception
        // (scrubbing message and stack on the way), which is the shape existing
        // readers bind to.
        this.enqueue('event', EXCEPTION, {
          error: ex,
          properties: {
            ...context?.properties,
            ...exceptionProperties(err, {
              handled,
              id: uuidv7(),
              level: context?.level,
            }),
          },
        })
        this.flush()
      } catch {
        /* nor the reverse */
      }
    } finally {
      this.reentrant = false
    }
  }

  /** captureException — @sentry-familiar alias of captureError. */
  captureException = this.captureError.bind(this)

  /** setCohort persists cohort dimensions (e.g. signupWeek at signup) so they ride
   *  every subsequent event. */
  setCohort(patch: Cohort): void {
    this.cohort = mergeCohort(patch)
  }

  /** flush drains the buffer to the server as ONE batch through the ONE ingest
   *  front door POST /v1/event, body { batch: [Event…] }. beacon=true selects the
   *  unload-safe transport. Auth is orthogonal to the wire:
   *
   *    • publishable key set → rides ?ingest_key=pk-… on both sends, keeping each
   *      a CORS-simple request that any origin may send.
   *    • else a bearer JWT rides Authorization (fetch only — sendBeacon cannot
   *      carry a header, so token apps fall back to keepalive fetch on unload).
   *    • else a cookie app rides same-origin credentials (beacon carries the
   *      cookie fine).
   */
  flush(beacon = false): void {
    if (!this.cfg.enabled || this.queue.length === 0) return
    const batch = this.queue
    this.queue = []
    this.clearTimer()

    // A publishable key and a bearer JWT are mutually exclusive doors, and the
    // BEARER WINS. It names a real principal and resolves to THAT person's org;
    // a pk- names one org for everybody holding it. So the key is what attributes
    // a visitor nobody has vouched for, and it must never displace someone who
    // has been.
    //
    // The precedence used to run the other way, which was survivable only while
    // the key had to be passed in code. Once it also resolves from the build env,
    // key-wins means setting one variable silently blanks every signed-in user's
    // token and re-files their events under whichever org minted the key — on a
    // console served to several brands from one bundle, that is a cross-tenant
    // leak introduced by an env var.
    const token = this.cfg.getToken?.() ?? undefined
    const key = token ? undefined : this.cfg.ingestKey?.trim() || undefined
    // Only a bearer JWT blocks the beacon: sendBeacon cannot set an Authorization
    // header. A pk- rides ?ingest_key; a cookie rides credentials.
    const useBeacon = beacon && !token
    const body = serializeBatch(batch)
    if (body === null) {
      if (this.cfg.debug) console.debug('[event] flush → dropped, batch unserializable')
      return
    }
    if (this.cfg.debug) console.debug('[event] flush →', EVENT_PATH, batch.length)
    this.transport.send(this.cfg.host + EVENT_PATH, body, {
      beacon: useBeacon,
      token,
      ingestKey: key,
      debug: this.cfg.debug,
    })
  }

  // ── internals ────────────────────────────────────────────────────────────

  /** sendError frames one exception as a Sentry envelope and posts it to the DSN's
   *  ingest URL. The DSN's own key rides ?sentry_key= (the credential channel the
   *  server trusts, and the only one a headerless beacon can carry), so NO bearer
   *  or publishable key is attached here — the two planes authenticate
   *  independently. Errors are sent one envelope per event, immediately: batching
   *  a crash report is how you lose it. */
  private sendError(err: unknown, options?: CaptureErrorOptions): void {
    if (!this.cfg.enabled || !this.dsn) return
    const event = buildSentryEvent({
      error: err,
      options,
      identity: this.errorIdentity(),
      capturePII: this.cfg.capturePII ?? false,
    })
    const body = buildEnvelope(event, this.dsn)
    if (this.cfg.debug) console.debug('[event] error →', this.dsn.ingestUrl, event.event_id)
    this.transport.send(this.dsn.ingestUrl, body, {
      beacon: false,
      contentType: ENVELOPE_CONTENT_TYPE,
      debug: this.cfg.debug,
    })
  }

  /** errorIdentity is the SAME identity the event stream stamps — the OIDC subject
   *  once identify() has run, else the anon id. Never email/PII. */
  private errorIdentity(): ErrorIdentity {
    return {
      userId: this.personId ?? anonId(),
      sessionId: sessionId(),
      product: this.cfg.product,
      release: this.cfg.release ?? readEnv('NEXT_PUBLIC_HANZO_RELEASE'),
      environment: this.cfg.environment ?? readEnv('NODE_ENV'),
    }
  }

  private enqueue(kind: EventKind, event: string | undefined, extra: Partial<WireEvent>): void {
    if (!this.cfg.enabled) return
    if (!this.started) this.init()
    this.queue.push(this.build(kind, event, extra))
    if (this.queue.length >= this.cfg.batchSize) this.flush()
    else this.schedule()
  }

  private build(kind: EventKind, event: string | undefined, extra: Partial<WireEvent>): WireEvent {
    const anon = anonId()
    const wire: WireEvent = {
      messageId: uuidv7(),
      type: kind,
      event,
      timestamp: new Date().toISOString(),
      distinctId: this.personId ?? anon,
      anonymousId: anon,
      personId: this.personId,
      sessionId: sessionId(),
      product: this.cfg.product,
      referrer: this.attribution.referrer,
      utm: this.attribution.utm,
      refCode: this.cohort.refCode ?? this.attribution.refCode,
      channel: this.cohort.channel ?? this.attribution.channel,
      signupWeek: this.cohort.signupWeek,
      // Where the event happened, stamped for every kind rather than only for
      // pageviews. An interaction is reported against the page it happened on,
      // and autocapture ($click/$input/$change) reaches the wire through
      // capture(), which supplies no location — so every click arrived with an
      // empty url and path, and `host`, derived from url, was empty with them.
      // That is unattributable to a page, which is the one thing a heatmap
      // needs. Read here, at the single point every event is built, so it
      // cannot go missing from a call site again.
      //
      // Before `...extra`: pageview() passes an explicit path for route
      // changes that fire before window.location has caught up, and that value
      // has to win over the one read here.
      url: isBrowser() ? window.location.href : undefined,
      path: isBrowser() ? window.location.pathname : undefined,
      library: '@hanzo/event',
      libraryVersion: VERSION,
      ...extra,
    }

    // A location is free text an attacker (or an ordinary product flow) controls,
    // and it is now stamped on EVERY event rather than only pageviews — so the
    // one field that is always a URL gets the same policy the error plane has
    // always applied to error text. A password-reset, invite or magic link puts
    // a JWT in the query and an address in `?email=`; without this, one click on
    // that page ships both to the warehouse in cleartext, and every later click
    // repeats it.
    //
    // AFTER `...extra`, deliberately. A call site can pass its own location —
    // pageview() passes `path`, and until this commit it passed `url` too — and
    // `extra` merges over the fields read above, so scrubbing at the read would
    // have left the highest-volume event emitting a raw location while looking
    // scrubbed. Applied to the ASSEMBLED record, the guarantee holds for every
    // call site, including ones not written yet.
    //
    // `scrubText` is the SAME policy as the error plane (secrets always,
    // PII unless capturePII) rather than a second URL-specific redactor: one
    // definition of "must not leave the browser", already tested, mirroring the
    // server's. Guarded on presence so an absent field stays absent instead of
    // becoming the empty string that `host` derivation reads as a page.
    const capturePII = this.cfg.capturePII ?? false
    if (wire.url) wire.url = scrubText(wire.url, capturePII)
    if (wire.path) wire.path = scrubText(wire.path, capturePII)
    if (wire.referrer) wire.referrer = scrubText(wire.referrer, capturePII)
    return wire
  }

  private schedule(): void {
    if (this.timer || !this.cfg.enabled) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.flush()
    }, this.cfg.flushIntervalMs)
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

// ── one stream, one client ──────────────────────────────────────────────────
//
// A page has ONE event stream per (host, product): one queue, one anon id, one
// credential. Two clients on it split the batch and double the pageview, and
// the half built by the caller that had no key is refused at the door — so the
// same page is both over- and under-counted, and neither number says so.
//
// Two callers ask for that stream on any real page and both are right to: the
// app mounts a provider, and the component library mounts its own telemetry.
// Neither can see the other, so the fix cannot live in either. It lives here,
// where the stream is: asking twice returns the same client.
//
// The registry is on the PAGE, under a `Symbol.for` slot, not in module scope.
// `@hanzo/event` and `@hanzo/event/react` are separate bundles that each carry
// a copy of this module, so a module-scope map is per-copy and the two copies
// never see each other's — which is exactly how the duplicate arises. A
// well-known symbol is the one slot every copy resolves to the same value.
//
// Browser only. A server process serves many visitors, and one client shared
// across requests would carry one visitor's personId into the next.
const CLIENTS = Symbol.for('hanzo.event.clients')

function registry(): Map<string, Analytics> {
  const g = globalThis as unknown as Record<symbol, Map<string, Analytics> | undefined>
  const existing = g[CLIENTS]
  if (existing) return existing
  const fresh = new Map<string, Analytics>()
  g[CLIENTS] = fresh
  return fresh
}

/** createAnalytics returns the client for a stream, building it on first ask.
 *  This is the ONE way to get a client: `new Analytics` bypasses the registry
 *  and is for tests and for a deliberately separate instance. */
export function createAnalytics(config: AnalyticsConfig): Analytics {
  // A disabled client emits nothing, so it can double nothing and does not take
  // the stream. Callers reach their answer at different moments — a provider
  // whose ownership resolves in an effect renders once saying `false` before it
  // has decided anything — and the client built in that moment must not become
  // the one the page keeps. Registering it would silence the page, and adopting
  // `enabled` from a later caller would let one surface overrule another's
  // reading of consent. Neither: it is simply not the stream's client.
  if (!isBrowser() || config.enabled === false) return new Analytics(config)
  const key = (config.host ?? DEFAULT_HOST) + '\0' + config.product
  const clients = registry()
  const existing = clients.get(key)
  if (existing) {
    existing.adopt(config)
    return existing
  }
  const fresh = new Analytics(config)
  clients.set(key, fresh)
  return fresh
}

// Re-export the hydrate helpers so consumers can read persisted cohort/attribution
// (e.g. to send refCode to the referrals API) without reaching into storage.
export { getCohort, getFirstTouch }
