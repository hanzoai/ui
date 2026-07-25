// Pure builders for the error path: parse a Hanzo-minted DSN, turn a JS Error into
// a Sentry `event`, and frame it into a Sentry envelope. No I/O, no globals — the
// Analytics client (core.ts) wires these to identity + transport.
//
// The wire shapes are a from-scratch model of the PUBLIC, documented Sentry ingest
// protocol (develop.sentry.dev), verified against the Hanzo /v1/sentry ingest
// (o11y pkg/modules/errortracking/implerrortracking: parseEnvelope, SentryEvent,
// normalizeEvent, computeFingerprint). No upstream (FSL) code is used.

import { scrubText } from './scrub'
import { VERSION } from './version'
import type {
  CaptureErrorOptions,
  Dsn,
  SentryEvent,
  SentryFrame,
  SentryLevel,
} from './types'

/** Max stack frames kept — well under the server's 250 cap, plenty for grouping. */
const MAX_FRAMES = 50
/** Max stack lines examined, and max length of a line worth examining. Guards the
 *  frame regexes against a hostile `stack` string (see framesFromStack). */
const MAX_LINES = 500
const MAX_LINE_LEN = 2048
/** Max tag string length, so one huge property can't bloat the envelope. */
const MAX_TAG_LEN = 1024
/** Max tags copied from properties. */
const MAX_TAGS = 50

/** eventId mints a 32-hex-char id (no dashes) — the Sentry event_id shape. */
export function eventId(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && 'randomUUID' in c) return c.randomUUID().replace(/-/g, '')
  let s = ''
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

/** byteLen returns the UTF-8 byte length used for envelope item framing. */
function byteLen(s: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length
  // Node fallback.
  if (typeof Buffer !== 'undefined') return Buffer.byteLength(s, 'utf8')
  return s.length
}

/**
 * parseDsn parses "https://<version>:<hmac>@<host>/v1/sentry/<projectId>" into its
 * public key + the derived envelope ingest URL. The key (which itself contains a
 * ':') is taken verbatim as the userinfo — we do NOT split it as user:pass. The
 * key rides ?sentry_key= (not the DSN in the body) because that is the credential
 * channel the server trusts AND the only one sendBeacon can carry on unload.
 * Returns null for anything malformed (fail-safe: the caller then stays inert).
 */
export function parseDsn(dsn: string | undefined | null): Dsn | null {
  if (!dsn) return null
  const m = /^(https?):\/\/([^@]+)@([^/]+)(\/.*)?$/.exec(dsn.trim())
  if (!m) return null
  const scheme = m[1]
  const publicKey = m[2]
  const host = m[3]
  const path = m[4] ?? ''
  if (!publicKey || !host) return null
  const segs = path.split('/').filter(Boolean)
  const projectId = segs.length > 0 ? segs[segs.length - 1] : ''
  if (!projectId) return null
  const origin = `${scheme}://${host}`
  const ingestUrl =
    `${origin}/v1/sentry/${encodeURIComponent(projectId)}/envelope/` +
    `?sentry_key=${encodeURIComponent(publicKey)}`
  return { publicKey, origin, projectId, ingestUrl }
}

const V8_FRAME = /^\s*at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?\s*$/
const MOZ_FRAME = /^\s*(?:(.*?)@)?(.+?):(\d+):(\d+)\s*$/

/** inApp marks a frame as the app's own code (vs vendor/runtime) for grouping. */
function inApp(file: string): boolean {
  if (!file) return false
  return !(
    file.includes('node_modules') ||
    file.startsWith('webpack-internal') ||
    file.startsWith('webpack://') ||
    file.startsWith('chrome-extension://') ||
    file.startsWith('moz-extension://')
  )
}

/**
 * framesFromStack parses a browser Error.stack into Sentry frames, OLDEST-FIRST
 * (Sentry orders caller->callee; the crash site is last — matching the server's
 * pickCrashFrame). Handles both V8 ("at fn (file:li:co)") and
 * Firefox/Safari ("fn@file:li:co"). Unparseable lines are skipped.
 */
export function framesFromStack(stack: string | undefined): SentryFrame[] {
  if (!stack) return []
  // Both frame regexes use lazy nested quantifiers, which backtrack badly on a
  // long line that never matches. A stack is attacker-influenced (a thrown value
  // can carry any `stack` string), so bound the work: skip absurd lines and stop
  // after MAX_LINES. Only the innermost MAX_FRAMES are kept anyway.
  const lines = stack.split('\n', MAX_LINES)
  const frames: SentryFrame[] = []
  for (const raw of lines) {
    if (raw.length > MAX_LINE_LEN) continue
    const line = raw.trimEnd()
    if (!line) continue
    // Header lines like "TypeError: x is not a function" match neither frame
    // regex (no "at " prefix, no trailing :line:col) and are skipped naturally.
    let fn: string | undefined
    let file = ''
    let lineno = 0
    let colno = 0
    const v = V8_FRAME.exec(line)
    if (v) {
      fn = v[1]
      if (v[2]) {
        file = v[2]
        lineno = Number(v[3]) || 0
        colno = Number(v[4]) || 0
      } else {
        file = (v[5] || '').trim()
      }
    } else {
      const f = MOZ_FRAME.exec(line)
      if (!f) continue
      fn = f[1]
      file = f[2]
      lineno = Number(f[3]) || 0
      colno = Number(f[4]) || 0
    }
    if (!file && !fn) continue
    frames.push({
      function: fn || '<anonymous>',
      filename: file,
      abs_path: file,
      lineno,
      colno,
      in_app: inApp(file),
    })
  }
  // Reverse to oldest-first and cap to the innermost MAX_FRAMES.
  frames.reverse()
  if (frames.length > MAX_FRAMES) return frames.slice(frames.length - MAX_FRAMES)
  return frames
}

