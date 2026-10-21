'use client'

// Read-only field renderers — the cell, the card row and the record page value.
//
// Each is standalone and value-agnostic: it coerces the raw record value through
// coerce.ts and draws with @hanzo/ui's record kit, so a select is the kit's Tag, a
// relation its Chip with an Avatar, a list of values its OverflowingList. Colours
// are theme rungs and the data palette, never literals, so every display follows
// the theme it is mounted in.
//
// The cell vocabulary — tags 20px, pills and record chips on the 4px radius, a
// "+N" count past what fits, a star row for a rating, an icon and a word for a
// boolean — is MIT-derived (see NOTICE), re-expressed on the kit.
import { Text, XStack, useTheme } from '@hanzo/gui'
import {
  Bot, Calendar as CalendarIcon, Check, Code, Download, Mail, Paperclip, Star, Upload, Webhook, Workflow, X,
} from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'
import { Avatar, Chip, OverflowingList, Tag as KitTag, TruncatedText } from '@hanzo/ui'
import type { CurrencyValue, FieldDisplayProps, SelectOption, TagColor } from './types'
import {
  addressText, asActor, asArray, asDate, asDay, asEmails, asLinks, asNum, asPhone, asStr, hostOf, nameText,
  phoneText, relationText, richText, safeHref, telHref,
} from './coerce'

/** Em-dash placeholder for empty values — one consistent "no value" glyph, at the faintest ink. */
function Empty() {
  return (
    <Text fontSize="$2" color={'var(--text-faint)' as never} aria-label="Empty">
      —
    </Text>
  )
}

/** One line of the cell's text, cut with an overflow hint. */
const Line = ({ text, color = '$ink', mono }: { text: string; color?: string; mono?: boolean }) => (
  <TruncatedText text={text} size="$2" color={color as never} {...(mono ? { fontFamily: '$mono' } : null)} />
)

/** A link target opens beside the app, never in its place. */
const OUT = { target: '_blank', rel: 'noopener noreferrer' } as const

// ── Tag: the shared label for select / multiSelect / status ──────────────────
/**
 * The colour-tagged label a select option is drawn as: @hanzo/ui's `Tag` in the
 * option's hue (soft: step 3 fill under step 11 ink). An option with no colour
 * is gray, as a new option is.
 */
export function Tag({ label, color }: { label: string; color?: TagColor }) {
  return <KitTag color={color ?? 'gray'}>{label}</KitTag>
}

const optionFor = (options: SelectOption[] | undefined, value: string): SelectOption =>
  options?.find((o) => o.value === value) ?? { value, label: value }

// ── text family ──────────────────────────────────────────────────────────────
export function TextDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value).trim()
  return s ? <Line text={s} /> : <Empty />
}

export function LongTextDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value).trim()
  return s ? <TruncatedText text={s} lineClamp={2} size="$2" color="$ink" isTooltipMultiline /> : <Empty />
}

/** A note body: its first line of text, marks and blocks stripped. */
export function RichTextDisplay({ value }: FieldDisplayProps) {
  const s = richText(value)
  return s ? <Line text={s} color="$aside" /> : <Empty />
}

/** One rounded pill per address, each a mailto link; past the room, a "+N". */
export function EmailDisplay({ value }: FieldDisplayProps) {
  const list = asEmails(value)
  if (list.length === 0) return <Empty />
  return (
    <Pills>
      {list.map((e, i) => (
        <Chip key={`${e}-${i}`} shape="round" variant="soft" label={e} href={`mailto:${e}`} />
      ))}
    </Pills>
  )
}

/** A link pill with the host (or its label); `javascript:` and other unsafe schemes are drawn without a target. */
const LinkPill = ({ url, label }: { url: string; label?: string }) => {
  const href = safeHref(url)
  return (
    <Chip
      shape="round"
      variant="soft"
      label={label?.trim() || hostOf(url)}
      tooltipContent={url}
      {...(href ? { href, ...(OUT as object) } : null)}
    />
  )
}

