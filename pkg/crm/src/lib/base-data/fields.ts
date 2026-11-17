/**
 * Pure mapping between a Hanzo Base (hanzoai/base) collection and @hanzo/data:
 * the schema (`baseCollectionToFields` → `FieldDefinition[]`, the column model
 * `DataTable` / `RecordForm` render from) and each value (`fromBase` for what a
 * record holds, `toBase` for what an edit writes back).
 *
 * Base describes a collection as a list of typed fields (modern key `fields`;
 * legacy PocketBase used `schema`, nesting a type's options under `options`). A
 * module's field carries its own `label`, and a select its options with a label
 * and a hue, so a CRM column reads "Last contact" and a stage "Term sheet". The
 * composite types (`fullName`, `emails`, `phones`, `links`, `address`,
 * `currency`, `actor`) are one JSON object of named parts in Base and one value
 * of @hanzo/data's own shape here; `fromBase`/`toBase` are the only crossing.
 *
 * No I/O and no React — data in, data out, trivially testable. The @hanzo/data
 * imports are `import type` (erased at build), so this module pulls in none of
 * its runtime (the unit test runs in plain Node).
 */
import type { FieldDefinition, FieldType, SelectOption, TagColor } from '@hanzo/data'
import { editorText, paragraphs } from './html'

/** One option of a select, as a module declares it. */
export interface BaseOption {
  value: string
  label?: string
  color?: string
  position?: number
}

/** One field of a Base collection schema (modern flat shape + legacy `options`). */
export interface BaseField {
  name: string
  type: string
  label?: string
  position?: number
  required?: boolean
  /** Hidden from the API response — never rendered. */
  hidden?: boolean
  /** System field (`id`, `created`, `updated`, …). Skipped except `id`. */
  system?: boolean
  /** select/file/relation: unset or 1 = single value, >1 = multiple. */
  maxSelect?: number
  /** select: the accepted values. */
  values?: string[]
  /** relation: the collection it points at, by id (or, in a module document, by name). */
  collectionId?: string
  /**
   * A module's select options (`[{ value, label, color }]`), or legacy PocketBase's
   * nested `{ maxSelect, values }`.
   */
  options?: BaseOption[] | ({ maxSelect?: number; values?: string[] } & Record<string, unknown>)
}

/** A Base collection schema. `fields` is canonical; `schema` is the legacy key. */
export interface BaseCollection {
  /** Base collection id — the value a `relation` field targets (`collectionId`). */
  id?: string
  name?: string
  label?: string
  plural?: string
  fields?: BaseField[]
  schema?: BaseField[]
  /** `base` | `auth` | `view` — a `view` collection is read-only. */
  type?: string
  /** Internal Base collection (`_superusers`, `_mfas`, …) — hidden from the browser. */
  system?: boolean
}

/**
 * Base field type → @hanzo/data field type. 1:1 cases only — `select` (single vs
 * multi), `autodate` and `actor` (read-only) carry extra shape and are handled in
 * `toFieldDefinition`.
 */
const TYPE_MAP: Record<string, FieldType> = {
  text: 'text',
  number: 'number',
  bool: 'boolean',
  email: 'email',
  emails: 'email',
  url: 'url',
  links: 'links',
  phones: 'phone',
  fullName: 'fullName',
  address: 'address',
  currency: 'currency',
  editor: 'richText',
  date: 'date',
  json: 'json',
  relation: 'relation',
  file: 'files',
  geoPoint: 'json',
}

/** The hues @hanzo/data draws a tag in; a module's colour outside them is drawn grey. */
const HUES = new Set<string>([
  'red', 'ruby', 'crimson', 'tomato', 'orange', 'amber', 'yellow', 'lime', 'grass', 'green', 'jade', 'mint', 'teal',
  'cyan', 'sky', 'blue', 'iris', 'violet', 'purple', 'plum', 'pink', 'bronze', 'gold', 'brown', 'gray', 'mauve',
  'olive', 'sage', 'sand', 'slate',
])
/** A module's own names for two hues the palette spells otherwise. */
const HUE_ALIAS: Record<string, TagColor> = { turquoise: 'teal' }

/** Words rendered upper-case in a humanized label. */
const ACRONYMS = new Set(['id', 'url', 'uuid', 'api', 'ip'])

