/**
 * Pure logic for the content-type builder — the model + validation + DocType
 * projection for defining a collection's fields on-page. No React, no I/O, so it
 * is unit-tested in plain Node. The builder UI is a thin shell over these.
 *
 * A "collection" is a framework DocType tagged with the lane module; a "field" is
 * a DocField. The builder offers exactly the engine's fieldtypes (mapped to
 * friendly labels), lets the author add/remove/reorder/require fields, and
 * projects the whole thing to a valid `DocType` create body. Names are slugified
 * to field-name rules so a save never 400s on a bad identifier.
 */
import type { DocType, DocField, Fieldtype } from './types'
import { slugify, isValidDoctypeName } from './fields'

/**
 * The builder's field-type vocabulary — every framework fieldtype, with a friendly
 * label + hint. This is the ONE list the "add field" type picker renders, so the
 * builder always offers exactly what the engine accepts (no drift). Order is the
 * author-facing order (common types first).
 */
export const BUILDER_FIELD_TYPES: { type: Fieldtype; label: string; hint: string }[] = [
  { type: 'Data', label: 'Text', hint: 'Single line of text' },
  { type: 'RichText', label: 'Rich text', hint: 'Formatted body (WYSIWYG)' },
  { type: 'LongText', label: 'Long text', hint: 'Multi-line plain text' },
  { type: 'Int', label: 'Number', hint: 'Whole number' },
  { type: 'Float', label: 'Decimal', hint: 'Decimal number' },
  { type: 'Currency', label: 'Currency', hint: 'Money amount' },
  { type: 'Check', label: 'Checkbox', hint: 'True / false' },
  { type: 'Date', label: 'Date', hint: 'Calendar date' },
  { type: 'Datetime', label: 'Date & time', hint: 'Date with time' },
  { type: 'Select', label: 'Select', hint: 'One of a list of options' },
  { type: 'Link', label: 'Relation', hint: 'Reference another collection' },
  { type: 'Attach', label: 'Attachment', hint: 'A file / image URL' },
  { type: 'Table', label: 'Table', hint: 'Repeatable child rows (JSON)' },
  { type: 'JSON', label: 'JSON', hint: 'Arbitrary JSON' },
]

const LABELS: Record<Fieldtype, string> = Object.fromEntries(
  BUILDER_FIELD_TYPES.map((t) => [t.type, t.label]),
) as Record<Fieldtype, string>

/** The friendly label for a fieldtype (falls back to the raw type). */
export function fieldTypeLabel(t: Fieldtype): string {
  return LABELS[t] ?? t
}

/** True when a fieldtype needs `options` (Select choices, Link/Table target). */
export function fieldNeedsOptions(t: Fieldtype): boolean {
  return t === 'Select' || t === 'Link' || t === 'Table'
}

/** One editable row in the builder — a superset of DocField the UI mutates. */
export interface BuilderField {
  /** Stable client key for React (not persisted). */
  key: string
  /** The field's label (author-facing); the fieldname is derived from it. */
  label: string
  type: Fieldtype
  required: boolean
  inListView: boolean
  /** Select → newline-joined choices; Link/Table → target collection name. */
  options: string
}

let seq = 0
/** A fresh, unique client key. */
export function newKey(): string {
  seq += 1
  return `f${seq}_${Math.random().toString(36).slice(2, 8)}`
}

/** A blank field row of a given type. */
export function blankField(type: Fieldtype = 'Data'): BuilderField {
  return { key: newKey(), label: '', type, required: false, inListView: false, options: '' }
}

/**
 * The default starter fields for a NEW content collection: a required Title, a URL
 * Slug (the autoname key), a rich Body, and a Draft/Published Status. The author
 * edits from here. Mirrors the cloud CMS seed so a hand-built collection matches a
 * seeded one.
 */
export function starterFields(): BuilderField[] {
  return [
    { key: newKey(), label: 'Title', type: 'Data', required: true, inListView: true, options: '' },
    { key: newKey(), label: 'Slug', type: 'Data', required: true, inListView: true, options: '' },
    { key: newKey(), label: 'Body', type: 'RichText', required: false, inListView: false, options: '' },
    { key: newKey(), label: 'Status', type: 'Select', required: false, inListView: true, options: 'Draft\nPublished' },
    // Optional project scope — lets a host's org→project switcher filter this collection.
    { key: newKey(), label: 'Project', type: 'Data', required: false, inListView: false, options: '' },
  ]
}

