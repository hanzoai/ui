// Editable field renderers — Twenty-grade. Each coerces the raw value, renders a
// polished control on @hanzo/gui primitives + this package's small dropdown /
// calendar / toggle / checkbox primitives, and emits the next value via onChange;
// the host owns draft/save (matching the display/edit split). One editor per type,
// resolved through the registry, so a new type is a `registerField` call — never a
// switch. Palette is the package's raw-hex tokens (theme-config independent).
import { useMemo, useState, type ReactNode } from 'react'
import { Button, Input, Text, TextArea, XStack, YStack } from '@hanzo/gui'
import { Calendar as CalendarIcon, ChevronDown, Upload, X } from '@hanzogui/lucide-icons-2'
import type { FieldInputProps, SelectOption, CurrencyValue } from './types'
import { Tag } from './displays'
import { Menu, MenuItem, Toggle, Calendar } from '../primitives'
import { tokens } from '../theme'

const asStr = (v: unknown): string => (v == null ? '' : String(v))
const asNum = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
const asArray = (v: unknown): string[] =>
  (Array.isArray(v) ? v : v == null ? [] : [v]).map(asStr).filter(Boolean)

const optionsOf = (props: FieldInputProps): SelectOption[] =>
  (props.field.metadata as { options?: SelectOption[] } | undefined)?.options ?? []

/** A bordered trigger pill — the shared look for select / relation / date pickers. */
function TriggerPill({ children }: { children: ReactNode }) {
  return (
    <XStack
      items="center"
      justify="space-between"
      gap={8}
      px={10}
      py={7}
      rounded={8}
      borderWidth={1}
      cursor="pointer"
      minH={36}
      hoverStyle={{ borderColor: tokens.textMuted }}
      style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
    >
      <XStack items="center" gap={6} flex={1} style={{ flexWrap: 'wrap' }}>{children}</XStack>
      <ChevronDown size={14} color={tokens.textFaint} />
    </XStack>
  )
}

const Placeholder = ({ text }: { text: string }) => <Text style={{ color: tokens.textFaint }}>{text}</Text>

const SearchBox = ({ q, onQ, placeholder }: { q: string; onQ: (v: string) => void; placeholder: string }) => (
  <Input size="$2" value={q} onChangeText={onQ} placeholder={placeholder} autoFocus />
)

// ── text family ──────────────────────────────────────────────────────────────
export function TextInput({ field, value, onChange, onSubmit, autoFocus }: FieldInputProps) {
  const placeholder = (field.metadata as { placeholder?: string } | undefined)?.placeholder
  return (
    <Input
      value={asStr(value)}
      onChangeText={(t: string) => onChange(t)}
      onSubmitEditing={onSubmit}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  )
}

export function EmailInput(props: FieldInputProps) { return <TextInput {...props} /> }
export function UrlInput(props: FieldInputProps) { return <TextInput {...props} /> }
export function PhoneInput(props: FieldInputProps) { return <TextInput {...props} /> }

export function LongTextInput({ field, value, onChange, autoFocus }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { placeholder?: string; rows?: number }
  return (
    <TextArea
      value={asStr(value)}
      onChangeText={(t: string) => onChange(t)}
      placeholder={meta.placeholder}
      autoFocus={autoFocus}
      numberOfLines={meta.rows ?? 4}
      style={{ minHeight: (meta.rows ?? 4) * 22 }}
    />
  )
}

// ── numeric family ────────────────────────────────────────────────────────────
export function NumberInput({ field, value, onChange, onSubmit, autoFocus }: FieldInputProps) {
  const placeholder = (field.metadata as { placeholder?: string } | undefined)?.placeholder
  return (
    <Input
      value={value == null ? '' : String(value)}
      onChangeText={(t: string) => onChange(t === '' ? null : asNum(t))}
      onSubmitEditing={onSubmit}
      placeholder={placeholder}
      inputMode="numeric"
      autoFocus={autoFocus}
    />
  )
}
export function PercentInput(props: FieldInputProps) { return <NumberInput {...props} /> }

export function CurrencyInput({ field, value, onChange, onSubmit, autoFocus }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { currencyCode?: string }
  const raw = (value ?? {}) as Partial<CurrencyValue>
  const amount = typeof raw === 'object' && raw != null ? raw.amount : asNum(value)
  const code = raw.currencyCode || meta.currencyCode || 'USD'
  return (
    <XStack items="center" gap={8}>
      <Text style={{ color: tokens.textMuted }} fontSize={13}>{code}</Text>
      <Input
        flex={1}
        value={amount == null ? '' : String(amount)}
        onChangeText={(t: string) => onChange({ amount: t === '' ? null : asNum(t), currencyCode: code })}
        onSubmitEditing={onSubmit}
        inputMode="decimal"
        autoFocus={autoFocus}
      />
    </XStack>
  )
}