/** `firstName` / `first_name` → "First Name"; known acronyms upper-cased (`id` → "ID"). */
function humanize(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

/** The legacy nested options object, when that is what a field carries. */
const legacy = (f: BaseField): { maxSelect?: number; values?: string[] } | undefined =>
  f.options && !Array.isArray(f.options) ? f.options : undefined

/** Effective `maxSelect` of a select/file/relation field (flat shape or legacy `options`). */
const maxSelectOf = (f: BaseField): number => f.maxSelect ?? legacy(f)?.maxSelect ?? 1

/** A select's options: the module's (label, hue, order) where it gives them, else its bare values. */
export function optionsOf(f: BaseField): SelectOption[] {
  const declared = Array.isArray(f.options) ? f.options : []
  const values = f.values ?? legacy(f)?.values ?? declared.map((o) => o.value)
  const byValue = new Map(declared.map((o) => [o.value, o]))
  return values.map((v) => {
    const o = byValue.get(v)
    const hue = o?.color ? (HUE_ALIAS[o.color] ?? (HUES.has(o.color) ? (o.color as TagColor) : undefined)) : undefined
    return { value: v, label: o?.label || v, ...(hue ? { color: hue } : {}) }
  })
}

/** Keep a field unless it is hidden, or a system field other than `id`. */
const isRenderable = (f: BaseField): boolean =>
  typeof f?.name === 'string' && typeof f?.type === 'string' && !f.hidden && (!f.system || f.name === 'id')

/** Options for mapping a schema: how a relation's target collection id reads as its name. */
export interface MapOptions {
  /** Collection id → name, so a relation names the object it points at. */
  names?: ReadonlyMap<string, string>
}

/** Translate ONE Base field to a @hanzo/data `FieldDefinition`. */
function toFieldDefinition(f: BaseField, opts: MapOptions): FieldDefinition {
  const base = { name: f.name, label: f.label || humanize(f.name) }
  // The only system field that survives `isRenderable` is `id` — server-owned, so
  // it renders as a value everywhere and never enters edit mode (no id input).
  const ro = f.system ? { readOnly: true as const } : {}

  if (f.type === 'select') {
    return { ...base, type: maxSelectOf(f) > 1 ? 'multiSelect' : 'select', metadata: { options: optionsOf(f) }, ...ro }
  }
  if (f.type === 'autodate') {
    // Server-assigned create/update timestamps are never user-editable.
    return { ...base, type: 'dateTime', readOnly: true }
  }
  if (f.type === 'actor') return { ...base, type: 'actor', readOnly: true }
  if (f.type === 'relation') {
    const target = f.collectionId ? (opts.names?.get(f.collectionId) ?? f.collectionId) : undefined
    const people = target === 'people' || target === 'candidates'
    return { ...base, type: 'relation', metadata: { objectName: target, shape: people ? 'circle' : 'square' }, ...ro }
  }
  // Unmapped (or future) types render as raw JSON — honest, never a wrong guess.
  return { ...base, type: TYPE_MAP[f.type] ?? 'json', ...ro }
}

/** The raw Base fields of a collection, in the module's order where it states one. */
export function baseFieldsOf(collection: BaseCollection | null | undefined): BaseField[] {
  const raw = collection?.fields ?? collection?.schema ?? []
  if (!Array.isArray(raw)) return []
  const ordered = raw.some((f) => typeof f?.position === 'number')
  return ordered ? [...raw].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : raw
}

/**
 * Map a Base collection schema to the ordered `FieldDefinition[]` a `DataTable`
 * renders. Accepts the modern `fields` key and the legacy `schema` key; skips
 * hidden + system fields (keeping `id`). Total: returns `[]` for an absent or
 * malformed schema.
 */
export function baseCollectionToFields(collection: BaseCollection | null | undefined, opts: MapOptions = {}): FieldDefinition[] {
  return baseFieldsOf(collection)
    .filter(isRenderable)
    .map((f) => toFieldDefinition(f, opts))
}

// ── values ───────────────────────────────────────────────────────────────────
//
// Keyed by the BASE type, which is what decides a value's shape: Base's `email`
// (one address) and `emails` (a primary and others) both read as @hanzo/data's
// `email`, and only the Base type says which to write back.

const str = (v: unknown): string => (v == null ? '' : String(v).trim())
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

/** Micros per major unit of a Base currency amount. */
const MICROS = 1_000_000

/**
 * A Base value as @hanzo/data reads it. A type that is the same on both sides
 * passes through; money and links become @hanzo/data's shape; an expanded
 * relation becomes the record it names, so a cell shows its name, not an id.
 */
export function fromBase(baseType: string, value: unknown, expanded?: unknown): unknown {
  switch (baseType) {
    case 'currency': {
      const v = obj(value)
      if (v.amountMicros == null || v.amountMicros === '') return null
      const micros = Number(v.amountMicros)
      return Number.isFinite(micros) ? { amount: micros / MICROS, currencyCode: str(v.currencyCode) || 'USD' } : null
    }
    case 'links': {
      const v = obj(value)
      const out = [] as { url: string; label?: string }[]
      if (str(v.primaryLinkUrl)) out.push({ url: str(v.primaryLinkUrl), ...(str(v.primaryLinkLabel) ? { label: str(v.primaryLinkLabel) } : {}) })
      for (const l of Array.isArray(v.secondaryLinks) ? v.secondaryLinks : []) {
        const o = obj(l)
        const url = str(o.url ?? o.primaryLinkUrl)
        if (url) out.push({ url, ...(str(o.label) ? { label: str(o.label) } : {}) })
      }
      return out
    }
    case 'relation':
      if (expanded && typeof expanded === 'object') return Array.isArray(expanded) ? (expanded[0] ?? value) : expanded
      return value
    // An editor field is HTML in Base and the words it says here (html.ts).
    case 'editor':
      return typeof value === 'string' ? editorText(value) : value
    default:
      return value
  }
}

/**
 * What an edit writes back to Base for one field. `prior` is the record's current
 * Base value, so a composite keeps the parts the editor does not show (a
 * person's other addresses, a phone's calling code).
 */
export function toBase(baseType: string, value: unknown, prior?: unknown): unknown {
  const was = obj(prior)
  switch (baseType) {
    case 'currency': {
      if (value == null || value === '') return null
      const v = typeof value === 'object' ? obj(value) : { amount: value }
      const amount = Number(v.amount)
      if (v.amount == null || v.amount === '' || !Number.isFinite(amount)) return null
      return { amountMicros: Math.round(amount * MICROS), currencyCode: str(v.currencyCode ?? was.currencyCode) || 'USD' }
    }
    case 'emails': {
      const list = (Array.isArray(value) ? value : str(value).split(/[,;\s]+/)).map((e) => str(e).toLowerCase()).filter(Boolean)
      if (!list.length) return null
      const [primaryEmail, ...rest] = list
      return { primaryEmail, additionalEmails: rest.length ? rest : Array.isArray(was.additionalEmails) ? was.additionalEmails : [] }
    }
    case 'email':
      return (Array.isArray(value) ? str(value[0]) : str(value)).toLowerCase()
    case 'phones': {
      const v = typeof value === 'object' && value ? obj(value) : { number: value }
      const number = str(v.number ?? v.primaryPhoneNumber)
      if (!number) return null
      return {
        primaryPhoneNumber: number,
        primaryPhoneCountryCode: str(v.country ?? v.primaryPhoneCountryCode ?? was.primaryPhoneCountryCode),
        primaryPhoneCallingCode: str(v.callingCode ?? v.primaryPhoneCallingCode ?? was.primaryPhoneCallingCode),
        additionalPhones: Array.isArray(was.additionalPhones) ? was.additionalPhones : [],
      }
    }
    case 'fullName': {
      const words = typeof value === 'string' ? value.trim().split(/\s+/) : null
      const v = words ? { first: words[0], last: words.slice(1).join(' ') } : obj(value)
      const firstName = str(v.first ?? v.firstName)
      const lastName = str(v.last ?? v.lastName)
      return firstName || lastName ? { firstName, lastName } : null
    }
    case 'address': {
      const v = typeof value === 'string' ? { street1: value } : obj(value)
      const pick = (k: string, base: string) => str(v[k] ?? v[base])
      const out = {
        addressStreet1: pick('street1', 'addressStreet1'),
        addressStreet2: pick('street2', 'addressStreet2'),
        addressCity: pick('city', 'addressCity'),
        addressState: pick('state', 'addressState'),
        addressPostcode: pick('postcode', 'addressPostcode'),
        addressCountry: pick('country', 'addressCountry'),
      }
      return Object.values(out).some(Boolean) ? out : null
    }
    case 'links': {
      const list = (Array.isArray(value) ? value : value ? [value] : [])
        .map((l) => (typeof l === 'string' ? { url: l } : obj(l)))
        .map((l) => ({ url: str(l.url), label: str(l.label) }))
        .filter((l) => l.url)
      if (!list.length) return null
      const [first, ...rest] = list
      return { primaryLinkUrl: first.url, primaryLinkLabel: first.label, secondaryLinks: rest }
    }
    case 'relation': {
      const id = (v: unknown) => (v && typeof v === 'object' ? str(obj(v).id ?? obj(v).value) : str(v))
      return Array.isArray(value) ? value.map(id).filter(Boolean) : id(value)
    }
    case 'date': {
      if (value == null || value === '') return ''
      const d = value instanceof Date ? value : new Date(String(value))
      return Number.isNaN(d.getTime()) ? '' : d.toISOString().replace('T', ' ')
    }
    case 'editor':
      return typeof value === 'string' ? paragraphs(value) : value
    default:
      return value
  }
}

/**
 * A record's own value for a field. The hosted Base writes a record's stamps as
 * `createdAt` and `updatedAt` while its schema, its filters and its sorts name them
 * `created` and `updated`; an autodate is read under either.
 */
export const valueOf = (f: Pick<BaseField, 'name' | 'type'>, record: Record<string, unknown>): unknown =>
  f.type === 'autodate' && record[f.name] === undefined ? record[`${f.name}At`] : record[f.name]

/** A whole Base record as @hanzo/data reads it, each relation resolved from `expand`. */
export function recordFromBase(fields: readonly BaseField[], record: Record<string, unknown>): Record<string, unknown> {
  const expand = obj(record.expand)
  const out: Record<string, unknown> = { id: record.id }
  for (const f of fields) out[f.name] = fromBase(f.type, valueOf(f, record), expand[f.name])
  return out
}
