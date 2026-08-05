// @hanzo/replay — browser session replay. rrweb records the DOM, this package
// decides what may leave the device and where it goes.
//
//   import { record } from '@hanzo/replay'
//   const replay = record({ ingestKey: 'pk-…' })
//   replay.stop()
//
// Orthogonal to @hanzo/observe. That package answers "what did the user DO" as a
// readable semantic hierarchy; this one answers "what did the user SEE" as a DOM
// movie the player can replay. Same privacy policy, different question, both ship.
//
// Nothing runs at module scope — importing this package records nothing.

import { record as rrwebRecord } from 'rrweb'
import { Batch, DEFAULT_ENDPOINT, defaultTransport, publishable, replayUrl } from './batch'
import { distinctId, sessionId, windowId } from './identity'
import { recorderOptions } from './policy'
import { refused } from './routes'
import { scrubEvent } from './scrub'
import type { ReplayConfig, ReplayHandle, eventWithTime } from './types'

export { CREDENTIAL_ROUTES, isCredentialRoute } from './routes'
export { CREDENTIAL_SELECTOR, fieldIdentity, maskInput, maskText, privateSelector, recorderOptions } from './policy'
export { scrubEvent } from './scrub'
export { DEFAULT_ENDPOINT, REPLAY_PATH, encodeBatch, publishable, replayUrl } from './batch'
export { distinctId, sessionId, windowId } from './identity'
export type {
  RedactionPolicy,
  Recorder,
  ReplayBatch,
  ReplayConfig,
  ReplayHandle,
  ReplayIds,
  ReplayTransport,
  eventWithTime,
} from './types'

/** An inert handle. Returned whenever the recorder declines to run, so a caller
 *  can always `.stop()` what `record()` gave back. */
function inert(ids: { sessionId: string; windowId: string; distinctId: string }): ReplayHandle {
  return { ...ids, recording: false, flush() {}, stop() {} }
}

/**
 * Start recording. Returns a handle whose `stop()` ends the recording and flushes.
 *
 * Refuses outright — and returns an inert handle — on a credential-bearing route,
 * and stops if the app routes onto one while recording.
 */
export function record(config: ReplayConfig): ReplayHandle {
  const ids = {
    sessionId: config.sessionId || sessionId(),
    windowId: config.windowId || windowId(),
    distinctId: config.distinctId || distinctId(),
  }
  const fail = (err: unknown) => {
    try {
      config.onError?.(err)
    } catch {
      /* an error handler that throws is not the app's problem */
    }
    if (config.debug) console.warn('[replay]', err)
  }

  if (!config.ingestKey) {
    fail(new Error('replay: ingestKey is required'))
    return inert(ids)
  }
  // A PUBLISHABLE key and nothing else. This runs in a browser, so whatever is
  // handed here is readable by anyone who opens devtools — a secret key would be
  // published by the act of using it, on every batch, in an Authorization header.
  // The beacon path already refused one; refusing at the door means there is no
  // carrier on which a secret can leave, rather than one carrier that happens to.
  if (!publishable(config.ingestKey)) {
    fail(new Error('replay: ingestKey must be a publishable key (pk-…) — never a secret key'))
    return inert(ids)
  }
  // A recording of an OAuth callback IS the authorization code. Never start here.
  if (refused(config.refuse)) return inert(ids)

  const batch = new Batch({
    ...ids,
    ingestKey: config.ingestKey,
    url: replayUrl(config.endpoint || DEFAULT_ENDPOINT),
    batchSize: config.batchSize ?? 50,
    maxBytes: config.maxBytes ?? 512 * 1024,
    flushIntervalMs: config.flushIntervalMs ?? 5000,
    transport: config.transport || defaultTransport,
    // An SPA can route onto a callback with nothing left to mutate, so the clock
    // — not only the event stream — has to be able to notice.
    tick: () => {
      if (refused(config.refuse)) stop()
    },
    onError: fail,
    debug: config.debug,
  })

  let live = true
  let end: (() => void) | undefined

  function stop(): void {
    if (!live) return
    live = false
    try {
      end?.()
    } catch (err) {
      fail(err)
    }
    end = undefined
    batch.stop()
  }

  batch.start()

  const options = recorderOptions(config.policy, {
    blockSelector: config.blockSelector,
    maskTextSelector: config.maskTextSelector,
    extra: config.rrweb,
  })

  try {
    end = (config.recorder || (rrwebRecord as ReplayConfig['recorder'])!)({
      ...options,
      emit: (e: eventWithTime) => {
        // Checked per event, not once at start: this is the moment the app has
        // actually navigated, and the event in hand is the first one that would
        // carry the new page. Dropping it and stopping means the callback page is
        // never captured at all.
        if (refused(config.refuse)) {
          stop()
          return
        }
        if (!live) return
        try {
          batch.add(scrubEvent(e))
        } catch (err) {
          fail(err)
        }
      },
    })
  } catch (err) {
    fail(err)
    stop()
    return inert(ids)
  }

  return {
    ...ids,
    get recording() {
      return live
    },
    flush: () => batch.flush(),
    stop,
  }
}
