/**
 * The console's lines and its one dimension.
 */
import { describe, expect, it } from 'vitest'

import { cap, ceiling, clamp, count, HEAD, level, MIN_OPEN, opened, resolve, SHUT, split } from './log'

describe('lines', () => {
  it('splits a block into its lines and drops the trailing blanks', () => {
    expect(split('a\r\nb\n\n  \n')).toEqual(['a', 'b'])
    expect(split('')).toEqual([])
  })

  it('keeps the newest lines when there are too many', () => {
    expect(cap([1, 2, 3, 4], 2)).toEqual([3, 4])
    expect(cap([1], 2)).toEqual([1])
  })

  it('reads a level off the wire, and calls anything else a log', () => {
    expect(level('error')).toBe('error')
    expect(level('fatal')).toBe('log')
    expect(level(3)).toBe('log')
  })

  it('counts each level', () => {
    expect(count([{ id: 1, level: 'error', text: 'x' }, { id: 2, level: 'error', text: 'y' }, { id: 3, level: 'log', text: 'z' }]).error).toBe(2)
  })
})

describe('the dock height', () => {
  it('is open exactly when taller than its header', () => {
    expect(opened(HEAD)).toBe(false)
    expect(opened(HEAD + 1)).toBe(true)
  })

  it('closes when shoved below the floor, and never opens into a sliver', () => {
    expect(resolve(SHUT, 1000)).toBe(HEAD)
    expect(resolve(SHUT + 1, 1000)).toBe(MIN_OPEN)
  })

  it('never eats more than 70% of the window', () => {
    expect(ceiling(1000)).toBe(700)
    expect(clamp(5000, 1000)).toBe(700)
    expect(clamp(Number.NaN, 1000)).toBe(MIN_OPEN)
    expect(ceiling(100)).toBe(MIN_OPEN)
  })
})
