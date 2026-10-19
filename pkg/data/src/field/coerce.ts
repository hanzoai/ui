// Value coercion — the one place a raw record value becomes what a field shows.
//
// Pure: no React, no gui, no DOM. The displays and editors read through here, and
// so do the sort and filter logic (table/logic.ts), so a value sorts by exactly
// the text a cell shows. Every function tolerates any input — a record from an
// import, an API or an older schema — and answers its empty value rather than
// throwing.
import type { ActorValue, AddressValue, FullNameValue, LinkValue } from './types'
import { CALLING } from './calling'

export const asStr = (v: unknown): string => (v == null ? '' : String(v))

export const asNum = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v])

/** A calendar day `YYYY-MM-DD`, or ''. A day is not an instant: it never moves with a time zone. */
export const asDay = (v: unknown): string => {
  if (v == null || v === '') return ''
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10)
  const s = String(v)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

/** An instant, or null. */
export const asDate = (v: unknown): Date | null => {
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v as string | number)
  return Number.isNaN(d.getTime()) ? null : d
}

/** `{ first, last }` from either spelling, or a "First Last" string split at the first space. */
export const asName = (v: unknown): FullNameValue => {
  if (v == null || v === '') return {}
  if (typeof v === 'string') {
    const t = v.trim()
    const i = t.indexOf(' ')
    return i < 0 ? { first: t } : { first: t.slice(0, i), last: t.slice(i + 1).trim() }
  }
  if (typeof v !== 'object') return { first: String(v) }
  const r = v as Record<string, unknown>
  return { first: asStr(r.first ?? r.firstName).trim() || undefined, last: asStr(r.last ?? r.lastName).trim() || undefined }
}

export const nameText = (v: unknown): string => {
  const n = asName(v)
  return [n.first, n.last].filter(Boolean).join(' ')
}

/** The address parts a postal line is drawn from, in reading order. */
export const ADDRESS_PARTS = ['street1', 'street2', 'city', 'state', 'postcode', 'country'] as const

export const asAddress = (v: unknown): AddressValue => {
  if (v == null || v === '') return {}
  if (typeof v === 'string') return { street1: v }
  const r = v as Record<string, unknown>
  const out: AddressValue = {}
  // Twenty's composite spells them addressStreet1 … addressCountry; read both.
  const alias: Record<(typeof ADDRESS_PARTS)[number], string> = {
    street1: 'addressStreet1',
    street2: 'addressStreet2',
    city: 'addressCity',
    state: 'addressState',
    postcode: 'addressPostcode',
    country: 'addressCountry',
  }
  for (const k of ADDRESS_PARTS) {
    const s = asStr(r[k] ?? r[alias[k]]).trim()
    if (s) out[k] = s
  }
  return out
}

