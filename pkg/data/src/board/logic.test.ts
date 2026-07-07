import { describe, it, expect } from 'vitest'
import type { FieldDefinition } from '../field/types'
import {
  groupFieldCandidates,
  defaultGroupField,
  groupKeyOf,
  boardColumns,
  movePatch,
  NO_VALUE,
} from './logic'

const stage: FieldDefinition = {
  name: 'stage',
  label: 'Stage',
  type: 'select',
  metadata: { options: [
    { value: 'NEW', label: 'New', color: 'blue' },
    { value: 'WON', label: 'Won', color: 'green' },
    { value: 'LOST', label: 'Lost', color: 'red' },
  ] },
}
const active: FieldDefinition = { name: 'active', label: 'Active', type: 'boolean' }
const name: FieldDefinition = { name: 'name', label: 'Name', type: 'text' }

const rows: Record<string, unknown>[] = [
  { id: '1', name: 'A', stage: 'NEW', active: true },
  { id: '2', name: 'B', stage: 'WON', active: false },
  { id: '3', name: 'C', stage: 'NEW', active: true },
  { id: '4', name: 'D', stage: '', active: false },
  { id: '5', name: 'E', stage: 'ARCHIVED', active: true }, // value not in options
]

describe('group field candidates', () => {
  it('offers select/boolean/relation fields only', () => {
    expect(groupFieldCandidates([name, stage, active]).map((f) => f.name)).toEqual(['stage', 'active'])
  })
  it('defaults to the first select', () => {
    expect(defaultGroupField([name, active, stage])).toBe('stage')
  })
})

describe('groupKeyOf', () => {
  it('maps boolean and empties', () => {
    expect(groupKeyOf(active, true)).toBe('true')
    expect(groupKeyOf(active, false)).toBe('false')
    expect(groupKeyOf(active, null)).toBe(NO_VALUE)
    expect(groupKeyOf(stage, 'NEW')).toBe('NEW')
    expect(groupKeyOf(stage, '')).toBe(NO_VALUE)
  })
})

describe('boardColumns', () => {
  it('keeps declared option order, shows empty lanes, and appends unknown values', () => {
    const cols = boardColumns(rows, stage)
    // no-value lane appears (row 4 has ''), then NEW, WON, LOST (declared), then ARCHIVED (unknown)
    expect(cols.map((c) => c.key)).toEqual([NO_VALUE, 'NEW', 'WON', 'LOST', 'ARCHIVED'])
    const byKey = Object.fromEntries(cols.map((c) => [c.key, c.records.map((r) => r.id)]))
    expect(byKey['NEW']).toEqual(['1', '3'])
    expect(byKey['WON']).toEqual(['2'])
    expect(byKey['LOST']).toEqual([]) // declared but empty — still a lane
    expect(byKey['ARCHIVED']).toEqual(['5'])
    expect(byKey[NO_VALUE]).toEqual(['4'])
  })
  it('drops the empty no-value lane when nothing is unset', () => {
    const cols = boardColumns(rows.filter((r) => r.stage !== ''), stage)
    expect(cols.map((c) => c.key)).not.toContain(NO_VALUE)
  })
  it('groups booleans into Yes/No lanes', () => {
    const cols = boardColumns(rows, active)
    const byKey = Object.fromEntries(cols.map((c) => [c.key, c.records.map((r) => r.id)]))
    expect(byKey['true']).toEqual(['1', '3', '5'])
    expect(byKey['false']).toEqual(['2', '4'])
  })
})

describe('movePatch', () => {
  it('produces the field patch for a target lane', () => {
    expect(movePatch(stage, 'WON')).toEqual({ stage: 'WON' })
    expect(movePatch(stage, NO_VALUE)).toEqual({ stage: null })
    expect(movePatch(active, 'true')).toEqual({ active: true })
    expect(movePatch(active, 'false')).toEqual({ active: false })
  })
})