/** An existing DocType → editable builder rows (drops engine-managed fields). */
export function fieldsFromDocType(dt: DocType): BuilderField[] {
  return (dt.fields ?? []).map((f) => ({
    key: newKey(),
    label: f.label || f.fieldname,
    type: f.fieldtype,
    required: Boolean(f.reqd),
    inListView: Boolean(f.inListView),
    options: f.options ?? '',
  }))
}

/** The fieldname derived from a label (slug with underscores; identifier-safe). */
export function fieldNameFromLabel(label: string): string {
  const slug = slugify(label).replace(/-/g, '_')
  // A leading digit isn't a valid identifier lead; prefix it.
  return /^[0-9]/.test(slug) ? `f_${slug}` : slug
}

export interface BuilderValidation {
  ok: boolean
  /** Per-row error keyed by BuilderField.key. */
  fieldErrors: Record<string, string>
  /** A form-level error (name / no-fields). */
  formError: string | null
}

/**
 * Validate the whole builder: the collection name, at least one field, unique
 * non-empty field labels/names, and options present where required. Pure.
 */
export function validateBuilder(name: string, fields: BuilderField[]): BuilderValidation {
  const fieldErrors: Record<string, string> = {}
  let formError: string | null = null

  if (!isValidDoctypeName(name.trim())) {
    formError = 'Enter a collection name with letters, digits, dashes or underscores (no spaces).'
  } else if (fields.length === 0) {
    formError = 'Add at least one field.'
  }

  const seen = new Set<string>()
  for (const f of fields) {
    const label = f.label.trim()
    if (!label) {
      fieldErrors[f.key] = 'Name this field.'
      continue
    }
    const fname = fieldNameFromLabel(label)
    if (!fname) {
      fieldErrors[f.key] = 'Use letters or digits in the field name.'
      continue
    }
    if (seen.has(fname)) {
      fieldErrors[f.key] = `Duplicate field "${fname}".`
      continue
    }
    seen.add(fname)
    if ((f.type === 'Link' || f.type === 'Table') && !f.options.trim()) {
      fieldErrors[f.key] = f.type === 'Link' ? 'Choose the collection to relate to.' : 'Name the child collection.'
    } else if (f.type === 'Select' && !f.options.trim()) {
      fieldErrors[f.key] = 'Add at least one option.'
    }
  }

  return { ok: !formError && Object.keys(fieldErrors).length === 0, fieldErrors, formError }
}

/** A builder row → a framework DocField (drops UI-only bits, coerces options). */
export function toDocField(f: BuilderField): DocField {
  const fieldname = fieldNameFromLabel(f.label)
  const field: DocField = {
    fieldname,
    fieldtype: f.type,
    label: f.label.trim(),
  }
  if (f.required) field.reqd = true
  if (f.inListView) field.inListView = true
  if (fieldNeedsOptions(f.type) && f.options.trim()) field.options = f.options.trim()
  return field
}

/** Move a row within the ordered field list (a no-op at either end). Pure. */
export function moveField(fields: BuilderField[], key: string, dir: -1 | 1): BuilderField[] {
  const i = fields.findIndex((f) => f.key === key)
  const j = i + dir
  if (i < 0 || j < 0 || j >= fields.length) return fields
  const next = [...fields]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/**
 * The builder → a `DocType` create body. Auto-derives `autoname`/`titleField` from
 * conventional fields when present (a `slug` field → `field:slug` naming; a `title`
 * field → the title). Tags the module so the collection joins the lane.
 */
export function toDocType(name: string, module: string, fields: BuilderField[]): DocType {
  const docFields = fields.map(toDocField)
  const byName = new Set(docFields.map((f) => f.fieldname))
  const dt: DocType = { name: name.trim(), module, fields: docFields }
  if (byName.has('slug')) dt.autoname = 'field:slug'
  if (byName.has('title')) dt.titleField = 'title'
  return dt
}
