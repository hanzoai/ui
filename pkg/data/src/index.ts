// @hanzo/data — the cross-platform, metadata-driven data-app layer.
//
// One model (typed fields → records → views) powers any Base-backed app: CRM,
// CMS, commerce, internal tools. Built on @hanzo/gui so the same components run on
// web, native (iOS), and desktop. Drawn with @hanzo/ui's record kit, so its cells,
// cards and editors are the kit's and follow the host's theme and density.
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
  AddressValue,
  FullNameValue,
  ActorValue,
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

// The lists the phone, address and currency editors pick from, for a host's own
// settings (a default country, a default currency): built from Intl in the
// reader's language, with each region's E.164 calling code.
export { regions, currencies, type Region, type Currency } from './field/regions'
export { CALLING } from './field/calling'

// ── Views ────────────────────────────────────────────────────────────────────
export { DataTable, type DataTableProps, type RemotePage } from './table/DataTable'
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
export { Operand, operandField, operandText, takesOperand, type OperandProps } from './view/Operand'
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
  isActiveRule,
  rangeOf,
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
  type FilterMatch,
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
  setMatch,
  otherMatch,
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
