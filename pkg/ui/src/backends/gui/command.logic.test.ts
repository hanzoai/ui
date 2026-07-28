import { describe, expect, it } from 'vitest'

import { score, step } from './command.logic'

const ranked = (search: string, values: string[]) =>
  values
    .map((v) => [v, score(v, search)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([v]) => v)

describe('score', () => {
  it('keeps everything when there is no search', () => {
    expect(score('anything', '')).toBe(1)
    expect(score('anything', '   ')).toBe(1)
  })

  it('ranks exact above prefix above substring above subsequence', () => {
    expect(ranked('cat', ['cat', 'category', 'the cat sat', 'contract'])).toEqual([
      'cat',
      'category',
      'the cat sat',
      'contract',
    ])
  })

  it('prefers an earlier substring hit', () => {
    expect(score('x bb', 'bb')).toBeGreaterThan(score('xxxx bb', 'bb'))
  })

  it('drops a non-match', () => {
    expect(score('apple', 'zq')).toBe(0)
    expect(score('abc', 'cba')).toBe(0)
  })

  it('matches on keywords as well as the value', () => {
    expect(score('apricot', 'stone', ['stone', 'fruit'])).toBeGreaterThan(0)
    expect(score('apricot', 'stone')).toBe(0)
  })

  it('is case-insensitive on both sides', () => {
    expect(score('Apple', 'APP')).toBe(score('apple', 'app'))
  })
})

describe('step', () => {
  it('takes the first item when nothing is selected', () => {
    expect(step(3, -1, 1)).toBe(0)
    expect(step(3, -1, -1)).toBe(0)
    expect(step(3, -1, -1, true)).toBe(2)
  })

  it('walks and clamps at the ends', () => {
    expect(step(3, 0, 1)).toBe(1)
    expect(step(3, 2, 1)).toBe(2)
    expect(step(3, 0, -1)).toBe(0)
  })

  it('wraps at the ends when looping', () => {
    expect(step(3, 2, 1, true)).toBe(0)
    expect(step(3, 0, -1, true)).toBe(2)
  })

  it('has nowhere to go in an empty list', () => {
    expect(step(0, -1, 1)).toBe(-1)
    expect(step(0, 0, -1, true)).toBe(-1)
  })
})
