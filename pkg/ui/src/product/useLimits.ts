'use client'

// The signed-in payer's plan usage, held: read from `GET /v1/ai/limits` and
// kept current by every served call's usage headers and every billing refusal
// a host hands to `observe`.
//
//   const read = (signal) => fetch(`${api}/v1/ai/limits`, { headers, signal }).then(...)
//   const { limits, notice, near } = useLimits(read, org)
//   observe(response)   // in the host's fetch, for each AI call
//
// The host owns the request — its base URL, bearer and org — so this never
// learns how a surface authenticates.

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  limitsOf,
  nearOf,
  noticeOf,
  overlay,
  refusalOf,
  servedOf,
  type Heard,
  type LimitNotice,
  type Limits,
} from './limits'

interface Held extends Heard {
  /** When it was heard, ms. */
  at: number
}

let held: Held = { served: null, refusal: null, at: 0 }
const listeners = new Set<() => void>()

const tell = (next: Held) => {
  held = next
  for (const l of listeners) l()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const snapshot = () => held
const EMPTY: Held = { served: null, refusal: null, at: 0 }
const server = () => EMPTY

/**
 * Reads the usage headers off an AI call's response, and the billing envelope
 * off a 402 or 429. Never throws and never consumes the body.
 */
export function observe(res: Response): void {
  const served = servedOf(res.headers)
  if (res.ok) {
    if (served) tell({ served, refusal: null, at: Date.now() })
    return
  }
  if (res.status !== 402 && res.status !== 429) return
  const retry = res.headers.get('retry-after')
  res
    .clone()
    .json()
    .then((body: unknown) => {
      const refusal = refusalOf(body, res.status, retry)
      if (refusal) tell({ served: served ?? held.served, refusal, at: Date.now() })
    })
    .catch(() => {})
}

/** Forgets every heard header and refusal: a sign-out, or another payer. */
export function forget(): void {
  tell(EMPTY)
}

export interface UseLimits {
  /** The limits with what served calls said since laid over them; null until read, or when the read failed. */
  limits: Limits | null
  /** The first read has come back, either way. */
  answered: boolean
  /** A class paused or refused: the message and its actions. */
  notice: LimitNotice | null
  /** The one-line note for a class close to its included usage. */
  near: string | null
  reload: () => void
}

/**
 * The plan usage for whoever `read` asks as. `read` answers the parsed body of
 * `GET /v1/ai/limits` or throws; null reads nothing (signed out). `key` reads
 * again when it changes (the org). `name` turns a fallback model id into the
 * name the reader knows it by.
 */
export function useLimits(
  read: ((signal: AbortSignal) => Promise<unknown>) | null,
  key: unknown = null,
  name?: (id: string) => string,
): UseLimits {
  const [limits, setLimits] = useState<Limits | null>(null)
  const [answered, setAnswered] = useState(false)
  const [readAt, setReadAt] = useState(0)
  const [nonce, setNonce] = useState(0)
  const reader = useRef(read)
  reader.current = read
  const on = read !== null
  const heard = useSyncExternalStore(subscribe, snapshot, server)

  useEffect(() => {
    const go = reader.current
    if (!go) {
      setLimits(null)
      return
    }
    const stop = new AbortController()
    const started = Date.now()
    go(stop.signal)
      .then((body) => {
        if (stop.signal.aborted) return
        setLimits(limitsOf(body))
        setReadAt(started)
      })
      .catch(() => {
        if (!stop.signal.aborted) setLimits(null)
      })
      .finally(() => {
        if (!stop.signal.aborted) setAnswered(true)
      })
    return () => stop.abort()
  }, [on, key, nonce])

  // A served call whose state differs from what was read, or a refusal, means
  // the read is stale: read again for the percent, the reset and the actions.
  const fresh = heard.at > readAt
  const drift =
    fresh &&
    (heard.refusal !== null ||
      (heard.served !== null &&
        (heard.served.fallback !== null ||
          (heard.served.class !== null && limits?.classes[heard.served.class]?.state !== heard.served.state))))
  useEffect(() => {
    if (drift && on) setNonce((n) => n + 1)
  }, [drift, on, heard.at])

  // Once read again, what a served call said still counts only while the
  // limits agree the reader is limited: an upgrade or a top-up clears it at once.
  const effective: Heard = useMemo(
    () => (fresh || limits?.state === 'limited' ? heard : { served: null, refusal: null }),
    [fresh, heard, limits?.state],
  )
  const shown = useMemo(() => overlay(limits, effective), [limits, effective])
  const nameRef = useRef(name)
  nameRef.current = name
  const notice = useMemo(() => noticeOf(shown, effective, (id) => nameRef.current?.(id) ?? id), [shown, effective])
  const near = useMemo(() => (notice ? null : nearOf(shown)), [notice, shown])

  return { limits: shown, answered, notice, near, reload: useCallback(() => setNonce((n) => n + 1), []) }
}
