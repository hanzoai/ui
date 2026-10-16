// The framework-agnostic event client. ONE API surface over TWO orthogonal
// planes, sharing one session and one identity:
//
//   1. EVENT STREAM — buffered pageview/event/identify/group, flushed as ONE
//      batch to the Hanzo Cloud entry point:
//        POST {host}/v1/event   body: { batch: [Event, …] }  -> { accepted, dropped }
//      Cloud resolves the tenant server-side (validated session, or the signed
//      publishable key) and stamps it; the client NEVER sends the org.
//
//   Errors ride the same pipe: a captured exception is ONE event of type 'error'
//   carrying {type, message, frames|stack, handled} plus release, environment,
//   site, product and level. The server files it on the error plane and groups it
//   into an issue. There is no second endpoint, DSN or envelope.
//
// Auth is orthogonal — the SAME body to the SAME endpoint, differing only in how the
// caller proves its tenant:
//
//   • cookie/session app (host:'')  — same-origin credentials ride the request.
//   • bearer app (getToken)         — Authorization: Bearer <jwt>.
//   • publishable-key app (ingestKey: 'pk-…') — ?ingest_key=pk-… on the query, on
//     the fetch and the beacon alike, with a text/plain body. Write-only and safe
//     to ship in a bundle; the endpoint resolves it to an org server-side. The query
//     is the carrier neither send needs a header for, which is what keeps both
//     CORS-simple and therefore sendable from a customer's own origin.
//
// The wire is the canonical `Event` (== the cloud CaptureEvent).
//
// CONSENT IS THE CLIENT'S OWN RULE in a browser (consent.ts): until the visitor
// allows Analytics it sends no pageview, event, identify or group, and writes no
// identifier, session or attribution to the device. An error still goes, because a
// broken page is ours to fix, but as a stranger: an id held in memory for this page
// alone, no session, no attribution, nothing stored. When the visitor accepts, the
// client takes up what it held — the visit's attribution and the view in hand — and
// runs as before. Every browser event states the consent it was sent under.

import {
  parseAttribution,
  hasAttribution,
  deriveChannel,
} from './attribution'
import { keyForPage } from './org'
import { PAGEVIEW } from './events'
import { scrubText, withoutFragment } from './scrub'
import { framesFromStack, normalizeError as normalizeThrowable } from './throwable'
import {
  adoptAnonId,
  forgetAnonId,
  adoptSession,
  anonId,
  sessionId,
  getFirstTouch,
  setFirstTouchOnce,
  getLastTouch,
  setLastTouch,
  getCohort,
  mergeCohort,
} from './storage'
import { uuidv7 } from './uid'
import { internal } from './automated'
import { linkUrl, readLink, stripLink, type LinkState } from './link'
import { CONSENT_EVENT, honour, read as readConsent, render as renderConsent } from './consent'
import type {
  AnalyticsConfig,
  Attribution,
  CaptureErrorOptions,
  Cohort,
  EventKind,
  Exception,
  Transport,
  WireEvent,
} from './types'
import { VERSION } from './version'

export { VERSION }

const EVENT_PATH = '/v1/event' // the ONE canonical ingestion entry point
const DEFAULT_HOST = 'https://api.hanzo.ai' // the one edge; cookie apps pass host:''
// The beacon body's type. text/plain is CORS-SAFELISTED, which is the whole
// property: a safelisted type makes the POST a SIMPLE request, and a simple
// request needs no preflight. An unloading document does not get a second round
// trip, so cross-origin a preflighted beacon is never sent at all. The endpoint reads
// the raw body and dispatches on its first non-space byte, so the type names the
// CORS class and nothing else.
const BEACON_CONTENT_TYPE = 'text/plain'

/** readEnv reads an inlined build-time variable, guarded for SSR. */
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
/** normalizeError adapts the hostile-input-safe normalizer (sentry.ts) to the
 *  stream's Exception shape: a thrown object may define `name`/`message`/`stack`
 *  as throwing getters. */
function normalizeError(err: unknown): Exception {
  const n = normalizeThrowable(err)
  const frames = framesFromStack(n.stack)
    .slice(-50)
    .map((f) => ({ function: f.function, file: f.filename, line: f.lineno, column: f.colno }))
  return { type: n.name, message: n.message, stack: n.stack, frames }
}

