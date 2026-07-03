// Pure table logic — the decisions the record grid takes, isolated from React +
// @hanzo/gui so they are trivially testable (data in, data out) and reusable by a
// host doing server-side sort/filter. Imports only `type` from the field model,
// so this module pulls in no runtime and runs in plain Node.
//
// One vocabulary for sort, filter, search, and pagination powers the table, the
// board, and any saved view — decomplected from rendering. A field type maps to a
// comparable primitive HERE, once, so every view orders and filters identically.
import type { FieldDefinition, FieldType, SelectOption, CurrencyValue, LinkValue } from '../field/types'

export type Record_ = Record<string, unknown>

// ── comparable coercion (one place; mirrors the display coercions) ───────────
const asStr = (v: unknown): string => (v == null ? '' : String(v))
const asNum = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v])
const asTime = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v as string | number)
  const t = d.getTime()
  return Number.isNaN(t) ? null : t
}

const optionLabel = (field: FieldDefinition | undefined, value: string): string => {
  const options = (field?.metadata as { options?: SelectOption[] } | undefined)?.options
  return options?.find((o) => o.value === value)?.label ?? value
}

/** The record's relation/label text — the same resolution the display uses. */
export function relationLabel(field: FieldDefinition | undefined, value: unknown): string {
  const labelField = (field?.metadata as { labelField?: string } | undefined)?.labelField ?? 'name'
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    return asStr(rec[labelField] ?? rec.label ?? rec.name ?? rec.id)
  }
  return ''
}

/**
 * A field value reduced to a comparable primitive (number | string | null) for
 * sorting and relational filters. Numeric types compare numerically; dates by
 * timestamp; selects by their human label; multi-value types by their joined
 * labels; everything else case-folded text. `null` sorts last.
 */
export function comparable(field: FieldDefinition | undefined, value: unknown): number | string | null {
  const type: FieldType | undefined = field?.type
  switch (type) {
    case 'number':
    case 'percent':
    case 'rating':
    case 'position':
      return asNum(value)
    case 'currency': {
      const raw = (value ?? {}) as Partial<CurrencyValue>
      return typeof raw === 'object' && raw != null ? asNum(raw.amount) : asNum(value)
    }
    case 'boolean':
      return value === true || value === 'true' || value === 1 ? 1 : 0
    case 'date':
    case 'dateTime':
      return asTime(value)
    case 'select':
      return value == null || value === '' ? null : optionLabel(field, asStr(value)).toLowerCase()
    case 'multiSelect':
      return asArray(value).map((v) => optionLabel(field, asStr(v))).join(', ').toLowerCase() || null
    case 'relation':
      return relationLabel(field, value).toLowerCase() || null
    case 'links':
      return (
        asArray(value)
          .map((l) => (typeof l === 'string' ? l : (l as LinkValue)?.url ?? ''))
          .join(', ')
          .toLowerCase() || null
      )
    default: {
      const s = asStr(value)
      return s === '' ? null : s.toLowerCase()
    }
  }
}

// ── sort ──────────────────────────────────────────────────────────────────────
export type SortDir = 'asc' | 'desc'
export interface SortRule { field: string; dir: SortDir }

const fieldByName = (fields: FieldDefinition[], name: string): FieldDefinition | undefined =>
  fields.find((f) => f.name === name)

/** Compare two NON-null comparable primitives (numbers numerically, else by locale). */
function cmpNonNull(a: number | string, b: number | string): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

/**
 * Stable multi-key sort. Records are ordered by each rule in turn; equal records
 * keep their input order (stable). Empty values always sort LAST regardless of
 * direction (a descending sort doesn't float blanks to the top). Returns a new
 * array; the input is untouched.
 */
export function sortRecords(records: Record_[], sorts: SortRule[], fields: FieldDefinition[]): Record_[] {
  if (sorts.length === 0) return records.slice()
  return records
    .map((r, i) => [r, i] as const)
    .sort(([a, ia], [b, ib]) => {
      for (const s of sorts) {
        const f = fieldByName(fields, s.field)
        const av = comparable(f, a[s.field])
        const bv = comparable(f, b[s.field])
        if (av === null && bv === null) continue
        if (av === null) return 1 // a is empty → last
        if (bv === null) return -1 // b is empty → last
        const d = cmpNonNull(av, bv)
        if (d !== 0) return s.dir === 'asc' ? d : -d
      }
      return ia - ib
    })
    .map(([r]) => r)
}

