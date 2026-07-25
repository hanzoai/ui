import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import {
  parseDsn,
  framesFromStack,
  buildSentryEvent,
  buildEnvelope,
  eventId,
  normalizeError,
} from './sentry'
import type { SentryEvent, SentryFrame } from './types'
import { VERSION } from './version'

const DSN = 'https://1:deadbeefcafe@api.hanzo.ai/v1/sentry/00000000-0000-0000-0000-000000000000'

describe('parseDsn', () => {
  it('keeps the version:hmac key intact (does NOT split on the colon) and derives the ingest url', () => {
    const dsn = parseDsn(DSN)!
    expect(dsn.publicKey).toBe('1:deadbeefcafe')
    expect(dsn.origin).toBe('https://api.hanzo.ai')
    expect(dsn.projectId).toBe('00000000-0000-0000-0000-000000000000')
    expect(dsn.ingestUrl).toBe(
      'https://api.hanzo.ai/v1/sentry/00000000-0000-0000-0000-000000000000/envelope/?sentry_key=1%3Adeadbeefcafe',
    )
  })
  it('returns null for malformed input (fail-safe)', () => {
    expect(parseDsn(undefined)).toBeNull()
    expect(parseDsn('')).toBeNull()
    expect(parseDsn('not-a-dsn')).toBeNull()
    expect(parseDsn('https://api.hanzo.ai/v1/sentry/x')).toBeNull() // no key
    expect(parseDsn('https://1:k@api.hanzo.ai')).toBeNull() // no project
  })
})

describe('framesFromStack', () => {
  it('parses a V8 stack oldest-first with in_app marking', () => {
    const stack = [
      'TypeError: x is not a function',
      '    at inner (https://app.hanzo.ai/app.js:10:5)',
      '    at outer (https://app.hanzo.ai/app.js:20:1)',
      '    at eval (webpack-internal:///./node_modules/lib/index.js:3:2)',
    ].join('\n')
    const frames = framesFromStack(stack)
    expect(frames).toHaveLength(3)
    // oldest-first: the node_modules frame is the outermost caller (first),
    // the crash site (inner) is last.
    expect(frames[frames.length - 1].function).toBe('inner')
    expect(frames[frames.length - 1].lineno).toBe(10)
    expect(frames[frames.length - 1].in_app).toBe(true)
    expect(frames[0].function).toBe('eval')
    expect(frames[0].in_app).toBe(false) // node_modules
  })
  it('parses a Firefox/Safari stack (fn@file:li:co and bare @file)', () => {
    const stack = ['boom@https://app.hanzo.ai/a.js:1:2', '@https://app.hanzo.ai/b.js:3:4'].join('\n')
    const frames = framesFromStack(stack)
    expect(frames).toHaveLength(2)
    expect(frames[frames.length - 1].function).toBe('boom')
    expect(frames[frames.length - 1].filename).toBe('https://app.hanzo.ai/a.js')
  })
  it('skips the header line and tolerates junk', () => {
    expect(framesFromStack('Error: nope\n   total garbage line')).toHaveLength(0)
    expect(framesFromStack(undefined)).toHaveLength(0)
  })
})

describe('normalizeError', () => {
  it('coerces Error, string, and objects', () => {
    expect(normalizeError(new RangeError('r')).name).toBe('RangeError')
    expect(normalizeError('boom')).toEqual({ name: 'Error', message: 'boom' })
    expect(normalizeError({ a: 1 }).message).toBe('{"a":1}')
  })
})

describe('eventId', () => {
  it('is 32 lowercase hex chars (the Sentry event_id shape)', () => {
    expect(eventId()).toMatch(/^[0-9a-f]{32}$/)
    expect(eventId()).not.toBe(eventId())
  })
})

describe('buildSentryEvent', () => {
  it('sets subject-only user, default error level, scrubbed message, product tags', () => {
    const ev = buildSentryEvent({
      error: new Error('boom for bob@corp.com'),
      identity: { userId: 'sub-9', sessionId: 'sess-1', product: 'app', release: 'v1', environment: 'production' },
    })
    expect(ev.platform).toBe('javascript')
    expect(ev.level).toBe('error')
    expect(ev.user).toEqual({ id: 'sub-9' })
    expect(ev.exception!.values[0].value).toBe('boom for [email]')
    expect(ev.tags!.product).toBe('app')
    expect(ev.tags!.session).toBe('sess-1')
    expect(ev.tags!.handled).toBe('true')
    expect(ev.release).toBe('v1')
    expect(ev.environment).toBe('production')
    expect(ev.sdk).toEqual({ name: '@hanzo/event', version: VERSION })
  })
  it('uncaught errors default to fatal level and handled=false', () => {
    const ev = buildSentryEvent({ error: new Error('x'), options: { handled: false }, identity: {} })
    expect(ev.level).toBe('fatal')
    expect(ev.tags!.handled).toBe('false')
  })
  it('omits user entirely when there is no subject', () => {
    const ev = buildSentryEvent({ error: new Error('x'), identity: {} })
    expect(ev.user).toBeUndefined()
  })
})

