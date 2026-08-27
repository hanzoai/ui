import { describe, expect, it } from 'vitest'

import { tw } from './tw'

/**
 * `calc()` requires whitespace around `+` and `-`. A class name cannot hold a
 * space, so what an author writes is what the browser refuses — and it refuses
 * the whole declaration, silently. This left the lux hero with no top padding,
 * sitting under a fixed 80px header.
 */
describe('tw: an arbitrary calc', () => {
  it('spaces the operator, or the declaration is dropped', () => {
    expect(tw('pt-[calc(44px+4vh)]').props).toEqual({ paddingTop: 'calc(44px + 4vh)' })
    expect(tw('w-[calc(100%-2rem)]').props).toEqual({ width: 'calc(100% - 2rem)' })
  })

  it('leaves a custom property alone — its name is not a subtraction', () => {
    expect(tw('px-[var(--gutter)]').props).toEqual({
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)',
    })
    expect(tw('w-[calc(var(--frame)-2rem)]').props).toEqual({ width: 'calc(var(--frame) - 2rem)' })
  })

  it('does not touch a value with no calc in it', () => {
    expect(tw('w-[100vw]').props).toEqual({ width: '100vw' })
    expect(tw('pt-[8vh]').props).toEqual({ paddingTop: '8vh' })
  })

  it('keeps an already-spaced calc as it is', () => {
    expect(tw('pt-[calc(44px_+_4vh)]').props).toEqual({ paddingTop: 'calc(44px + 4vh)' })
  })
})
