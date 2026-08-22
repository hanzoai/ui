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
  it('floors at one Mth of the row, gaps removed', () => {
    expect(tracks({ min: 160, max: 4 }, 12)).toBe(
      'repeat(auto-fill, minmax(max(min(160px, 100%), calc((100% - 36px) / 4)), 1fr))',
    )
  })

  it('counts M-1 gaps, not M', () => {
    expect(tracks({ min: 160, max: 4 }, 12)).not.toContain('100% - 48px')
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
