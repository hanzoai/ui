// The operand side of a filter rule, as data: which editor it is entered with, and
// how it reads in a chip. No React, so it is tested in plain Node.
import type { FieldDefinition, SelectOption } from '../field/types'
import { rangeOf, type FilterRule } from '../table/logic'

/** The types whose own editor is a single line of text a rule's words can be typed in. */
const PLAIN = new Set(['text', 'longText', 'email', 'url'])
/** The operators that compare words. */
const WORDS = new Set(['contains', 'notContains', 'is', 'isNot'])

/**
 * The editor a rule's operand is entered with. Words are typed as words: a rule on
 * a name, an address, links, a phone or rich text compares text, so its operand is
 * one text box, never the field's composite editor (a name's two boxes made an
 * operand no "contains" could read).
 */
export function operandField(field: FieldDefinition, rule: FilterRule, options?: SelectOption[]): FieldDefinition {
  const numeric = field.type === 'currency' || field.type === 'percent' || field.type === 'rating'
  const words = WORDS.has(rule.op) && !PLAIN.has(field.type) && field.type !== 'select' && field.type !== 'multiSelect' && field.type !== 'relation' && field.type !== 'boolean' && !numeric && field.type !== 'date' && field.type !== 'dateTime' && field.type !== 'number'
  const base: FieldDefinition =
    rule.op === 'isAnyOf'
      ? { ...field, type: 'multiSelect' }
      : numeric
        ? { ...field, type: 'number' }
        : words
          ? { ...field, type: 'text', metadata: undefined }
          : field
  return options ? { ...base, metadata: { ...(base.metadata as object), options } as FieldDefinition['metadata'] } : base
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
