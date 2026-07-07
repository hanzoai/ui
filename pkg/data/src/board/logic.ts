// Pure board (kanban) logic — group a collection's records into ordered columns
// by a select / status / boolean / relation field, and describe the patch that
// moving a card between columns implies. No React, no @hanzo/gui: data in, data
// out, testable in plain Node.
import type { FieldDefinition, FieldType, SelectOption, TagColor } from '../field/types'

type Record_ = Record<string, unknown>

const asStr = (v: unknown): string => (v == null ? '' : String(v))

/** One board column: a group value + the records in it, in input order. */
export interface BoardColumn {
  /** The group value (`''` for the no-value column). */
  key: string
  label: string
  color?: TagColor
  records: Record_[]
}

/** The sentinel column key for records with no value in the group field. */
export const NO_VALUE = ''

/** Field types that make sensible board lanes (a bounded, single set of values). */
const GROUPABLE: ReadonlySet<FieldType> = new Set<FieldType>(['select', 'boolean', 'relation'])

/** The fields a board can group by — the same order they appear in the schema. */
export function groupFieldCandidates(fields: FieldDefinition[]): FieldDefinition[] {
  return fields.filter((f) => GROUPABLE.has(f.type))
}

/** The best default group field (first select, else first candidate), or undefined. */
export function defaultGroupField(fields: FieldDefinition[]): string | undefined {
  const selects = fields.filter((f) => f.type === 'select')
  if (selects.length > 0) return selects[0].name
  const c = groupFieldCandidates(fields)
  return c[0]?.name
}

/** The group key for one record's value in a group field (the option value / bool / id). */
export function groupKeyOf(field: FieldDefinition, value: unknown): string {
  if (field.type === 'boolean') {
    if (value == null || value === '') return NO_VALUE
    return value === true || value === 'true' || value === 1 ? 'true' : 'false'
  }
  if (field.type === 'relation') {
    if (value && typeof value === 'object') {
      const rec = value as Record<string, unknown>
      return asStr(rec.id ?? rec.value ?? '')
    }
    return asStr(value)
  }
  return asStr(value)
}

/** The declared column keys for a group field, in display order (before data). */
function declaredColumns(field: FieldDefinition): { key: string; label: string; color?: TagColor }[] {
  if (field.type === 'boolean') {
    const meta = (field.metadata ?? {}) as { trueLabel?: string; falseLabel?: string }
    return [
      { key: 'true', label: meta.trueLabel ?? 'Yes', color: 'green' },
      { key: 'false', label: meta.falseLabel ?? 'No', color: 'gray' },
    ]
  }
  const options = (field.metadata as { options?: SelectOption[] } | undefined)?.options ?? []
  return options.map((o) => ({ key: o.value, label: o.label, color: o.color }))
}

export interface BoardColumnsOptions {
  /** Include an explicit "no value" column even when empty (default true). */
  includeEmpty?: boolean
  /** A label for the no-value column (default "No <field label>"). */
  emptyLabel?: string
}

/**
 * Partition records into board columns. Declared option columns come first in
 * their schema order (so an empty stage still shows as a lane); any value not in
 * the schema (or a relation id) becomes a trailing lane; records with no value
 * collect in the leading "no value" lane. Order within a lane is preserved.
 */
export function boardColumns(
  records: Record_[],
  field: FieldDefinition,
  opts: BoardColumnsOptions = {},
): BoardColumn[] {
  const includeEmpty = opts.includeEmpty ?? true
  const declared = declaredColumns(field)
  const order: string[] = []
  const meta = new Map<string, { label: string; color?: TagColor }>()
  const buckets = new Map<string, Record_[]>()

  const ensure = (key: string, label: string, color?: TagColor) => {
    if (!buckets.has(key)) { buckets.set(key, []); order.push(key); meta.set(key, { label, color }) }
  }

  // Leading no-value lane, then declared option lanes (empty-but-present).
  if (includeEmpty) ensure(NO_VALUE, opts.emptyLabel ?? `No ${field.label.toLowerCase()}`)
  for (const c of declared) ensure(c.key, c.label, c.color)

  for (const rec of records) {
    const key = groupKeyOf(field, rec[field.name])
    if (key === NO_VALUE && !includeEmpty) continue
    if (!buckets.has(key)) ensure(key, key || (opts.emptyLabel ?? `No ${field.label.toLowerCase()}`))
    buckets.get(key)!.push(rec)
  }

  // Drop the no-value lane if it ended up empty and wasn't forced.
  return order
    .filter((key) => !(key === NO_VALUE && (buckets.get(key)?.length ?? 0) === 0 && declared.length > 0))
    .map((key) => ({ key, ...(meta.get(key) as { label: string; color?: TagColor }), records: buckets.get(key) ?? [] }))
}

/** The record patch that moving a card into a column implies (`{ [field]: value }`). */
export function movePatch(field: FieldDefinition, columnKey: string): Record<string, unknown> {
  if (field.type === 'boolean') return { [field.name]: columnKey === 'true' }
  return { [field.name]: columnKey === NO_VALUE ? null : columnKey }
}
