/**
 * CSV in and out of the CRM, and the one rule an import keeps: a person is their
 * address and a company its domain, so importing the same file twice, or a file
 * that names someone the CRM already holds, never makes a second record.
 *
 * Ids are derived exactly as the cloud derives them (apps/crm base.go `recordID`:
 * the first 15 hex characters of SHA-256 over kind, a NUL, and the key), so a
 * person imported here is the same record a form, a sent mail or the drip later
 * files on. Pure, apart from WebCrypto's digest.
 */
import type { FieldDefinition } from '@hanzo/data'

// ── parse and write ─────────────────────────────────────────────────────────

/** Rows of a CSV file (RFC 4180: quoted fields, doubled quotes, CRLF or LF, a leading BOM). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += c
      continue
    }
    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** One CSV cell: quoted when it must be, and never read by a spreadsheet as a formula. */
export function csvCell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

// ── a value as text ─────────────────────────────────────────────────────────

const s = (v: unknown): string => (v == null ? '' : String(v))
const o = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

/** A value as a person reads it in a cell, for an export. Values are @hanzo/data's (see base-data `fromBase`). */
export function cellText(field: FieldDefinition, value: unknown): string {
  if (value == null || value === '') return ''
  switch (field.type) {
    case 'fullName': {
      const n = o(value)
      return [s(n.first ?? n.firstName), s(n.last ?? n.lastName)].filter(Boolean).join(' ')
    }
    case 'email': {
      const e = o(value)
      return Array.isArray(value) ? value.map(s).join('; ') : 'primaryEmail' in e ? [s(e.primaryEmail), ...(Array.isArray(e.additionalEmails) ? e.additionalEmails.map(s) : [])].filter(Boolean).join('; ') : s(value)
    }
    case 'phone': {
      const p = o(value)
      return 'primaryPhoneNumber' in p ? [p.primaryPhoneCallingCode ? `+${s(p.primaryPhoneCallingCode).replace(/^\+/, '')}` : '', s(p.primaryPhoneNumber)].filter(Boolean).join(' ') : s(value)
    }
    case 'links':
      return (Array.isArray(value) ? value : [value]).map((l) => (typeof l === 'string' ? l : s(o(l).url))).filter(Boolean).join('; ')
    case 'address': {
      const a = o(value)
      return ['addressStreet1', 'addressStreet2', 'addressCity', 'addressState', 'addressPostcode', 'addressCountry'].map((k) => s(a[k] ?? a[k.replace('address', '').replace(/^./, (c) => c.toLowerCase())])).filter(Boolean).join(', ')
    }
    case 'currency': {
      const c = o(value)
      return c.amount == null ? '' : `${s(c.amount)} ${s(c.currencyCode)}`.trim()
    }
    case 'select':
    case 'multiSelect': {
      const opts = (field.metadata as { options?: { value: string; label: string }[] } | undefined)?.options ?? []
      return (Array.isArray(value) ? value : [value]).map((v) => opts.find((x) => x.value === v)?.label ?? s(v)).join('; ')
    }
    case 'relation': {
      const rec = o(value)
      if (!Object.keys(rec).length) return Array.isArray(value) ? value.map(s).join('; ') : s(value)
      return cellText({ ...field, type: 'fullName' }, rec.name) || s(rec.name ?? rec.title ?? rec.id)
    }
    case 'actor':
      return s(o(value).name)
    case 'boolean':
      return value === true || value === 'true' ? 'yes' : 'no'
    case 'date':
    case 'dateTime':
      return s(value).slice(0, field.type === 'date' ? 10 : 19).replace('T', ' ')
    default:
      return typeof value === 'object' ? JSON.stringify(value) : s(value)
  }
}

// ── ids ─────────────────────────────────────────────────────────────────────

