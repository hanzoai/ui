// Read-only field renderers. Each is standalone and value-agnostic: it coerces
// the raw record value for its own type and renders with @hanzo/gui primitives
// (cross-platform — web, native, desktop). Static token colors use literal
// props; runtime palette colors (tag tones) go through `style` so they satisfy
// Gui's typed color props.
import { Text, XStack } from '@hanzo/gui'
import type {
  FieldDisplayProps,
  SelectOption,
  CurrencyValue,
  LinkValue,
  TagColor,
} from './types'
import { tagTone, tokens } from '../theme'

// ── coercion helpers (one place; components stay tiny) ───────────────────────
const asStr = (v: unknown): string => (v == null ? '' : String(v))
const asNum = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v])
const asDate = (v: unknown): Date | null => {
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v as string | number)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Em-dash placeholder for empty values — one consistent "no value" glyph. */
function Empty() {
  return <Text color={tokens.textFaint}>—</Text>
}

// ── Tag: the shared pill for select / multiSelect / status ───────────────────
export function Tag({ label, color }: { label: string; color?: TagColor }) {
  const t = tagTone(color)
  return (
    <XStack px={8} py={2} rounded={4} items="center" style={{ backgroundColor: t.bg }}>
      <Text fontSize={12} fontWeight="600" numberOfLines={1} style={{ color: t.fg }}>
        {label}
      </Text>
    </XStack>
  )
}

const optionFor = (options: SelectOption[] | undefined, value: string): SelectOption =>
  options?.find((o) => o.value === value) ?? { value, label: value }

// ── text family ──────────────────────────────────────────────────────────────
export function TextDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value)
  return s ? <Text color={tokens.text} numberOfLines={1}>{s}</Text> : <Empty />
}

export function LongTextDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value)
  return s ? <Text color={tokens.text} numberOfLines={2}>{s}</Text> : <Empty />
}

export function EmailDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value)
  return s ? <Text color={tokens.accent} numberOfLines={1}>{s}</Text> : <Empty />
}

export function UrlDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value)
  return s ? <Text color={tokens.accent} numberOfLines={1}>{s}</Text> : <Empty />
}

export function PhoneDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value)
  return s ? <Text color={tokens.text} numberOfLines={1}>{s}</Text> : <Empty />
}

// ── numeric family ────────────────────────────────────────────────────────────
export function NumberDisplay({ field, value }: FieldDisplayProps) {
  const n = asNum(value)
  if (n == null) return <Empty />
  const meta = (field.metadata ?? {}) as { decimals?: number; prefix?: string; suffix?: string }
  const body = meta.decimals != null ? n.toFixed(meta.decimals) : n.toLocaleString()
  return <Text color={tokens.text}>{`${meta.prefix ?? ''}${body}${meta.suffix ?? ''}`}</Text>
}

export function PercentDisplay({ field, value }: FieldDisplayProps) {
  const n = asNum(value)
  if (n == null) return <Empty />
  const decimals = ((field.metadata ?? {}) as { decimals?: number }).decimals ?? 0
  return <Text color={tokens.text}>{`${n.toFixed(decimals)}%`}</Text>
}

export function CurrencyDisplay({ field, value }: FieldDisplayProps) {
  const meta = (field.metadata ?? {}) as { currencyCode?: string; decimals?: number }
  const raw = (value ?? {}) as Partial<CurrencyValue>
  const amount = typeof raw === 'object' && raw != null ? asNum(raw.amount) : asNum(value)
  if (amount == null) return <Empty />
  const code = raw.currencyCode || meta.currencyCode || 'USD'
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
  return <Text color={tokens.text}>{text}</Text>
}

export function RatingDisplay({ field, value }: FieldDisplayProps) {
  const n = asNum(value) ?? 0
  const max = ((field.metadata ?? {}) as { max?: number }).max ?? 5
  const stars = '★'.repeat(Math.max(0, Math.min(max, Math.round(n)))) +
    '☆'.repeat(Math.max(0, max - Math.round(n)))
  return <Text style={{ color: tagTone('amber').fg }}>{stars}</Text>
}

// ── boolean ───────────────────────────────────────────────────────────────────
export function BooleanDisplay({ field, value }: FieldDisplayProps) {
  const meta = (field.metadata ?? {}) as { trueLabel?: string; falseLabel?: string }
  const on = value === true || value === 'true' || value === 1
  return <Tag label={on ? meta.trueLabel ?? 'Yes' : meta.falseLabel ?? 'No'} color={on ? 'green' : 'gray'} />
}

// ── select / multiSelect ──────────────────────────────────────────────────────
export function SelectDisplay({ field, value }: FieldDisplayProps) {
  const s = asStr(value)
  if (!s) return <Empty />
  const options = (field.metadata as { options?: SelectOption[] } | undefined)?.options
  const opt = optionFor(options, s)
  return <Tag label={opt.label} color={opt.color} />
}

export function MultiSelectDisplay({ field, value }: FieldDisplayProps) {
  const values = asArray(value).map(asStr).filter(Boolean)
  if (values.length === 0) return <Empty />
  const options = (field.metadata as { options?: SelectOption[] } | undefined)?.options
  return (
    <XStack gap={4} items="center" style={{ flexWrap: 'wrap' }}>
      {values.map((v) => {
        const opt = optionFor(options, v)
        return <Tag key={v} label={opt.label} color={opt.color} />
      })}
    </XStack>
  )
}

// ── date family ───────────────────────────────────────────────────────────────
export function DateDisplay({ value }: FieldDisplayProps) {
  const d = asDate(value)
  return d ? <Text color={tokens.text}>{d.toLocaleDateString()}</Text> : <Empty />
}

export function DateTimeDisplay({ value }: FieldDisplayProps) {
  const d = asDate(value)
  return d ? <Text color={tokens.text}>{d.toLocaleString()}</Text> : <Empty />
}

// ── links ─────────────────────────────────────────────────────────────────────
export function LinksDisplay({ value }: FieldDisplayProps) {
  const links = asArray(value)
    .map((l) => (typeof l === 'string' ? { url: l } : (l as LinkValue)))
    .filter((l) => l && l.url)
  if (links.length === 0) return <Empty />
  return (
    <XStack gap={4} items="center" style={{ flexWrap: 'wrap' }}>
      {links.map((l, i) => (
        <Tag key={`${l.url}-${i}`} label={l.label || l.url} color="blue" />
      ))}
    </XStack>
  )
}

// ── relation ──────────────────────────────────────────────────────────────────
export function RelationDisplay({ field, value }: FieldDisplayProps) {
  const labelField = ((field.metadata ?? {}) as { labelField?: string }).labelField ?? 'name'
  let label = ''
  if (typeof value === 'string') label = value
  else if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    label = asStr(rec[labelField] ?? rec.label ?? rec.name ?? rec.id)
  }
  return label ? <Tag label={label} color="purple" /> : <Empty />
}

// ── json / fallback ───────────────────────────────────────────────────────────
export function JsonDisplay({ value }: FieldDisplayProps) {
  if (value == null) return <Empty />
  let text: string
  try { text = JSON.stringify(value) } catch { text = String(value) }
  return <Text color={tokens.textMuted} numberOfLines={1}>{text}</Text>
}

export function FallbackDisplay({ value }: FieldDisplayProps) {
  const s = asStr(value)
  return s ? <Text color={tokens.text} numberOfLines={1}>{s}</Text> : <Empty />
}

