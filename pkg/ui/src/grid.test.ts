import { describe, expect, it } from 'vitest'

import { tracks } from './grid'

/**
 * Two formulas inside `tracks()` read like verbosity and are not. Both are one
 * edit away from being "tidied" into the exact ragged row Grid exists to
 * prevent, and neither failure is visible in a screenshot of a grid whose
 * content happens to be short — so they are asserted as text.
 *
 * Each assertion is paired with the shorter spelling it must NOT produce. A test
 * that only checked the right answer would pass just as well against a stringly
 * different one.
 */
describe('a count floors its tracks at zero', () => {
  it('compiles to minmax(0, 1fr)', () => {
    expect(tracks(3)).toBe('repeat(3, minmax(0, 1fr))')
  })

  // `1fr` alone means `minmax(auto, 1fr)`, and `auto` is the content's
  // min-content width — one long unbroken string then widens its own column and
  // squeezes every sibling.
  it('is not a bare 1fr', () => {
    expect(tracks(3)).not.toBe('repeat(3, 1fr)')
  })
})

describe('a fit floor never exceeds the container', () => {
  it('wraps the min in min(Npx, 100%)', () => {
    expect(tracks({ min: 240 })).toBe('repeat(auto-fill, minmax(min(240px, 100%), 1fr))')
  })

  // A bare `minmax(240px, 1fr)` forces a 240px track inside a 200px phone and
  // scrolls the document sideways.
  it('is not a bare px floor', () => {
    expect(tracks({ min: 240 })).not.toContain('minmax(240px,')
  })
})

describe('a capped fit cannot fit one more track', () => {
  // The floor also has to be at least one Mth of the row: subtract the M-1 gaps
  // first, then divide. Below that width the max() picks Npx again and the grid
  // wraps normally, which is why a cap costs nothing on a phone.
  //
  // The gap arrives as a CSS length rather than a number, so the subtraction is
  // written for the browser to do. That is what lets a token gap through: a
  // `var()` cannot be multiplied in JavaScript and can be multiplied in `calc`.
  it('floors at one Mth of the row, gaps removed', () => {
    expect(tracks({ min: 160, max: 4 }, '12px')).toBe(
      'repeat(auto-fill, minmax(max(min(160px, 100%), calc((100% - 3 * 12px) / 4)), 1fr))',
    )
  })

  it('counts M-1 gaps, not M', () => {
    expect(tracks({ min: 160, max: 4 }, '12px')).toContain('100% - 3 * 12px')
  })

  it('subtracts a token gap the same way', () => {
    // The case that was silently wrong: every `$n` gap resolved to the 12px
    // fallback, so a four-column fit reserved 36px of gutter whatever the
    // caller asked for.
    expect(tracks({ min: 160, max: 4 }, 'var(--space-6, 12px)')).toContain(
      'calc((100% - 3 * var(--space-6, 12px)) / 4)',
    )
  })
})

describe('the other spellings', () => {
  it('takes a list, where a number is px', () => {
    expect(tracks(['2fr', 240, '1fr'])).toBe('2fr 240px 1fr')
  })

  it('passes a written track list through', () => {
    expect(tracks('repeat(auto-fit, 120px)')).toBe('repeat(auto-fit, 120px)')
  })
})