export function UrlDisplay({ value }: FieldDisplayProps) {
  const links = asLinks(value)
  if (links.length === 0) return <Empty />
  return links.length === 1 ? (
    <LinkPill url={links[0].url} label={links[0].label} />
  ) : (
    <Pills>
      {links.map((l, i) => (
        <LinkPill key={`${l.url}-${i}`} url={l.url} label={l.label} />
      ))}
    </Pills>
  )
}

export function LinksDisplay({ value }: FieldDisplayProps) {
  const links = asLinks(value)
  if (links.length === 0) return <Empty />
  return (
    <Pills>
      {links.map((l, i) => (
        <LinkPill key={`${l.url}-${i}`} url={l.url} label={l.label} />
      ))}
    </Pills>
  )
}

/** The number in international form, "+33 6 12 34 56 78", as a tel: pill. */
export function PhoneDisplay({ field, value }: FieldDisplayProps) {
  const fallback = (field.metadata as { defaultCountry?: string } | undefined)?.defaultCountry
  const phones = (Array.isArray(value) ? value : [value]).map((v) => asPhone(v, fallback)).filter((p) => p.number)
  if (phones.length === 0) return <Empty />
  return (
    <Pills>
      {phones.map((p, i) => {
        const href = telHref(p)
        return <Chip key={`${p.number}-${i}`} shape="round" variant="soft" label={phoneText(p)} {...(href ? { href } : null)} />
      })}
    </Pills>
  )
}

// ── numeric family ────────────────────────────────────────────────────────────
const tabular = { fontVariant: ['tabular-nums'] } as const

const NumberText = ({ text }: { text: string }) => (
  <Text fontSize="$2" color="$ink" numberOfLines={1} {...(tabular as object)}>
    {text}
  </Text>
)

export function NumberDisplay({ field, value }: FieldDisplayProps) {
  const n = asNum(value)
  if (n == null) return <Empty />
  const meta = (field.metadata ?? {}) as { decimals?: number; prefix?: string; suffix?: string }
  const body =
    meta.decimals != null
      ? n.toLocaleString(undefined, { minimumFractionDigits: meta.decimals, maximumFractionDigits: meta.decimals })
      : n.toLocaleString()
  return <NumberText text={`${meta.prefix ?? ''}${body}${meta.suffix ?? ''}`} />
}

export function PercentDisplay({ field, value }: FieldDisplayProps) {
  const n = asNum(value)
  if (n == null) return <Empty />
  const decimals = ((field.metadata ?? {}) as { decimals?: number }).decimals ?? 0
  return <NumberText text={`${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`} />
}

export function CurrencyDisplay({ field, value }: FieldDisplayProps) {
  const meta = (field.metadata ?? {}) as { currencyCode?: string; decimals?: number }
  const raw = (value ?? {}) as Partial<CurrencyValue>
  const amount = typeof raw === 'object' && raw != null ? asNum(raw.amount) : asNum(value)
  if (amount == null) return <Empty />
  const code = (typeof raw === 'object' && raw?.currencyCode) || meta.currencyCode || 'USD'
  let text: string
  try {
    text = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: meta.decimals ?? 2,
    }).format(amount)
  } catch {
    text = `${amount} ${code}`
  }
  return <NumberText text={text} />
}

/** The rating's star row, the same one the editor draws: lit stars in the secondary ink, unlit on the pressed rung. */
export function Stars({ value, max, hover }: { value: number; max: number; hover?: number | null }) {
  const theme = useTheme()
  const on = (theme as Record<string, { get?: () => string }>).aside?.get?.() ?? 'currentColor'
  const lit = hover ?? value
  return (
    <XStack items="center" gap={2} aria-hidden>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <Star key={n} size={16} color={n <= lit ? '$aside' : '$raised'} fill={n <= lit ? on : 'none'} />
      ))}
    </XStack>
  )
}

export function RatingDisplay({ field, value }: FieldDisplayProps) {
  const max = ((field.metadata ?? {}) as { max?: number }).max ?? 5
  const n = Math.max(0, Math.min(max, Math.round(asNum(value) ?? 0)))
  return (
    <XStack role="img" aria-label={`${n} of ${max}`}>
      <Stars value={n} max={max} />
    </XStack>
  )
}