export function RatingInput({ field, value, onChange }: FieldInputProps) {
  const max = ((field.metadata ?? {}) as { max?: number }).max ?? 5
  const current = asNum(value) ?? 0
  return (
    <XStack gap={2} items="center">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <YStack key={n} cursor="pointer" onPress={() => onChange(n === current ? 0 : n)}>
          <Text fontSize={18} style={{ color: n <= current ? '#fbbf24' : tokens.border }}>{n <= current ? '★' : '☆'}</Text>
        </YStack>
      ))}
    </XStack>
  )
}

// ── boolean (sliding toggle) ──────────────────────────────────────────────────
export function BooleanInput({ field, value, onChange }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { trueLabel?: string; falseLabel?: string }
  const on = value === true || value === 'true' || value === 1
  return (
    <XStack items="center" gap={8}>
      <Toggle on={on} onChange={(next) => onChange(next)} />
      <Text fontSize={13} style={{ color: tokens.textMuted }}>{on ? meta.trueLabel ?? 'Yes' : meta.falseLabel ?? 'No'}</Text>
    </XStack>
  )
}

// ── select (searchable dropdown, chip value) ──────────────────────────────────
export function SelectInput(props: FieldInputProps) {
  const { value, onChange } = props
  const options = optionsOf(props)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const current = asStr(value)
  const selected = options.find((o) => o.value === current)
  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())),
    [options, q],
  )
  return (
    <Menu
      open={open}
      onOpenChange={(o) => { setOpen(o); if (!o) setQ('') }}
      width={260}
      header={options.length > 6 ? <SearchBox q={q} onQ={setQ} placeholder="Search options…" /> : undefined}
      trigger={<TriggerPill>{selected ? <Tag label={selected.label} color={selected.color} /> : <Placeholder text="Select…" />}</TriggerPill>}
    >
      {current ? (
        <MenuItem onPress={() => { onChange(null); setOpen(false) }}>
          <Text fontSize={13} style={{ color: tokens.textFaint }}>Clear</Text>
        </MenuItem>
      ) : null}
      {filtered.map((o) => (
        <MenuItem key={o.value} active={o.value === current} onPress={() => { onChange(o.value); setOpen(false) }}>
          <Tag label={o.label} color={o.color} />
        </MenuItem>
      ))}
      {filtered.length === 0 ? <Text px={10} py={6} fontSize={12} style={{ color: tokens.textFaint }}>No options</Text> : null}
    </Menu>
  )
}

// ── multiSelect (chips + checkable dropdown) ──────────────────────────────────
export function MultiSelectInput(props: FieldInputProps) {
  const { value, onChange } = props
  const options = optionsOf(props)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = new Set(asArray(value))
  const toggle = (v: string) => {
    const next = new Set(selected)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    onChange([...next])
  }
  const chosen = options.filter((o) => selected.has(o.value))
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <Menu
      open={open}
      onOpenChange={(o) => { setOpen(o); if (!o) setQ('') }}
      width={260}
      header={options.length > 6 ? <SearchBox q={q} onQ={setQ} placeholder="Search options…" /> : undefined}
      trigger={
        <TriggerPill>
          {chosen.length > 0 ? chosen.map((o) => <Tag key={o.value} label={o.label} color={o.color} />) : <Placeholder text="Select…" />}
        </TriggerPill>
      }
    >
      {filtered.map((o) => (
        <MenuItem
          key={o.value}
          active={selected.has(o.value)}
          onPress={() => toggle(o.value)}
          trailing={selected.has(o.value) ? <Text style={{ color: tokens.accent }}>✓</Text> : null}
        >
          <Tag label={o.label} color={o.color} />
        </MenuItem>
      ))}
      {filtered.length === 0 ? <Text px={10} py={6} fontSize={12} style={{ color: tokens.textFaint }}>No options</Text> : null}
    </Menu>
  )
}

// ── date / dateTime (calendar picker) ─────────────────────────────────────────
export function DateInput({ value, onChange, autoFocus }: FieldInputProps) {
  const [open, setOpen] = useState(false)
  const isoDay = value == null ? '' : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
  const label = isoDay ? new Date(`${isoDay}T00:00:00`).toLocaleDateString() : ''
  return (
    <Menu
      open={open}
      onOpenChange={setOpen}
      width={272}
      trigger={
        <TriggerPill>
          <XStack items="center" gap={8} flex={1}>
            <CalendarIcon size={15} color={tokens.textFaint} />
            {label ? <Text style={{ color: tokens.text }}>{label}</Text> : <Placeholder text="Pick a date…" />}
          </XStack>
        </TriggerPill>
      }
    >
      <Calendar value={isoDay} onSelect={(d) => { onChange(d); setOpen(false) }} />
      {isoDay ? (
        <MenuItem onPress={() => { onChange(null); setOpen(false) }}>
          <Text fontSize={13} style={{ color: tokens.textFaint }}>Clear</Text>
        </MenuItem>
      ) : null}
      <YStack px={10} pb={8}>
        <Input size="$2" value={isoDay} placeholder="YYYY-MM-DD" onChangeText={(t: string) => onChange(t)} autoFocus={autoFocus} />
      </YStack>
    </Menu>
  )
}

