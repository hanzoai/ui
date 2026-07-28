import { describe, it, expect } from 'vitest'
import { GRID_MIN, TABLE_MIN, TAP, layoutFor } from './responsive'

describe('layoutFor — mobile FIRST is a rule, not a fallback', () => {
  it('an UNMEASURED container is a phone (the first paint, SSR included)', () => {
    expect(layoutFor(0)).toBe('phone')
    expect(layoutFor(-1)).toBe('phone')
  })

  it('a phone-width box stays a phone', () => {
    expect(layoutFor(390)).toBe('phone') // iPhone 15 portrait
    expect(layoutFor(430)).toBe('phone')
    expect(layoutFor(TABLE_MIN - 1)).toBe('phone')
  })

  it('a box wide enough for a table becomes the desktop enhancement', () => {
    expect(layoutFor(TABLE_MIN)).toBe('desktop')
    expect(layoutFor(1280)).toBe('desktop')
  })

  it('measures the CONTAINER, so a narrow pane on a wide screen is still a phone', () => {
    // A console with a 260px sidebar and a 420px detail rail: the renderer's own
    // box, not the viewport, is what has to hold the table.
    expect(layoutFor(420)).toBe('phone')
  })

  it('honours a caller-supplied threshold', () => {
    expect(layoutFor(500, 480)).toBe('desktop')
    expect(layoutFor(500, 900)).toBe('phone')
  })

  it('the tap floor is the accessibility minimum, not a guess', () => {
    expect(TAP).toBeGreaterThanOrEqual(44) // WCAG 2.5.5 / iOS HIG
    expect(GRID_MIN).toBeLessThan(TABLE_MIN)
  })
})
