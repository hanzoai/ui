import { describe, expect, it } from 'vitest'

import { defaultLayout, resizeAt, type PanelSpec } from './resizable.logic'

const spec = (id: string, p: Partial<PanelSpec> = {}): PanelSpec => ({ id, ...p })

describe('defaultLayout', () => {
  it('splits evenly when nothing is declared', () => {
    expect(defaultLayout([spec('a'), spec('b'), spec('c')])).toEqual([100 / 3, 100 / 3, 100 / 3])
  })

  it('honours declared sizes and gives the remainder to the rest', () => {
    expect(defaultLayout([spec('a', { defaultSize: 60 }), spec('b'), spec('c')])).toEqual([60, 20, 20])
  })

  it('normalises to 100 when declared sizes overshoot', () => {
    const out = defaultLayout([spec('a', { defaultSize: 80 }), spec('b', { defaultSize: 80 })])
    expect(out).toEqual([50, 50])
  })

  it('is empty for no panels', () => {
    expect(defaultLayout([])).toEqual([])
  })
})

describe('resizeAt', () => {
  const specs = [spec('a'), spec('b')]

  it('moves the boundary and keeps the pair sum invariant', () => {
    const out = resizeAt([50, 50], specs, 0, 10)
    expect(out).toEqual([60, 40])
    expect(out[0] + out[1]).toBe(100)
  })

  it('clamps at the left panel minSize', () => {
    expect(resizeAt([50, 50], [spec('a', { minSize: 30 }), spec('b')], 0, -40)).toEqual([30, 70])
  })

  it('clamps at the right panel minSize', () => {
    expect(resizeAt([50, 50], [spec('a'), spec('b', { minSize: 25 })], 0, 40)).toEqual([75, 25])
  })

  it('clamps at maxSize', () => {
    expect(resizeAt([50, 50], [spec('a', { maxSize: 55 }), spec('b')], 0, 40)).toEqual([55, 45])
  })

  it('lets a collapsible panel go below minSize down to collapsedSize', () => {
    const s = [spec('a', { minSize: 20, collapsible: true, collapsedSize: 4 }), spec('b')]
    expect(resizeAt([50, 50], s, 0, -60)).toEqual([4, 96])
  })

  it('returns the same array when fully clamped', () => {
    const sizes = [50, 50]
    expect(resizeAt(sizes, [spec('a', { minSize: 50 }), spec('b')], 0, -10)).toBe(sizes)
  })

  it('leaves other panels untouched', () => {
    expect(resizeAt([30, 30, 40], [spec('a'), spec('b'), spec('c')], 1, 10)).toEqual([30, 40, 30])
  })

  it('ignores an out-of-range boundary', () => {
    const sizes = [50, 50]
    expect(resizeAt(sizes, specs, 1, 10)).toBe(sizes)
  })
})
