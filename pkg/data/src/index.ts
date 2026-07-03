// @hanzo/data — the cross-platform, metadata-driven data-app layer.
//
// One model (typed fields → records → views) powers any Base-backed app: CRM,
// CMS, commerce, internal tools. Built on @hanzo/gui so the same components run on
// web, native (iOS), and desktop. Airtable/Twenty-class polish, clean-room.
// Importing the package registers the built-in field renderers; register more to
// extend. A business app is a curated set of views over these components.
//
//   import { RecordsView, DataTable, BoardView, RecordDetail, registerField } from '@hanzo/data'

// Register the built-in field renderers as a side effect of importing the lib.
import './field/registerDefaults'

// ── Field model + contracts ──────────────────────────────────────────────────
export type {
  FieldType,
  TagColor,
  SelectOption,
  LinkValue,
  CurrencyValue,
  FieldMetadata,
  FieldMetadataMap,
  FieldDefinition,
  FieldDisplayProps,
  FieldInputProps,
  FieldDisplayComponent,
  FieldInputComponent,
} from './field/types'

// Registry (extensibility)
export {
  registerField,
  getFieldRenderers,
  hasField,
  registeredFieldTypes,
  type FieldRenderers,
} from './field/registry'
export { registerDefaultFields } from './field/registerDefaults'

// Routers + built-in renderers (usable standalone / for composition)
export { FieldDisplay } from './field/FieldDisplay'
export { FieldInput, isEditable } from './field/FieldInput'
export * from './field/displays'
export * from './field/inputs'

// ── Views ────────────────────────────────────────────────────────────────────
export { DataTable, type DataTableProps } from './table/DataTable'
export { RecordCard, type RecordCardProps } from './table/RecordCard'
export { BoardView, type BoardViewProps } from './board/BoardView'
export {
  RecordDetail,
  RecordForm,
  type RecordDetailProps,
  type RecordFormProps,
} from './record/RecordDetail'
export {
  RecordsView,
  type RecordsViewProps,
  type SavedViews,
} from './view/RecordsView'
export { RecordsToolbar, type RecordsToolbarProps } from './view/Toolbar'
export type { ViewConfig, ViewKind } from './view/types'

// ── Composable primitives (dropdown, checkbox, toggle, calendar) ──────────────
export { Menu, MenuItem, CheckBox, Toggle, Calendar } from './primitives'
export type { MenuProps, MenuItemProps, CheckBoxProps, ToggleProps, CalendarProps } from './primitives'

// ── Pure logic (sort / filter / search / group / view) — host-usable, testable ──
export {
  comparable,
  relationLabel,
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
  OP_LABELS,
  type SortRule,
  type SortDir,
  type FilterRule,
  type FilterOp,
  type Page,
} from './table/logic'
export {
  boardColumns,
  movePatch,
  groupKeyOf,
  groupFieldCandidates,
  defaultGroupField,
  NO_VALUE,
  type BoardColumn,
} from './board/logic'
export {
  applyView,
  emptyView,
  defaultRuleFor,
  addFilter,
  updateFilter,
  removeFilter,
  setSorts,
  cycleColumnSort,
  setSearch,
  setKind,
  setGroupField,
  setColumnOrder,
  toggleFieldHidden,
  upsertView,
  removeView,
  describeView,
} from './view/logic'

// ── Theme ────────────────────────────────────────────────────────────────────
export { tokens, TAG_TONES, tagTone, type TagTone } from './theme'
