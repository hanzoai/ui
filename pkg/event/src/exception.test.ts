import { describe, expect, it } from 'vitest'
import { digest, exceptionEntry, exceptionProperties, fingerprint } from './exception'

/** A throwable with a realistic V8 stack, innermost call first (as V8 emits). */
function boom(msg = 'Cannot read properties of undefined'): Error {
  const e = new TypeError(msg)
  e.stack = [
    `TypeError: ${msg}`,
    '    at loadIssue (https://hanzo.ai/_next/static/chunks/app.js:42:9)',
    '    at render (https://hanzo.ai/_next/static/chunks/app.js:17:3)',
    '    at vendorLoad (https://hanzo.ai/node_modules/react-dom/index.js:12:3)',
  ].join('\n')
  return e
}

describe('frame ordering — the product reads frames bottom-up', () => {
  it('puts the entry point first and the throw site last', () => {
    const e = exceptionEntry(boom(), { handled: false, id: 'x' })
    const frames = e.stacktrace!.frames
    // V8 emits innermost-first; the product wants the reverse.
    expect(frames[0].mangled_name).toBe('vendorLoad')
    expect(frames[frames.length - 1].mangled_name).toBe('loadIssue')
  })

  it('indexes the throw site at -1, which is where the issue list reads it', () => {
    const p = exceptionProperties(boom(), { handled: false, id: 'x' })
    expect(p.$exception_functions.at(-1)).toBe('loadIssue')
    expect(p.$exception_sources.at(-1)).toBe('https://hanzo.ai/_next/static/chunks/app.js')
  })
})

describe('stacktrace.type — the renderer draws nothing on any other value', () => {
  it("is the literal 'resolved'", () => {
    const e = exceptionEntry(boom(), { handled: false, id: 'x' })
    expect(e.stacktrace!.type).toBe('resolved')
  })

  it('is omitted entirely when there is no stack, rather than sent empty', () => {
    const e = exceptionEntry('Script error.', { handled: false, id: 'x' })
    expect(e.stacktrace).toBeUndefined()
    expect(e.type).toBe('Error')
    expect(e.value).toBe('Script error.')
  })
})

describe('in_app — frames without it are hidden by default', () => {
  it('marks first-party code in_app and vendor code not', () => {
    const frames = exceptionEntry(boom(), { handled: false, id: 'x' }).stacktrace!.frames
    const byName = Object.fromEntries(frames.map((f) => [f.mangled_name, f.in_app]))
    expect(byName.loadIssue).toBe(true)
    expect(byName.render).toBe(true)
    expect(byName.vendorLoad).toBe(false)
  })

  it('keeps only in_app frames out of the fingerprint', () => {
    const p = exceptionProperties(boom(), { handled: false, id: 'x' })
    // vendorLoad is the only non-in_app frame; it must not move the group key.
    const e = exceptionEntry(boom(), { handled: false, id: 'y' })
    e.stacktrace!.frames = e.stacktrace!.frames.filter((f) => f.in_app)
    expect(fingerprint(e)).toBe(p.$exception_fingerprint)
  })
})

describe('fingerprint — the issue grouping key', () => {
  it('is present, since the issue query drops events without one', () => {
    const p = exceptionProperties(boom(), { handled: false, id: 'x' })
    expect(p.$exception_fingerprint).toMatch(/^[0-9a-f]{32}$/)
  })

  it('groups the SAME bug whose message varies — the whole point', () => {
    // The real-world case: one failed-chunk bug produced a distinct event name per
    // chunk id. These must be one issue.
    const a = new Error('Loading chunk 3324 failed.')
    const b = new Error('Loading chunk 998 failed.')
    const stack = '    at load (https://hanzo.ai/app.js:1:1)'
    a.stack = `Error: x\n${stack}`
    b.stack = `Error: y\n${stack}`
    const fa = exceptionProperties(a, { handled: false, id: '1' }).$exception_fingerprint
    const fb = exceptionProperties(b, { handled: false, id: '2' }).$exception_fingerprint
    expect(fa).toBe(fb)
  })

  it('separates genuinely different bugs', () => {
    const other = new RangeError('nope')
    other.stack = 'RangeError: nope\n    at somewhereElse (https://hanzo.ai/other.js:5:5)'
    const fa = exceptionProperties(boom(), { handled: false, id: '1' }).$exception_fingerprint
    const fb = exceptionProperties(other, { handled: false, id: '2' }).$exception_fingerprint
    expect(fa).not.toBe(fb)
  })

  it('still groups stackless errors by type instead of scattering them', () => {
    const f1 = exceptionProperties('Script error.', { handled: false, id: '1' })
    const f2 = exceptionProperties('Script error.', { handled: false, id: '2' })
    expect(f1.$exception_fingerprint).toBe(f2.$exception_fingerprint)
  })
})

