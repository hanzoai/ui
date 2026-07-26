// The Sentry envelope path — the wire-level @sentry replacement. A captured
// Exception is serialized into a Sentry-compatible envelope and POSTed to the
// Hanzo Sentry product's ingest route (/v1/sentry/<projectUUID>/envelope/),
// authenticated by the DSN public key (?sentry_key). It rides the SAME Transport
// as analytics events — one client, one session, one identity — so errors and
// analytics share a single de-duped pipe with no third-party SDK.
//
// This is a from-scratch implementation of the PUBLIC, documented Sentry ingest
// protocol (develop.sentry.dev): the newline-framed envelope and the subset of
// the event payload Hanzo's grouping consumes (exception type + normalized crash
// frame). No upstream Sentry code is used.

import type { Exception, Transport } from './types'

/** A parsed Hanzo Sentry DSN.
 *
 *   https://<version>:<hmac>@<host>/v1/sentry/<projectUUID>
 *
 * The `<version>:<hmac>` userinfo IS the ingest public key; the last path segment
 * is the project UUID; the ingest endpoint is derived per the CLEAN Hanzo route
 * (no /api/ segment). */
export interface Dsn {
  /** The full "<version>:<hmac>" ingest public key (the sentry_key). */
  publicKey: string
  /** Ingest origin host (may include a port). */
  host: string
  /** Project UUID — the last DSN path segment; the server route is UUID-constrained. */
  projectId: string
  /** Derived ingest endpoint: `<scheme>//<host>/v1/sentry/<projectUUID>/envelope/`. */
  ingestUrl: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** parseDsn decodes a Hanzo Sentry DSN, returning null (fail-closed) for anything
 *  malformed or whose project segment is not a UUID — so the caller cleanly falls
 *  back to the analytics-stream error path instead of POSTing to a 404/401 URL. */
export function parseDsn(dsn?: string): Dsn | null {
  if (!dsn) return null
  let u: URL
  try {
    u = new URL(dsn)
  } catch {
    return null
  }
  // The Hanzo key is "<version>:<hmac>"; a URL parses that userinfo into
  // username=<version> + password=<hmac>, so rejoin them into the sentry_key.
  const publicKey = u.password ? `${u.username}:${u.password}` : u.username
  if (!publicKey) return null
  const segs = u.pathname.split('/').filter(Boolean)
  const projectId = segs.pop() ?? ''
  if (!UUID_RE.test(projectId)) return null
  const base = segs.length ? '/' + segs.join('/') : ''
  const ingestUrl = `${u.protocol}//${u.host}${base}/${projectId}/envelope/`
  return { publicKey, host: u.host, projectId, ingestUrl }
}

/** ingestUrlWithKey appends the DSN public key as the ?sentry_key auth param —
 *  the query-string half of the Sentry auth surface (the header half needs custom
 *  headers the Transport does not carry, so we use the query the server accepts). */
export function ingestUrlWithKey(dsn: Dsn): string {
  return `${dsn.ingestUrl}?sentry_key=${encodeURIComponent(dsn.publicKey)}`
}

/** One stack frame in Sentry shape. Fields the server's grouping reads: function,
 *  filename/module, and in_app (line/col are carried for display, dropped from the
 *  group key). Frames are ordered oldest-first — the crashing frame is LAST. */
export interface SentryFrame {
  filename?: string
  function?: string
  lineno?: number
  colno?: number
  in_app?: boolean
}

/** One exception value (Sentry chains these; the LAST is the thrown one). */
export interface SentryExceptionValue {
  type: string
  value: string
  stacktrace?: { frames: SentryFrame[] }
}

/** The subset of the Sentry event payload Hanzo consumes. */
export interface SentryEnvelopeEvent {
  event_id: string
  timestamp: string
  platform: 'javascript'
  level: string
  release?: string
  environment?: string
  exception: { values: SentryExceptionValue[] }
  tags?: Record<string, string>
  user?: { id?: string }
  request?: { url?: string }
  extra?: Record<string, unknown>
  sdk: { name: string; version: string }
}

/** The client-side context stamped on an error event — the same session + identity
 *  the analytics stream carries, so an error correlates to its session. */
export interface SentryContext {
  sessionId?: string
  distinctId?: string
  product?: string
  release?: string
  environment?: string
  url?: string
  properties?: Record<string, unknown>
  sdk: { name: string; version: string }
}

const MAX_FRAMES = 50

const FRAME_RE = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/

/** stackFrames parses a V8/JS stack string into Sentry frames, oldest-first (the
 *  order Sentry expects and Hanzo's crash-frame picker relies on). Lines without a
 *  file:line:col (the header line, `at <anonymous>`) are skipped. */
export function stackFrames(stack?: string): SentryFrame[] {
  if (!stack) return []
  const frames: SentryFrame[] = []
  for (const line of stack.split('\n')) {
    const m = FRAME_RE.exec(line)
    if (!m) continue
    const filename = m[2]
    frames.push({
      function: m[1] || '<anonymous>',
      filename,
      lineno: Number(m[3]),
      colno: Number(m[4]),
      in_app: !filename.includes('node_modules'),
    })
    if (frames.length >= MAX_FRAMES) break
  }
  // JS stacks list the crash site first; Sentry lists it last.
  return frames.reverse()
}

function eventId(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && 'randomUUID' in c) return c.randomUUID().replace(/-/g, '')
  let s = ''
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

/** buildSentryEvent renders an Exception + context into a Sentry event payload.
 *  The exception type + message drive server-side grouping; the session id, user,
 *  and product ride as tags so an error joins the same identity as its analytics. */
export function buildSentryEvent(ex: Exception, ctx: SentryContext): SentryEnvelopeEvent {
  const frames = stackFrames(ex.stack)
  const tags: Record<string, string> = { handled: String(ex.handled ?? true) }
  if (ctx.sessionId) tags.session = ctx.sessionId
  if (ctx.product) tags.product = ctx.product

  return {
    event_id: eventId(),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    release: ctx.release,
    environment: ctx.environment,
    exception: {
      values: [
        {
          type: ex.type || 'Error',
          value: ex.message,
          ...(frames.length ? { stacktrace: { frames } } : {}),
        },
      ],
    },
    tags,
    ...(ctx.distinctId ? { user: { id: ctx.distinctId } } : {}),
    ...(ctx.url ? { request: { url: ctx.url } } : {}),
    ...(ctx.properties ? { extra: ctx.properties } : {}),
    sdk: ctx.sdk,
  }
}

/** buildEnvelope frames a Sentry event into the newline-delimited envelope wire
 *  format: an envelope header line, an item header line, then the event payload.
 *  Trailing newline included (the format tolerates it). */
export function buildEnvelope(dsnString: string, event: SentryEnvelopeEvent): string {
  const header = JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString(), dsn: dsnString })
  const itemHeader = JSON.stringify({ type: 'event' })
  const payload = JSON.stringify(event)
  return `${header}\n${itemHeader}\n${payload}\n`
}

/** SentryReporter posts one error envelope via the shared Transport. It holds the
 *  parsed DSN + the raw DSN string (for the envelope header) and stamps every event
 *  with the caller's session/identity context. */
export class SentryReporter {
  constructor(
    private readonly dsn: Dsn,
    private readonly dsnString: string,
    private readonly transport: Transport,
  ) {}

  /** The project this reporter ingests into (for tests / diagnostics). */
  get projectId(): string {
    return this.dsn.projectId
  }

  report(ex: Exception, ctx: SentryContext): void {
    const event = buildSentryEvent(ex, ctx)
    const body = buildEnvelope(this.dsnString, event)
    // keepalive fetch (never a beacon): an error may be moments before an unload,
    // and the ingest endpoint is not the analytics/tracker route.
    this.transport.send(ingestUrlWithKey(this.dsn), body, { beacon: false })
  }
}