// ── round-trip proof: a byte-faithful TS port of the SERVER parser recovers the
//    exact event from our envelope. Port of o11y
//    pkg/modules/errortracking/implerrortracking/envelope.go parseEnvelope. ───────

function parseEnvelopeOracle(body: Uint8Array): SentryEvent[] {
  let pos = 0
  const dec = new TextDecoder()
  const readLine = (): Uint8Array | null => {
    if (pos >= body.length) return null
    const nl = body.indexOf(0x0a, pos)
    if (nl >= 0) {
      const line = body.subarray(pos, nl)
      pos = nl + 1
      return line
    }
    const line = body.subarray(pos)
    pos = body.length
    return line
  }
  if (readLine() === null) throw new Error('empty envelope') // required header
  const events: SentryEvent[] = []
  while (pos < body.length) {
    if (events.length >= 1000) break
    const hdrLine = readLine()
    if (hdrLine === null) break
    const hdrStr = dec.decode(hdrLine).trim()
    if (hdrStr.length === 0) continue
    let ih: { type?: string; length?: number | null }
    try {
      ih = JSON.parse(hdrStr)
    } catch {
      break
    }
    let payload: Uint8Array | null
    if (ih.length != null && ih.length >= 0 && ih.length <= body.length - pos) {
      const end = pos + ih.length
      payload = body.subarray(pos, end)
      pos = end
      if (pos < body.length && body[pos] === 0x0a) pos++
    } else {
      payload = readLine()
      if (payload === null) break
    }
    if (ih.type === 'event') {
      try {
        events.push(JSON.parse(dec.decode(payload)) as SentryEvent)
      } catch {
        /* skip */
      }
    }
  }
  return events
}

describe('buildEnvelope round-trip (server parser recovers our event)', () => {
  it('recovers exactly one event with matching id + exception', () => {
    const dsn = parseDsn(DSN)!
    const event = buildSentryEvent({
      error: new TypeError('cannot read properties of undefined'),
      identity: { userId: 'sub-1', sessionId: 'sess-1', product: 'app' },
    })
    const envelope = buildEnvelope(event, dsn)
    const recovered = parseEnvelopeOracle(new TextEncoder().encode(envelope))
    expect(recovered).toHaveLength(1)
    expect(recovered[0].event_id).toBe(event.event_id)
    expect(recovered[0].exception!.values[0].type).toBe('TypeError')
    expect(recovered[0].platform).toBe('javascript')
  })

  it('byte-length framing is correct with multi-byte characters', () => {
    const dsn = parseDsn(DSN)!
    const event = buildSentryEvent({
      error: new Error('naïve café €500 — 日本語 fails'),
      identity: { userId: 'sub-1' },
    })
    const envelope = buildEnvelope(event, dsn)
    const recovered = parseEnvelopeOracle(new TextEncoder().encode(envelope))
    expect(recovered).toHaveLength(1)
    expect(recovered[0].exception!.values[0].value).toContain('日本語')
  })
})

// ── grouping proof: a compact port of the server fingerprint (fingerprint.go).
//    Two errors with the same crash frame group together; a different type does not.

