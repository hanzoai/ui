import { describe, expect, it } from 'vitest'

import { GAP, pages } from './Pagination'

/** Slots are fixed-width past the fit threshold — the property the four
 *  hand-rolled pagers each got wrong in a different place. */
const width = (p: number, count: number, around = 1) => pages(p, count, around).length

describe('pages', () => {
  it('lists every page while they all fit, with no ellipsis', () => {
    expect(pages(1, 1)).toEqual([1])
    expect(pages(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
    // 7 is exactly the fit threshold at around=1 (2*1+5).
    expect(pages(4, 7)).not.toContain(GAP)
  })

  it('is empty when there is nothing to page', () => {
    expect(pages(1, 0)).toEqual([])
    expect(pages(1, -3)).toEqual([])
  })

  it('keeps first and last reachable once it elides', () => {
    const out = pages(50, 100)
    expect(out[0]).toBe(1)
    expect(out[out.length - 1]).toBe(100)
    expect(out).toEqual([1, GAP, 49, 50, 51, GAP, 100])
  })

  it('holds one width at both ends instead of collapsing', () => {
    // The bug this encodes: a run clamped with Math.max alone shrinks near the
    // edges, so the control changes width as you page and the buttons move
    // under the cursor.
    const w = width(50, 100)
    for (const p of [1, 2, 3, 50, 98, 99, 100]) expect(width(p, 100), `page ${p}`).toBe(w)
  })

  it('elides on the far side only, at each end', () => {
    expect(pages(1, 100)).toEqual([1, 2, 3, 4, 5, GAP, 100])
    expect(pages(100, 100)).toEqual([1, GAP, 96, 97, 98, 99, 100])
  })

  it('never repeats a page and stays ascending', () => {
    for (const p of [1, 2, 3, 4, 50, 97, 98, 99, 100]) {
      const nums = pages(p, 100).filter((s): s is number => s !== GAP)
      expect(new Set(nums).size, `page ${p}`).toBe(nums.length)
      expect([...nums].sort((a, b) => a - b), `page ${p}`).toEqual(nums)
    }
  })

  it('clamps a page outside the range rather than inventing slots', () => {
    expect(pages(0, 100)).toEqual(pages(1, 100))
    expect(pages(999, 100)).toEqual(pages(100, 100))
  })

  it('widens with `around`', () => {
    expect(pages(50, 100, 2)).toEqual([1, GAP, 48, 49, 50, 51, 52, GAP, 100])
    expect(width(50, 100, 2)).toBe(9)
  })
})