// ── boolean ───────────────────────────────────────────────────────────────────
/** A check or a cross at 14px and its word, 4px apart: the value read at a glance and stated for a reader. */
export function BooleanDisplay({ field, value }: FieldDisplayProps) {
  if (value == null || value === '') return <Empty />
  const meta = (field.metadata ?? {}) as { trueLabel?: string; falseLabel?: string }
  const on = value === true || value === 'true' || value === 1
  const Icon = on ? Check : X
  return (
    <XStack items="center" gap="$1" height={20}>
      <Icon size={14} color="$aside" />
      <Text fontSize="$2" color="$aside">
        {on ? meta.trueLabel ?? 'Yes' : meta.falseLabel ?? 'No'}
      </Text>
    </XStack>
  )
}

// ── select / multiSelect ──────────────────────────────────────────────────────
export function SelectDisplay({ field, value }: FieldDisplayProps) {
  const s = asStr(value)
  if (!s) return <Empty />
  const options = (field.metadata as { options?: SelectOption[] } | undefined)?.options
  const opt = optionFor(options, s)
  return <Tag label={opt.label} color={opt.color} />
}

/** The row of tags, as many as fit, then a "+N" that lists them all. */
export function MultiSelectDisplay({ field, value }: FieldDisplayProps) {
  const values = asArray(value).map(asStr).filter(Boolean)
  if (values.length === 0) return <Empty />
  const options = (field.metadata as { options?: SelectOption[] } | undefined)?.options
  return (
    <Pills>
      {values.map((v) => {
        const opt = optionFor(options, v)
        return <Tag key={v} label={opt.label} color={opt.color} />
      })}
    </Pills>
  )
}

// ── date family ───────────────────────────────────────────────────────────────
const RELATIVE: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86400],
  ['month', 30 * 86400],
  ['week', 7 * 86400],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

/** "in 3 days", "2 hours ago" — the largest unit that is at least one. */
export const relativeTime = (d: Date, now = Date.now()): string => {
  const secs = (d.getTime() - now) / 1000
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, size] of RELATIVE) if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit)
  return rtf.format(Math.round(secs), 'second')
}

/**
 * A calendar day is shown in UTC, so "2026-10-19" reads as the 19th everywhere:
 * a day is not an instant, and parsing it as local midnight moved it to the
 * 18th for every reader west of Greenwich.
 */
export function DateDisplay({ field, value }: FieldDisplayProps) {
  const day = asDay(value)
  if (!day) return <Empty />
  const d = new Date(`${day}T00:00:00Z`)
  const relative = (field.metadata as { display?: string } | undefined)?.display === 'relative'
  if (relative) {
    const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
    return <Line text={relativeTime(d, today.getTime())} />
  }
  return <Line text={d.toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })} />
}

export function DateTimeDisplay({ field, value }: FieldDisplayProps) {
  const d = asDate(value)
  if (!d) return <Empty />
  const relative = (field.metadata as { display?: string } | undefined)?.display === 'relative'
  return (
    <Line
      text={
        relative
          ? relativeTime(d)
          : d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
      }
    />
  )
}

// ── relation / actor ──────────────────────────────────────────────────────────
/** A record chip: the record's avatar (its picture, else its initial in its hue) and its label. */
export function RecordChip({
  label,
  seed,
  src,
  shape = 'square',
  href,
  onPress,
}: {
  label: string
  seed?: string
  src?: string
  shape?: 'square' | 'circle'
  href?: string
  onPress?: () => void
}) {
  return (
    <Chip
      label={label}
      startElement={<Avatar size="md" shape={shape === 'circle' ? 'circle' : 'square'} name={label} colorSeed={seed ?? label} src={src ?? null} />}
      {...(href ? { href } : null)}
      {...(onPress ? { onPress } : null)}
    />
  )
}

/**
 * One record (many-to-one) or a list of them (one-to-many). A value is a label,
 * a record `{ id, name, … }`, or a list of either; the label comes from the
 * field's `labelField`, the picture from its `avatarField`.
 */
