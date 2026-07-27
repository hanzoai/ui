import { describe, expect, it } from 'vitest'

import { monogram } from './OrgMark'

describe('monogram', () => {
  it('takes the first letter of the first two words', () => {
    expect(monogram('Acme Robotics')).toBe('AR')
    expect(monogram('North Star Labs Incorporated')).toBe('NS')
  })

  it('breaks on the separators an org id carries, not whitespace alone', () => {
    // The old switcher split on \s+ only, so every one of these collapsed to the
    // first two LETTERS of one word — `acme-labs` read "AC", not "AL".
    expect(monogram('acme-labs')).toBe('AL')
    expect(monogram('acme_labs')).toBe('AL')
    expect(monogram('acme.labs')).toBe('AL')
    expect(monogram('acme/labs')).toBe('AL')
  })

  it('gives a single word its one initial — the account widget’s own rule', () => {
    expect(monogram('hanzo')).toBe('H')
    expect(monogram('maxpower')).toBe('M')
  })

  it('is stable on degenerate names', () => {
    expect(monogram('')).toBe('')
    expect(monogram('   ')).toBe('')
    expect(monogram('x')).toBe('X')
    expect(monogram('  spaced  out  ')).toBe('SO')
    expect(monogram('---')).toBe('--')
  })
})
