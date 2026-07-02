// Editable field renderers. Each coerces the raw value, renders a control on
// @hanzo/gui primitives (cross-platform), and emits the next value via
// onChange — the host owns draft/save (matching the display/edit split). Built
// on Input + Button (the proven primitives) so the foundation typechecks
// everywhere; richer pickers (dropdown Select, date calendar, record picker)
// drop in later through the registry without touching callers.
import { Button, Input, Text, XStack } from '@hanzo/gui'
import type {
  FieldInputProps,
  SelectOption,
  CurrencyValue,
} from './types'
import { tokens } from '../theme'

const asStr = (v: unknown): string => (v == null ? '' : String(v))
const asNum = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
const asArray = (v: unknown): string[] =>
  (Array.isArray(v) ? v : v == null ? [] : [v]).map(asStr).filter(Boolean)

// ── text family ──────────────────────────────────────────────────────────────
export function TextInput({ field, value, onChange, autoFocus }: FieldInputProps) {
  const placeholder = (field.metadata as { placeholder?: string } | undefined)?.placeholder
  return (
    <Input
      value={asStr(value)}
      onChangeText={(t: string) => onChange(t)}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  )
}

export function EmailInput(props: FieldInputProps) {
  return <TextInput {...props} />
}
export function UrlInput(props: FieldInputProps) {
  return <TextInput {...props} />
}
export function PhoneInput(props: FieldInputProps) {
  return <TextInput {...props} />
}
export function LongTextInput(props: FieldInputProps) {
  return <TextInput {...props} />
}

// ── numeric family ────────────────────────────────────────────────────────────
export function NumberInput({ field, value, onChange, autoFocus }: FieldInputProps) {
  const placeholder = (field.metadata as { placeholder?: string } | undefined)?.placeholder
  return (
    <Input
      value={value == null ? '' : String(value)}
      onChangeText={(t: string) => onChange(t === '' ? null : asNum(t))}
      placeholder={placeholder}

      autoFocus={autoFocus}
    />
  )
}

export function PercentInput(props: FieldInputProps) {
  return <NumberInput {...props} />
}

export function CurrencyInput({ field, value, onChange, autoFocus }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { currencyCode?: string }
  const raw = (value ?? {}) as Partial<CurrencyValue>
  const amount = typeof raw === 'object' && raw != null ? raw.amount : asNum(value)
  const code = raw.currencyCode || meta.currencyCode || 'USD'
  return (
    <XStack items="center" gap={8}>
      <Text color={tokens.textMuted} fontSize={13}>{code}</Text>
      <Input
        value={amount == null ? '' : String(amount)}
        onChangeText={(t: string) => onChange({ amount: t === '' ? null : asNum(t), currencyCode: code })}

        autoFocus={autoFocus}
      />
    </XStack>
  )
}

export function DateInput({ value, onChange, autoFocus }: FieldInputProps) {
  // ISO text entry in the foundation; a calendar picker registers over this later.
  const iso = value == null ? '' : value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
  return (
    <Input
      value={iso}
      onChangeText={(t: string) => onChange(t)}
      placeholder="YYYY-MM-DD"
      autoFocus={autoFocus}
    />
  )
}

// ── boolean (button toggle — no composite Switch API needed) ──────────────────
export function BooleanInput({ field, value, onChange }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { trueLabel?: string; falseLabel?: string }
  const on = value === true || value === 'true' || value === 1
  return (
    <Button size="$2" theme={on ? 'green' : undefined} onPress={() => onChange(!on)}>
      {on ? meta.trueLabel ?? 'Yes' : meta.falseLabel ?? 'No'}
    </Button>
  )
}

