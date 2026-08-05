// Who and what a recording belongs to.
//
// A replay is only worth having if it lands on the SAME session and the SAME
// person as the events around it — a movie you cannot join to the funnel is a
// curiosity. So this module does not mint a private identity space: it reads the
// keys @hanzo/event already owns (`hz_session`, `hz_anon_id`, legacy `hz_id`) and
// only mints into them when a page has none, which is exactly what
// @hanzo/event's own chain does. Whichever client loads first wins, and both
// agree either way.
//
// Every accessor is SSR-safe: no window, no storage, no throw.

import { uuidv7 } from '@hanzo/event'

/** @hanzo/event's session record: `{ id, last }`, rotated on inactivity. */
const SESSION_KEY = 'hz_session'
/** The shared anonymous id, and the legacy key hz.js wrote before it. */
const ANON_KEY = 'hz_anon_id'
const ANON_LEGACY_KEY = 'hz_id'
/** One tab. sessionStorage is per-tab by definition, which is the whole idea. */
const WINDOW_KEY = 'hz_window'

function store(kind: 'local' | 'session'): Storage | undefined {
  try {
    if (typeof window === 'undefined') return undefined
    const s = kind === 'local' ? window.localStorage : window.sessionStorage
    return s || undefined
  } catch {
    return undefined // Safari private mode / blocked storage
  }
}

function read(s: Storage | undefined, key: string): string {
  try {
    return s?.getItem(key) || ''
  } catch {
    return ''
  }
}

function write(s: Storage | undefined, key: string, value: string): void {
  try {
    s?.setItem(key, value)
  } catch {
    /* quota exhausted, or a jar that reads but refuses writes */
  }
}

/** The value of cookie `name`, or ''. The anon id lives on the registrable
 *  domain so every *.hanzo.ai surface reads one visitor. */
function cookie(name: string): string {
  try {
    if (typeof document === 'undefined' || typeof document.cookie !== 'string') return ''
    for (const part of document.cookie.split(';')) {
      const eq = part.indexOf('=')
      if (eq < 0) continue
      if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim())
    }
  } catch {
    /* no jar */
  }
  return ''
}

/**
 * The session this recording belongs to — @hanzo/event's session id when the page
 * has one, else a fresh one written in @hanzo/event's own `{id,last}` shape so
 * the analytics client adopts it rather than minting a second.
 *
 * Rotation on inactivity stays @hanzo/event's job. Reading a live session is not
 * a second policy; re-implementing the TTL would be.
 */
export function sessionId(now = Date.now()): string {
  const s = store('local')
  try {
    const state = JSON.parse(read(s, SESSION_KEY) || 'null')
    if (state && typeof state.id === 'string' && state.id) return state.id
  } catch {
    /* unparseable — mint below */
  }
  const id = uuidv7(now)
  write(s, SESSION_KEY, JSON.stringify({ id, last: now }))
  return id
}

/** The visitor. Reads @hanzo/event's anon chain in ITS order — cookie, then
 *  `hz_anon_id`, then legacy `hz_id` — adopting any id already in the wild
 *  instead of detaching a returning visitor from their own history. */
export function distinctId(): string {
  const s = store('local')
  const found = cookie(ANON_KEY) || read(s, ANON_KEY) || read(s, ANON_LEGACY_KEY)
  if (found) return found
  const id = uuidv7()
  // Write only the localStorage rung; @hanzo/event promotes it to the shared
  // cookie on its next read, so there is one place that owns cookie scope.
  write(s, ANON_KEY, id)
  return id
}

/** This tab. Survives a reload (sessionStorage does), which is what makes a
 *  reload read as one window rather than two. */
export function windowId(): string {
  const s = store('session')
  const found = read(s, WINDOW_KEY)
  if (found) return found
  const id = uuidv7()
  write(s, WINDOW_KEY, id)
  return id
}
