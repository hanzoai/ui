// The `$exception` product-event shape — pure builders, no I/O.
//
// An exception reaches TWO destinations, and they read different shapes:
//
//   1. The ERROR PLANE — a Sentry envelope to the DSN host (sentry.ts). Untouched
//      by this module.
//   2. ERROR TRACKING in Hanzo Insights — reads the PRODUCT-EVENT plane
//      (`insights.events WHERE event = '$exception'`) and expects the PostHog
//      exception vocabulary: `$exception_list` plus the denormalized `$exception_*`
//      properties. This module builds that.
//
// WHY THE FULLY-DERIVED SHAPE. Upstream, a server stage (Cymbal) symbolicates
// frames and computes `$exception_fingerprint`, `$exception_types`, `_values`,
// `_sources`, `_functions`, then REPLACES the property bag. That stage is not in
// Hanzo's path: the ingest endpoint writes `event.fact` and a materialized view projects it
// into `insights.events`, so nothing between the client and the warehouse derives
// anything. Whatever the product reads, the client has to have sent. Two
// consequences are load-bearing rather than cosmetic:
//
//   • The issue query drops any event whose `$exception_fingerprint` is null, so an
//     event without one is invisible no matter how well-formed the rest is.
//   • `stacktrace.type` must be the literal 'resolved'; on any other value the
//     renderer falls through both match arms and draws nothing under the header.
//
// If that server stage is ever put in front of this plane it replaces these
// properties wholesale, so sending them stays correct either way.
//
// FRAME ORDER is bottom-up: frames[0] is the entry point and the LAST frame is the
// throw site. framesFromStack (sentry.ts) already returns that order, which is why
// this module reuses it rather than re-parsing.

import { framesFromStack, normalizeError } from './sentry'
import type {
  ExceptionEntry,
  ExceptionFrame,
  ExceptionProperties,
  SentryFrame,
  SentryLevel,
} from './types'

/** Cap on the frames carried per exception, matching the Sentry path's budget. */
const MAX_FRAMES = 50
/** Cap on `value`, so one enormous message cannot dominate a batch. The product
 *  truncates for display anyway; this bounds the wire. */
const MAX_VALUE = 4096

/**
 * digest is a stable 32-hex-char (128-bit) content hash, computed synchronously.
 *
 * Grouping keys are needed on the capture path, which is synchronous and may be
 * running inside an unload handler — SubtleCrypto is async and unavailable on
 * insecure origins, so it cannot be used here. This is FNV-1a run over four seeds
 * and concatenated. It is a GROUPING key, never a security boundary: it is not
 * collision-resistant against a chosen-input adversary, and nothing authorizes or
 * authenticates on it. The product treats the value as opaque.
 */
export function digest(s: string): string {
  let out = ''
  for (const seed of [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b]) {
    let h = seed >>> 0
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      // FNV prime 16777619, via shifts to stay in 32-bit integer math.
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0
    }
    out += h.toString(16).padStart(8, '0')
  }
  return out
}

/**
 * frameOf converts one parsed stack frame into the shape the product renders.
 *
 * The product's frame vocabulary is the POST-symbolication one (`mangled_name`,
 * `source`, `line`, `column`), so that is what is emitted. `resolved` is false and
 * honest: a browser bundle is minified and no symbol set has been uploaded, so the
 * original name and line are genuinely unknown. Claiming `resolved: true` would
 * trade an accurate "upload your symbol sets" hint for a misleading "source code is
 * not available" error.
 */
function frameOf(f: SentryFrame): ExceptionFrame {
  const source = f.filename ?? ''
  const name = f.function ?? '<anonymous>'
  const line = f.lineno ?? 0
  const column = f.colno ?? 0
  return {
    // Stable per code location, so the same frame groups and re-renders under one
    // key. The '/part' suffix is the product's format for one raw frame expanding
    // into several resolved ones; a browser frame is always part 0.
    raw_id: `${digest(`${source}|${name}|${line}|${column}`)}/0`,
    mangled_name: name,
    source,
    line,
    column,
    in_app: f.in_app ?? false,
    lang: 'javascript',
    resolved: false,
    resolve_failure: 'no symbol set uploaded for this release',
    resolved_name: null,
    module: null,
  }
}

