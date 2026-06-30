// @hanzo/data — the cross-platform, metadata-driven data-app layer.
//
// One model (typed fields → records → views) powers any Base-backed app: CRM,
// CMS, commerce, internal tools. Built on @hanzo/gui so the same components run
// on web, native (iOS), and desktop. Importing the package registers the
// built-in field renderers; register more to extend.
//
//   import { DataTable, RecordForm, FieldDisplay, registerField } from '@hanzo/data'

// Register the built-in field renderers as a side effect of importing the lib.
import './field/registerDefaults'

// Field model + contracts
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

// Routers
export { FieldDisplay } from './field/FieldDisplay'
export { FieldInput, isEditable } from './field/FieldInput'

// Built-in renderers (also usable standalone / for composition)
export * from './field/displays'
export * from './field/inputs'

// Views
export { DataTable, type DataTableProps } from './table/DataTable'
export { RecordCard, type RecordCardProps } from './table/RecordCard'
export {
  RecordDetail,
  RecordForm,
  type RecordDetailProps,
  type RecordFormProps,
} from './record/RecordDetail'

// Theme
export { tokens, TAG_TONES, tagTone, type TagTone } from './theme'