describe('raw_id — frame identity', () => {
  it('carries the "<hash>/<part>" shape the product expects', () => {
    const frames = exceptionEntry(boom(), { handled: false, id: 'x' }).stacktrace!.frames
    for (const f of frames) expect(f.raw_id).toMatch(/^[0-9a-f]{32}\/0$/)
  })

  it('is stable for the same code location across captures', () => {
    const a = exceptionEntry(boom(), { handled: false, id: '1' }).stacktrace!.frames
    const b = exceptionEntry(boom('different message'), { handled: false, id: '2' })
      .stacktrace!.frames
    expect(a.map((f) => f.raw_id)).toEqual(b.map((f) => f.raw_id))
  })
})

describe('mechanism + level', () => {
  it('reports an uncaught error as unhandled', () => {
    const e = exceptionEntry(boom(), { handled: false, id: 'x' })
    expect(e.mechanism).toEqual({ type: 'generic', handled: false, synthetic: false })
  })

  it('marks a non-Error throwable synthetic', () => {
    const e = exceptionEntry('just a string', { handled: true, id: 'x' })
    expect(e.mechanism?.synthetic).toBe(true)
  })

  it('defaults level to error and honours an override', () => {
    expect(exceptionProperties(boom(), { handled: true, id: 'x' }).$exception_level).toBe('error')
    expect(
      exceptionProperties(boom(), { handled: true, id: 'x', level: 'warning' }).$exception_level,
    ).toBe('warning')
  })
})

describe('denormalized properties (nothing derives these server-side here)', () => {
  it('sends the search + issue-column arrays the product reads', () => {
    const p = exceptionProperties(boom(), { handled: false, id: 'x' })
    expect(p.$exception_types).toEqual(['TypeError'])
    expect(p.$exception_values).toEqual(['Cannot read properties of undefined'])
    expect(p.$exception_type).toBe('TypeError')
    expect(p.$exception_handled).toBe(false)
    expect(p.$exception_fingerprint_record).toEqual([{ type: 'manual' }])
    expect(p.$exception_list).toHaveLength(1)
  })
})

describe('hostile input never escapes', () => {
  it('survives a throwable whose getters throw', () => {
    const hostile = {
      get name() {
        throw new Error('nope')
      },
      get message() {
        throw new Error('nope')
      },
      get stack() {
        throw new Error('nope')
      },
    }
    expect(() => exceptionProperties(hostile, { handled: true, id: 'x' })).not.toThrow()
  })

  it('bounds an enormous message', () => {
    const e = exceptionEntry(new Error('x'.repeat(100_000)), { handled: true, id: 'x' })
    expect(e.value.length).toBeLessThanOrEqual(4096)
  })

  it('bounds frame count', () => {
    const many = new Error('deep')
    many.stack =
      'Error: deep\n' +
      Array.from({ length: 500 }, (_, i) => `    at f${i} (https://hanzo.ai/a.js:${i}:1)`).join(
        '\n',
      )
    expect(exceptionEntry(many, { handled: true, id: 'x' }).stacktrace!.frames.length).toBe(50)
  })
})

describe('digest', () => {
  it('is stable and 32 hex chars', () => {
    expect(digest('abc')).toBe(digest('abc'))
    expect(digest('abc')).toMatch(/^[0-9a-f]{32}$/)
  })

  it('separates different inputs', () => {
    expect(digest('abc')).not.toBe(digest('abd'))
  })

  it('handles an empty string', () => {
    expect(digest('')).toMatch(/^[0-9a-f]{32}$/)
  })
})