/** truncate bounds a free-text field without splitting a surrogate pair. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  let end = max
  const c = s.charCodeAt(end - 1)
  // A high surrogate at the cut point would leave a lone half.
  if (c >= 0xd800 && c <= 0xdbff) end--
  return s.slice(0, end)
}

/**
 * exceptionEntry builds the single `$exception_list` entry for a throwable.
 *
 * One entry, not a chain: `Error.cause` chaining is a distinct fact with its own
 * ordering rules, and emitting it wrongly is worse than not emitting it.
 */
export function exceptionEntry(
  err: unknown,
  opts: { handled: boolean; id: string },
): ExceptionEntry {
  const n = normalizeError(err)
  const frames = framesFromStack(n.stack).slice(-MAX_FRAMES)
  const entry: ExceptionEntry = {
    id: opts.id,
    type: n.name,
    value: truncate(n.message, MAX_VALUE),
    mechanism: {
      type: 'generic',
      handled: opts.handled,
      // An exception the app reported by hand was constructed, not thrown by the
      // runtime at a real call site.
      synthetic: !(err instanceof Error),
    },
  }
  if (frames.length > 0) {
    // 'resolved' names the SHAPE of the frame list, not the symbolication state of
    // any frame — the renderer only walks frames on this exact value.
    entry.stacktrace = { type: 'resolved', frames: frames.map(frameOf) }
  }
  return entry
}

/**
 * fingerprint is the issue grouping key.
 *
 * Keyed on exception type plus each in-app frame's function and source — the same
 * pieces the server-side grouper records ("Exception Type", "Resolved function
 * name", "Source file name"). Deliberately NOT the message: `Loading chunk 3324
 * failed` and `Loading chunk 998 failed` are one bug, and grouping on message is
 * precisely the mistake that made every distinct error string its own event name.
 *
 * Falls back to the type alone when no in-app frame survived, which keeps
 * stackless errors (`Script error.`, cross-origin) in one issue instead of
 * scattering them.
 */
export function fingerprint(entry: ExceptionEntry): string {
  const frames = entry.stacktrace?.frames ?? []
  const pieces = frames
    .filter((f) => f.in_app)
    .map((f) => `${f.mangled_name}@${f.source}`)
  return digest([entry.type, ...pieces].join('\n'))
}

/**
 * exceptionProperties builds the full `$exception_*` property bag for one captured
 * throwable — everything Error Tracking reads off the event.
 *
 * The denormalized arrays are ordered like `frames`: last element is the throw
 * site, which is the element the issue list indexes at -1 for its source/function
 * columns.
 */
export function exceptionProperties(
  err: unknown,
  opts: { handled: boolean; id: string; level?: SentryLevel },
): ExceptionProperties {
  const entry = exceptionEntry(err, opts)
  const frames = entry.stacktrace?.frames ?? []
  const fp = fingerprint(entry)
  return {
    $exception_list: [entry],
    $exception_fingerprint: fp,
    // Records WHY this fingerprint holds. 'manual' is the honest value: the client
    // supplied the key rather than a server grouper deriving one.
    $exception_fingerprint_record: [{ type: 'manual' }],
    $exception_type: entry.type,
    $exception_message: entry.value,
    $exception_level: opts.level ?? 'error',
    $exception_handled: opts.handled,
    $exception_synthetic: entry.mechanism?.synthetic ?? false,
    $exception_types: [entry.type],
    $exception_values: [entry.value],
    $exception_sources: frames.map((f) => f.source).filter((s): s is string => !!s),
    $exception_functions: frames
      .map((f) => f.resolved_name ?? f.mangled_name)
      .filter((s): s is string => !!s),
  }
}
