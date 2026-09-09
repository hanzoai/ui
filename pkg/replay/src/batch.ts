// Buffering and delivery. Three triggers flush a batch: it got long, it got big,
// or the clock ran — plus the page going away, which is the only one that cannot
// be retried.
//
// Events are serialized ON ARRIVAL, once. A full snapshot is the largest thing
// this package ever holds, and stringifying it again at flush time would double
// the cost of the most expensive event in the recording. Serializing early also
// contains damage: one unserializable event is dropped where it is found instead
// of taking the whole batch with it.

import type { ReplayIds, ReplayTransport, eventWithTime } from './types'

export const REPLAY_PATH = '/v1/replay' // the ONE replay ingest entry point
export const DEFAULT_ENDPOINT = 'https://api.hanzo.ai'

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
  })
  return head.slice(0, -1) + ',"events":[' + parts.join(',') + ']}'
}

/** fetch(keepalive) normally; navigator.sendBeacon for the headerless unload
 *  flush, where the publishable key rides `?ingest_key=` instead of a header. */
export const defaultTransport: ReplayTransport = {
  send(url, payload, opts) {
    if (
      opts.beacon &&
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
      keepalive: true,
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

  constructor(private cfg: BatchConfig) {}

  /** Buffer one event, flushing if it took the batch over either threshold. */
  add(e: eventWithTime): void {
    let part: string
    try {
      part = JSON.stringify(e)
    } catch (err) {
      this.cfg.onError?.(err)
      return // one poisoned event, never the batch
    }
    this.parts.push(part)
    this.bytes += part.length
    if (this.parts.length >= this.cfg.batchSize || this.bytes >= this.cfg.maxBytes) this.flush()
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
