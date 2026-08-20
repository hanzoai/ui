// Pure error parsing: coerce an unknown throwable into {name, message, stack},
// and parse a browser stack string into structured frames. No I/O, no globals —
// core.ts wires these to identity and transport.
//
// These frames ride the error Event to POST /v1/event so the warehouse stores
// WHERE a crash happened, not just that one did. Nothing here talks to Sentry:
// the client has one door and one credential. The frame shape is deliberately the
// conventional one (function/filename/abs_path/lineno/colno/in_app) because it is
// what every stack tool already speaks — including a future grouper built over
// the warehouse.

/** Max frames kept — well under the server's cap, plenty to identify a crash. */
const MAX_FRAMES = 50
/** Max stack lines examined, and max length of a line worth examining. Guards the
 *  frame regexes against a hostile `stack` string (see framesFromStack). */
const MAX_LINES = 500
const MAX_LINE_LEN = 2048

/** One parsed stack frame. */
export interface Frame {
  filename?: string
  function?: string
  abs_path?: string
  lineno?: number
  colno?: number
  /** The app's own code, as opposed to vendor/runtime — the useful default filter. */
  in_app?: boolean
}

const V8_FRAME = /^\s*at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?\s*$/
const MOZ_FRAME = /^\s*(?:(.*?)@)?(.+?):(\d+):(\d+)\s*$/

/** inApp marks a frame as the app's own code (vs vendor/runtime). */
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
 * framesFromStack parses a browser Error.stack into frames, OLDEST-FIRST (caller
 * → callee, so the crash site is LAST). Handles both V8 ("at fn (file:li:co)")
 * and Firefox/Safari ("fn@file:li:co"). Unparseable lines are skipped.
 */
export function framesFromStack(stack: string | undefined): Frame[] {
  if (!stack) return []
  // Both frame regexes use lazy nested quantifiers, which backtrack badly on a
  // long line that never matches. A stack is attacker-influenced (a thrown value
  // can carry any `stack` string), so bound the work: skip absurd lines and stop
  // after MAX_LINES. Only the innermost MAX_FRAMES are kept anyway.
  const lines = stack.split('\n', MAX_LINES)
  const frames: Frame[] = []
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

/** read pulls a property off a value that may be hostile — `name`, `message` and
 *  `stack` are ordinary getters that a thrown object is free to define as
 *  throwing. The thrown value is the least trustworthy input this library
 *  handles; losing the whole report to one of them is not acceptable. */
function read(o: unknown, k: string): unknown {
  try {
    return (o as Record<string, unknown>)[k]
  } catch {
    return undefined
  }
}

/** str coerces to a string without letting a throwing toString/Symbol.toPrimitive
 *  escape. */
function str(v: unknown): string {
  try {
    return String(v)
  } catch {
    return '[unstringifiable]'
  }
}

/** normalizeError coerces an unknown throwable into {name, message, stack}.
 *  TOTAL: it returns a usable record for ANY input, including an object
 *  engineered to throw on property access. */
export function normalizeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    const name = read(err, 'name')
    const message = read(err, 'message')
    const stack = read(err, 'stack')
    return {
      name: typeof name === 'string' && name ? name : 'Error',
      message: typeof message === 'string' && message ? message : str(err),
      stack: typeof stack === 'string' ? stack : undefined,
    }
  }
  if (typeof err === 'string') return { name: 'Error', message: err }
  try {
    return { name: 'Error', message: JSON.stringify(err) ?? str(err) }
  } catch {
    return { name: 'Error', message: str(err) }
  }
}