/** A country as a reader names it: ISO alpha-2 through Intl.DisplayNames, anything else as written. */
export const countryName = (code: string | undefined, locale?: string): string => {
  if (!code) return ''
  if (!/^[A-Za-z]{2}$/.test(code)) return code
  try {
    return new Intl.DisplayNames(locale ? [locale] : undefined, { type: 'region' }).of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

/** One comma-joined line of the parts present. */
export const addressText = (v: unknown, locale?: string): string => {
  const a = asAddress(v)
  return ADDRESS_PARTS.map((k) => (k === 'country' ? countryName(a.country, locale) : a[k])).filter(Boolean).join(', ')
}

/** Links from a URL string, a `{url, label}`, or a list of either. */
export const asLinks = (v: unknown): LinkValue[] =>
  asArray(v)
    .map((l) => (typeof l === 'string' ? { url: l } : (l as LinkValue)))
    .filter((l): l is LinkValue => !!l && typeof l.url === 'string' && l.url.trim() !== '')

/** A URL's host without `www.`, for a pill; the input itself when it is not a URL. */
export const hostOf = (url: string): string => {
  const raw = url.trim()
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`)
    return u.host.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname.replace(/\/$/, '') : '')
  } catch {
    return raw
  }
}

/** A link target a browser can follow: a bare domain gains https://; a `javascript:` URL is refused. */
export const safeHref = (url: string): string | undefined => {
  const raw = url.trim()
  if (!raw) return undefined
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    const u = new URL(withScheme)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? u.href : undefined
  } catch {
    return undefined
  }
}

/** Emails from a string (comma/semicolon separated), a list, or Twenty's `{primaryEmail, additionalEmails}`. */
export const asEmails = (v: unknown): string[] => {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const r = v as { primaryEmail?: unknown; additionalEmails?: unknown }
    return [asStr(r.primaryEmail), ...asArray(r.additionalEmails).map(asStr)].map((e) => e.trim()).filter(Boolean)
  }
  return asArray(v)
    .flatMap((e) => asStr(e).split(/[,;]/))
    .map((e) => e.trim())
    .filter(Boolean)
}

/** An email address a mail client would accept: one @, a dotted domain, no spaces. */
export const isEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

/** A phone number: the region it is dialled in (ISO alpha-2), its calling code, and the national digits. */
export interface PhoneParts {
  country?: string
  callingCode?: string
  number: string
}

/** The regions that share each calling code, the first being the one a bare "+N" belongs to. */
const BY_CODE: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {}
  for (const [iso, code] of Object.entries(CALLING)) (out[code] ??= []).push(iso)
  // The main region of a shared code, where the code is ambiguous.
  const main: Record<string, string> = { '1': 'US', '7': 'RU', '44': 'GB', '47': 'NO', '61': 'AU', '212': 'MA', '262': 'RE', '290': 'SH', '358': 'FI', '590': 'GP', '599': 'CW' }
  for (const [code, iso] of Object.entries(main)) {
    const list = out[code]
    if (list?.includes(iso)) out[code] = [iso, ...list.filter((x) => x !== iso)]
  }
  return out
})()

/**
 * Parts from a stored phone: "+33 6 12 34 56 78", "0612345678", or Twenty's
 * `{ primaryPhoneNumber, primaryPhoneCountryCode, primaryPhoneCallingCode }`.
 * A leading "+" is matched to the longest calling code it starts with.
 */
export const asPhone = (v: unknown, fallbackCountry?: string): PhoneParts => {
  if (v && typeof v === 'object') {
    const r = v as Record<string, unknown>
    const number = asStr(r.number ?? r.primaryPhoneNumber).trim()
    const country = asStr(r.country ?? r.countryCode ?? r.primaryPhoneCountryCode).trim().toUpperCase() || undefined
    const callingCode = asStr(r.callingCode ?? r.primaryPhoneCallingCode).replace(/^\+/, '').trim() || (country ? CALLING[country] : undefined)
    return { country, callingCode, number }
  }
  const s = asStr(v).trim()
  if (!s.startsWith('+')) {
    const country = fallbackCountry?.toUpperCase()
    return { country, callingCode: country ? CALLING[country] : undefined, number: s }
  }
  const digits = s.slice(1).replace(/[^\d]/g, '')
  for (let n = Math.min(4, digits.length); n > 0; n--) {
    const code = digits.slice(0, n)
    const regions = BY_CODE[code]
    if (regions) {
      const country = fallbackCountry && regions.includes(fallbackCountry.toUpperCase()) ? fallbackCountry.toUpperCase() : regions[0]
      return { country, callingCode: code, number: afterDigits(s.slice(1), n) }
    }
  }
  return { number: s }
}

/** What follows the first `n` digits of `s`, its leading separators dropped. */
const afterDigits = (s: string, n: number): string => {
  let seen = 0
  let i = 0
  while (i < s.length && seen < n) if (/\d/.test(s[i++])) seen++
  return s.slice(i).replace(/^[\s.()-]+/, '').trim()
}

/** The international spelling of a phone: "+33 6 12 34 56 78", or the number alone without a code. */
export const phoneText = (p: PhoneParts): string => {
  const number = p.number.trim()
  if (!number) return ''
  return p.callingCode ? `+${p.callingCode} ${number.replace(/^0+(?=\d)/, '')}` : number
}

/** A `tel:` target: the digits with their code. */
export const telHref = (p: PhoneParts): string | undefined => {
  const digits = p.number.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '')
  if (!digits) return undefined
  return `tel:${p.callingCode ? `+${p.callingCode}` : ''}${digits}`
}

export const asActor = (v: unknown): ActorValue | null => {
  if (v == null || v === '') return null
  if (typeof v === 'string') return { name: v }
  const r = v as Record<string, unknown>
  const name = asStr(r.name ?? r.workspaceMemberName ?? r.label).trim()
  if (!name) return null
  return { name, source: asStr(r.source).toLowerCase() || undefined, avatarUrl: asStr(r.avatarUrl).trim() || undefined }
}

/**
 * Rich text as one plain line: the first non-empty line of markdown (marks and
 * list bullets stripped), or of a block document's text nodes. What a cell and a
 * card show of a note body.
 */
export const richText = (v: unknown): string => {
  if (v == null || v === '') return ''
  if (typeof v === 'object') {
    const r = v as Record<string, unknown>
    if (typeof r.markdown === 'string' && r.markdown.trim()) return richText(r.markdown)
    if ('blocknote' in r || 'content' in r || 'type' in r || Array.isArray(v)) return richText(texts(v).join('\n'))
    return ''
  }
  for (const line of String(v).split('\n')) {
    const t = line
      .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+|-\s\[[ x]\]\s+)/i, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/(\*\*|__|\*|_|~~|`)/g, '')
      .trim()
    if (t) return t
  }
  return ''
}

/** Every `text` string in a block document, in order. */
const texts = (node: unknown): string[] => {
  if (typeof node === 'string') {
    try {
      return texts(JSON.parse(node))
    } catch {
      return [node]
    }
  }
  if (Array.isArray(node)) return node.flatMap(texts)
  if (node && typeof node === 'object') {
    const r = node as Record<string, unknown>
    const own = typeof r.text === 'string' ? [r.text] : []
    const kids = [r.content, r.children, r.blocknote].flatMap((k) => (k == null ? [] : texts(k)))
    // A block ends a line: its own text and its inline children read as one.
    return r.type && kids.length ? [[...own, ...kids].join('')] : [...own, ...kids]
  }
  return []
}

/** A relation value's label: the configured field, then label/name/id. */
export const relationText = (labelField: string, value: unknown): string => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    return asStr(rec[labelField] ?? rec.label ?? rec.name ?? rec.id)
  }
  return ''
}
