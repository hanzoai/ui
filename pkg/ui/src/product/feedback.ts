// Help & feedback client — `POST /v1/help/feedback`.
//
// Pure, dependency-free helper (no React, no gui, no DOM at load time) usable
// from browsers, server routes, and Node tests. Supports signed-in and
// anonymous submissions, exception reporting, and a deduped/rate-limited global
// window exception listener.

export type FeedbackKind = 'bug' | 'billing' | 'feature' | 'exception' | 'feedback'

export interface FeedbackPayload {
  kind: FeedbackKind
  subject?: string
  message?: string
  email?: string
  user?: string
  app?: string
  page?: string
  version?: string
  error?: string
  stack?: string
  context?: Record<string, string>
}

export interface FeedbackResult {
  id: string
  status: string
  kind: string
}

export interface FeedbackRequestOptions {
  /** Base API URL (defaults to `https://api.hanzo.ai`). */
  apiBase?: string
  /** Optional IAM Bearer token; omitted for anonymous submissions. */
  token?: string | null
  headers?: Record<string, string>
  signal?: AbortSignal
  fetch?: typeof fetch
}

export const DEFAULT_FEEDBACK_API = 'https://api.hanzo.ai'

const FEEDBACK_PATH = '/v1/help/feedback'
const BENIGN_NOISE_RE = /resizeobserver loop|signal is aborted|the user aborted a request/i
const SELF_ENDPOINT_RE = /\/v1\/help\/feedback(?:\/|\?|$|\b)/i

function trimBase(apiBase?: string): string {
  const raw = (apiBase ?? DEFAULT_FEEDBACK_API).trim()
  return (raw || DEFAULT_FEEDBACK_API).replace(/\/+$/, '')
}

function currentHref(): string | undefined {
  try {
    if (typeof window !== 'undefined' && typeof window.location?.href === 'string') {
      return window.location.href
    }
  } catch {
    // ignore restricted location access
  }
  return undefined
}

function extractErrorDetails(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return {
      name: err.name || 'Error',
      message: err.message || String(err),
      stack: err.stack ? String(err.stack).slice(0, 4000) : undefined,
    }
  }
  if (err && typeof err === 'object') {
    const rec = err as { name?: unknown; message?: unknown; stack?: unknown }
    const name = typeof rec.name === 'string' && rec.name ? rec.name : 'Error'
    const message = typeof rec.message === 'string' && rec.message ? rec.message : String(err)
    const stack = typeof rec.stack === 'string' && rec.stack ? rec.stack.slice(0, 4000) : undefined
    return { name, message, stack }
  }
  return { name: 'Error', message: String(err ?? 'Unknown error') }
}

/**
 * Submit a bug report, billing inquiry, feature request, feedback, or exception
 * to `POST /v1/help/feedback`. Works for both signed-in and anonymous users.
 */
export async function reportFeedback(
  payload: FeedbackPayload,
  options: FeedbackRequestOptions = {},
): Promise<FeedbackResult> {
  const url = `${trimBase(options.apiBase)}${FEEDBACK_PATH}`
  const doFetch = options.fetch ?? fetch
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const page = payload.page ?? currentHref()
  const body: FeedbackPayload = {
    ...payload,
    ...(page ? { page } : {}),
  }

  const res = await doFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
    keepalive: payload.kind === 'exception' ? true : undefined,
  })

  const raw = await res.text().catch(() => '')
  let parsed: Record<string, unknown> | null = null
  try {
    const data = raw ? JSON.parse(raw) : null
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      parsed = data as Record<string, unknown>
    }
  } catch {
    parsed = null
  }

  if (!res.ok) {
    const nested = parsed?.error && typeof parsed.error === 'object' ? (parsed.error as Record<string, unknown>) : null
    const msg =
      (typeof nested?.message === 'string' && nested.message) ||
      (typeof parsed?.error === 'string' && parsed.error) ||
      (typeof parsed?.message === 'string' && parsed.message) ||
      (typeof parsed?.detail === 'string' && parsed.detail) ||
      `Feedback request failed (${res.status}).`
    throw new Error(msg)
  }

  return {
    id: typeof parsed?.id === 'string' ? parsed.id : '',
    status: typeof parsed?.status === 'string' ? parsed.status : 'received',
    kind: typeof parsed?.kind === 'string' ? parsed.kind : payload.kind,
  }
}

export interface ReportExceptionOptions extends FeedbackRequestOptions {
  app?: string
  user?: string
  email?: string
  version?: string
  page?: string
  subject?: string
  message?: string
  context?: Record<string, string>
}

/**
 * Report a caught or uncaught runtime exception to `POST /v1/help/feedback`
 * with `kind: "exception"`. Never throws — returns `null` if suppressed or if
 * the network request fails.
 */
