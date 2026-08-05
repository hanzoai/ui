// The shapes @hanzo/replay is defined in terms of. rrweb owns the event type; we
// only ever add the envelope around it.

import type { RedactionPolicy } from '@hanzo/observe'
import type { eventWithTime, recordOptions } from 'rrweb'

export type { eventWithTime, recordOptions }
export type { RedactionPolicy }

/** The three ids that file a recording. `sessionId` is the SAME session
 *  @hanzo/event stamps on its events, which is what lets a player put a replay
 *  and its event stream on one timeline. */
export interface ReplayIds {
  sessionId: string
  /** One browser tab. A session can span several. */
  windowId: string
  /** Who the session belongs to — the shared anonymous id, or a known user id. */
  distinctId: string
}

/** The wire body of POST /v1/replay. Raw rrweb events, no re-encoding: the
 *  player already speaks this. */
export interface ReplayBatch extends ReplayIds {
  events: eventWithTime[]
}

/** Where a serialized batch goes. Swappable so a test can read the exact bytes
 *  the door would receive. */
export interface ReplayTransport {
  send(
    url: string,
    payload: string,
    opts: { beacon: boolean; ingestKey: string; debug?: boolean },
  ): void
}

/** rrweb's `record`, narrowed to the one instantiation we use. Injectable so a
 *  consumer can hand us the rrweb they already bundle. */
export type Recorder = (options?: recordOptions<eventWithTime>) => (() => void) | undefined

export interface ReplayConfig {
  /** Publishable key (`pk-…`). It is what attributes the write; there is no
   *  other credential on this path, and a secret key must never be used here —
   *  the unload beacon puts the key in a URL. */
  ingestKey: string
  /** Ingest origin. Default `https://api.hanzo.ai`. */
  endpoint?: string

  /** The capture-time privacy policy. THE SAME `RedactionPolicy` @hanzo/observe
   *  applies — one policy, two capture engines. Default: mask everything. */
  policy?: RedactionPolicy

  /** Override any id. Omitted ids resolve from the shared browser identity. */
  sessionId?: string
  windowId?: string
  distinctId?: string

  /** Flush after this many events. Default 50. */
  batchSize?: number
  /** Flush once the buffered payload reaches this many bytes. Default 512 KiB. */
  maxBytes?: number
  /** Flush at least this often, in ms. Default 5000. */
  flushIntervalMs?: number

  /** App selectors to block (never captured) on top of the policy's own. */
  blockSelector?: string
  /** App selectors to mask (captured as asterisks) on top of the policy's own. */
  maskTextSelector?: string

  /** Extra route refusal, ANDed onto the built-in credential routes. Return true
   *  to refuse to record on that path. */
  refuse?: (pathname: string) => boolean

  /** Escape hatch onto rrweb. Applied UNDER our options, so it can tune sampling
   *  or plugins but cannot widen the privacy gate. */
  rrweb?: Partial<recordOptions<eventWithTime>>

  /** Seams. */
  recorder?: Recorder
  transport?: ReplayTransport
  onError?: (err: unknown) => void
  debug?: boolean
}

/** What `record()` hands back. */
export interface ReplayHandle extends ReplayIds {
  /** False once stopped — including when the recorder refused to start. */
  readonly recording: boolean
  /** Send whatever is buffered now. */
  flush(): void
  /** Stop recording and flush. Idempotent. */
  stop(): void
}