export function RelationDisplay({ field, value }: FieldDisplayProps) {
  const meta = (field.metadata ?? {}) as { labelField?: string; avatarField?: string; shape?: 'square' | 'circle' }
  const labelField = meta.labelField ?? 'name'
  const items = asArray(value)
    .map((v) => {
      const label = relationText(labelField, v)
      const rec = v && typeof v === 'object' ? (v as Record<string, unknown>) : null
      const src = rec ? asStr(rec[meta.avatarField ?? 'avatarUrl']).trim() || undefined : undefined
      return { label, seed: rec ? asStr(rec.id) || label : label, src }
    })
    .filter((r) => r.label)
  if (items.length === 0) return <Empty />
  const chips = items.map((r, i) => <RecordChip key={`${r.seed}-${i}`} label={r.label} seed={r.seed} src={r.src} shape={meta.shape} />)
  return items.length === 1 ? chips[0] : <Pills>{chips}</Pills>
}

/** Where a record came from, for an actor that is not a person. */
const SOURCE: Record<string, typeof Bot> = {
  api: Code,
  import: Upload,
  email: Mail,
  calendar: CalendarIcon,
  workflow: Workflow,
  webhook: Webhook,
  system: Bot,
  manual: Download,
}

/** "Created by": a person as a round avatar and name, a source as its icon and name, in a ghost chip. */
export function ActorDisplay({ value }: FieldDisplayProps) {
  const a = asActor(value)
  if (!a) return <Empty />
  const Icon = a.source && a.source !== 'member' ? SOURCE[a.source] : undefined
  return (
    <Chip
      label={a.name}
      startElement={
        Icon ? (
          <Icon size={14} color="$hint" />
        ) : (
          <Avatar size="md" shape="circle" name={a.name} src={a.avatarUrl ?? null} />
        )
      }
    />
  )
}

// ── composite text ───────────────────────────────────────────────────────────
export function FullNameDisplay({ value }: FieldDisplayProps) {
  const s = nameText(value)
  return s ? <Line text={s} /> : <Empty />
}

/** The address as one comma-joined line of the parts it has; the country by name. */
export function AddressDisplay({ value }: FieldDisplayProps) {
  const s = addressText(value)
  return s ? <Line text={s} /> : <Empty />
}

export function UuidDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value)
  return s ? <Line text={s} color="$hint" mono /> : <Empty />
}

/** Attachments as file chips: the name, cut at the chip's width. */
export function FilesDisplay({ value }: FieldDisplayProps) {
  const files = asArray(value)
    .map((f) => (typeof f === 'string' ? { name: f } : (f as { name?: string; label?: string; url?: string })))
    .map((f) => ({ name: asStr(f?.label ?? f?.name).trim() || 'file', url: asStr(f?.url).trim() }))
  if (files.length === 0) return <Empty />
  return (
    <Pills>
      {files.map((f, i) => {
        const href = f.url ? safeHref(f.url) : undefined
        return (
          <Chip
            key={`${f.name}-${i}`}
            variant="soft"
            label={f.name}
            maxW={120}
            startElement={<Paperclip size={14} color="$hint" />}
            {...(href ? { href, ...(OUT as object) } : null)}
          />
        )
      })}
    </Pills>
  )
}

// ── json / fallback ───────────────────────────────────────────────────────────
export function JsonDisplay({ value }: FieldDisplayProps) {
  if (value == null) return <Empty />
  let text: string
  try {
    text = JSON.stringify(value)
  } catch {
    text = String(value)
  }
  return <Line text={text} color="$hint" mono />
}

export function FallbackDisplay({ value }: FieldDisplayProps) {
  if (value != null && typeof value === 'object') return <JsonDisplay field={{ name: '', label: '', type: 'json' }} value={value} />
  const s = asStr(value)
  return s ? <Line text={s} /> : <Empty />
}

/** Several values in one line: what fits, then a count that opens all of them. */
function Pills({ children }: { children: ReactNode }) {
  return (
    <OverflowingList flex={1} minW={0}>
      {children}
    </OverflowingList>
  )
}