export async function reportException(
  error: unknown,
  options: ReportExceptionOptions = {},
): Promise<FeedbackResult | null> {
  const { name, message, stack } = extractErrorDetails(error)
  const combined = `${name}: ${message}`
  if (SELF_ENDPOINT_RE.test(combined) || (stack && SELF_ENDPOINT_RE.test(stack))) {
    return null
  }
  try {
    return await reportFeedback(
      {
        kind: 'exception',
        subject: options.subject ?? combined.slice(0, 140),
        message: options.message ?? message.slice(0, 1000),
        error: combined.slice(0, 500),
        ...(stack ? { stack } : {}),
        ...(options.app ? { app: options.app } : {}),
        ...(options.user ? { user: options.user } : {}),
        ...(options.email ? { email: options.email } : {}),
        ...(options.version ? { version: options.version } : {}),
        ...(options.page ? { page: options.page } : {}),
        ...(options.context ? { context: options.context } : {}),
      },
      options,
    )
  } catch {
    return null
  }
}

export interface GlobalExceptionTarget {
  addEventListener: (type: string, listener: (e: Event) => void) => void
  removeEventListener: (type: string, listener: (e: Event) => void) => void
}

export interface GlobalExceptionReporterOptions {
  apiBase?: string
  app: string
  version?: string
  /** Return user id/name string or `{ user, email }` for attribution. */
  getUser?: () => string | { user?: string; email?: string } | null | undefined
  /** Return current Bearer token if signed in. */
  getToken?: () => string | null | undefined
  /** Minimum ms before the same error signature is reported again. Default 60000 (1 min). */
  dedupeWindowMs?: number
  /** Maximum exception reports sent per session. Default 10. */
  maxReports?: number
  /** Clock override for tests. */
  now?: () => number
  /** Fetch override for tests. */
  fetch?: typeof fetch
  /** Event target override for tests (defaults to `window`). */
  target?: GlobalExceptionTarget
}

/**
 * Hooks `window` `error` and `unhandledrejection` events and posts uncaught
 * exceptions to `POST /v1/help/feedback` (`kind: "exception"`) with
 * signature deduplication and a per-session cap so repeated crashes never spam.
 * Returns an uninstall function.
 */
export function installGlobalExceptionReporter(options: GlobalExceptionReporterOptions): () => void {
  const target: GlobalExceptionTarget | null =
    options.target ?? (typeof window !== 'undefined' ? (window as unknown as GlobalExceptionTarget) : null)
  if (!target) return () => {}

  const dedupeWindowMs = options.dedupeWindowMs ?? 60_000
  const maxReports = options.maxReports ?? 10
  const getNow = options.now ?? (() => Date.now())
  const seen = new Map<string, number>()
  let sent = 0

  const resolveIdentity = (): { user?: string; email?: string } => {
    try {
      const u = options.getUser?.()
      if (!u) return {}
      if (typeof u === 'string') return { user: u }
      return {
        ...(u.user ? { user: u.user } : {}),
        ...(u.email ? { email: u.email } : {}),
      }
    } catch {
      return {}
    }
  }

  const resolveToken = (): string | null => {
    try {
      return options.getToken?.() ?? null
    } catch {
      return null
    }
  }

  const handle = (err: unknown, source: string, extra?: Record<string, string>) => {
    if (sent >= maxReports) return
    const details = extractErrorDetails(err)
    const msg = details.message.trim()
    if (!msg || details.name === 'AbortError' || BENIGN_NOISE_RE.test(msg) || BENIGN_NOISE_RE.test(details.name)) return
    if (SELF_ENDPOINT_RE.test(msg) || (details.stack && SELF_ENDPOINT_RE.test(details.stack))) return

    const sig = `${details.name}:${msg.slice(0, 120)}`
    const now = getNow()
    const prev = seen.get(sig)
    if (prev !== undefined && now - prev < dedupeWindowMs) return
    seen.set(sig, now)
    sent += 1

    const identity = resolveIdentity()
    void reportException(err, {
      apiBase: options.apiBase,
      token: resolveToken(),
      app: options.app,
      version: options.version,
      fetch: options.fetch,
      ...identity,
      context: { source, ...(extra ?? {}) },
    })
  }

  const onError = (event: Event) => {
    const e = event as ErrorEvent
    const err = e.error ?? (e.message ? new Error(e.message) : null)
    if (!err) return
    const extra: Record<string, string> = {}
    if (e.filename) extra.filename = e.filename
    if (typeof e.lineno === 'number' && e.lineno > 0) extra.lineno = String(e.lineno)
    if (typeof e.colno === 'number' && e.colno > 0) extra.colno = String(e.colno)
    handle(err, 'window.onerror', extra)
  }

  const onRejection = (event: Event) => {
    const e = event as PromiseRejectionEvent
    if (e.reason === undefined || e.reason === null) return
    handle(e.reason, 'unhandledrejection')
  }

  target.addEventListener('error', onError)
  target.addEventListener('unhandledrejection', onRejection)
  return () => {
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onRejection)
  }
}
