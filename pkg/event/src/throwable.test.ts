import { describe, it, expect } from 'vitest'
import { framesFromStack, normalizeError } from './throwable'

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

  it('an object with a throwing toString is still reportable', () => {
    const evil = {
      toString() {
        throw new Error('toString bomb')
      },
    }
    expect(() => normalizeError(evil)).not.toThrow()
  })
})
