// The framework-agnostic event client. Buffers analytics events and flushes them
// as one batch to Hanzo Cloud — /v1/analytics normally, /v1/tracker via sendBeacon
// on page unload. It NEVER sends the org/tenant: the server stamps that from the
// validated session. The client only supplies its own visitor identity.
//
// Errors are captured through the SAME client — one session, one identity, one
// transport, one de-duped pipe. With a Sentry DSN configured they POST a Sentry
// envelope to /v1/sentry (the wire-level @sentry replacement); without one they
// ride the analytics stream as `type:'error'` events. Either way there is no
// second SDK and no double-send.

import {
  parseAttribution,
  hasAttribution,
  deriveChannel,
} from './attribution'
import { PAGEVIEW } from './events'
import { parseDsn, SentryReporter } from './sentry'
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

export const VERSION = '0.3.0'

const ANALYTICS_PATH = '/v1/analytics'
const TRACKER_PATH = '/v1/tracker' // beacon-on-unload alias

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

/** A stable signature for de-duplication: the group-defining parts of an error. */
function errorSignature(ex: Exception): string {
  const firstFrame = (ex.stack ?? '').split('\n')[1]?.trim() ?? ''
  return `${ex.type ?? ''}|${ex.message}|${firstFrame}`
}

const isBrowser = () => typeof window !== 'undefined'

/** DefaultTransport: fetch(keepalive) for authenticated/normal sends;
 *  navigator.sendBeacon for headerless page-unload beacons. */
class DefaultTransport implements Transport {
  send(url: string, body: string, opts: { beacon: boolean; token?: string }): void {
    if (opts.beacon && isBrowser() && typeof navigator.sendBeacon === 'function') {
      try {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
        return
      } catch {
        /* fall through to fetch */
      }
    }
    if (typeof fetch !== 'function') return
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`
    void fetch(url, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
      credentials: 'include',
    }).catch(() => {
      /* analytics loss is acceptable; never throw into the app */
    })
  }
}

export class Analytics {
  private cfg: Required<
    Pick<
      AnalyticsConfig,
      'product' | 'batchSize' | 'flushIntervalMs' | 'enabled' | 'captureErrors' | 'errorDedupeWindowMs'
    >
  > &
    AnalyticsConfig
  private transport: Transport
  private sentry: SentryReporter | null
  private queue: WireEvent[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private personId?: string
  private attribution: Attribution = { utm: {} }
  private cohort: Cohort = {}
  private started = false
  private recentErrors = new Map<string, number>()

  constructor(config: AnalyticsConfig) {
    this.cfg = {
      host: '',
      batchSize: 20,
      flushIntervalMs: 5000,
      enabled: true,
      captureErrors: true,
      errorDedupeWindowMs: 4000,
      ...config,
    }
    this.transport = config.transport ?? new DefaultTransport()
    const dsn = parseDsn(config.sentryDsn)
    this.sentry = dsn ? new SentryReporter(dsn, config.sentryDsn as string, this.transport) : null
  }

  /** init is idempotent and browser-only for its side effects: capture first-touch
   *  attribution, hydrate cohort, and register the unload flush. Safe to call from
   *  a React effect on every render. */
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
    // rejected promises become error reports on the same de-duped pipe.
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

  /** captureError records an exception through the ONE error path (subsumes
   *  @sentry). A caught error, an unhandled rejection, or a manual report all funnel
   *  here, are de-duplicated by signature, and then either POST a Sentry envelope to
   *  /v1/sentry (when a DSN is configured) or ride the analytics stream as a
   *  `type:'error'` event. Never throws back into the app. */
  captureError(
    err: unknown,
    context?: { handled?: boolean; properties?: Record<string, unknown> },
  ): void {
    if (!this.cfg.enabled) return
    if (!this.started) this.init()
    const ex = normalizeError(err)
    ex.handled = context?.handled ?? true

    if (this.deduped(ex)) return

    if (this.sentry) {
      // The Sentry envelope path — same transport, same session + identity, no
      // analytics-batch duplicate (no double-send).
      this.sentry.report(ex, {
        sessionId: sessionId(),
        distinctId: this.personId ?? anonId(),
        product: this.cfg.product,
        release: this.cfg.release,
        environment: this.cfg.environment,
        url: isBrowser() ? window.location.href : undefined,
        properties: context?.properties,
        sdk: { name: '@hanzo/event', version: VERSION },
      })
      return
    }

    // Fallback: the error is an event on the analytics stream. Errors are
    // higher-signal than pageviews, so flush promptly (a crash may unload the page
    // moments later).
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

  /** flush drains the buffer to the server as one batch. beacon=true uses the
   *  unload-safe path. */
  flush(beacon = false): void {
    if (!this.cfg.enabled || this.queue.length === 0) return
    const batch = this.queue
    this.queue = []
    this.clearTimer()
    const token = this.cfg.getToken?.() ?? undefined
    // sendBeacon cannot carry an Authorization header, so token apps always use
    // keepalive fetch; cookie apps may beacon to the tracker route on unload.
    const useBeacon = beacon && !token
    const path = useBeacon ? TRACKER_PATH : ANALYTICS_PATH
    const body = JSON.stringify({ batch })
    if (this.cfg.debug) console.debug('[analytics] flush', batch.length, path)
    this.transport.send(this.cfg.host + path, body, { beacon: useBeacon, token: token ?? undefined })
  }

  // ── internals ────────────────────────────────────────────────────────────

  /** deduped reports whether this error's signature was seen within the dedupe
   *  window; records the sighting when it is not. A 0 window disables it. */
  private deduped(ex: Exception): boolean {
    const window = this.cfg.errorDedupeWindowMs
    if (window <= 0) return false
    const now = Date.now()
    const sig = errorSignature(ex)
    const last = this.recentErrors.get(sig)
    if (last !== undefined && now - last < window) return true
    if (this.recentErrors.size > 100) this.recentErrors.clear()
    this.recentErrors.set(sig, now)
    return false
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
