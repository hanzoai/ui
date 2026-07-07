import { describe, expect, it } from 'vitest'

import { rowShift, targetIndex } from './Reorder'

describe('targetIndex', () => {
  it('rounds travel to the nearest row and clamps to range', () => {
    // rowH=44, from=2, drag down 100px → +2.27 → +2 → index 4
    expect(targetIndex(2, 100, 44, 6)).toBe(4)
    // drag up 100px → −2 → index 0
    expect(targetIndex(2, -100, 44, 6)).toBe(0)
    // clamp at the ends
    expect(targetIndex(5, 999, 44, 6)).toBe(5)
    expect(targetIndex(0, -999, 44, 6)).toBe(0)
    // sub-half-row travel stays put
    expect(targetIndex(3, 20, 44, 6)).toBe(3)
  })

  it('is a safe no-op for degenerate inputs', () => {
    expect(targetIndex(2, 100, 0, 6)).toBe(2)
    expect(targetIndex(2, 100, 44, 0)).toBe(2)
  })
})

describe('rowShift — displacement of siblings during a drag', () => {
  const rowH = 44
  it('the dragged row follows the pointer', () => {
    expect(rowShift(2, 2, 4, 90, rowH)).toBe(90)
  })
  it('rows between from and to (dragging down) move up by one row', () => {
    // from=1 → to=3: rows 2,3 shift up
    expect(rowShift(2, 1, 3, 90, rowH)).toBe(-rowH)
    expect(rowShift(3, 1, 3, 90, rowH)).toBe(-rowH)
    expect(rowShift(4, 1, 3, 90, rowH)).toBe(0)
  })
  it('rows between to and from (dragging up) move down by one row', () => {
    // from=4 → to=2: rows 2,3 shift down
    expect(rowShift(2, 4, 2, -90, rowH)).toBe(rowH)
    expect(rowShift(3, 4, 2, -90, rowH)).toBe(rowH)
    expect(rowShift(1, 4, 2, -90, rowH)).toBe(0)
  })
})
