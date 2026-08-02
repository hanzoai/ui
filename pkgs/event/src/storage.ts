// SSR-safe browser storage for stable identifiers and first-touch state. Every
// accessor no-ops (returns undefined) when there is no window/localStorage, so the
// client imports cleanly in a Next.js server component.

import type { Attribution, Cohort } from './types'
import { uuidv7 } from './uid'

const KEY = {
  anon: 'hz_anon_id',
  session: 'hz_session',
  firstTouch: 'hz_first_touch',
  cohort: 'hz_cohort',
} as const

/** 30-minute inactivity window defines a session (PostHog/GA convention). */
const SESSION_TTL_MS = 30 * 60 * 1000

function ls(): Storage | undefined {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return undefined
    return window.localStorage
  } catch {
    return undefined // Safari private mode / blocked storage
  }
}

/** Stable anonymous id, minted once per browser and reused across sessions. */
export function anonId(): string | undefined {
  const s = ls()
  if (!s) return undefined
  let v = s.getItem(KEY.anon)
  if (!v) {
    v = uuidv7()
    s.setItem(KEY.anon, v)
  }
  return v
}

interface SessionState {
  id: string
  last: number
}

/**
 * Current session id, rotated after SESSION_TTL_MS of inactivity.
 *
 * Minted at `now`, so the v7 timestamp the id carries IS the session's start
 * instant — which is what the session rollups partition and order on. Passing the
 * caller's clock rather than reading Date.now() again keeps the id's embedded time
 * and the recorded `last` from disagreeing.
 */
export function sessionId(now = Date.now()): string | undefined {
  const s = ls()
  if (!s) return undefined
  let state: SessionState | null = null
  try {
    state = JSON.parse(s.getItem(KEY.session) || 'null')
  } catch {
    state = null
  }
  if (!state || now - state.last > SESSION_TTL_MS) {
    state = { id: uuidv7(now), last: now }
  } else {
    state.last = now
  }
  s.setItem(KEY.session, JSON.stringify(state))
  return state.id
}

/** Read the persisted first-touch attribution. */
export function getFirstTouch(): Attribution | undefined {
  const s = ls()
  if (!s) return undefined
  try {
    const v = s.getItem(KEY.firstTouch)
    return v ? (JSON.parse(v) as Attribution) : undefined
  } catch {
    return undefined
  }
}

/** Persist first-touch attribution ONCE — never overwrite an existing record. */
export function setFirstTouchOnce(a: Attribution): Attribution {
  const s = ls()
  const existing = getFirstTouch()
  if (existing) return existing
  if (s) s.setItem(KEY.firstTouch, JSON.stringify(a))
  return a
}

/** Read persisted cohort dimensions. */
export function getCohort(): Cohort | undefined {
  const s = ls()
  if (!s) return undefined
  try {
    const v = s.getItem(KEY.cohort)
    return v ? (JSON.parse(v) as Cohort) : undefined
  } catch {
    return undefined
  }
}

/** Merge + persist cohort dimensions (signupWeek set once). */
export function mergeCohort(patch: Cohort): Cohort {
  const s = ls()
  const cur = getCohort() || {}
  const next: Cohort = {
    signupWeek: cur.signupWeek || patch.signupWeek,
    channel: patch.channel || cur.channel,
    refCode: cur.refCode || patch.refCode,
  }
  if (s) s.setItem(KEY.cohort, JSON.stringify(next))
  return next
}
