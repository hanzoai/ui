import { describe, expect, it } from 'vitest'

import { isEmoji, monogram } from './OrgMark'

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

describe('isEmoji', () => {
  it('accepts an emoji mark, including multi-code-point ones', () => {
    expect(isEmoji('🚀')).toBe(true)
    expect(isEmoji(' 🎧 ')).toBe(true)
    // One glyph, several code points — counted as one grapheme cluster, which is
    // the whole reason this is not a `.length <= 3` test.
    expect(isEmoji('🇯🇵')).toBe(true)
    expect(isEmoji('👨‍👩‍👧')).toBe(true)
  })

  it('rejects a URL, which is the other kind of logo', () => {
    expect(isEmoji('https://acme.test/logo.png')).toBe(false)
    expect(isEmoji('http://acme.test/logo.svg')).toBe(false)
    expect(isEmoji('/logo.png')).toBe(false)
    expect(isEmoji('data:image/png;base64,iVBOR')).toBe(false)
  })

  it('rejects text, so a display name never renders as a mark', () => {
    expect(isEmoji('')).toBe(false)
    expect(isEmoji('   ')).toBe(false)
    expect(isEmoji('AC')).toBe(false)
    expect(isEmoji('acme')).toBe(false)
  })

  it('rejects a string of emoji — a mark is one glyph, not a sentence', () => {
    expect(isEmoji('🚀🚀🚀🚀🚀')).toBe(false)
  })
})
