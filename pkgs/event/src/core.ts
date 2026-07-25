// The framework-agnostic event client. Buffers events and flushes them as ONE
// batch through the ONE Hanzo Cloud ingestion front door:
//
//   POST {host}/v1/event   body: { batch: [Event, …] }   -> { accepted, dropped }
//
// It NEVER sends the org/tenant: Cloud resolves that server-side (from the
// validated session, or the signed publishable key) and stamps it. The client
// only supplies its own visitor identity. Errors are just events (type:'error')
// on the same stream — one client, one pipe, lensed server-side into product
// analytics (insights), web analytics (analytics), and error tracking (sentry).
//
// Auth is orthogonal — the SAME body to the SAME door, differing only in how the
// caller proves its tenant:
//
//   • cookie/session app (host:'')  — same-origin credentials ride the request.
//   • bearer app (getToken)         — Authorization: Bearer <jwt>.
//   • publishable-key app (ingestKey: 'pk_…') — Authorization: Bearer pk_… on
//     fetch, ?ingest_key=pk_… on a headerless page-unload beacon. Write-only and
//     safe to ship in a bundle; the door HMAC-verifies it to an org server-side.
//
// The wire is the canonical `Event` (== the cloud CaptureEvent): its `type` field
// is what Cloud folds to event_type='error', so a captured exception reaches the
// error-tracking lens. (A four-field {event,distinctId,time,properties} object has
// no `type`, so it can never be lensed as an error — this batched Event wire is
// the one that lights up all three lenses.)

import {
  parseAttribution,
  hasAttribution,
  deriveChannel,
} from './attribution'
import { PAGEVIEW } from './events'
import {
  anonId,
  sessionId,
  getFirstTouch,
  setFirstTouchOnce,
  getCohort,
  mergeCohort,
} from './storage'
import type {
  AnalyticsConfig,
  Attribution,
  Cohort,
  EventKind,
  Exception,
  Transport,
  WireEvent,
} from './types'

// Rides every event as `libraryVersion` — keep it equal to package.json, or the
// dimension that tells you WHICH client sent a batch quietly lies.
export const VERSION = '0.3.2'

const EVENT_PATH = '/v1/event' // the ONE canonical ingestion front door
const DEFAULT_HOST = 'https://api.hanzo.ai' // the one edge; cookie apps pass host:''

/** appendQuery adds a single query param to a URL string — used to carry a
 *  publishable key on a headerless sendBeacon (?ingest_key=…). */
function appendQuery(url: string, key: string, value: string): string {
  return url + (url.includes('?') ? '&' : '?') + key + '=' + encodeURIComponent(value)
}

function uid(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && 'randomUUID' in c) return c.randomUUID()
  return 'm-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** Normalize anything thrown (Error | string | unknown) into an Exception. */
function normalizeError(err: unknown): Exception {
  if (err instanceof Error) {
    return { type: err.name, message: err.message, stack: err.stack }
  }
  if (typeof err === 'string') return { message: err }
  try {
    return { message: JSON.stringify(err) }
  } catch {
    return { message: String(err) }
  }
}

const isBrowser = () => typeof window !== 'undefined'

/** DefaultTransport: fetch(keepalive) for authenticated/normal sends;
 *  navigator.sendBeacon for headerless page-unload beacons. A bearer (a JWT or a
 *  publishable pk_ key) rides Authorization on fetch; on a beacon — which cannot
 *  set headers — a publishable key rides the ?ingest_key query instead. */
class DefaultTransport implements Transport {
  send(url: string, body: string, opts: { beacon: boolean; token?: string; ingestKey?: string }): void {
    if (opts.beacon && isBrowser() && typeof navigator.sendBeacon === 'function') {
      const beaconUrl = opts.ingestKey ? appendQuery(url, 'ingest_key', opts.ingestKey) : url
      try {
        navigator.sendBeacon(beaconUrl, new Blob([body], { type: 'application/json' }))
        return
      } catch {
        /* fall through to fetch */
      }
    }
    if (typeof fetch !== 'function') return
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const bearer = opts.ingestKey ?? opts.token
    if (bearer) headers.Authorization = `Bearer ${bearer}`
    void fetch(url, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
      credentials: 'include',
    }).catch(() => {
      /* telemetry loss is acceptable; never throw into the app */
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

  constructor(config: AnalyticsConfig) {
    this.cfg = {
      host: DEFAULT_HOST,
      batchSize: 20,
      flushIntervalMs: 5000,
      enabled: true,
      captureErrors: true,
      ...config,
    }
    this.transport = config.transport ?? new DefaultTransport()
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
    // rejected promises become type:'error' events on the same stream, which Cloud
    // stamps event_type='error' → the sentry.hanzo.ai lens.
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

  /** pageview records a $pageview for the current (or given) location. */
  pageview(path?: string, properties?: Record<string, unknown>): void {
    const url = isBrowser() ? window.location.href : undefined
    const p = path ?? (isBrowser() ? window.location.pathname : undefined)
    this.enqueue('pageview', PAGEVIEW, { url, path: p, properties })
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

  /** captureError records an exception as a first-class error event — the ONE
   *  error path (subsumes @sentry). A caught error, an unhandled rejection, a
   *  React render error, or a manual report all become a type:'error' event on the
   *  same stream; Cloud folds the exception into properties.$exception and stamps
   *  event_type='error', so it surfaces in the error-tracking lens. Never throws
   *  back into the app; errors are higher-signal than pageviews, so it flushes
   *  promptly (a crash may unload the page moments later). */
  captureError(
    err: unknown,
    context?: { handled?: boolean; properties?: Record<string, unknown> },
  ): void {
    const ex = normalizeError(err)
    ex.handled = context?.handled ?? true
    this.enqueue('error', ex.message, { error: ex, properties: context?.properties })
    this.flush()
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
   *    • publishable key set → rides Authorization: Bearer pk_… (fetch) or
   *      ?ingest_key=pk_… (beacon), so unload beacons work anonymously.
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

    const key = this.cfg.ingestKey?.trim() || undefined
    // A publishable key and a bearer JWT are mutually exclusive doors; the key wins.
    const token = key ? undefined : this.cfg.getToken?.() ?? undefined
    // Only a headerful bearer JWT blocks the beacon: sendBeacon cannot set an
    // Authorization header. A pk_ rides ?ingest_key; a cookie rides credentials.
    const useBeacon = beacon && !token
    const body = JSON.stringify({ batch })
    if (this.cfg.debug) console.debug('[event] flush →', EVENT_PATH, batch.length)
    this.transport.send(this.cfg.host + EVENT_PATH, body, { beacon: useBeacon, token, ingestKey: key })
  }

  // ── internals ────────────────────────────────────────────────────────────

  private enqueue(kind: EventKind, event: string | undefined, extra: Partial<WireEvent>): void {
    if (!this.cfg.enabled) return
    if (!this.started) this.init()
    this.queue.push(this.build(kind, event, extra))
    if (this.queue.length >= this.cfg.batchSize) this.flush()
    else this.schedule()
  }

  private build(kind: EventKind, event: string | undefined, extra: Partial<WireEvent>): WireEvent {
    const anon = anonId()
    return {
      messageId: uid(),
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
      library: '@hanzo/event',
      libraryVersion: VERSION,
      ...extra,
    }
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

/** createAnalytics builds a client instance. Most apps use one shared instance. */
export function createAnalytics(config: AnalyticsConfig): Analytics {
  return new Analytics(config)
}

// Re-export the hydrate helpers so consumers can read persisted cohort/attribution
// (e.g. to send refCode to the referrals API) without reaching into storage.
export { getCohort, getFirstTouch }
