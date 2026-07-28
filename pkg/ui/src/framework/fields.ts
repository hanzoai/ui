/**
 * Pure mapping between the Hanzo Framework DocType metadata and @hanzo/data's
 * render model — the brain of the generic DocType renderer. It is the ONE place
 * that translates the engine's Frappe field vocabulary into @hanzo/data's, so
 * EVERY app lane (CMS/ERP/CRM/Helpdesk) renders list/form/detail identically with
 * zero per-doctype code. A new DocType — or a whole new lane — "just works".
 *
 * No I/O, no React — data in, data out, trivially testable (the @hanzo/data
 * imports are `import type`, erased at build, so the unit test runs in plain Node).
 */
import type { FieldDefinition, FieldType, SelectOption } from '@hanzo/data'
import type { DocField, DocType, FrameworkDoc } from './types'
import { REDACTED_MARKER } from './types'

/**
 * Frappe fieldtype → @hanzo/data field type. 1:1 cases; the value shape each
 * needs is handled in `toRecord`/`savePayload` (currency object, boolean, etc).
 * Attach is a single asset URL → `url` (a clickable link + text input); a Table /
 * JSON renders as raw JSON (honest — no silent wrong guess). Password → `text`
 * (write-only; the value is never surfaced, only set).
 */
const TYPE_MAP: Record<DocField['fieldtype'], FieldType> = {
  Data: 'text',
  SmallText: 'text',
  Text: 'longText',
  LongText: 'longText',
  RichText: 'richText',
  Int: 'number',
  Float: 'number',
  Currency: 'currency',
  Check: 'boolean',
  Date: 'date',
  Datetime: 'dateTime',
  Select: 'select',
  Link: 'relation',
  Table: 'json',
  Attach: 'url',
  JSON: 'json',
  Password: 'text',
}

const ACRONYMS = new Set(['id', 'url', 'seo', 'api', 'ip'])

