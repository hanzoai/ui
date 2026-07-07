import { describe, it, expect } from 'vitest'
import type { FieldDefinition } from '../field/types'
import {
  comparable,
  sortRecords,
  cycleSort,
  sortDirOf,
  operatorsForType,
  matchesRule,
  filterRecords,
  searchRecords,
  paginate,
  moveItem,
  orderedColumns,
  columnIndexAtX,
} from './logic'

const fields: FieldDefinition[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'employees', label: 'Employees', type: 'number' },
  { name: 'stage', label: 'Stage', type: 'select', metadata: { options: [
    { value: 'NEW', label: 'New', color: 'blue' },
    { value: 'WON', label: 'Won', color: 'green' },
  ] } },
  { name: 'active', label: 'Active', type: 'boolean' },
  { name: 'arr', label: 'ARR', type: 'currency' },
  { name: 'signed', label: 'Signed', type: 'date' },
]

const rows: Record<string, unknown>[] = [
  { id: '1', name: 'Beta', employees: 10, stage: 'NEW', active: true, arr: { amount: 500, currencyCode: 'USD' }, signed: '2024-02-01' },
  { id: '2', name: 'alpha', employees: 3, stage: 'WON', active: false, arr: { amount: 1500, currencyCode: 'USD' }, signed: '2024-01-01' },
  { id: '3', name: 'Gamma', employees: null, stage: '', active: true, arr: { amount: null, currencyCode: 'USD' }, signed: '' },
]

describe('comparable', () => {
  it('coerces per field type', () => {
    expect(comparable(fields[1], 10)).toBe(10)
    expect(comparable(fields[4], { amount: 500, currencyCode: 'USD' })).toBe(500) // currency
    expect(comparable(fields[2], 'WON')).toBe('won') // select → label lowercased
    expect(comparable(fields[4], { amount: null })).toBeNull()
    expect(comparable(fields[0], '')).toBeNull()
    expect(comparable(fields[0], 'Hi')).toBe('hi')
  })
})

describe('sortRecords', () => {
  it('sorts text case-insensitively, ascending', () => {
    const out = sortRecords(rows, [{ field: 'name', dir: 'asc' }], fields)
    expect(out.map((r) => r.name)).toEqual(['alpha', 'Beta', 'Gamma'])
  })
  it('sorts numbers descending with null last', () => {
    const out = sortRecords(rows, [{ field: 'employees', dir: 'desc' }], fields)
    expect(out.map((r) => r.id)).toEqual(['1', '2', '3']) // 10, 3, null
  })
  it('is stable and does not mutate input', () => {
    const before = rows.map((r) => r.id)
    const out = sortRecords(rows, [{ field: 'active', dir: 'desc' }], fields)
    expect(rows.map((r) => r.id)).toEqual(before)
    // both active=true rows keep their relative order (1 before 3)
    expect(out.filter((r) => r.active).map((r) => r.id)).toEqual(['1', '3'])
  })
  it('returns a copy when no sort rules', () => {
    const out = sortRecords(rows, [], fields)
    expect(out).not.toBe(rows)
    expect(out.map((r) => r.id)).toEqual(['1', '2', '3'])
  })
})

describe('cycleSort / sortDirOf', () => {
  it('cycles unsorted → asc → desc → unsorted', () => {
    let s = cycleSort([], 'name')
    expect(s).toEqual([{ field: 'name', dir: 'asc' }])
    expect(sortDirOf(s, 'name')).toBe('asc')
    s = cycleSort(s, 'name')
    expect(s).toEqual([{ field: 'name', dir: 'desc' }])
    s = cycleSort(s, 'name')
    expect(s).toEqual([])
  })
  it('switching column starts a fresh asc', () => {
    const s = cycleSort([{ field: 'name', dir: 'desc' }], 'employees')
    expect(s).toEqual([{ field: 'employees', dir: 'asc' }])
  })
})

describe('operatorsForType', () => {
  it('offers numeric operators for numbers/dates', () => {
    expect(operatorsForType('number')).toContain('gte')
    expect(operatorsForType('date')).toContain('lt')
  })
  it('offers set operators for selects', () => {
    expect(operatorsForType('select')).toContain('isAnyOf')
  })
  it('offers text operators for text', () => {
    expect(operatorsForType('text')).toContain('contains')
  })
})

