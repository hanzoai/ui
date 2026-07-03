// The saved-view model — a named, serializable configuration of how a collection
// is presented: which view kind (table / board), what it's filtered + sorted +
// grouped by, and the table's column layout. A host persists these (per user, per
// collection); the components render from them and emit the next config. One
// value describes a view, so switching, saving, and restoring are all data.
import type { SortRule, FilterRule } from '../table/logic'

export type ViewKind = 'table' | 'board'

export interface ViewConfig {
  /** Stable id (host-assigned). */
  id: string
  /** Human name shown in the view switcher. */
  name: string
  kind: ViewKind
  /** AND-combined filter rules. */
  filters: FilterRule[]
  /** Ordered sort rules (first is primary). */
  sorts: SortRule[]
  /** Quick full-text search across fields. */
  search?: string
  /** Board: the select/status/boolean field records are grouped into columns by. */
  groupField?: string
  /** Table: column order by field name (missing names append in schema order). */
  columnOrder?: string[]
  /** Table: field names hidden from the grid. */
  hiddenFields?: string[]
  /** Table: rows per page. */
  pageSize?: number
}
