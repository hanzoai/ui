// Buffering and delivery. Three triggers flush a batch: it got long, it got big,
// or the clock ran — plus the page going away, which is the only one that cannot
// be retried.
//
// Events are serialized ON ARRIVAL, once. A full snapshot is the largest thing
// this package ever holds, and stringifying it again at flush time would double
// the cost of the most expensive event in the recording. Serializing early also
// contains damage: one unserializable event is dropped where it is found instead
// of taking the whole batch with it.

import { readConsent, renderConsent } from '@hanzo/event'
import type { ReplayIds, ReplayTransport, eventWithTime } from './types'

/** The ONE replay ingest entry point: cloud serves it beside the event ingest
 *  (hanzo-inc/cloud apps/event/replay.go `replayPath`). */
export const REPLAY_PATH = '/v1/event/replay'
export const DEFAULT_ENDPOINT = 'https://api.hanzo.ai'

/** The largest body the ingest accepts, in bytes: 512 KiB (apps/event/replay.go
 *  `maxReplayBytes`). Over it the answer is 413, so a batch is cut before it gets
 *  there and an event that is bigger on its own is never sent. */
export const MAX_BATCH_BYTES = 512 * 1024

/** What `fetch(keepalive)` and `sendBeacon` may carry: the Fetch standard refuses a
 *  keepalive body once the page's in-flight keepalive bytes pass 64 KiB. */
export const KEEPALIVE_BYTES = 64 * 1024

/** The envelope's bytes beyond what encodeBatch measured at construction: the
 *  consent it reads at flush time renders at most `analytics,marketing,ads`. */
const CONSENT_BYTES = 'analytics,marketing,ads'.length

/** The UTF-8 length of a string, without encoding it: the body is sent as UTF-8,
 *  and a JS string's length counts UTF-16 units. */
export function utf8Length(s: string): number {
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c < 0x80) n += 1
    else if (c < 0x800) n += 2
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      n += 4
      i++
    } else n += 3
  }
  return n
}

/** A publishable key — the only kind that may ride a URL. `sendBeacon` cannot set
 *  headers, so an unload flush has to carry the key in the query string; putting
 *  a SECRET key there would write it into access logs and Referer headers. */
export function publishable(key: string): boolean {
  return /^pk[-_]/.test(key)
}

/** The batch endpoint for an ingest origin. */
export function replayUrl(endpoint = DEFAULT_ENDPOINT): string {
  return endpoint.replace(/\/+$/, '') + REPLAY_PATH
}

/** The wire body: the three ids, then the raw rrweb events. `parts` are already
 *  serialized events, so the array is spliced in rather than re-encoded. */
export function encodeBatch(ids: ReplayIds, parts: string[]): string {
  const head = JSON.stringify({
    sessionId: ids.sessionId,
    windowId: ids.windowId,
    distinctId: ids.distinctId,
    // The choice the batch was recorded under, as @hanzo/event spells it: cloud
    // keeps a recording only under Analytics.
    consent: renderConsent(readConsent()),
  })
  return head.slice(0, -1) + ',"events":[' + parts.join(',') + ']}'
}

/** fetch normally; navigator.sendBeacon for the headerless unload flush, where the
 *  publishable key rides `?ingest_key=` instead of a header. Only a body inside the
 *  keepalive quota is beaconed or kept alive: past it the browser refuses the
 *  request outright, and a full snapshot is several times the quota. */
export const defaultTransport: ReplayTransport = {
  send(url, payload, opts) {
    const fits = utf8Length(payload) <= KEEPALIVE_BYTES
    if (
      opts.beacon &&
      fits &&
      publishable(opts.ingestKey) &&
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const sep = url.includes('?') ? '&' : '?'
      const beaconUrl = url + sep + 'ingest_key=' + encodeURIComponent(opts.ingestKey)
      try {
        if (navigator.sendBeacon(beaconUrl, new Blob([payload], { type: 'application/json' }))) return
      } catch {
        /* fall through to fetch */
      }
    }
    if (typeof fetch !== 'function') return
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.ingestKey}` },
      body: payload,
      keepalive: opts.beacon && fits,
      credentials: 'include',
    })
      .then((res) => {
        // Losing a replay never throws into the app, but silence is how a client
        // stops reporting without anyone noticing. Under `debug`, say so.
        if (!res.ok && opts.debug) console.warn('[replay] ingest rejected', res.status)
      })
      .catch((e: unknown) => {
        if (opts.debug) console.warn('[replay] ingest failed', e)
      })
  },
}

export interface BatchConfig extends ReplayIds {
  ingestKey: string
  url: string
  batchSize: number
  maxBytes: number
  flushIntervalMs: number
  transport: ReplayTransport
  /** Called on the interval tick, before flushing — the recorder uses it to
   *  notice an SPA that routed onto a credential page with nothing to record. */
  tick?: () => void
  onError?: (err: unknown) => void
  debug?: boolean
}

export class Batch {
  private parts: string[] = []
  private bytes = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private unload: (() => void) | null = null

  /** The bytes the envelope around the events takes: the ids, the consent, the
   *  brackets. */
  private head: number

  constructor(private cfg: BatchConfig) {
    this.head = utf8Length(encodeBatch(cfg, [])) + CONSENT_BYTES
  }

  /** Buffer one event. A batch never passes `maxBytes` (counted as the body is sent,
   *  envelope and commas included): an event that would take it over flushes what
   *  is buffered first, and one that is over on its own is reported and dropped,
   *  because the ingest would refuse it whole. */
  add(e: eventWithTime): void {
    let part: string
    try {
      part = JSON.stringify(e)
    } catch (err) {
      this.cfg.onError?.(err)
      return // one poisoned event, never the batch
    }
    const size = utf8Length(part) + 1 // and its comma
    if (this.head + size > this.cfg.maxBytes) {
      this.cfg.onError?.(
        new Error(`replay: a ${size - 1}-byte event cannot fit a ${this.cfg.maxBytes}-byte batch; not sent`),
      )
      return
    }
    if (this.head + this.bytes + size > this.cfg.maxBytes) this.flush()
    this.parts.push(part)
    this.bytes += size
    if (this.parts.length >= this.cfg.batchSize) this.flush()
  }

  /** Send what is buffered. `beacon` selects the unload path. */
  flush(beacon = false): void {
    if (this.parts.length === 0) return
    const payload = encodeBatch(this.cfg, this.parts)
    this.parts = []
    this.bytes = 0
    try {
      this.cfg.transport.send(this.cfg.url, payload, {
        beacon,
        ingestKey: this.cfg.ingestKey,
        debug: this.cfg.debug,
      })
    } catch (err) {
      this.cfg.onError?.(err)
    }
  }

  /** Start the interval and the page-going-away flushes. */
  start(): void {
    if (this.timer) return
    if (this.cfg.flushIntervalMs > 0) {
      this.timer = setInterval(() => {
        this.cfg.tick?.()
        this.flush()
      }, this.cfg.flushIntervalMs)
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    // `pagehide` and a hidden `visibilitychange` are the two events a mobile
    // browser reliably fires before it discards the page; `beforeunload` is not.
    const onHide = () => {
      if (document.visibilityState === 'hidden') this.flush(true)
    }
    const onPageHide = () => this.flush(true)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    this.unload = () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
    }
  }

  /** Throw away what is buffered, unsent: the visitor withdrew the grant it was recorded under. */
  drop(): void {
    this.parts = []
    this.bytes = 0
  }

  /** Stop the timers, drop the listeners, and send the tail. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.unload?.()
    this.unload = null
    this.flush()
  }
}
