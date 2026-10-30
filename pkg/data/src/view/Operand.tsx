'use client'

// Operand — the value side of one filter rule, entered with the field's own
// editor. Both filter surfaces (the regular toolbar's builder and the compact
// view bar's chips) draw it, so a rule reads and edits the same in either:
//
//   isAnyOf   the field as a multi-select of its options
//   between   two editors, from and to; either may stay empty for an open range
//   otherwise the field's editor
//
// A rule on money, a percentage or a rating compares a plain number, so its
// operand is a number editor rather than the field's composite one.
import { useMemo } from 'react'
import { Text, XStack } from '@hanzo/gui'
import type { FieldDefinition, SelectOption } from '../field/types'
import { FieldInput } from '../field/FieldInput'
import { rangeOf, type FilterRule } from '../table/logic'
import { tokens } from '../theme'

export interface OperandProps {
  field: FieldDefinition
  rule: FilterRule
  onChange: (value: unknown) => void
  fieldOptions?: (field: FieldDefinition) => SelectOption[] | undefined
}

/** The editor a rule's operand is entered with. */
export function operandField(field: FieldDefinition, rule: FilterRule, options?: SelectOption[]): FieldDefinition {
  const numeric = field.type === 'currency' || field.type === 'percent' || field.type === 'rating'
  const base: FieldDefinition =
    rule.op === 'isAnyOf' ? { ...field, type: 'multiSelect' } : numeric ? { ...field, type: 'number' } : field
  return options ? { ...base, metadata: { ...(base.metadata as object), options } as FieldDefinition['metadata'] } : base
}

/** Whether a rule takes an operand at all. */
export const takesOperand = (rule: FilterRule): boolean => rule.op !== 'isEmpty' && rule.op !== 'isNotEmpty'

export function Operand({ field, rule, onChange, fieldOptions }: OperandProps) {
  const options = fieldOptions?.(field)
  const input = useMemo(() => operandField(field, rule, options), [field, rule, options])
  if (rule.op !== 'between') return <FieldInput field={input} value={rule.value} onChange={onChange} />
  const [from, to] = rangeOf(rule.value)
  return (
    <XStack items="center" gap={6} flex={1}>
      <XStack flex={1} minW={90} {...({ 'aria-label': 'From' } as object)}>
        <FieldInput field={input} value={from} onChange={(v) => onChange([v, to])} />
      </XStack>
      <Text fontSize={12} style={{ color: tokens.textFaint }}>to</Text>
      <XStack flex={1} minW={90} {...({ 'aria-label': 'To' } as object)}>
        <FieldInput field={input} value={to} onChange={(v) => onChange([from, v])} />
      </XStack>
    </XStack>
  )
}

/** A rule's operand in words, for a chip: `a, b`, `1 to 5`, `from 1`, `to 5`. */
export function operandText(rule: FilterRule, field: FieldDefinition | undefined): string {
  const options = (field?.metadata as { options?: { value: string; label: string }[] } | undefined)?.options
  const label = (v: unknown) => options?.find((o) => o.value === v)?.label ?? String(v)
  if (rule.op === 'between') {
    const [from, to] = rangeOf(rule.value)
    if (from !== undefined && to !== undefined) return `${label(from)} to ${label(to)}`
    if (from !== undefined) return `from ${label(from)}`
    if (to !== undefined) return `to ${label(to)}`
    return ''
  }
  if (rule.value == null || rule.value === '') return ''
  return Array.isArray(rule.value) ? rule.value.map(label).join(', ') : label(rule.value)
}