/** `first_name` / `firstName` → "First Name"; known acronyms upper-cased. */
export function humanize(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

/** Select field's newline-separated choices → @hanzo/data options (blank dropped). */
function selectOptions(options: string | undefined): SelectOption[] {
  return (options ?? '')
    .split('\n')
    .map((s) => s.replace(/\r$/, '').trim())
    .filter(Boolean)
    .map((v) => ({ value: v, label: v }))
}

/** Per-field @hanzo/data metadata (select options, currency code, relation target). */
function metadataFor(f: DocField): FieldDefinition['metadata'] | undefined {
  switch (f.fieldtype) {
    case 'Select':
      return { options: selectOptions(f.options) }
    case 'Currency':
      return { currencyCode: 'USD' }
    case 'Int':
      return { decimals: 0 }
    case 'Link':
      return { objectName: f.options }
    default:
      return undefined
  }
}

/** The autoname source field for a `field:xxx` rule (`""` otherwise). */
export function autonameSource(dt: DocType): string {
  const a = (dt.autoname ?? '').trim()
  return a.startsWith('field:') ? a.slice('field:'.length).trim() : ''
}

export interface FieldMapOpts {
  /** Editing an existing record: the autoname-source field is fixed (the URL key). */
  editing?: boolean
}

/**
 * Map a DocType's fields to the ordered `FieldDefinition[]` every @hanzo/data view
 * renders from. Hidden fields are dropped; the engine's readOnly is honored; and
 * when editing an existing record the autoname source (e.g. `slug`) is made
 * read-only because it IS the document's immutable URL key.
 */
export function docTypeToFields(dt: DocType, opts: FieldMapOpts = {}): FieldDefinition[] {
  const src = autonameSource(dt)
  return (dt.fields ?? [])
    .filter((f) => !f.hidden)
    .map((f) => {
      const readOnly = f.readOnly || (opts.editing && f.fieldname === src) || undefined
      const metadata = metadataFor(f)
      return {
        name: f.fieldname,
        label: f.label || humanize(f.fieldname),
        type: TYPE_MAP[f.fieldtype] ?? 'text',
        ...(metadata ? { metadata } : {}),
        ...(readOnly ? { readOnly: true as const } : {}),
      }
    })
}

/** The status field a publishable content type uses (a Select including "Published"). */
export function statusField(dt: DocType): string {
  const f = (dt.fields ?? []).find(
    (x) => x.fieldtype === 'Select' && x.fieldname === 'status' && (x.options ?? '').includes('Published'),
  )
  return f ? f.fieldname : ''
}

/** Fields shown as table columns: the `inListView` subset (all, if none flagged). */
export function listHiddenFields(dt: DocType): string[] {
  const anyListed = (dt.fields ?? []).some((f) => f.inListView)
  if (!anyListed) return []
  return (dt.fields ?? []).filter((f) => !f.inListView && !f.hidden).map((f) => f.fieldname)
}

/** True when a DocType is a media/asset library (a required Attach) → grid view. */
export function isMediaDoctype(dt: DocType): boolean {
  return (dt.fields ?? []).some((f) => f.fieldtype === 'Attach' && f.reqd)
}

/** The primary Attach field name (the asset URL) of a media doctype. */
export function mediaFileField(dt: DocType): string {
  const f = (dt.fields ?? []).find((x) => x.fieldtype === 'Attach' && x.reqd) ?? (dt.fields ?? []).find((x) => x.fieldtype === 'Attach')
  return f ? f.fieldname : ''
}

/** DocTypes belonging to an app lane (module) — a CMS "collection" is one of these. */
export function moduleDoctypes(dts: DocType[], module: string): DocType[] {
  return dts.filter((dt) => (dt.module ?? '') === module)
}

/** The conventional field a collection uses to scope documents to a project. */
export const PROJECT_FIELD = 'project'

/** True when a DocType declares the `project` scope field (→ project filtering works). */
export function hasProjectField(dt: DocType): boolean {
  return (dt.fields ?? []).some((f) => f.fieldname === PROJECT_FIELD)
}

/** A record's human title — the DocType's titleField, else its name. */
export function titleOf(doc: Record<string, unknown>, dt: DocType): string {
  if (dt.titleField && typeof doc[dt.titleField] === 'string' && doc[dt.titleField]) return String(doc[dt.titleField])
  return typeof doc.name === 'string' && doc.name ? doc.name : '(untitled)'
}

/**
 * URL-safe slug from arbitrary text: lower-case, any run of non-alphanumerics
 * collapsed to a single dash, ends trimmed. Guarantees a no-space, `%`-free
 * document name (the engine and the console's own proxy path both require it).
 */
export function slugify(s: unknown): string {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (accents → ASCII)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Valid Pascal/slug DocType name (letters/digits/dash/underscore, alnum-led, no space). */
export function isValidDoctypeName(name: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(name.trim())
}

const secToMs = (v: unknown): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n * 1000 : undefined
}
const numOrNull = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** One field value, framework wire → @hanzo/data display shape. */
function coerceForDisplay(f: DocField, v: unknown): unknown {
  switch (f.fieldtype) {
    case 'Currency':
      return { amount: numOrNull(v), currencyCode: 'USD' }
    case 'Check':
      return v === 1 || v === true || v === '1'
    case 'Datetime':
      return typeof v === 'string' ? v.replace(' ', 'T') : v
    case 'Password':
      return v === REDACTED_MARKER ? '' : v // never surface the marker
    default:
      return v
  }
}

/**
 * A framework document → a flat @hanzo/data record: the field values coerced to
 * their display shapes, plus `id` (the record key every view uses) and the managed
 * envelope. The ONE read mapping every DocType view shares.
 */
export function toRecord(doc: FrameworkDoc, dt: DocType): Record<string, unknown> {
  const rec: Record<string, unknown> = {
    id: doc.name,
    name: doc.name,
    doctype: doc.doctype,
    docstatus: doc.docstatus,
    createdAt: secToMs(doc.createdAt),
    updatedAt: secToMs(doc.updatedAt),
  }
  for (const f of dt.fields ?? []) {
    if (!(f.fieldname in doc)) continue
    rec[f.fieldname] = coerceForDisplay(f, doc[f.fieldname])
  }
  return rec
}

/** One draft value, @hanzo/data edit shape → framework wire. */
function coerceForWrite(f: DocField, v: unknown): unknown {
  switch (f.fieldtype) {
    case 'Currency':
      return v && typeof v === 'object' && 'amount' in v ? Number((v as { amount: unknown }).amount) : Number(v)
    case 'Check':
      return Boolean(v)
    case 'Int':
    case 'Float':
      return Number(v)
    case 'Datetime':
      if (v instanceof Date) return v.toISOString()
      if (typeof v === 'number' && Number.isFinite(v)) return new Date(v).toISOString()
      return v
    case 'Link':
      // The picker stores a plain id (string); an unedited enriched value is
      // {id,label}; a cleared value is null. The engine wants the id string ('' = clear).
      if (v == null || v === '') return ''
      if (typeof v === 'object') return String((v as { id?: unknown; value?: unknown }).id ?? (v as { value?: unknown }).value ?? '')
      return v
    default:
      return v
  }
}

/**
 * Enrich a record's Link values with the target's human label ({id,label}), so a
 * relation renders as its title (not a raw id) in BOTH the list cell and the
 * detail — @hanzo/data's relation display reads `.label`, its input reads `.id`.
 * `optionsByField` is the loaded picker options per Link field (value=id, label=title).
 */
export function enrichLinks(
  record: Record<string, unknown>,
  dt: DocType,
  optionsByField: Record<string, SelectOption[]>,
): Record<string, unknown> {
  const out = { ...record }
  for (const f of dt.fields ?? []) {
    if (f.fieldtype !== 'Link') continue
    const raw = out[f.fieldname]
    if (typeof raw === 'string' && raw) {
      const opt = (optionsByField[f.fieldname] ?? []).find((o) => o.value === raw)
      out[f.fieldname] = { id: raw, label: opt?.label ?? raw }
    }
  }
  return out
}

/** The Link fields of a DocType (their options must be loaded for the picker). */
export function linkFields(dt: DocType): DocField[] {
  return (dt.fields ?? []).filter((f) => f.fieldtype === 'Link')
}

/** A blank create-form draft seeded with each field's declared default (Check → bool). */
export function newDraft(dt: DocType): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of dt.fields ?? []) {
    if (f.default === undefined || f.default === '') continue
    out[f.fieldname] = f.fieldtype === 'Check' ? f.default === '1' || f.default === 'true' : f.default
  }
  return out
}

/**
 * A draft record → the framework write body: editable field values only (the
 * engine owns `name`/`docstatus`/timestamps), each coerced to its wire shape, and
 * the autoname source (e.g. `slug`) slugified so the document name is always URL-
 * safe. Fields left `undefined` are dropped — a partial edit never nulls a value.
 */
export function savePayload(draft: Record<string, unknown>, dt: DocType): Record<string, unknown> {
  const src = autonameSource(dt)
  const out: Record<string, unknown> = {}
  for (const f of dt.fields ?? []) {
    if (f.readOnly) continue // engine-owned; never written back
    let v = draft[f.fieldname]
    if (v === undefined) continue
    v = coerceForWrite(f, v)
    if (f.fieldname === src && typeof v === 'string') v = slugify(v)
    out[f.fieldname] = v
  }
  return out
}
