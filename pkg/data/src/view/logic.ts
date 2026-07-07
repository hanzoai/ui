// Pure view-state logic — composing a saved view (search → filter → sort) over a
// record set, and the immutable edits the view toolbar makes (add/update/remove a
// filter, cycle a column's sort, change search / group / kind, save & delete
// views). No React, no @hanzo/gui: every helper is data-in/data-out and tested in
// plain Node. The ONE place a view is applied, so table + board agree.
import type { FieldDefinition } from '../field/types'
import {
  filterRecords,
  searchRecords,
  sortRecords,
  cycleSort,
  operatorsForType,
  type FilterRule,
  type SortRule,
} from '../table/logic'
import type { ViewConfig, ViewKind } from './types'

type Record_ = Record<string, unknown>

/** A blank view of a given kind. */
export function emptyView(kind: ViewKind, id = 'default', name = kind === 'board' ? 'Board' : 'All records'): ViewConfig {
  return { id, name, kind, filters: [], sorts: [] }
}

/**
 * Apply a view to a record set: quick-search, then filter (AND), then sort. Pure
 * — returns a new array, input untouched. Board grouping is applied by the board
 * view over this same filtered+sorted result, so both views stay consistent.
 */
export function applyView(records: Record_[], view: ViewConfig, fields: FieldDefinition[]): Record_[] {
  let out = records
  if (view.search && view.search.trim()) out = searchRecords(out, view.search, fields)
  out = filterRecords(out, view.filters, fields)
  out = sortRecords(out, view.sorts, fields)
  return out
}

// ── filter edits (immutable) ──────────────────────────────────────────────────
/** The sensible starting rule for a field — its first operator, no value yet. */
export function defaultRuleFor(field: FieldDefinition): FilterRule {
  const ops = operatorsForType(field.type)
  return { field: field.name, op: ops[0] ?? 'contains' }
}

export function addFilter(view: ViewConfig, rule: FilterRule): ViewConfig {
  return { ...view, filters: [...view.filters, rule] }
}

export function updateFilter(view: ViewConfig, index: number, patch: Partial<FilterRule>): ViewConfig {
  return { ...view, filters: view.filters.map((r, i) => (i === index ? { ...r, ...patch } : r)) }
}

export function removeFilter(view: ViewConfig, index: number): ViewConfig {
  return { ...view, filters: view.filters.filter((_, i) => i !== index) }
}

// ── sort edits ────────────────────────────────────────────────────────────────
export function setSorts(view: ViewConfig, sorts: SortRule[]): ViewConfig {
  return { ...view, sorts }
}

/** Header-click: cycle a column through unsorted → asc → desc → unsorted. */
export function cycleColumnSort(view: ViewConfig, field: string): ViewConfig {
  return { ...view, sorts: cycleSort(view.sorts, field) }
}

// ── search / kind / group ─────────────────────────────────────────────────────
export function setSearch(view: ViewConfig, search: string): ViewConfig {
  return { ...view, search }
}
export function setKind(view: ViewConfig, kind: ViewKind): ViewConfig {
  return { ...view, kind }
}
export function setGroupField(view: ViewConfig, groupField: string | undefined): ViewConfig {
  return { ...view, groupField }
}

// ── column layout edits (table) ───────────────────────────────────────────────
export function setColumnOrder(view: ViewConfig, columnOrder: string[]): ViewConfig {
  return { ...view, columnOrder }
}
export function toggleFieldHidden(view: ViewConfig, name: string): ViewConfig {
  const hidden = new Set(view.hiddenFields ?? [])
  if (hidden.has(name)) hidden.delete(name)
  else hidden.add(name)
  return { ...view, hiddenFields: [...hidden] }
}

// ── saved views collection ────────────────────────────────────────────────────
/** Insert or replace a view by id (order preserved; appended when new). */
export function upsertView(views: ViewConfig[], view: ViewConfig): ViewConfig[] {
  const i = views.findIndex((v) => v.id === view.id)
  if (i < 0) return [...views, view]
  return views.map((v, j) => (j === i ? view : v))
}

export function removeView(views: ViewConfig[], id: string): ViewConfig[] {
  return views.filter((v) => v.id !== id)
}

/** A short human summary of a view's filter + sort state — for the switcher. */
export function describeView(view: ViewConfig, fields: FieldDefinition[]): string {
  const label = (name: string) => fields.find((f) => f.name === name)?.label ?? name
  const parts: string[] = []
  if (view.filters.length) parts.push(`${view.filters.length} filter${view.filters.length > 1 ? 's' : ''}`)
  if (view.sorts.length) parts.push(`sorted by ${label(view.sorts[0].field)}`)
  if (view.kind === 'board' && view.groupField) parts.push(`grouped by ${label(view.groupField)}`)
  return parts.join(' · ')
}