// ── select / multiSelect (option buttons; dropdown registers over this later) ─
export function SelectInput({ field, value, onChange }: FieldInputProps) {
  const options = (field.metadata as { options?: SelectOption[] } | undefined)?.options ?? []
  const current = asStr(value)
  return (
    <XStack gap={6} items="center" style={{ flexWrap: 'wrap' }}>
      {options.map((o) => (
        <Button
          key={o.value}
          size="$2"
          theme={current === o.value ? 'blue' : undefined}
          onPress={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </XStack>
  )
}

export function MultiSelectInput({ field, value, onChange }: FieldInputProps) {
  const options = (field.metadata as { options?: SelectOption[] } | undefined)?.options ?? []
  const selected = new Set(asArray(value))
  const toggle = (v: string) => {
    const next = new Set(selected)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    onChange([...next])
  }
  return (
    <XStack gap={6} items="center" style={{ flexWrap: 'wrap' }}>
      {options.map((o) => (
        <Button
          key={o.value}
          size="$2"
          theme={selected.has(o.value) ? 'blue' : undefined}
          onPress={() => toggle(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </XStack>
  )
}

// ── rating (star buttons) ─────────────────────────────────────────────────────
export function RatingInput({ field, value, onChange }: FieldInputProps) {
  const max = ((field.metadata ?? {}) as { max?: number }).max ?? 5
  const current = asNum(value) ?? 0
  return (
    <XStack gap={2} items="center">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <Button key={n} size="$2" chromeless onPress={() => onChange(n)}>
          {n <= current ? '★' : '☆'}
        </Button>
      ))}
    </XStack>
  )
}

// ── relation (record picker — single or to-many over host-injected options) ───
// The host injects candidate records as metadata.options ({value:id, label}).
// maxSelect>1 (or 0/undefined with an array value) = to-many → array of ids;
// otherwise a single id (or null when cleared by re-tapping).
export function RelationInput({ field, value, onChange }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { options?: SelectOption[]; maxSelect?: number }
  const options = meta.options ?? []
  const multi = (meta.maxSelect ?? 1) !== 1 || Array.isArray(value)
  const selected = new Set(multi ? asArray(value) : [asStr(value)].filter(Boolean))
  const tap = (v: string) => {
    if (multi) {
      const next = new Set(selected)
      next.has(v) ? next.delete(v) : next.add(v)
      onChange([...next])
    } else {
      onChange(selected.has(v) ? null : v) // re-tap clears
    }
  }
  if (options.length === 0) {
    // No candidates injected — fall back to raw id entry so the field is still editable.
    return (
      <Input
        value={multi ? asArray(value).join(', ') : asStr(value)}
        onChangeText={(t: string) => onChange(multi ? t.split(',').map((s) => s.trim()).filter(Boolean) : (t || null))}
        placeholder="record id"
      />
    )
  }
  return (
    <XStack gap={6} items="center" style={{ flexWrap: 'wrap' }}>
      {options.map((o) => (
        <Button key={o.value} size="$2" theme={selected.has(o.value) ? 'blue' : undefined} onPress={() => tap(o.value)}>
          {o.label}
        </Button>
      ))}
    </XStack>
  )
}

// ── files (filename/URL list — add + remove; upload is a host concern) ────────
export function FilesInput({ value, onChange }: FieldInputProps) {
  const files = asArray(value)
  const add = (t: string) => { const v = t.trim(); if (v) onChange([...files, v]) }
  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i))
  return (
    <XStack gap={6} items="center" style={{ flexWrap: 'wrap' }}>
      {files.map((f, i) => (
        <Button key={`${f}-${i}`} size="$2" onPress={() => remove(i)}>
          {shortName(f)} ✕
        </Button>
      ))}
      <Input placeholder="Add file URL/ref…" onSubmitEditing={(e: { nativeEvent: { text: string } }) => add(e.nativeEvent.text)} />
    </XStack>
  )
}

// ── links (url list — add + remove) ───────────────────────────────────────────
export function LinksInput({ value, onChange }: FieldInputProps) {
  const links = asArray(value)
  const add = (t: string) => { const v = t.trim(); if (v) onChange([...links, v]) }
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i))
  return (
    <XStack gap={6} items="center" style={{ flexWrap: 'wrap' }}>
      {links.map((l, i) => (
        <Button key={`${l}-${i}`} size="$2" onPress={() => remove(i)}>{l} ✕</Button>
      ))}
      <Input placeholder="Add link…" onSubmitEditing={(e: { nativeEvent: { text: string } }) => add(e.nativeEvent.text)} />
    </XStack>
  )
}

// ── json (raw text; parses on change, keeps text on invalid so typing isn't lost)
export function JsonInput({ value, onChange }: FieldInputProps) {
  const text = typeof value === 'string' ? value : value == null ? '' : safeStringify(value)
  return (
    <Input
      value={text}
      onChangeText={(t: string) => { try { onChange(JSON.parse(t)) } catch { onChange(t) } }}
      placeholder='{ }'
    />
  )
}

// ── fullName (first + last sub-fields → { first, last }) ──────────────────────
export function FullNameInput({ value, onChange }: FieldInputProps) {
  const v = (value ?? {}) as { first?: string; last?: string }
  return (
    <XStack gap={8} items="center">
      <Input value={asStr(v.first)} placeholder="First" onChangeText={(t: string) => onChange({ ...v, first: t })} />
      <Input value={asStr(v.last)} placeholder="Last" onChangeText={(t: string) => onChange({ ...v, last: t })} />
    </XStack>
  )
}

// ── address (street/city/state/postal sub-fields) ─────────────────────────────
export function AddressInput({ value, onChange }: FieldInputProps) {
  const v = (value ?? {}) as { street?: string; city?: string; state?: string; postalCode?: string }
  const set = (k: string, t: string) => onChange({ ...v, [k]: t })
  return (
    <XStack gap={6} items="center" style={{ flexWrap: 'wrap' }}>
      <Input value={asStr(v.street)} placeholder="Street" onChangeText={(t: string) => set('street', t)} />
      <Input value={asStr(v.city)} placeholder="City" onChangeText={(t: string) => set('city', t)} />
      <Input value={asStr(v.state)} placeholder="State" onChangeText={(t: string) => set('state', t)} />
      <Input value={asStr(v.postalCode)} placeholder="ZIP" onChangeText={(t: string) => set('postalCode', t)} />
    </XStack>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────
const shortName = (s: string): string => {
  const base = s.split(/[/\\]/).pop() || s
  return base.length > 24 ? base.slice(0, 21) + '…' : base
}
const safeStringify = (v: unknown): string => {
  try { return JSON.stringify(v) } catch { return String(v) }
}
