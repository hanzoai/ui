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
