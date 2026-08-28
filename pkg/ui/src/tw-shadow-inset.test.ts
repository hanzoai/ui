import { describe, expect, it } from 'vitest'

import { tw } from './tw'

describe('tw: a shadow written out', () => {
  it('reads a hard offset shadow, which has no rung to name', () => {
    // Measured on a live site: this exact class appeared 100+ times and came
    // back as `rest`, so a design whose whole language is hard shadows rendered
    // with none of them.
    expect(tw('shadow-[8px_8px_0_0_#000]').props).toEqual({ boxShadow: '8px 8px 0 0 #000' })
  })

  it('still reads the named rungs', () => {
    expect(tw('shadow-lg').props.boxShadow).toContain('10px')
    expect(tw('shadow-[4px_4px_0_0_#000]').rest).toBe('')
  })

  it('reads one under a breakpoint', () => {
    expect(tw('md:shadow-[12px_12px_0_0_#000]').props).toEqual({
      $md: { boxShadow: '12px 12px 0 0 #000' },
    })
  })

  it('keeps an escaped underscore, so a var() name survives', () => {
    expect(tw('shadow-[0_0_0_1px_var(--ring)]').props).toEqual({
      boxShadow: '0 0 0 1px var(--ring)',
    })
  })
})

describe('tw: inset by axis', () => {
  it('reads both axes, not just the four-sided form', () => {
    expect(tw('inset-x-0').props).toEqual({ left: 0, right: 0 })
    expect(tw('inset-y-0').props).toEqual({ top: 0, bottom: 0 })
    expect(tw('inset-0').props).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
  })

  it('reads a spaced value, not only zero', () => {
    expect(tw('inset-x-4').props).toEqual({ left: 16, right: 16 })
  })
})

describe('tw: z-index', () => {
  it('reads a rung and a value written out', () => {
    expect(tw('z-50').props).toEqual({ zIndex: 50 })
    // `z-[60]` is how anything above the named scale is spelled. Unread, a phone
    // menu asking to sit over a z-50 header got no z-index and the header kept
    // the click — the close button could not be pressed at all.
    expect(tw('z-[60]').props).toEqual({ zIndex: 60 })
    expect(tw('z-[60]').rest).toBe('')
  })

  it('reads a negative one', () => {
    expect(tw('z-[-1]').props).toEqual({ zIndex: -1 })
  })
})