// React Native defines a `window` but no `document` (and no `window.location`),
// so `typeof window !== 'undefined'` alone took the browser path there and
// `init()` threw on `window.location.search`. Requiring `document` makes RN read
// as non-browser: `init()` returns early (skips attribution + the visibility/
// unload listeners RN doesn't have), while `capture()`/`flush()` — which are NOT
// gated on this and post through plain `fetch` — still emit. So the client is
// inert-safe under SSR/Node and live on RN, without a second transport.
/** The screen and language a page view carries, for the readers that derive device and locale. */
const viewport = (): Record<string, string> =>
  isBrowser()
    ? { screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`, language: navigator.language || '' }
    : {}

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

/** An address with its query and fragment taken off. */
function withoutQuery(href: string): string {
  try {
    const u = new URL(href)
    return u.origin + u.pathname
  } catch {
    return ''
  }
}

/** Takes the query and fragment off every address in free text — any scheme, or a
 *  path — keeping the :line:column a stack puts after one. */
function bare(s: string | undefined): string | undefined {
  return s?.replace(/(^|[\s('"@<[=])((?:[a-z][a-z0-9+.-]*:\/\/|\/)[^\s)'"\]>]+)/gi, (_m, pre: string, a: string) => {
    const at = /(?::\d+)+$/.exec(a)?.[0] ?? ''
    const base = a.slice(0, a.length - at.length)
    const i = base.search(/[?#]/)
    return pre + (i < 0 ? base : base.slice(0, i)) + at
  })
}

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
    const simple = opts.ingestKey !== undefined && opts.token === undefined && opts.contentType === undefined
    const headers: Record<string, string> = {
      'Content-Type': simple ? BEACON_CONTENT_TYPE : (opts.contentType ?? 'application/json'),
    }
    // A signed-in page sends the key (which project) in the query AND the person's bearer
    // (who) in the header; the bearer never replaces the key.
    const bearer = simple ? undefined : (opts.token ?? opts.ingestKey)
    if (bearer) headers.Authorization = `Bearer ${bearer}`
    void fetch(opts.ingestKey ? appendQuery(url, 'ingest_key', opts.ingestKey) : url, {
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
  /** The last touch's campaign, once the visitor allowed Analytics. */
  private lastUtm?: Attribution['utm']
  private cohort: Cohort = {}
  private started = false
  /** What this page arrived with — the link's identity and the landing's
   *  attribution — held in memory until the visitor allows Analytics. */
  private linked: LinkState = {}
  private landing: Attribution = { utm: {} }
  /** The held state has been taken up: the visitor allowed Analytics. */
  private settled = false
  /** The view a pageview was asked for while the visitor had not allowed Analytics. */
  private held?: { path?: string; properties?: Record<string, unknown> }
  /** The traits an identify was asked for while the visitor had not allowed Analytics. */
  private traits?: Record<string, unknown>
  /** The cohort a setCohort was asked for while the visitor had not allowed Analytics. */
  private patch?: Cohort
  /** Who an error is filed under before consent: this page alone, never stored. */
  private stranger = uuidv7()
  /** The view pageview() last counted — path + location. */
  private counted?: string
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
      //   3. the org that owns the HOST this page is served from (`org.ts`).
      //
      // Step 3 fires only when a surface configured NOTHING, so it never overrides
      // the KMS chain above — it replaces going dark with reporting to the right
      // brand. That is what a static export needs: `output: export` inlines no env,
      // so before this the only way to report was to commit a key literal, and the
      // fleet grew one copy per site of a value with a single source.
      //
      // A surface no brand claims still has no key, and the edge REFUSES an
      // unattributed event (401 `ingest_key_required`) — the reserved `$public`
      // tenant that once caught keyless beacons is retired, and anonymous ingest is
      // refused at every edge on every brand host. So there is no quiet fallback to
      // rely on: an event lands in the org a credential names, or it does not land.
      ingestKey:
        config.ingestKey ?? readEnv('NEXT_PUBLIC_PUBLISHABLE_KEY') ?? keyForPage(),
    }
    this.transport = config.transport ?? new DefaultTransport()
  }

  /** adopt gives this client a credential it does not have. The key belongs to
   *  the stream, not to whichever caller happened to ask for the handle first,
   *  so a later caller carrying one hands it over. Present fields are never overwritten: the first caller's key stays. */
  adopt(config: AnalyticsConfig): void {
    if (config.ingestKey && !this.cfg.ingestKey) this.cfg.ingestKey = config.ingestKey
    if (config.getToken && !this.cfg.getToken) this.cfg.getToken = config.getToken
  }

  /** init is idempotent and browser-only for its side effects: read what the page
   *  arrived with, take it up once the visitor allows Analytics (now, or when they
   *  accept), register the unload flush, and (unless opted out) auto-capture
   *  unhandled errors. Safe to call from a React effect on every render. */
  init(): void {
    if (this.started || !this.cfg.enabled) return
    this.started = true
    if (!isBrowser()) return

    // A link from another Hanzo host carries the visitor with it. It is read, and
    // taken off the address, now; it is adopted with the visitor's consent, so the
    // first pageview after it is already the same person, session and first touch.
    this.linked = readLink(window.location.search)
    const clean = stripLink(window.location.href)
    if (clean !== undefined) {
      try {
        window.history.replaceState(window.history.state, '', clean)
      } catch {
        /* a sandboxed frame may refuse; the params are then simply visible */
      }
    }
    this.landing = parseAttribution(window.location.search, document.referrer)
    // A browser that refuses now, over a grant stored on an earlier page, withdraws it.
    honour()
    this.settle()
    window.addEventListener(CONSENT_EVENT, () => {
      if (!this.allowed()) this.forgetVisitor()
      this.settle()
    })

    const flushHidden = () => {
      if (document.visibilityState === 'hidden') this.flush(true)
    }
    window.addEventListener('visibilitychange', flushHidden)
    window.addEventListener('pagehide', () => this.flush(true))

    // Unhandled errors and rejected promises are reported as type:'error' events.
    if (this.cfg.captureErrors) {
      window.addEventListener('error', (e: ErrorEvent) => {
        this.captureError(e.error ?? e.message, { handled: false })
      })
      window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        this.captureError(e.reason, { handled: false })
      })
    }
  }

  /** settle takes up what the page arrived with once the visitor allows
   *  Analytics: the link's identity, the first touch, the last touch, the cohort,
   *  and the identify and the view asked for before the choice. Before that
   *  nothing is written; after it, once is enough. */
  private settle(): void {
    if (this.settled || !this.started || !isBrowser() || !this.allowed()) return
    this.settled = true
    const { linked, landing } = this
    if (linked.anonId) adoptAnonId(linked.anonId)
    if (linked.sessionId) adoptSession(linked.sessionId)
    // The first touch the link carries is the visit's real origin. Without it this
    // host's own "first touch" would be the referring Hanzo page, which says nothing.
    const first = linked.firstTouch && !getFirstTouch() ? setFirstTouchOnce(linked.firstTouch) : undefined
    this.attribution =
      first ?? (hasAttribution(landing) ? setFirstTouchOnce(landing) : getFirstTouch() ?? landing)
    // A visit that arrives with a campaign is the last touch, whatever came first.
    if (landing.utm.source || landing.utm.campaign) setLastTouch(landing.utm)
    this.lastUtm = getLastTouch()
    this.cohort = mergeCohort({
      channel: this.attribution.channel ?? deriveChannel(this.attribution),
      refCode: this.attribution.refCode,
    })
    if (this.patch) this.cohort = mergeCohort(this.patch)
    this.patch = undefined
    const { held, traits } = this
    this.held = this.traits = undefined
    if (traits && this.personId) this.identify(this.personId, Object.keys(traits).length ? traits : undefined)
    if (held) this.pageview(held.path, held.properties)
  }

  /** forgetVisitor runs when the visitor no longer allows Analytics: the page
   *  forgets the visitor it held, so a later yes is a new visitor. What was queued
   *  under the old grant is held back at send (flush). */
  private forgetVisitor(): void {
    forgetAnonId()
    this.settled = false
    this.linked = {}
  }

  /** allowed is whether this client may send and store: off a browser always, in
   *  one only once the visitor allows Analytics. */
  private allowed(): boolean {
    return !isBrowser() || readConsent().analytics
  }

  /** link returns `url` carrying this visitor's anonymous id, session and first
   *  touch when the destination is a Hanzo-owned host, so the journey continues
   *  across the hop. Any other URL comes back unchanged, and so does every URL
   *  before the visitor allows Analytics: there is no visitor to carry yet. */
  link(url: string): string {
    if (!isBrowser()) return url
    if (!this.started) this.init()
    if (!this.allowed()) return url
    return linkUrl(
      url,
      { anonId: anonId(), sessionId: sessionId(), firstTouch: this.attribution },
      window.location.hostname,
      window.location.href,
    )
  }

  /** authorize decorates an OAuth authorize URL for the redirect to IAM and flushes
   *  what is queued, because the page is about to unload. Assign the result to
   *  `location`. */
  authorize(url: string): string {
    const out = this.link(url)
    this.flush(true)
    return out
  }

  /** identify binds the current visitor to a stable person id (post-login). Before
   *  the visitor allows Analytics the binding is held, and stated when they accept. */
  identify(personId: string, traits?: Record<string, unknown>): void {
    this.personId = personId
    if (this.cfg.enabled && !this.allowed()) {
      if (!this.started) this.init()
      this.traits = traits ?? {}
      return
    }
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
    if (this.cfg.enabled && !this.allowed()) {
      // The view in hand is counted when the visitor accepts, on this page.
      if (!this.started) this.init()
      this.held = { path, properties }
      return
    }
    const view = (p ?? '') + '\0' + (isBrowser() ? window.location.href : '')
    if (view === this.counted) return
    this.counted = view
    this.enqueue('pageview', PAGEVIEW, { path: p, properties: { ...viewport(), ...properties } })
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

  /** captureError reports a caught error, an unhandled rejection, a React render
   *  error, or a manual report as ONE event of type 'error' on the one stream.
   *  It carries the exception (type, message, frames, stack, handled) and the
   *  release, environment, site, product and level that group and scope it, and
   *  flushes promptly (a crash may unload the page moments later). Never throws
   *  back into the app. */
  captureError(err: unknown, context?: CaptureErrorOptions): void {
    // A failure inside the error path must not recurse through the global handlers.
    if (this.reentrant) return
    this.reentrant = true
    try {
      const handled = context?.handled ?? true
      const ex = normalizeError(err)
      ex.handled = handled
      this.enqueue('error', undefined, {
        error: ex,
        level: context?.level ?? (handled ? 'error' : 'fatal'),
        release: this.cfg.release ?? readEnv('NEXT_PUBLIC_HANZO_RELEASE'),
        environment: this.cfg.environment ?? readEnv('NODE_ENV'),
        site: isBrowser() ? window.location.hostname : undefined,
        properties: context?.properties,
      })
      this.flush()
    } catch {
      /* the error path never takes the app down */
    } finally {
      this.reentrant = false
    }
  }

  /** setCohort persists cohort dimensions (e.g. signupWeek at signup) so they ride
   *  every subsequent event. Before the visitor allows Analytics they are held, and
   *  stored when they accept. */
  setCohort(patch: Cohort): void {
    if (isBrowser() && !(this.settled && this.allowed())) {
      this.patch = { ...this.patch, ...patch }
      this.cohort = { ...this.cohort, ...patch }
      this.settle()
      return
    }
    this.cohort = mergeCohort(patch)
  }

  /** flush drains the buffer to the server as ONE batch through the ONE ingest
   *  endpoint POST /v1/event, body { batch: [Event…] }. beacon=true selects the
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
    // An event goes only under a choice that still covers the one it was stamped
    // with: a grant withdrawn since — here or in another tab — takes what was
    // queued under it.
    const now = new Set(renderConsent(readConsent()).split(',').filter(Boolean))
    const covered = (e: WireEvent) =>
      !isBrowser() || String(e.properties?.consent ?? '').split(',').filter(Boolean).every((k) => now.has(k))
    const batch = this.queue.filter(covered)
    this.queue = []
    this.clearTimer()
    if (batch.length === 0) return

    // Two kinds of credential, and both ride when both are held: the publishable key
    // names the project, the bearer names the person. The bearer never replaces the key.
    const token = this.cfg.getToken?.() ?? undefined
    const key = this.cfg.ingestKey?.trim() || undefined
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

  private enqueue(kind: EventKind, event: string | undefined, extra: Partial<WireEvent>): void {
    if (!this.cfg.enabled) return
    if (!this.started) this.init()
    // Before consent only an error goes, and it goes as a stranger (build).
    const known = this.allowed()
    if (!known && kind !== 'error') return
    this.queue.push(this.build(kind, event, extra, known))
    if (this.queue.length >= this.cfg.batchSize) this.flush()
    else this.schedule()
  }

  private build(kind: EventKind, event: string | undefined, extra: Partial<WireEvent>, known = true): WireEvent {
    if (known) this.settle()
    const anon = known ? anonId() : this.stranger
    const wire: WireEvent = {
      messageId: uuidv7(),
      type: kind,
      event,
      timestamp: new Date().toISOString(),
      distinctId: known ? (this.personId ?? anon) : anon,
      anonymousId: anon,
      personId: known ? this.personId : undefined,
      sessionId: known ? sessionId() : undefined,
      product: this.cfg.product,
      referrer: known ? this.attribution.referrer : undefined,
      utm: known ? this.attribution.utm : undefined,
      lastUtm: known ? this.lastUtm : undefined,
      refCode: known ? (this.cohort.refCode ?? this.attribution.refCode) : undefined,
      channel: known ? (this.cohort.channel ?? this.attribution.channel) : undefined,
      signupWeek: known ? this.cohort.signupWeek : undefined,
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
      // A stranger's error names the page, never its query: the campaign and the
      // ad click the address carries wait for the visitor's choice.
      url: isBrowser() ? (known ? window.location.href : withoutQuery(window.location.href)) : undefined,
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
    //
    // The fragment goes first and whole: nothing after `#` is ever the server's
    // (see withoutFragment), so it is dropped rather than scrubbed.
    const capturePII = this.cfg.capturePII ?? false
    if (wire.url) wire.url = scrubText(withoutFragment(wire.url), capturePII)
    if (wire.path) wire.path = scrubText(withoutFragment(wire.path), capturePII)
    if (wire.referrer) wire.referrer = scrubText(withoutFragment(wire.referrer), capturePII)
    // A stranger's error names its pages without their queries, in its message and
    // stack too, and carries none of the caller's properties.
    if (!known) wire.properties = undefined
    if (!known && wire.error) {
      const e = wire.error
      wire.error = {
        ...e,
        message: bare(e.message) ?? e.message,
        stack: bare(e.stack),
        frames: e.frames?.map((f) => (f.file ? { ...f, file: bare(f.file) } : f)),
      }
    }
    if (internal()) wire.properties = { ...wire.properties, internal: true }
    // The consent the event was sent under, as the cookie spells it: cloud holds
    // every reader to it.
    if (isBrowser()) wire.properties = { ...wire.properties, consent: renderConsent(readConsent()) }
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
// the half built by the caller that had no key is refused at the edge — so the
// same page is both over- and under-counted, and neither number says so.
//
// Two callers ask for that stream on any real page and both are right to: the
// app mounts a provider, and the component library mounts its own telemetry.
// Neither can see the other, so the fix cannot live in either. It lives here,
// where the stream is: asking twice returns the same client.
//
// The registry is on the PAGE, under a `Symbol.for` slot, not in module scope. The
// slot is named for the consent contract its clients keep (`.optin`): a copy built
// before every visitor opted in keeps its own clients, and never hands one to this
// copy, whose callers rely on the client asking first.
// `@hanzo/event` and `@hanzo/event/react` are separate bundles that each carry
// a copy of this module, so a module-scope map is per-copy and the two copies
// never see each other's — which is exactly how the duplicate arises. A
// well-known symbol is the one slot every copy resolves to the same value.
//
// Browser only. A server process serves many visitors, and one client shared
// across requests would carry one visitor's personId into the next.
const CLIENTS = Symbol.for('hanzo.event.clients.optin')

function registry(): Map<string, Analytics> {
  const g = globalThis as unknown as Record<symbol, Map<string, Analytics> | undefined>
  const existing = g[CLIENTS]
  if (existing) return existing
  const fresh = new Map<string, Analytics>()
  g[CLIENTS] = fresh
  return fresh
}

/** resetClients drops the page's clients, so the next `createAnalytics` for a
 *  stream builds a fresh one.
 *
 *  A real page loads once and never needs this. A TEST RUNNER is what it exists
 *  for: one document, many mounts, each meant to be its own page. The second one
 *  gets a client that already counted this location, so its pageview is
 *  correctly suppressed and the suite reads it as "nothing was emitted".
 *
 *  It is exported so a suite calls this instead of reaching for the slot itself.
 *  A consumer that deletes the registry from its own code path takes the
 *  guarantee with it: `<Provider/>` unmount/remount is not a new page, and the
 *  fresh client it would get counts the same view again. */
export function resetClients(): void {
  const g = globalThis as unknown as Record<symbol, Map<string, Analytics> | undefined>
  delete g[CLIENTS]
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
