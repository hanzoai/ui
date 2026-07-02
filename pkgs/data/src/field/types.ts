// The field type system — the universal vocabulary every Base-backed app
// (CRM, CMS, commerce, internal tool) is built from. An "object" is a set of
// typed fields; a "record" is values for those fields; every view (table,
// board, detail) renders from this one model. One source of truth.
//
// Each FieldType maps to exactly one display component (read) and at most one
// input component (edit), resolved through the registry — so adding a type is
// adding one entry, never editing a switch.
import type { ReactElement } from 'react'

/**
 * The built-in field types. Extensible: register a new type's renderers and it
 * works everywhere. Covers the universal CRM/CMS/commerce set; niche types
 * (actor/position/json/files/richText/address/fullName) are declared here so
 * schemas can reference them and slot renderers in incrementally.
 */
export type FieldType =
  | 'text'        // single-line text
  | 'longText'    // multi-line text
  | 'number'      // integer or decimal
  | 'percent'     // 0–100(%), stored as a number
  | 'currency'    // money: { amount, currencyCode }
  | 'boolean'     // true/false toggle
  | 'select'      // one color-tagged option
  | 'multiSelect' // many color-tagged options
  | 'date'        // calendar date (no time)
  | 'dateTime'    // date + time
  | 'email'       // single email address
  | 'url'         // single URL
  | 'links'       // many labelled URLs
  | 'phone'       // phone number
  | 'rating'      // 0–N stars
  | 'relation'    // reference to another record
  | 'json'        // arbitrary JSON
  | 'uuid'        // immutable identifier
  | 'fullName'    // { first, last }
  | 'address'     // postal address
  | 'files'       // file attachments
  | 'richText'    // block/markdown rich text
  | 'position'    // sort order
  | 'actor'       // audit: who/what created the record

/** Tag palette key — resolved to bg/fg by the theme. Brand-neutral by name. */
export type TagColor =
  | 'gray' | 'blue' | 'green' | 'amber' | 'red'
  | 'purple' | 'pink' | 'teal' | 'orange'

/** One option of a select/multiSelect field. */
export interface SelectOption {
  value: string
  label: string
  color?: TagColor
}

/** A labelled URL, for `links`. */
export interface LinkValue {
  url: string
  label?: string
}

/** A money value, for `currency`. */
export interface CurrencyValue {
  /** Major-unit amount (e.g. dollars), not micros — kept simple at the edge. */
  amount: number | null
  /** ISO 4217 code, e.g. "USD". */
  currencyCode: string
}

/** Per-type metadata — the schema knobs each type understands. */
export interface FieldMetadataMap {
  text: { placeholder?: string }
  longText: { placeholder?: string; rows?: number }
  number: { placeholder?: string; decimals?: number; prefix?: string; suffix?: string }
  percent: { decimals?: number }
  currency: { currencyCode?: string; decimals?: number }
  boolean: { trueLabel?: string; falseLabel?: string }
  select: { options: SelectOption[] }
  multiSelect: { options: SelectOption[] }
  date: { display?: 'relative' | 'absolute' }
  dateTime: { display?: 'relative' | 'absolute' }
  email: { placeholder?: string }
  url: { placeholder?: string }
  links: Record<string, never>
  phone: { placeholder?: string }
  rating: { max?: number }
  // objectName/labelField name the target; options are the candidate records the
  // host injects ({value: id, label: display}); maxSelect>1 (or 0) = to-many.
  relation: { objectName?: string; labelField?: string; options?: SelectOption[]; maxSelect?: number }
  json: Record<string, never>
  uuid: Record<string, never>
  fullName: Record<string, never>
  address: Record<string, never>
  files: { accept?: string; maxSelect?: number }
  richText: Record<string, never>
  position: Record<string, never>
  actor: Record<string, never>
}

export type FieldMetadata<T extends FieldType = FieldType> = FieldMetadataMap[T]

/**
 * A field's definition — the schema unit. Mirrors a Base collection field:
 * a stable `name`, a human `label`, a `type`, and type-specific `metadata`.
 */
export interface FieldDefinition<T extends FieldType = FieldType> {
  /** Stable key — the record property / collection field name. */
  name: string
  /** Human-readable column/label text. */
  label: string
  /** Drives which display + input render. */
  type: T
  /** Type-specific options (select options, currency code, …). */
  metadata?: FieldMetadata<T>
  /** When true, the field never enters edit mode. */
  readOnly?: boolean
  /** Fixed pixel width when used as a table column; otherwise it flexes. */
  width?: number
}

// ── Component contracts ──────────────────────────────────────────────────────
// Display + Input are intentionally tiny and value-agnostic: each component
// owns the coercion of `value` for its own type, so they stay standalone and
// composable. The router (FieldDisplay/FieldInput) only resolves by type.

export interface FieldDisplayProps {
  field: FieldDefinition
  /** The record's raw value for this field — each component coerces it. */
  value: unknown
}

export interface FieldInputProps {
  field: FieldDefinition
  value: unknown
  /** Emit the next value. The host owns persistence (draft vs save). */
  onChange: (value: unknown) => void
  /** Commit (Enter / blur). */
  onSubmit?: () => void
  /** Discard (Escape). */
  onCancel?: () => void
  autoFocus?: boolean
}

export type FieldDisplayComponent = (props: FieldDisplayProps) => ReactElement | null
export type FieldInputComponent = (props: FieldInputProps) => ReactElement | null
