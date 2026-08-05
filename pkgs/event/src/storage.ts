// SSR-safe browser storage for stable identifiers and first-touch state. Every
// accessor no-ops (returns undefined) when there is no window/localStorage, so the
// client imports cleanly in a Next.js server component.
//
// The anonymous id is the one value that must outlive an ORIGIN, so it lives in a
// cookie on the registrable domain; everything else here stays origin-local.

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

/** The registrable domain the anon cookie is scoped to, so docs, cloud, console,
 *  studio, pay, id and www all read the ONE id. */
const ANON_DOMAIN = 'hanzo.ai'

/** Two years, refreshed on every read — the cookie rolls forward with the visitor
 *  instead of expiring a fixed two years after first touch. */
const ANON_MAX_AGE_S = 2 * 365 * 24 * 60 * 60

function ls(): Storage | undefined {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return undefined
    return window.localStorage
  } catch {
    return undefined // Safari private mode / blocked storage
  }
}

/** The cookie jar, or undefined wherever there is no document to read one from. */
function jar(): Document | undefined {
  try {
    if (typeof document === 'undefined' || typeof document.cookie !== 'string') return undefined
    return document
  } catch {
    return undefined // sandboxed frame with an opaque origin
  }
}

function getCookie(name: string): string | undefined {
  const d = jar()
  if (!d) return undefined
  for (const part of d.cookie.split(';')) {
    const eq = part.indexOf('=')
    if (eq < 0 || part.slice(0, eq).trim() !== name) continue
    const v = part.slice(eq + 1).trim()
    if (!v) continue
    try {
      return decodeURIComponent(v)
    } catch {
      return v // not percent-encoded — take it as written
    }
  }
  return undefined
}

function setCookie(name: string, value: string): void {
  const d = jar()
  if (!d) return
  let host = ''
  let secure = false
  try {
    if (typeof window !== 'undefined' && window.location) {
      host = window.location.hostname || ''
      // A Secure cookie is refused outright by a non-secure origin, which would
      // strand http://localhost dev on the localStorage path.
      secure = window.location.protocol === 'https:'
    }
  } catch {
    /* location unreachable — write a host-only, non-secure cookie */
  }
  const attrs = [
    // encodeURIComponent leaves a UUID byte-identical while making any value that
    // is not one unable to forge a `;` and inject an attribute.
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${ANON_MAX_AGE_S}`,
    'SameSite=Lax',
  ]
  // Off hanzo.ai (localhost, previews, other registrable domains) the attribute
  // would be rejected and the cookie dropped, so the cookie stays host-only there.
  if (host === ANON_DOMAIN || host.endsWith(`.${ANON_DOMAIN}`)) attrs.push(`Domain=${ANON_DOMAIN}`)
  if (secure) attrs.push('Secure')
  try {
    d.cookie = attrs.join('; ')
  } catch {
    /* cookies refused — localStorage still carries the id */
  }
}

/** Last resort for a browser that refuses cookies AND localStorage: without it
 *  every event in a page load would mint its own id. */
let memAnon: string | undefined

/**
 * Stable anonymous id, shared by every *.hanzo.ai surface.
 *
 * It lives in a first-party cookie on the registrable domain because
 * localStorage is ORIGIN-scoped: docs, cloud and console each minted their own
 * id for the same person, so one marketing → docs → signup → checkout journey
 * arrived as several strangers — 463 anonymous identities carried 545 events in
 * a week, about 1.2 events each.
 *
 * Resolution is strictly ADDITIVE: cookie, else the localStorage id this package
 * has always written (ADOPTED into the cookie, never minted over — minting there
 * would reset every returning visitor and detach their history), else mint.
 * localStorage keeps being written, so a rollback finds everyone where it left
 * them.
 */
export function anonId(): string | undefined {
  if (typeof window === 'undefined') return undefined // SSR / prerender
  const s = ls()
  const id = getCookie(KEY.anon) || s?.getItem(KEY.anon) || memAnon || uuidv7()
  memAnon = id
  setCookie(KEY.anon, id)
  try {
    if (s && s.getItem(KEY.anon) !== id) s.setItem(KEY.anon, id)
  } catch {
    /* quota exhausted, or a private-mode jar that reads but refuses writes */
  }
  return id
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
