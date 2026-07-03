import { describe, it, expect } from 'vitest'
import type { FieldDefinition } from '../field/types'
import {
  emptyView,
  applyView,
  defaultRuleFor,
  addFilter,
  updateFilter,
  removeFilter,
  cycleColumnSort,
  setSearch,
  setGroupField,
  upsertView,
  removeView,
  describeView,
} from './logic'

const fields: FieldDefinition[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'count', label: 'Count', type: 'number' },
  { name: 'stage', label: 'Stage', type: 'select', metadata: { options: [{ value: 'NEW', label: 'New' }, { value: 'WON', label: 'Won' }] } },
]

const rows: Record<string, unknown>[] = [
  { id: '1', name: 'Acme', count: 5, stage: 'NEW' },
  { id: '2', name: 'Beta', count: 2, stage: 'WON' },
  { id: '3', name: 'Ace', count: 9, stage: 'NEW' },
]

describe('applyView', () => {
  it('composes search → filter → sort', () => {
    let v = emptyView('table')
    v = setSearch(v, 'ac') // Acme, Ace
    v = addFilter(v, { field: 'stage', op: 'is', value: 'NEW' })
    v = { ...v, sorts: [{ field: 'count', dir: 'desc' }] }
    const out = applyView(rows, v, fields)
    expect(out.map((r) => r.id)).toEqual(['3', '1']) // Ace(9), Acme(5)
  })
  it('empty view returns all in order', () => {
    expect(applyView(rows, emptyView('table'), fields).map((r) => r.id)).toEqual(['1', '2', '3'])
  })
})

describe('filter edits (immutable)', () => {
  it('adds, updates, removes without mutating', () => {
    const v0 = emptyView('table')
    const v1 = addFilter(v0, defaultRuleFor(fields[0]))
    expect(v0.filters).toHaveLength(0)
    expect(v1.filters).toHaveLength(1)
    expect(v1.filters[0]).toMatchObject({ field: 'name', op: 'contains' })
    const v2 = updateFilter(v1, 0, { op: 'is', value: 'Acme' })
    expect(v2.filters[0]).toMatchObject({ op: 'is', value: 'Acme' })
    expect(v1.filters[0].op).toBe('contains') // v1 untouched
    const v3 = removeFilter(v2, 0)
    expect(v3.filters).toHaveLength(0)
  })
  it('defaultRuleFor picks a type-appropriate operator', () => {
    expect(defaultRuleFor(fields[1]).op).toBe('is') // number → first numeric op
    expect(defaultRuleFor(fields[2]).op).toBe('is') // select
  })
})

describe('cycleColumnSort', () => {
  it('cycles a column through asc/desc/off', () => {
    let v = emptyView('table')
    v = cycleColumnSort(v, 'name')
    expect(v.sorts).toEqual([{ field: 'name', dir: 'asc' }])
    v = cycleColumnSort(v, 'name')
    expect(v.sorts).toEqual([{ field: 'name', dir: 'desc' }])
    v = cycleColumnSort(v, 'name')
    expect(v.sorts).toEqual([])
  })
})

describe('saved views', () => {
  it('upsert appends new and replaces by id', () => {
    const a = emptyView('table', 'a', 'A')
    const b = emptyView('board', 'b', 'B')
    let views = upsertView([], a)
    views = upsertView(views, b)
    expect(views.map((v) => v.id)).toEqual(['a', 'b'])
    views = upsertView(views, { ...a, name: 'A2' })
    expect(views.find((v) => v.id === 'a')?.name).toBe('A2')
    expect(views).toHaveLength(2)
    views = removeView(views, 'a')
    expect(views.map((v) => v.id)).toEqual(['b'])
  })
})

describe('describeView', () => {
  it('summarizes filters, sort, and grouping', () => {
    let v = emptyView('board')
    v = addFilter(v, { field: 'stage', op: 'is', value: 'NEW' })
    v = { ...v, sorts: [{ field: 'count', dir: 'asc' }] }
    v = setGroupField(v, 'stage')
    expect(describeView(v, fields)).toBe('1 filter · sorted by Count · grouped by Stage')
  })
})