/**
 * Header-click sort cycle for a single column: unsorted → asc → desc → unsorted.
 * Sorting a column replaces the sort set (single-column sort is the common case;
 * a host can compose multi-sort with `sortRecords` directly).
 */
export function cycleSort(sorts: SortRule[], field: string): SortRule[] {
  const current = sorts.length === 1 && sorts[0].field === field ? sorts[0] : undefined
  if (!current) return [{ field, dir: 'asc' }]
  if (current.dir === 'asc') return [{ field, dir: 'desc' }]
  return []
}

/** The current sort direction for a column, or undefined when it isn't sorted. */
export function sortDirOf(sorts: SortRule[], field: string): SortDir | undefined {
  return sorts.find((s) => s.field === field)?.dir
}

// ── filter ──────────────────────────────────────────────────────────────────
export type FilterOp =
  | 'contains'
  | 'notContains'
  | 'is'
  | 'isNot'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isAnyOf'

export interface FilterRule {
  field: string
  op: FilterOp
  /** Operand — a string for text/number ops, a string[] for `isAnyOf`. */
  value?: unknown
}

/** Human labels for the operators — for the filter UI menu. */
export const OP_LABELS: Record<FilterOp, string> = {
  contains: 'contains',
  notContains: 'does not contain',
  is: 'is',
  isNot: 'is not',
  gt: 'is greater than',
  gte: 'is at least',
  lt: 'is less than',
  lte: 'is at most',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
  isAnyOf: 'is any of',
}

const TEXT_OPS: FilterOp[] = ['contains', 'notContains', 'is', 'isNot', 'isEmpty', 'isNotEmpty']
const NUM_OPS: FilterOp[] = ['is', 'isNot', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty']
const SELECT_OPS: FilterOp[] = ['is', 'isNot', 'isAnyOf', 'isEmpty', 'isNotEmpty']
const BOOL_OPS: FilterOp[] = ['is']

/** The operators that make sense for a field type — drives the filter menu. */
export function operatorsForType(type: FieldType): FilterOp[] {
  switch (type) {
    case 'number':
    case 'percent':
    case 'currency':
    case 'rating':
    case 'date':
    case 'dateTime':
      return NUM_OPS
    case 'select':
    case 'multiSelect':
    case 'relation':
      return SELECT_OPS
    case 'boolean':
      return BOOL_OPS
    default:
      return TEXT_OPS
  }
}

const isEmptyValue = (field: FieldDefinition | undefined, value: unknown): boolean => {
  if (value == null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (field?.type === 'currency') return asNum((value as Partial<CurrencyValue>)?.amount) == null
  return false
}

const numericType = (type: FieldType | undefined): boolean =>
  type === 'number' || type === 'percent' || type === 'currency' || type === 'rating' || type === 'date' || type === 'dateTime'

/** The record's raw stored keys for a set-like field (option values / relation ids). */
function rawKeys(field: FieldDefinition | undefined, value: unknown): string[] {
  if (field?.type === 'multiSelect') return asArray(value).map(asStr).filter((s) => s !== '')
  if (field?.type === 'relation') {
    const k = relationKey(value)
    return k ? [k] : []
  }
  const s = asStr(value)
  return s === '' ? [] : [s]
}

const relationKey = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    return asStr(rec.id ?? rec.value ?? '')
  }
  return ''
}

/**
 * True when one record's value satisfies one filter rule. Filters compare RAW
 * stored values (a select's option value, a relation's id, a boolean's truth) —
 * not the display label — so equality is exact; text ops fold case; numeric ops
 * compare magnitude. `null`/empty answers `isNot`-style predicates truthfully.
 */
