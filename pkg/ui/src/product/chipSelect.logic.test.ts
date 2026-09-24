import { describe, expect, it } from 'vitest'

import { PAGE, merge, move, narrow, near, pin, wants, type ChipItem } from './chipSelect.logic'

const rows = (...ids: string[]): ChipItem[] => ids.map((id) => ({ id, label: id }))

describe('merge', () => {
  it('appends a page after what is listed', () => {
    expect(merge(rows('a', 'b'), rows('c', 'd')).map((r) => r.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('drops a row a later page hands back again, keeping the first place', () => {
    // Cursor paging over a list that moved: `b` was pushed and reappears.
    expect(merge(rows('a', 'b'), rows('b', 'c')).map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('dedupes within one page too', () => {
    expect(merge([], rows('a', 'a', 'b')).map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('does not mutate what it was given', () => {
    const listed = rows('a')
    merge(listed, rows('b'))
    expect(listed.map((r) => r.id)).toEqual(['a'])
  })
})

describe('pin', () => {
  it('puts the chosen row first and removes its other copy', () => {
    const chosen = { id: 'c', label: 'c' }
    expect(pin(rows('a', 'b', 'c'), chosen).map((r) => r.id)).toEqual(['c', 'a', 'b'])
  })

  it('pins the chosen row even when no page has listed it yet', () => {
    expect(pin(rows('a'), { id: 'z', label: 'z' }).map((r) => r.id)).toEqual(['z', 'a'])
  })

  it('stops pinning once the search cannot match it', () => {
    const chosen = { id: 'hanzo-inc/cloud', label: 'hanzo-inc/cloud' }
    expect(pin(rows('acme/site'), chosen, 'site').map((r) => r.id)).toEqual(['acme/site'])
    expect(pin(rows('acme/cloudy'), chosen, 'CLOUD').map((r) => r.id)).toEqual([
      'hanzo-inc/cloud',
      'acme/cloudy',
    ])
  })

  it('leaves the list alone with nothing chosen', () => {
    expect(pin(rows('a', 'b'), null).map((r) => r.id)).toEqual(['a', 'b'])
  })
})

describe('narrow', () => {
  const list: ChipItem[] = [
    { id: '1', label: 'hanzo-inc/cloud' },
    { id: '2', label: 'acme/site', hint: 'private' },
  ]

  it('matches a literal substring of the label, case-insensitively', () => {
    expect(narrow(list, 'CLOUD').map((r) => r.id)).toEqual(['1'])
  })

  it('matches the hint', () => {
    expect(narrow(list, 'priv').map((r) => r.id)).toEqual(['2'])
  })

  it('treats pattern characters as text, never as a pattern', () => {
    expect(narrow(list, '.*')).toEqual([])
    expect(narrow([{ id: 'x', label: 'a.*b' }], '.*').map((r) => r.id)).toEqual(['x'])
  })

  it('returns everything for an empty search', () => {
    expect(narrow(list, '  ')).toHaveLength(2)
  })
})

describe('move', () => {
  it('steps down and up and stops at both ends', () => {
    expect(move('ArrowDown', -1, 3)).toBe(0)
    expect(move('ArrowDown', 0, 3)).toBe(1)
    expect(move('ArrowDown', 2, 3)).toBe(2)
    expect(move('ArrowUp', 1, 3)).toBe(0)
    expect(move('ArrowUp', 0, 3)).toBe(0)
  })

  it('jumps to the ends', () => {
    expect(move('Home', 5, 9)).toBe(0)
    expect(move('End', 0, 9)).toBe(8)
  })

  it('pages by PAGE and clamps', () => {
    expect(move('PageDown', 0, 100)).toBe(PAGE)
    expect(move('PageDown', 95, 100)).toBe(99)
    expect(move('PageUp', 3, 100)).toBe(0)
  })

  it('steps over disabled rows in the direction of travel', () => {
    const off = (i: number) => i === 1
    expect(move('ArrowDown', 0, 3, off)).toBe(2)
    expect(move('ArrowUp', 2, 3, off)).toBe(0)
  })

  it('turns back when the rest of the way is disabled', () => {
    expect(move('End', 0, 3, (i) => i > 0)).toBe(0)
  })

  it('answers -1 when there is nowhere to be', () => {
    expect(move('ArrowDown', -1, 0)).toBe(-1)
    expect(move('ArrowDown', -1, 2, () => true)).toBe(-1)
  })
})

describe('wants', () => {
  it('asks near the end when there is a next page and nothing in flight', () => {
    expect(wants({ next: 'c2', loading: false, at: 47, count: 50 })).toBe(true)
    expect(wants({ next: 'c2', loading: false, at: 10, count: 50 })).toBe(false)
  })

  it('never asks twice, and never past the last page', () => {
    expect(wants({ next: 'c2', loading: true, at: 49, count: 50 })).toBe(false)
    expect(wants({ next: null, loading: false, at: 49, count: 50 })).toBe(false)
  })
})

describe('near', () => {
  it('is true within the slack of the bottom', () => {
    expect(near(200, 276, 500)).toBe(true)
    expect(near(0, 276, 1200)).toBe(false)
  })
})