/** normalizeError coerces an unknown throwable into {name, message, stack}. */
export function normalizeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name || 'Error', message: err.message || String(err), stack: err.stack }
  }
  if (typeof err === 'string') return { name: 'Error', message: err }
  try {
    return { name: 'Error', message: JSON.stringify(err) }
  } catch {
    return { name: 'Error', message: String(err) }
  }
}

/** Identity carried onto every error event — the SAME ids analytics uses. */
export interface ErrorIdentity {
  /** OIDC sub (post-identify) or anon id. NEVER email/PII. */
  userId?: string
  sessionId?: string
  product?: string
  release?: string
  environment?: string
}

export interface BuildEventInput {
  error: unknown
  options?: CaptureErrorOptions
  identity: ErrorIdentity
  capturePII?: boolean
  /** Injectable for deterministic tests. */
  now?: number
  id?: string
}

function coerceTag(v: unknown): string {
  const s = typeof v === 'string' ? v : (() => {
    try {
      return JSON.stringify(v) ?? String(v)
    } catch {
      try {
        return String(v) // circular — fall back to the primitive coercion
      } catch {
        return '[unstringifiable]' // ...which a throwing toString can also refuse
      }
    }
  })()
  return s.length > MAX_TAG_LEN ? s.slice(0, MAX_TAG_LEN) : s
}

/**
 * buildSentryEvent turns a throwable + identity into a Sentry `event`. The message
 * (the leak surface) is scrubbed client-side; the user is ONLY the stable subject
 * id — never email/username/ip. Level defaults to error, or fatal for uncaught.
 */
export function buildSentryEvent(input: BuildEventInput): SentryEvent {
  const { error, options = {}, identity, capturePII = false } = input
  const norm = normalizeError(error)
  const handled = options.handled !== false
  const level: SentryLevel = options.level ?? (handled ? 'error' : 'fatal')

  const tags: Record<string, string> = { handled: String(handled) }
  if (identity.product) tags.product = identity.product
  if (identity.sessionId) tags.session = identity.sessionId
  // Tags come from arbitrary caller `properties`. Read each key in isolation:
  // Object.entries() invokes every getter at once, so one throwing getter would
  // cost us the entire envelope — losing the stack trace to save a tag. Keys are
  // optional; the exception is not.
  try {
    const props = (options.properties ?? {}) as Record<string, unknown>
    let n = 0
    for (const k of Object.keys(props)) {
      if (n >= MAX_TAGS) break
      try {
        const val = props[k]
        if (val === undefined || val === null) continue
        tags[k] = scrubText(coerceTag(val), capturePII)
        n++
      } catch {
        continue // throwing getter or unstringifiable value — skip this key only
      }
    }
  } catch {
    /* unenumerable/exotic properties object — ship the exception without tags */
  }

  const event: SentryEvent = {
    event_id: input.id ?? eventId(),
    timestamp: (input.now ?? Date.now()) / 1000,
    platform: 'javascript',
    level,
    logger: identity.product,
    environment: identity.environment,
    release: identity.release,
    exception: {
      values: [
        {
          type: norm.name,
          value: scrubText(norm.message, capturePII),
          stacktrace: { frames: framesFromStack(norm.stack) },
        },
      ],
    },
    tags,
    sdk: { name: '@hanzo/event', version: VERSION },
  }
  if (identity.userId) event.user = { id: identity.userId }
  return event
}

/**
 * buildEnvelope frames a Sentry event into a newline-delimited envelope:
 *
 *   {"event_id","dsn","sent_at"}\n
 *   {"type":"event","content_type":"application/json","length":N}\n
 *   <event json>\n
 *
 * The item is length-delimited (N = UTF-8 byte length) — the framing the server's
 * parseEnvelope reads first (falling back to newline-delimited otherwise).
 */
export function buildEnvelope(event: SentryEvent, dsn: Dsn, sentAt?: string): string {
  const payload = JSON.stringify(event)
  const header = JSON.stringify({
    event_id: event.event_id,
    dsn: `${dsn.origin}/v1/sentry/${dsn.projectId}`,
    sent_at: sentAt ?? new Date().toISOString(),
  })
  const itemHeader = JSON.stringify({
    type: 'event',
    content_type: 'application/json',
    length: byteLen(payload),
  })
  return `${header}\n${itemHeader}\n${payload}\n`
}