export function matchesRule(field: FieldDefinition | undefined, value: unknown, rule: FilterRule): boolean {
  if (rule.op === 'isEmpty') return isEmptyValue(field, value)
  if (rule.op === 'isNotEmpty') return !isEmptyValue(field, value)

  const type = field?.type

  if (type === 'boolean') {
    const on = value === true || value === 'true' || value === 1
    const want = rule.value === true || rule.value === 'true' || rule.value === 1
    return rule.op === 'isNot' ? on !== want : on === want
  }

  if (type === 'select' || type === 'multiSelect' || type === 'relation') {
    const keys = new Set(rawKeys(field, value))
    if (rule.op === 'isAnyOf') {
      const set = new Set((Array.isArray(rule.value) ? rule.value : []).map(asStr))
      if (set.size === 0) return true
      return [...keys].some((k) => set.has(k))
    }
    const target = asStr(rule.value)
    if (rule.op === 'is') return keys.has(target)
    if (rule.op === 'isNot') return !keys.has(target)
    return true
  }

  if (numericType(type)) {
    const left = comparable(field, value)
    const l = typeof left === 'number' ? left : null
    const isDate = type === 'date' || type === 'dateTime'
    const right = isDate ? asTime(rule.value) : asNum(rule.value)
    if (l == null || right == null) return rule.op === 'isNot'
    switch (rule.op) {
      case 'is': return l === right
      case 'isNot': return l !== right
      case 'gt': return l > right
      case 'gte': return l >= right
      case 'lt': return l < right
      case 'lte': return l <= right
      default: return true
    }
  }

  const l = asStr(comparable(field, value))
  const r = asStr(rule.value).toLowerCase()
  switch (rule.op) {
    case 'contains': return l.includes(r)
    case 'notContains': return !l.includes(r)
    case 'is': return l === r
    case 'isNot': return l !== r
    default: return true
  }
}

/** Keep records that satisfy EVERY rule (AND). Empty rules → all records. */
export function filterRecords(records: Record_[], filters: FilterRule[], fields: FieldDefinition[]): Record_[] {
  const active = filters.filter((r) => r.op === 'isEmpty' || r.op === 'isNotEmpty' || r.value != null)
  if (active.length === 0) return records.slice()
  return records.filter((rec) => active.every((rule) => matchesRule(fieldByName(fields, rule.field), rec[rule.field], rule)))
}

// ── quick search (across all text-ish fields) ─────────────────────────────────
/** Substring match of `query` against every field's displayed text (case-insensitive). */
export function searchRecords(records: Record_[], query: string, fields: FieldDefinition[]): Record_[] {
  const q = query.trim().toLowerCase()
  if (!q) return records.slice()
  return records.filter((rec) =>
    fields.some((f) => {
      const c = comparable(f, rec[f.name])
      return c != null && String(c).toLowerCase().includes(q)
    }),
  )
}

// ── pagination ────────────────────────────────────────────────────────────────
export interface Page<T> {
  items: T[]
  page: number
  pageCount: number
  total: number
  /** 1-based index of the first item on this page (0 when empty). */
  from: number
  /** 1-based index of the last item on this page. */
  to: number
}

/** Slice records into a page; `page` is clamped to a valid range. */
export function paginate<T>(records: T[], page: number, pageSize: number): Page<T> {
  const total = records.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const clamped = Math.min(Math.max(1, page), pageCount)
  const start = (clamped - 1) * pageSize
  const items = records.slice(start, start + pageSize)
  return {
    items,
    page: clamped,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + items.length,
  }
}

// ── column order helpers ──────────────────────────────────────────────────────
/** Move an array element from index `from` to index `to` (returns a new array). */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice()
  if (from < 0 || from >= next.length) return next
  const [item] = next.splice(from, 1)
  const dest = Math.min(Math.max(0, to), next.length)
  next.splice(dest, 0, item)
  return next
}

/** The 0-based column index whose horizontal band contains `x` px (from the grid left). */
export function columnIndexAtX(widths: number[], x: number): number {
  let acc = 0
  for (let i = 0; i < widths.length; i++) {
    acc += widths[i]
    if (x < acc) return i
  }
  return Math.max(0, widths.length - 1)
}

/**
 * The ordered, visible columns for the table: fields ordered by `order` (names),
 * with any field missing from `order` appended in schema order, and any hidden
 * name removed. One place decides column order so header + rows stay in lockstep.
 */
export function orderedColumns(
  fields: FieldDefinition[],
  order: string[] | undefined,
  hidden: ReadonlySet<string> | undefined,
): FieldDefinition[] {
  const visible = fields.filter((f) => !hidden?.has(f.name))
  if (!order || order.length === 0) return visible
  const byName = new Map(visible.map((f) => [f.name, f]))
  const out: FieldDefinition[] = []
  for (const name of order) {
    const f = byName.get(name)
    if (f) { out.push(f); byName.delete(name) }
  }
  for (const f of visible) if (byName.has(f.name)) out.push(f)
  return out
}
