import { describe, expect, it } from 'vitest'
import type { FieldDefinition } from '../field/types'
import { operandField, operandText } from './operands'

const f = (type: FieldDefinition['type']): FieldDefinition => ({ name: 'x', label: 'X', type })

describe('the operand a rule is entered with', () => {
  it('types words as words on a composite field', () => {
    for (const t of ['fullName', 'address', 'links', 'phone', 'richText', 'actor', 'json'] as const) {
      expect(operandField(f(t), { field: 'x', op: 'contains' }).type).toBe('text')
      expect(operandField(f(t), { field: 'x', op: 'is' }).type).toBe('text')
    }
  })
  it('keeps the field editor where it is the value', () => {
    expect(operandField(f('text'), { field: 'x', op: 'contains' }).type).toBe('text')
    expect(operandField(f('email'), { field: 'x', op: 'is' }).type).toBe('email')
    expect(operandField(f('date'), { field: 'x', op: 'between' }).type).toBe('date')
    expect(operandField(f('select'), { field: 'x', op: 'is' }).type).toBe('select')
    expect(operandField(f('select'), { field: 'x', op: 'isAnyOf' }).type).toBe('multiSelect')
    expect(operandField(f('currency'), { field: 'x', op: 'gte' }).type).toBe('number')
  })
  it('reads a range in words', () => {
    expect(operandText({ field: 'x', op: 'between', value: ['1', '5'] }, f('number'))).toBe('1 to 5')
    expect(operandText({ field: 'x', op: 'between', value: ['', '5'] }, f('number'))).toBe('to 5')
  })
})
