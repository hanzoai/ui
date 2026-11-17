/**
 * A @hanzo/data view as a Base query: its search, its filter rules (by every or
 * any), and its sort, written in Base's own filter and sort language so the
 * server does the work and the browser holds one page.
 *
 * Each rule compiles from the field's BASE type, because that is what decides how
 * Base reaches the value: a person's name is a JSON object searched across its
 * parts (`name ~ "ada"`), money is compared by its micros (`amount.amountMicros
 * >= 1000000000`), a primary address is one part (`emails.primaryEmail = …`), and
 * a calendar day is a range of stamps. A rule that is not finished (no operand
 * yet) is left out, as the table's own logic leaves it out.
 *
 * Pure: data in, a string out.
 */
import type { FilterRule, SortRule } from '@hanzo/data'
import type { BaseField } from './fields'

/** What a view holds that a query reads. */
export interface QueryView {
  filters: FilterRule[]
  match?: 'and' | 'or'
  sorts: SortRule[]
  search?: string
}

/** A Base list query's `filter` and `sort`, each empty when the view asks nothing. */
export interface BaseQuery {
  filter: string
  sort: string
}

/** A string literal in Base's filter language. */
export function lit(v: unknown): string {
  return `"${String(v ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null
  if (typeof v === 'object' && !Array.isArray(v) && 'amount' in (v as object)) return num((v as { amount: unknown }).amount)
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** A day (YYYY-MM-DD) from a date operand, or '' when it names none. */
export function dayOf(v: unknown): string {
  if (v == null || v === '') return ''
  const s = String(v).trim()
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

const start = (day: string) => lit(`${day} 00:00:00.000Z`)
const end = (day: string) => lit(`${day} 23:59:59.999Z`)

/**
 * The parts of each composite a person searches. A "contains" over the whole
 * value would read its JSON text, keys and all, so "first" would find every
 * person (`{"firstName":…}`): a composite is searched part by part instead.
 */
const TEXT_PARTS: Record<string, string[]> = {
  fullName: ['firstName', 'lastName'],
  emails: ['primaryEmail', 'additionalEmails'],
  phones: ['primaryPhoneNumber', 'additionalPhones'],
  links: ['primaryLinkUrl', 'primaryLinkLabel'],
  address: ['addressStreet1', 'addressCity', 'addressState', 'addressPostcode', 'addressCountry'],
}
const COMPOSITE_TEXT = new Set(Object.keys(TEXT_PARTS))

/** Whether a field's text holds `q`: across a composite's parts, or the field itself. */
function contains(field: BaseField, q: string, negate = false): string {
  const parts = TEXT_PARTS[field.type]
  if (!parts) return `${field.type === 'actor' ? `${field.name}.name` : field.name} ${negate ? '!~' : '~'} ${lit(q)}`
  // A part a record leaves out reads as NULL, which "does not contain" must count as not containing.
  return negate
    ? and(parts.map((p) => `(${field.name}.${p} = null || ${field.name}.${p} !~ ${lit(q)})`))
    : or(parts.map((p) => `${field.name}.${p} ~ ${lit(q)}`))
}

/** The part a composite's "is" compares, where the composite has one that is the value. */
const PRIMARY: Record<string, string> = { emails: 'primaryEmail', phones: 'primaryPhoneNumber', links: 'primaryLinkUrl' }

/** The part a relation is read by when searched or sorted: its target's name. */
const LABEL = 'name'

const and = (xs: string[]) => (xs.length === 1 ? xs[0] : `(${xs.join(' && ')})`)
const or = (xs: string[]) => (xs.length === 1 ? xs[0] : `(${xs.join(' || ')})`)

const set = (v: unknown): string[] => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]).map((x) => (x && typeof x === 'object' ? String((x as { id?: unknown; value?: unknown }).id ?? (x as { value?: unknown }).value ?? '') : String(x))).filter(Boolean)

const range = (v: unknown): [unknown, unknown] => {
  const pair = Array.isArray(v) ? v : []
  const end_ = (x: unknown) => (x == null || x === '' ? undefined : x)
  return [end_(pair[0]), end_(pair[1])]
}

/** One rule as a Base filter expression, or '' when it constrains nothing yet. */
export function ruleFilter(field: BaseField, rule: FilterRule): string {
  const f = field.name
  const op = rule.op
  const t = field.type

  if (op === 'isEmpty' || op === 'isNotEmpty') {
    const empty = op === 'isEmpty'
    if (t === 'number') return empty ? `${f} = 0` : `${f} != 0`
    if (t === 'currency') return empty ? `${f}.amountMicros = null` : `${f}.amountMicros != null`
    if (t === 'bool') return empty ? `${f} = false` : `${f} = true`
    if (COMPOSITE_TEXT.has(t)) {
      // An empty composite is NULL; one with a primary part may also hold it blank.
      const part = PRIMARY[t]
      if (!part) return `${f} ${empty ? '=' : '!='} null`
      return empty ? or([`${f} = null`, `${f}.${part} = ""`]) : and([`${f} != null`, `${f}.${part} != ""`])
    }
    return `${f} ${empty ? '=' : '!='} ""`
  }

  if (t === 'number' || t === 'currency') {
    const path = t === 'currency' ? `${f}.amountMicros` : f
    const scale = (n: number) => (t === 'currency' ? Math.round(n * 1_000_000) : n)
    if (op === 'between') {
      const [lo, hi] = range(rule.value).map(num)
      const parts = [lo != null ? `${path} >= ${scale(lo)}` : '', hi != null ? `${path} <= ${scale(hi)}` : ''].filter(Boolean)
      return parts.length ? and(parts) : ''
    }
    const n = num(rule.value)
    if (n == null) return ''
    const cmp: Partial<Record<FilterRule['op'], string>> = { is: '=', isNot: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' }
    return cmp[op] ? `${path} ${cmp[op]} ${scale(n)}` : ''
  }

  if (t === 'date' || t === 'autodate') {
    if (op === 'between') {
      const [lo, hi] = range(rule.value).map(dayOf)
      const parts = [lo ? `${f} >= ${start(lo)}` : `${f} != ""`, hi ? `${f} <= ${end(hi)}` : ''].filter(Boolean)
      return lo || hi ? and(parts) : ''
    }
    const day = dayOf(rule.value)
    if (!day) return ''
    switch (op) {
      case 'is': return and([`${f} >= ${start(day)}`, `${f} <= ${end(day)}`])
      case 'isNot': return or([`${f} < ${start(day)}`, `${f} > ${end(day)}`])
      case 'gt': return `${f} > ${end(day)}`
      case 'gte': return `${f} >= ${start(day)}`
      // A date left empty is "", which sorts before every day: "before" is only a day that is set.
      case 'lt': return and([`${f} != ""`, `${f} < ${start(day)}`])
      case 'lte': return and([`${f} != ""`, `${f} <= ${end(day)}`])
      default: return ''
    }
  }

  if (t === 'bool') {
    if (rule.value == null || rule.value === '') return ''
    const on = rule.value === true || rule.value === 'true' || rule.value === 1
    return op === 'isNot' ? `${f} != ${on}` : `${f} = ${on}`
  }

  if (t === 'select' || t === 'relation') {
    const multi = (field.maxSelect ?? 1) > 1
    const values = set(rule.value)
    if (!values.length) return ''
    const eq = multi ? '?=' : '='
    if (op === 'isAnyOf') return or(values.map((v) => `${f} ${eq} ${lit(v)}`))
    if (op === 'is') return `${f} ${eq} ${lit(values[0])}`
    if (op === 'isNot') return multi ? `${f} !~ ${lit(values[0])}` : `${f} != ${lit(values[0])}`
    // A relation searched by words reads its target's name.
    if (t === 'relation' && op === 'contains') return or(relationPaths(field).map((p) => `${p} ~ ${lit(values[0])}`))
    if (t === 'relation' && op === 'notContains') return and(relationPaths(field).map((p) => `${p} !~ ${lit(values[0])}`))
    return ''
  }

  const text = rule.value == null ? '' : String(Array.isArray(rule.value) ? rule.value[0] ?? '' : rule.value).trim()
  if (!text) return ''
  const part = PRIMARY[t]
  const exact = t === 'emails' || t === 'email' ? text.toLowerCase() : text
  switch (op) {
    case 'contains': return contains(field, text)
    case 'notContains': return contains(field, text, true)
    // A composite with no single part that is its value (a name, an address) is matched by its words.
    case 'is': return part ? `${f}.${part} = ${lit(exact)}` : COMPOSITE_TEXT.has(t) ? contains(field, text) : `${t === 'actor' ? `${f}.name` : f} = ${lit(exact)}`
    case 'isNot': return part ? `${f}.${part} != ${lit(exact)}` : COMPOSITE_TEXT.has(t) ? contains(field, text, true) : `${t === 'actor' ? `${f}.name` : f} != ${lit(exact)}`
    default: return ''
  }
}

/** The Base types a quick search reads. */
const SEARCHED = new Set(['text', 'email', 'url', 'fullName', 'emails', 'phones', 'links', 'address'])

/**
 * The parts a relation is read by when searched or sorted: what it points at is
 * named by its field (a CRM `company` is a company, a `contact` or `person` a
 * person), and a person's name is two parts.
 */
export function relationPaths(field: BaseField): string[] {
  if (/^(contact|person|people)$/.test(field.name)) return [`${field.name}.name.firstName`, `${field.name}.name.lastName`]
  return [`${field.name}.${LABEL}`]
}

/** A quick search across every text field of a collection, and the names of what it relates to. */
export function searchFilter(fields: readonly BaseField[], search: string | undefined): string {
  const q = (search ?? '').trim()
  if (!q) return ''
  const reads = fields.filter((f) => !f.hidden && SEARCHED.has(f.type)).map((f) => contains(f, q))
  const related = fields
    .filter((f) => f.type === 'relation' && !f.hidden && (f.maxSelect ?? 1) <= 1 && /^(company|contact|person)$/.test(f.name))
    .flatMap((f) => relationPaths(f).map((p) => `${p} ~ ${lit(q)}`))
  const all = [...reads, ...related]
  return all.length ? or(all) : ''
}

/** A sort rule as Base names it: a composite by its part a person reads first. */
const SORT_PART: Record<string, string> = {
  fullName: 'firstName',
  emails: 'primaryEmail',
  phones: 'primaryPhoneNumber',
  links: 'primaryLinkUrl',
  address: 'addressCity',
  currency: 'amountMicros',
  actor: 'name',
}

export function sortOf(fields: readonly BaseField[], sorts: SortRule[]): string {
  const byName = new Map(fields.map((f) => [f.name, f]))
  return sorts
    .map((s) => {
      const f = byName.get(s.field)
      if (!f) return ''
      const path = SORT_PART[f.type] ? `${f.name}.${SORT_PART[f.type]}` : f.type === 'relation' ? relationPaths(f)[0] : f.name
      return `${s.dir === 'desc' ? '-' : ''}${path}`
    })
    .filter(Boolean)
    .join(',')
}

/**
 * The view as one Base query. `scope` is what every row must also meet (a
 * pipeline, a list's members), ANDed outside the view's own rules, so an `or`
 * view never reaches past it.
 */
export function baseQuery(fields: readonly BaseField[], view: QueryView, scope?: string): BaseQuery {
  const byName = new Map(fields.map((f) => [f.name, f]))
  const rules = view.filters
    .map((r) => {
      const f = byName.get(r.field)
      return f ? ruleFilter(f, r) : ''
    })
    .filter(Boolean)
  const matched = rules.length ? (view.match === 'or' ? or(rules) : and(rules)) : ''
  const parts = [scope ?? '', searchFilter(fields, view.search), matched].filter(Boolean)
  return { filter: parts.length ? and(parts) : '', sort: sortOf(fields, view.sorts) }
}