/** The cloud's record id: 15 hex characters of SHA-256 over kind, NUL, key. */
export async function recordId(kind: string, key: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${kind}\u0000${key}`)
  const sum = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return [...sum].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 15)
}

/** The person an address is (cloud apps/crm `personID`). */
export const personId = (email: string): Promise<string> => recordId('person', email.trim().toLowerCase())

/** The company a domain is. */
export const companyId = (domain: string): Promise<string> => recordId('company', domain)

// ── an import ───────────────────────────────────────────────────────────────

/** What a column of the file becomes. */
export type Target =
  | 'skip'
  | 'name' | 'firstName' | 'lastName' | 'email' | 'phone' | 'job_title' | 'company' | 'domain' | 'linkedin' | 'x'
  | 'city' | 'country' | 'type' | 'source' | 'owner' | 'employees' | 'note'

export const TARGETS: { value: Target; label: string; for: ('people' | 'companies')[] }[] = [
  { value: 'skip', label: 'Do not import', for: ['people', 'companies'] },
  { value: 'name', label: 'Name', for: ['people', 'companies'] },
  { value: 'firstName', label: 'First name', for: ['people'] },
  { value: 'lastName', label: 'Last name', for: ['people'] },
  { value: 'email', label: 'Email', for: ['people'] },
  { value: 'phone', label: 'Phone', for: ['people'] },
  { value: 'job_title', label: 'Job title', for: ['people'] },
  { value: 'company', label: 'Company', for: ['people'] },
  { value: 'domain', label: 'Domain or website', for: ['people', 'companies'] },
  { value: 'linkedin', label: 'LinkedIn', for: ['people', 'companies'] },
  { value: 'x', label: 'X', for: ['people', 'companies'] },
  { value: 'city', label: 'City', for: ['people', 'companies'] },
  { value: 'country', label: 'Country', for: ['people', 'companies'] },
  { value: 'type', label: 'Type', for: ['people', 'companies'] },
  { value: 'source', label: 'Source', for: ['people'] },
  { value: 'owner', label: 'Owner', for: ['people', 'companies'] },
  { value: 'employees', label: 'Employees', for: ['companies'] },
  { value: 'note', label: 'Note', for: ['people', 'companies'] },
]

const GUESS: [RegExp, Target][] = [
  [/^(e-?mail|email address|work email|primary email|mail)$/, 'email'],
  [/^(first|first name|given name|firstname)$/, 'firstName'],
  [/^(last|last name|surname|family name|lastname)$/, 'lastName'],
  [/^(name|full name|contact|contact name|person|investor|investor name)$/, 'name'],
  [/^(phone|mobile|phone number|tel|telephone)$/, 'phone'],
  [/^(title|job title|role|position)$/, 'job_title'],
  [/^(company|company name|organization|organisation|firm|fund|account)$/, 'company'],
  [/^(domain|website|url|web|site|company domain|homepage)$/, 'domain'],
  [/^(linkedin|linkedin url|linkedin profile)$/, 'linkedin'],
  [/^(x|twitter|x handle|twitter handle)$/, 'x'],
  [/^(city|town)$/, 'city'],
  [/^(country|country code)$/, 'country'],
  [/^(type|category|kind|segment)$/, 'type'],
  [/^(source|lead source|origin)$/, 'source'],
  [/^(owner|assigned to|account owner)$/, 'owner'],
  [/^(employees|headcount|employee count|size)$/, 'employees'],
  [/^(note|notes|comment|comments|description)$/, 'note'],
]

/** What a column most likely is, by its header. */
export function guessTarget(header: string, object: 'people' | 'companies'): Target {
  const h = header.trim().toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ')
  const hit = GUESS.find(([re]) => re.test(h))?.[1] ?? 'skip'
  // For a company file, the company column is its name.
  if (object === 'companies' && hit === 'company') return 'name'
  return TARGETS.find((t) => t.value === hit)?.for.includes(object) ? hit : 'skip'
}

/** A domain from a website, an address or a bare domain: `https://www.Acme.com/x` is `acme.com`. */
export function domainOf(v: string): string {
  const t = v.trim().toLowerCase()
  if (!t) return ''
  const at = t.includes('@') && !t.includes('/') ? t.split('@').pop()! : t
  return at.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[/?#:]/)[0]
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The domains a person's work address does not name a company by. */
const FREE = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'yandex.com', 'qq.com', '163.com'])

/** One row read against the mapping: the values a record is made of. */
export type Row = Partial<Record<Exclude<Target, 'skip'>, string>>

export function readRow(cells: string[], mapping: Target[]): Row {
  const out: Row = {}
  mapping.forEach((t, i) => {
    if (t === 'skip') return
    const v = (cells[i] ?? '').trim()
    if (v && !out[t]) out[t] = v
  })
  return out
}

/** What an import will write, before it writes anything. */
export interface Plan {
  /** One per distinct key, the rows that named it merged in file order. */
  rows: { key: string; row: Row }[]
  /** Rows whose key repeats an earlier row's, merged into it. */
  merged: number
  /** Rows with no key the object is identified by, or an address that is not one. */
  invalid: { line: number; why: string }[]
}

/**
 * Rows grouped by what identifies the record: a person by their address (a row
 * without one cannot be told from anyone else, so it is not imported), a company
 * by its domain, or by its name when the file gives none. A later row fills only
 * what earlier rows left empty.
 */
export function plan(rows: Row[], object: 'people' | 'companies'): Plan {
  const byKey = new Map<string, Row>()
  const order: string[] = []
  const invalid: Plan['invalid'] = []
  let merged = 0
  rows.forEach((row, i) => {
    let key = ''
    if (object === 'people') {
      const email = (row.email ?? '').toLowerCase().replace(/^mailto:/, '')
      if (!email) return invalid.push({ line: i + 2, why: 'no email' })
      if (!EMAIL.test(email)) return invalid.push({ line: i + 2, why: `"${row.email}" is not an email address` })
      row = { ...row, email }
      key = email
    } else {
      key = domainOf(row.domain ?? '') || (row.name ?? '').trim().toLowerCase()
      if (!key) return invalid.push({ line: i + 2, why: 'no name or domain' })
    }
    const held = byKey.get(key)
    if (held) {
      merged++
      for (const [k, v] of Object.entries(row) as [keyof Row, string][]) if (!held[k]) held[k] = v
    } else {
      byKey.set(key, { ...row })
      order.push(key)
    }
  })
  return { rows: order.map((key) => ({ key, row: byKey.get(key)! })), merged, invalid }
}

/** A row as a Base record of `people`. `company` is the company's id when the row names one. */
export function personRecord(row: Row, company?: string): Record<string, unknown> {
  const words = (row.name ?? '').trim().split(/\s+/).filter(Boolean)
  const first = row.firstName ?? words[0] ?? ''
  const last = row.lastName ?? words.slice(1).join(' ')
  const rec: Record<string, unknown> = { emails: { primaryEmail: row.email, additionalEmails: [] } }
  if (first || last) rec.name = { firstName: first, lastName: last }
  if (row.phone) rec.phones = { primaryPhoneNumber: row.phone, primaryPhoneCountryCode: '', primaryPhoneCallingCode: '', additionalPhones: [] }
  if (row.job_title) rec.job_title = row.job_title
  if (row.linkedin) rec.linkedin = link(row.linkedin)
  if (row.x) rec.x = link(row.x)
  if (row.city || row.country) rec.address = { addressCity: row.city ?? '', addressCountry: row.country ?? '' }
  if (row.type) rec.type = row.type.toLowerCase()
  if (row.source) rec.source = row.source
  if (row.owner) rec.owner = row.owner
  if (company) rec.company = company
  return rec
}

/** A row as a Base record of `companies`. */
export function companyRecord(row: Row): Record<string, unknown> {
  const rec: Record<string, unknown> = { name: row.name ?? row.company ?? domainOf(row.domain ?? '') }
  if (row.domain) rec.domain = link(domainOf(row.domain))
  if (row.linkedin) rec.linkedin = link(row.linkedin)
  if (row.x) rec.x = link(row.x)
  if (row.city || row.country) rec.address = { addressCity: row.city ?? '', addressCountry: row.country ?? '' }
  if (row.type) rec.type = row.type.toLowerCase()
  if (row.owner) rec.owner = row.owner
  if (row.employees && Number.isFinite(Number(row.employees.replace(/[, ]/g, '')))) rec.employees = Number(row.employees.replace(/[, ]/g, ''))
  return rec
}

/** The company a person's row names: the domain it gives, else their work address's. */
export function companyKey(row: Row): { domain: string; name: string } | null {
  const domain = domainOf(row.domain ?? '') || (row.email && !FREE.has(domainOf(row.email)) ? domainOf(row.email) : '')
  const name = (row.company ?? '').trim()
  if (!domain && !name) return null
  return { domain, name: name || domain }
}

function link(v: string): Record<string, unknown> {
  const t = v.trim()
  return { primaryLinkUrl: t.includes('://') ? t : `https://${t}`, primaryLinkLabel: '', secondaryLinks: [] }
}

/**
 * What a record the CRM already holds gains from a row: only the fields it has
 * empty. A record the team has worked keeps what they gave it.
 */
export function fillEmpty(held: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> {
  const empty = (v: unknown): boolean =>
    v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.values(v as object).every((x) => x == null || x === '' || (Array.isArray(x) && x.length === 0)))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(incoming)) if (k !== 'emails' && empty(held[k]) && !empty(v)) out[k] = v
  return out
}