// ── relation (record picker over injected options, else id text) ──────────────
export function RelationInput(props: FieldInputProps) {
  const { value, onChange } = props
  const options = optionsOf(props)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  // Presentational: when the host injects candidate records as options, pick one;
  // otherwise fall back to a raw id entry (honest — no fabricated candidate list).
  if (options.length === 0) {
    const label = typeof value === 'object' && value != null
      ? asStr((value as Record<string, unknown>).name ?? (value as Record<string, unknown>).id)
      : asStr(value)
    return <Input value={label} onChangeText={(t: string) => onChange(t)} placeholder="Related record id…" />
  }

  const current = asStr(
    typeof value === 'object' && value != null
      ? (value as Record<string, unknown>).id ?? (value as Record<string, unknown>).value
      : value,
  )
  const selected = options.find((o) => o.value === current)
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <Menu
      open={open}
      onOpenChange={(o) => { setOpen(o); if (!o) setQ('') }}
      width={280}
      header={<SearchBox q={q} onQ={setQ} placeholder="Search records…" />}
      trigger={<TriggerPill>{selected ? <Tag label={selected.label} color="purple" /> : <Placeholder text="Link a record…" />}</TriggerPill>}
    >
      {current ? (
        <MenuItem onPress={() => { onChange(null); setOpen(false) }}>
          <Text fontSize={13} style={{ color: tokens.textFaint }}>Clear</Text>
        </MenuItem>
      ) : null}
      {filtered.map((o) => (
        <MenuItem key={o.value} active={o.value === current} onPress={() => { onChange(o.value); setOpen(false) }}>
          <Text fontSize={13} style={{ color: tokens.text }}>{o.label}</Text>
        </MenuItem>
      ))}
      {filtered.length === 0 ? <Text px={10} py={6} fontSize={12} style={{ color: tokens.textFaint }}>No matches</Text> : null}
    </Menu>
  )
}

// ── files (web upload; host persists) ─────────────────────────────────────────
export function FileInput({ value, onChange }: FieldInputProps) {
  const names = (Array.isArray(value) ? value : value == null ? [] : [value]).map((f) =>
    typeof f === 'string' ? f : asStr((f as { name?: string })?.name ?? 'file'),
  )
  const pick = () => {
    if (typeof document === 'undefined') return
    const el = document.createElement('input')
    el.type = 'file'
    el.multiple = true
    el.onchange = () => onChange(el.files ? Array.from(el.files) : [])
    el.click()
  }
  const supported = typeof document !== 'undefined'
  return (
    <YStack gap={8}>
      {supported ? (
        <Button size="$2" icon={<Upload size={15} />} onPress={pick}>Choose files</Button>
      ) : (
        <Text fontSize={13} style={{ color: tokens.textFaint }}>File upload is available on the web.</Text>
      )}
      {names.length > 0 ? (
        <XStack gap={6} items="center" style={{ flexWrap: 'wrap' }}>
          {names.map((n, i) => (
            <XStack key={`${n}-${i}`} items="center" gap={4} px={8} py={3} rounded={6} style={{ backgroundColor: tokens.hover }}>
              <Text fontSize={12} style={{ color: tokens.text }}>{n}</Text>
              <YStack cursor="pointer" onPress={() => onChange((Array.isArray(value) ? value : []).filter((_, j) => j !== i))}>
                <X size={12} color={tokens.textFaint} />
              </YStack>
            </XStack>
          ))}
        </XStack>
      ) : null}
    </YStack>
  )
}

// ── json (validated textarea) ─────────────────────────────────────────────────
function safeStringify(v: unknown): string {
  try { return JSON.stringify(v, null, 2) } catch { return String(v) }
}

export function JsonInput({ value, onChange, autoFocus }: FieldInputProps) {
  const initial = value == null ? '' : typeof value === 'string' ? value : safeStringify(value)
  const [text, setText] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const commit = (t: string) => {
    setText(t)
    if (t.trim() === '') { setError(null); onChange(null); return }
    try { onChange(JSON.parse(t)); setError(null) } catch { setError('Invalid JSON') }
  }
  return (
    <YStack gap={4}>
      <TextArea
        value={text}
        onChangeText={commit}
        autoFocus={autoFocus}
        numberOfLines={6}
        placeholder="{ }"
        style={{ minHeight: 132, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
      />
      {error ? <Text fontSize={12} style={{ color: tokens.danger }}>{error}</Text> : null}
    </YStack>
  )
}