describe('matchesRule / filterRecords', () => {
  it('text contains (case-insensitive)', () => {
    const out = filterRecords(rows, [{ field: 'name', op: 'contains', value: 'A' }], fields)
    expect(out.map((r) => r.id).sort()).toEqual(['1', '2', '3']) // Beta, alpha, Gamma all contain "a"
    expect(filterRecords(rows, [{ field: 'name', op: 'contains', value: 'ph' }], fields).map((r) => r.id)).toEqual(['2']) // alpha only
  })
  it('number gte', () => {
    const out = filterRecords(rows, [{ field: 'employees', op: 'gte', value: '10' }], fields)
    expect(out.map((r) => r.id)).toEqual(['1'])
  })
  it('select isAnyOf', () => {
    const out = filterRecords(rows, [{ field: 'stage', op: 'isAnyOf', value: ['WON'] }], fields)
    expect(out.map((r) => r.id)).toEqual(['2'])
  })
  it('isEmpty / isNotEmpty', () => {
    expect(filterRecords(rows, [{ field: 'employees', op: 'isEmpty' }], fields).map((r) => r.id)).toEqual(['3'])
    expect(filterRecords(rows, [{ field: 'stage', op: 'isNotEmpty' }], fields).map((r) => r.id).sort()).toEqual(['1', '2'])
  })
  it('boolean is', () => {
    expect(filterRecords(rows, [{ field: 'active', op: 'is', value: 'true' }], fields).map((r) => r.id).sort()).toEqual(['1', '3'])
  })
  it('date lt/gte compares ISO operands by time', () => {
    expect(filterRecords(rows, [{ field: 'signed', op: 'lt', value: '2024-01-15' }], fields).map((r) => r.id)).toEqual(['2']) // 2024-01-01
    expect(filterRecords(rows, [{ field: 'signed', op: 'gte', value: '2024-01-15' }], fields).map((r) => r.id)).toEqual(['1']) // 2024-02-01 (row 3 empty → excluded)
  })
  it('AND-combines rules; empty rules keep all', () => {
    const out = filterRecords(rows, [
      { field: 'active', op: 'is', value: 'true' },
      { field: 'name', op: 'contains', value: 'g' },
    ], fields)
    expect(out.map((r) => r.id)).toEqual(['3'])
    expect(filterRecords(rows, [], fields)).toHaveLength(3)
  })
  it('ignores a rule whose value is not yet set', () => {
    expect(filterRecords(rows, [{ field: 'name', op: 'contains' }], fields)).toHaveLength(3)
  })
})

describe('searchRecords', () => {
  it('matches across fields, case-insensitive', () => {
    expect(searchRecords(rows, 'won', fields).map((r) => r.id)).toEqual(['2'])
    expect(searchRecords(rows, 'amma', fields).map((r) => r.id)).toEqual(['3'])
    expect(searchRecords(rows, '', fields)).toHaveLength(3)
  })
})

describe('paginate', () => {
  it('slices and clamps the page', () => {
    const p = paginate([1, 2, 3, 4, 5], 1, 2)
    expect(p.items).toEqual([1, 2])
    expect(p).toMatchObject({ page: 1, pageCount: 3, total: 5, from: 1, to: 2 })
    expect(paginate([1, 2, 3, 4, 5], 99, 2).items).toEqual([5])
    expect(paginate([], 1, 10)).toMatchObject({ from: 0, to: 0, pageCount: 1 })
  })
})

describe('moveItem / orderedColumns', () => {
  it('moves an element and returns a new array', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })
  it('orders columns by order, appends missing, drops hidden', () => {
    const cols = orderedColumns(fields, ['stage', 'name'], new Set(['arr', 'signed']))
    expect(cols.map((f) => f.name)).toEqual(['stage', 'name', 'employees', 'active'])
  })
  it('columnIndexAtX finds the column under a pixel offset', () => {
    const w = [40, 200, 120, 120] // selection, name, employees, stage
    expect(columnIndexAtX(w, 10)).toBe(0)
    expect(columnIndexAtX(w, 100)).toBe(1)
    expect(columnIndexAtX(w, 250)).toBe(2)
    expect(columnIndexAtX(w, 9999)).toBe(3) // past the end clamps to last
  })
})