function normalizeFunction(fn: string): string {
  return fn.replace(/0x[0-9a-fA-F]+/g, '').trim()
}
function normalizeFilename(name: string): string {
  name = name.trim().replace(/\\/g, '/')
  const i = name.search(/[?#]/)
  if (i >= 0) name = name.slice(0, i)
  let segs = name.replace(/^\/+|\/+$/g, '').split('/')
  if (segs.length > 2) segs = segs.slice(segs.length - 2)
  return segs.map((s) => s.replace(/\b[0-9a-fA-F]{8,}\b/g, '*').replace(/\b\d[\d.,_]*\b/g, '*')).join('/')
}
function normalizeFrame(f: SentryFrame): string {
  const fn = normalizeFunction(f.function ?? '')
  const loc = f.module || normalizeFilename(f.filename ?? '') || normalizeFilename(f.abs_path ?? '')
  if (fn && loc) return `${fn}@${loc}`
  return fn || loc
}
function pickCrashFrame(frames: SentryFrame[]): SentryFrame | null {
  if (frames.length === 0) return null
  for (let i = frames.length - 1; i >= 0; i--) if (frames[i].in_app) return frames[i]
  return frames[frames.length - 1]
}
function fingerprintOf(ev: SentryEvent): string {
  const val = ev.exception!.values[0]
  const parts: string[] = []
  if (val.type) parts.push('type:' + val.type)
  const frame = pickCrashFrame(val.stacktrace?.frames ?? [])
  if (frame) {
    const sig = normalizeFrame(frame)
    if (sig) parts.push('frame:' + sig)
  }
  const h = createHash('sha256')
  parts.forEach((p, i) => {
    if (i > 0) h.update(Buffer.from([0]))
    h.update(Buffer.from(p, 'utf8'))
  })
  return h.digest('hex')
}

describe('fingerprint grouping (port of server model)', () => {
  const stack = [
    'TypeError: user missing',
    '    at loadUser (https://app.hanzo.ai/app.9f3a2b1c.js:42:11)',
    '    at render (https://app.hanzo.ai/app.9f3a2b1c.js:88:3)',
  ].join('\n')

  it('groups two errors with the same crash frame despite different ids in the message', () => {
    const e1 = new Error('user 111 missing')
    e1.stack = stack.replace('user missing', 'user 111 missing')
    const e2 = new Error('user 222 missing')
    e2.stack = stack.replace('user missing', 'user 222 missing')
    const f1 = fingerprintOf(buildSentryEvent({ error: e1, identity: {} }))
    const f2 = fingerprintOf(buildSentryEvent({ error: e2, identity: {} }))
    expect(f1).toMatch(/^[0-9a-f]{64}$/)
    expect(f1).toBe(f2)
  })

  it('does NOT group different exception types', () => {
    const e1 = new TypeError('boom')
    e1.stack = stack
    const e2 = new RangeError('boom')
    e2.stack = stack.replace('TypeError', 'RangeError')
    const f1 = fingerprintOf(buildSentryEvent({ error: e1, identity: {} }))
    const f2 = fingerprintOf(buildSentryEvent({ error: e2, identity: {} }))
    expect(f1).not.toBe(f2)
  })
})

// ── hostile thrown objects ─────────────────────────────────────────────────
//
// `name`, `message` and `stack` are ordinary getters. A thrown object is free to
// define any of them to throw, and the thrown value is the least trustworthy
// input this library handles. normalizeError must be TOTAL — buildSentryEvent
// throwing here meant the crash report was lost on both planes.

describe('normalizeError survives hostile input', () => {
  const bomb = (prop: string) => {
    const e = new Error('real message')
    Object.defineProperty(e, prop, {
      get() {
        throw new Error(prop + ' bomb')
      },
      configurable: true,
    })
    return e
  }

  for (const prop of ['stack', 'message', 'name']) {
    it(`a throwing ${prop} getter does not throw`, () => {
      expect(() => normalizeError(bomb(prop))).not.toThrow()
      const n = normalizeError(bomb(prop))
      expect(typeof n.name).toBe('string')
      expect(typeof n.message).toBe('string')
    })
  }

  it('buildSentryEvent still produces a usable event from a getter bomb', () => {
    const ev = buildSentryEvent({ error: bomb('stack'), identity: { product: 'test' } })
    expect(ev.exception?.values[0].type).toBe('Error')
    // The message survived because only `stack` was hostile.
    expect(ev.exception?.values[0].value).toBe('real message')
    expect(ev.exception?.values[0].stacktrace?.frames).toEqual([])
  })

  it('an object with a throwing toString is still reportable', () => {
    const evil = {
      toString() {
        throw new Error('toString bomb')
      },
    }
    expect(() => normalizeError(evil)).not.toThrow()
    expect(() => buildSentryEvent({ error: evil, identity: {} })).not.toThrow()
  })

  it('a frozen/null-prototype throwable is still reportable', () => {
    const weird = Object.freeze(Object.create(null)) as unknown
    expect(() => buildSentryEvent({ error: weird, identity: {} })).not.toThrow()
  })
})
