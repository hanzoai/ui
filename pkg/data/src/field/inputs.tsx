'use client'

// Field editors — one per type, resolved through the registry, each a @hanzo/ui
// record-kit control: Input and Textarea for text, NumberField for numbers, an
// InputGroup with a CurrencyPicker or a PhoneCountryPicker at its start, a
// searchable DropdownMenu of Tags for a select, the kit's Calendar in a Popover
// for a date. Each coerces the raw value, emits the next one through `onChange`,
// and leaves draft and save to the host.
//
// The keyboard is the inline-edit contract (twenty-spec FT-100): Enter commits,
// Escape cancels, Shift+Enter is a new line in long text; picker editors commit on
// a choice. Controls take their box from the nearest `<Density>` — a CRM sets
// `compact` once at its shell and every editor is 32px; a host that sets none
// keeps the kit's 36px.
//
// The editors' composition (a picker segment at the start of an amount or a
// number, a searchable option list with a "No value" row, a star row that clears
// on its own value) follows twenty-ui's field controls (MIT, see NOTICE).
import { useMemo, useState, type ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Calendar as CalendarIcon, ChevronDown, Upload, X } from '@hanzogui/lucide-icons-2'
import {
  Avatar, Button, Calendar as KitCalendar, CodeEditor, CountrySelect, CurrencyPicker, DropdownMenu, DropdownMenuContent,
  DropdownMenuEmpty, DropdownMenuItem, DropdownMenuOptionItem, DropdownMenuSearch, DropdownMenuSection,
  DropdownMenuSelectionGroup, DropdownMenuTrigger, Input, InputGroup, NumberField,
  PhoneCountryPicker, Popover, PopoverContent, PopoverTrigger, Switch, Textarea, checkJson,
} from '@hanzo/ui'
import type { AddressValue, CurrencyValue, FieldInputProps, LinkValue, SelectOption } from './types'
import { Stars, Tag } from './displays'
import {
  ADDRESS_PARTS, asAddress, asArray, asDay, asLinks, asName, asNum, asPhone, asStr, hostOf, isEmail,
} from './coerce'
import { currencies, regions } from './regions'
import { CALLING } from './calling'

const optionsOf = (props: FieldInputProps): SelectOption[] =>
  (props.field.metadata as { options?: SelectOption[] } | undefined)?.options ?? []

/** Options whose label (or value) contains the query, case- and accent-blind. */
const matching = (options: SelectOption[], q: string) => {
  const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  const want = fold(q.trim())
  return want ? options.filter((o) => fold(o.label).includes(want) || fold(o.value).includes(want)) : options
}

/**
 * The inline-edit keys around a text-like editor: Enter commits (not mid-IME and
 * not with Shift, which a long text keeps for a new line), Escape cancels. The
 * events bubble from the field, so the field keeps its own keys (a number's
 * arrows) and this hears only the two it owns.
 */
function Keys({ onSubmit, onCancel, multiline, children }: {
  onSubmit?: () => void
  onCancel?: () => void
  multiline?: boolean
  children: ReactNode
}) {
  const onKeyDown = (e: { key?: string; shiftKey?: boolean; nativeEvent?: { isComposing?: boolean }; preventDefault?: () => void }) => {
    if (e.nativeEvent?.isComposing) return
    if (e.key === 'Enter' && !(multiline && e.shiftKey)) {
      e.preventDefault?.()
      onSubmit?.()
    } else if (e.key === 'Escape') {
      e.preventDefault?.()
      onCancel?.()
    }
  }
  return (
    <YStack flex={1} minW={0} {...({ onKeyDown } as object)}>
      {children}
    </YStack>
  )
}

const label = (props: FieldInputProps) => props.field.label

// ── text family ──────────────────────────────────────────────────────────────
export function TextInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const placeholder = (field.metadata as { placeholder?: string } | undefined)?.placeholder
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <Input
        aria-label={field.label}
        value={asStr(value)}
        onChangeText={(t: string) => onChange(t)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </Keys>
  )
}

/** An email address; a typed value that is not one is marked invalid, not refused. */
export function EmailInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const s = Array.isArray(value) ? asStr(value[0]) : asStr(value)
  const placeholder = (field.metadata as { placeholder?: string } | undefined)?.placeholder ?? 'name@example.com'
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <Input
        aria-label={field.label}
        {...({ type: 'email', inputMode: 'email', autoComplete: 'email' } as object)}
        value={s}
        onChangeText={(t: string) => onChange(t.trim())}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={s !== '' && !isEmail(s) ? true : undefined}
      />
    </Keys>
  )
}

export function UrlInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const s = asStr(typeof value === 'object' && value != null && !Array.isArray(value) ? (value as LinkValue).url : value)
  const placeholder = (field.metadata as { placeholder?: string } | undefined)?.placeholder ?? 'https://'
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <Input
        aria-label={field.label}
        {...({ type: 'url', inputMode: 'url' } as object)}
        value={s}
        onChangeText={(t: string) => onChange(t.trim())}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </Keys>
  )
}

/**
 * A phone: the calling-code picker at the field's start and the national number
 * beside it. A string value comes back as a string ("+33 6 12 34 56 78"), an
 * object value as the same object shape, so a host's storage does not change
 * under it.
 */
export function PhoneInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { placeholder?: string; defaultCountry?: string }
  const parts = asPhone(value, meta.defaultCountry)
  const [country, setCountry] = useState<string | undefined>(parts.country ?? meta.defaultCountry?.toUpperCase())
  const list = useMemo(() => regions(), [])
  const emit = (iso: string | undefined, number: string) => {
    const code = iso ? CALLING[iso] : undefined
    if (value != null && typeof value === 'object' && !Array.isArray(value))
      onChange({ ...(value as object), number, countryCode: iso, callingCode: code ? `+${code}` : undefined })
    else onChange(number.trim() ? (code ? `+${code} ${number.trim()}` : number.trim()) : null)
  }
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <InputGroup>
        <PhoneCountryPicker
          countries={list}
          value={country ?? null}
          onValueChange={(iso) => {
            setCountry(iso ?? undefined)
            emit(iso ?? undefined, parts.number)
          }}
        />
        <Input
          aria-label={field.label}
          {...({ type: 'tel', inputMode: 'tel', autoComplete: 'tel' } as object)}
          value={parts.number}
          onChangeText={(t: string) => emit(country, t)}
          placeholder={meta.placeholder ?? 'Phone number'}
          autoFocus={autoFocus}
        />
      </InputGroup>
    </Keys>
  )
}

export function LongTextInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { placeholder?: string; rows?: number }
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel} multiline>
      <Textarea
        aria-label={field.label}
        value={asStr(value)}
        onChangeText={(t: string) => onChange(t)}
        placeholder={meta.placeholder}
        autoFocus={autoFocus}
        rows={meta.rows ?? 3}
        maxRows={meta.rows && meta.rows > 10 ? meta.rows : 10}
      />
    </Keys>
  )
}

// ── numeric family ────────────────────────────────────────────────────────────
export function NumberInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { placeholder?: string; decimals?: number }
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <NumberField
        aria-label={field.label}
        value={asNum(value)}
        onValueChange={(n) => onChange(n)}
        placeholder={meta.placeholder}
        autoFocus={autoFocus}
        allowOutOfRange
        {...(meta.decimals != null ? { format: { maximumFractionDigits: meta.decimals } } : null)}
      />
    </Keys>
  )
}

export function PercentInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const decimals = ((field.metadata ?? {}) as { decimals?: number }).decimals
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <InputGroup end={<Text fontSize="$2" color="$hint">%</Text>}>
        <NumberField
          aria-label={field.label}
          value={asNum(value)}
          onValueChange={(n) => onChange(n)}
          autoFocus={autoFocus}
          allowOutOfRange
          {...(decimals != null ? { format: { maximumFractionDigits: decimals } } : null)}
        />
      </InputGroup>
    </Keys>
  )
}

/** The currency picker at the field's start, the amount beside it: `{ amount, currencyCode }`. */
export function CurrencyInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { currencyCode?: string; decimals?: number }
  const raw = (value ?? {}) as Partial<CurrencyValue>
  const amount = typeof raw === 'object' && raw != null ? asNum(raw.amount) : asNum(value)
  const code = (typeof raw === 'object' && raw?.currencyCode) || meta.currencyCode || 'USD'
  const list = useMemo(() => currencies(), [])
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <InputGroup>
        <CurrencyPicker
          currencies={list}
          value={code}
          onValueChange={(c) => onChange({ amount, currencyCode: c ?? code })}
          selectedFirst
        />
        <NumberField
          aria-label={field.label}
          value={amount}
          onValueChange={(n) => onChange({ amount: n, currencyCode: code })}
          autoFocus={autoFocus}
          allowOutOfRange
          format={{ maximumFractionDigits: meta.decimals ?? 2 }}
        />
      </InputGroup>
    </Keys>
  )
}

/**
 * The star row as a control: a press sets the level and a press on the current
 * level clears it; the arrows step it, Home and End go to the ends. One slider to
 * assistive technology.
 */
export function RatingInput({ field, value, onChange }: FieldInputProps) {
  const max = ((field.metadata ?? {}) as { max?: number }).max ?? 5
  const current = Math.max(0, Math.min(max, Math.round(asNum(value) ?? 0)))
  const [hover, setHover] = useState<number | null>(null)
  const set = (n: number) => onChange(Math.max(0, Math.min(max, n)))
  const onKeyDown = (e: { key?: string; preventDefault?: () => void }) => {
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? current + 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? current - 1
      : e.key === 'Home' ? 0
      : e.key === 'End' ? max
      : null
    if (next == null) return
    e.preventDefault?.()
    set(next)
  }
  return (
    <XStack
      {...({ role: 'slider', tabIndex: 0, onKeyDown } as object)}
      aria-label={field.label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-valuetext={`${current} of ${max}`}
      items="center"
      height={20}
      rounded="$xs"
      focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
      onHoverOut={() => setHover(null)}
    >
      <XStack position="relative">
        <Stars value={current} max={max} hover={hover} />
        <XStack position="absolute" t={0} l={0} r={0} b={0}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <XStack
              key={n}
              flex={1}
              cursor="pointer"
              onHoverIn={() => setHover(n)}
              onPress={() => set(n === current ? 0 : n)}
              {...({ 'data-star': n } as object)}
            />
          ))}
        </XStack>
      </XStack>
    </XStack>
  )
}

// ── boolean ───────────────────────────────────────────────────────────────────
export function BooleanInput({ field, value, onChange }: FieldInputProps) {
  const meta = (field.metadata ?? {}) as { trueLabel?: string; falseLabel?: string }
  const on = value === true || value === 'true' || value === 1
  return (
    <XStack items="center" gap="$2">
      <Switch aria-label={field.label} checked={on} onCheckedChange={(next: boolean) => onChange(next)} />
      <Text fontSize="$2" color="$aside">
        {on ? meta.trueLabel ?? 'Yes' : meta.falseLabel ?? 'No'}
      </Text>
    </XStack>
  )
}

// ── pickers: select / multiSelect / relation ─────────────────────────────────
/** The editor's trigger: the field box holding the current value and a chevron. */
function Trigger({ children, ...props }: { children: ReactNode } & Record<string, unknown>) {
  return (
    <Button variant="outline" width="100%" justify="space-between" endIcon={<ChevronDown color="$hint" />} {...props}>
      <XStack flex={1} minW={0} items="center" gap="$1" overflow="hidden">
        {children}
      </XStack>
    </Button>
  )
}

const Placeholder = ({ text }: { text: string }) => (
  <Text fontSize="$2" color="$hush" numberOfLines={1}>
    {text}
  </Text>
)

/** Open from the start when the editor opens in place (a cell, a record field). */
const useOpen = (autoFocus?: boolean) => useState(Boolean(autoFocus))

export function SelectInput(props: FieldInputProps) {
  const { value, onChange, autoFocus } = props
  const options = optionsOf(props)
  const [open, setOpen] = useOpen(autoFocus)
  const [q, setQ] = useState('')
  const current = asStr(value)
  const selected = options.find((o) => o.value === current)
  const shown = matching(options, q)
  return (
    <DropdownMenu open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setQ('') }}>
      <DropdownMenuTrigger asChild>
        <Trigger aria-label={label(props)}>
          {selected ? <Tag label={selected.label} color={selected.color} /> : <Placeholder text="Select…" />}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent minW={240}>
        <DropdownMenuSearch value={q} onValueChange={setQ} placeholder="Search options" aria-label={`Search ${label(props)}`} />
        {current ? (
          <DropdownMenuItem onSelect={() => onChange(null)}>{`No ${label(props)}`}</DropdownMenuItem>
        ) : null}
        <DropdownMenuSelectionGroup value={current || null} onValueChange={(v) => onChange(v ?? null)}>
          <DropdownMenuSection scrollable>
            {shown.map((o) => (
              <DropdownMenuOptionItem key={o.value} value={o.value}>
                <Tag label={o.label} color={o.color} />
              </DropdownMenuOptionItem>
            ))}
          </DropdownMenuSection>
        </DropdownMenuSelectionGroup>
        {shown.length === 0 ? <DropdownMenuEmpty>No options</DropdownMenuEmpty> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A checkable list of options; every toggle is emitted, the menu stays open until dismissed. */
export function MultiSelectInput(props: FieldInputProps) {
  const { value, onChange, autoFocus } = props
  const options = optionsOf(props)
  const [open, setOpen] = useOpen(autoFocus)
  const [q, setQ] = useState('')
  const chosen = asArray(value).map(asStr).filter(Boolean)
  const shown = matching(options, q)
  return (
    <DropdownMenu open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setQ('') }}>
      <DropdownMenuTrigger asChild>
        <Trigger aria-label={label(props)}>
          {chosen.length > 0 ? (
            chosen.map((v) => {
              const o = options.find((x) => x.value === v) ?? { value: v, label: v }
              return <Tag key={v} label={o.label} color={o.color} />
            })
          ) : (
            <Placeholder text="Select…" />
          )}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent minW={240}>
        <DropdownMenuSearch value={q} onValueChange={setQ} placeholder="Search options" aria-label={`Search ${label(props)}`} />
        <DropdownMenuSelectionGroup multiple value={chosen} onValueChange={(v) => onChange(asArray(v).map(asStr))}>
          <DropdownMenuSection scrollable>
            {shown.map((o) => (
              <DropdownMenuOptionItem key={o.value} value={o.value}>
                <Tag label={o.label} color={o.color} />
              </DropdownMenuOptionItem>
            ))}
          </DropdownMenuSection>
        </DropdownMenuSelectionGroup>
        {shown.length === 0 ? <DropdownMenuEmpty>No options</DropdownMenuEmpty> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * A record picker over the candidates the host injects as options (`fieldOptions`
 * in the table and the record views). With none injected it is an id field —
 * honest about having no list rather than inventing one.
 */
export function RelationInput(props: FieldInputProps) {
  const { field, value, onChange, onSubmit, onCancel, autoFocus } = props
  const options = optionsOf(props)
  const shape = ((field.metadata ?? {}) as { shape?: 'square' | 'circle' }).shape ?? 'square'
  const [open, setOpen] = useOpen(autoFocus)
  const [q, setQ] = useState('')
  if (options.length === 0) {
    const text =
      typeof value === 'object' && value != null
        ? asStr((value as Record<string, unknown>).name ?? (value as Record<string, unknown>).id)
        : asStr(value)
    return (
      <Keys onSubmit={onSubmit} onCancel={onCancel}>
        <Input aria-label={field.label} value={text} onChangeText={(t: string) => onChange(t)} placeholder="Related record id…" autoFocus={autoFocus} />
      </Keys>
    )
  }
  const current = asStr(
    typeof value === 'object' && value != null
      ? (value as Record<string, unknown>).id ?? (value as Record<string, unknown>).value
      : value,
  )
  const selected = options.find((o) => o.value === current)
  const shown = matching(options, q)
  const face = (o: SelectOption) => (
    <XStack items="center" gap="$2" minW={0}>
      <Avatar size="md" shape={shape} name={o.label} colorSeed={o.value} src={o.avatarUrl ?? null} />
      <Text fontSize="$2" color="$ink" numberOfLines={1}>
        {o.label}
      </Text>
    </XStack>
  )
  return (
    <DropdownMenu open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setQ('') }}>
      <DropdownMenuTrigger asChild>
        <Trigger aria-label={field.label}>{selected ? face(selected) : <Placeholder text="Link a record…" />}</Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent minW={280}>
        <DropdownMenuSearch value={q} onValueChange={setQ} placeholder="Search records" aria-label={`Search ${field.label}`} />
        {current ? <DropdownMenuItem onSelect={() => onChange(null)}>{`No ${field.label}`}</DropdownMenuItem> : null}
        <DropdownMenuSelectionGroup value={current || null} onValueChange={(v) => onChange(v ?? null)}>
          <DropdownMenuSection scrollable>
            {shown.map((o) => (
              <DropdownMenuOptionItem key={o.value} value={o.value}>
                {face(o)}
              </DropdownMenuOptionItem>
            ))}
          </DropdownMenuSection>
        </DropdownMenuSelectionGroup>
        {shown.length === 0 ? <DropdownMenuEmpty>No record found</DropdownMenuEmpty> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── date / dateTime ───────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
/** A calendar day as the kit's Calendar holds it: local midnight of that day. */
const toLocal = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const fromLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/**
 * A date picker: the day as typed text above the kit's Calendar, and Clear. A
 * `date` value is a `YYYY-MM-DD` day; a `dateTime` adds an `HH:mm` field and is
 * emitted as an ISO instant in the reader's zone.
 */
export function DateInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const timed = field.type === 'dateTime'
  const [open, setOpen] = useOpen(autoFocus)
  const instant = timed && value != null && value !== '' ? new Date(value as string) : null
  const day = timed && instant && !Number.isNaN(instant.getTime()) ? fromLocal(instant) : asDay(value)
  const time = instant && !Number.isNaN(instant.getTime()) ? `${pad(instant.getHours())}:${pad(instant.getMinutes())}` : ''
  const [typed, setTyped] = useState<string | null>(null)
  const emit = (d: string, t = time) => {
    if (!d) return onChange(null)
    if (!timed) return onChange(d)
    const at = new Date(`${d}T${/^\d{2}:\d{2}$/.test(t) ? t : '00:00'}`)
    onChange(Number.isNaN(at.getTime()) ? null : at.toISOString())
  }
  const shown = day
    ? toLocal(day).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + (timed && time ? ` ${time}` : '')
    : ''
  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom-start">
      <PopoverTrigger asChild>
        <Trigger aria-label={field.label}>
          <CalendarIcon size={14} color="$hint" />
          {shown ? <Text fontSize="$2" color="$ink" numberOfLines={1}>{shown}</Text> : <Placeholder text="Pick a date…" />}
        </Trigger>
      </PopoverTrigger>
      <PopoverContent size="sm" width={280}>
        <Keys onSubmit={onSubmit} onCancel={onCancel}>
          <YStack gap="$2">
            <XStack gap="$1">
              <Input
                aria-label={`${field.label}, as YYYY-MM-DD`}
                size="sm"
                flex={1}
                value={typed ?? day}
                placeholder="YYYY-MM-DD"
                onChangeText={(t: string) => {
                  setTyped(t)
                  if (/^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(toLocal(t).getTime())) emit(t)
                  else if (t === '') emit('')
                }}
                onBlur={() => setTyped(null)}
              />
              {timed ? (
                <Input
                  aria-label={`${field.label}, time`}
                  size="sm"
                  width={72}
                  value={time}
                  placeholder="HH:mm"
                  onChangeText={(t: string) => {
                    if (/^\d{2}:\d{2}$/.test(t)) emit(day || fromLocal(new Date()), t)
                  }}
                />
              ) : null}
            </XStack>
            <KitCalendar
              mode="single"
              selected={day ? toLocal(day) : undefined}
              defaultMonth={day ? toLocal(day) : undefined}
              onSelect={(d?: Date) => {
                emit(d ? fromLocal(d) : '')
                if (!timed) setOpen(false)
              }}
            />
            {day ? (
              <Button size="xs" variant="ghost" emphasis="subtle" onPress={() => { emit(''); setOpen(false) }}>
                Clear
              </Button>
            ) : null}
          </YStack>
        </Keys>
      </PopoverContent>
    </Popover>
  )
}

// ── links (multi-item list) ───────────────────────────────────────────────────
/**
 * Several links: each a row with its host and a remove button, then an add field
 * where Enter appends. The first is the primary one, as twenty-spec FT-101 says.
 */
export function LinksInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const links = asLinks(value)
  const [draft, setDraft] = useState('')
  const add = () => {
    const url = draft.trim()
    if (!url) return onSubmit?.()
    onChange([...links, { url }])
    setDraft('')
  }
  return (
    <YStack gap="$1" flex={1} minW={0}>
      {links.map((l, i) => (
        <XStack key={`${l.url}-${i}`} items="center" gap="$2" minH={24}>
          <Text flex={1} minW={0} fontSize="$2" color="$ink" numberOfLines={1}>
            {l.label?.trim() || hostOf(l.url)}
          </Text>
          <Button
            size="icon-2xs"
            variant="ghost"
            emphasis="subtle"
            aria-label={`Remove ${l.label?.trim() || hostOf(l.url)}`}
            onPress={() => onChange(links.filter((_, j) => j !== i))}
          >
            <X />
          </Button>
        </XStack>
      ))}
      <Keys onSubmit={add} onCancel={onCancel}>
        <Input
          aria-label={`Add to ${field.label}`}
          {...({ type: 'url', inputMode: 'url' } as object)}
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a link"
          autoFocus={autoFocus}
        />
      </Keys>
    </YStack>
  )
}

// ── composite: full name, address ────────────────────────────────────────────
/** First and last side by side; "Ada Lovelace" pasted into the first splits across both. */
export function FullNameInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const n = asName(value)
  const emit = (first?: string, last?: string) =>
    onChange(!first?.trim() && !last?.trim() ? null : { first: first ?? '', last: last ?? '' })
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <XStack gap="$1">
        <Input
          aria-label={`${field.label}, first name`}
          flex={1}
          value={n.first ?? ''}
          placeholder="First name"
          autoFocus={autoFocus}
          onChangeText={(t: string) => {
            const pasted = asName(t)
            if (pasted.last && !n.last && t.includes(' ')) emit(pasted.first, pasted.last)
            else emit(t, n.last)
          }}
        />
        <Input aria-label={`${field.label}, last name`} flex={1} value={n.last ?? ''} placeholder="Last name" onChangeText={(t: string) => emit(n.first, t)} />
      </XStack>
    </Keys>
  )
}

const ADDRESS_LABEL: Record<(typeof ADDRESS_PARTS)[number], string> = {
  street1: 'Address 1',
  street2: 'Address 2',
  city: 'City',
  state: 'State',
  postcode: 'Post code',
  country: 'Country',
}

/** The labelled address form, its country a searchable select; emits `{ street1, …, country }`. */
export function AddressInput({ field, value, onChange, onSubmit, onCancel, autoFocus }: FieldInputProps) {
  const fallback = ((field.metadata ?? {}) as { defaultCountry?: string }).defaultCountry
  const a = asAddress(value)
  const list = useMemo(() => regions().map((r) => ({ value: r.value, label: r.label })), [])
  const set = (k: keyof AddressValue, v: string | null) => {
    const next: AddressValue = { ...a, [k]: v ?? undefined }
    if (!v) delete next[k]
    onChange(Object.keys(next).length ? next : null)
  }
  return (
    <Keys onSubmit={onSubmit} onCancel={onCancel}>
      <YStack gap="$1" width={344} maxW="100%">
        {(['street1', 'street2'] as const).map((k, i) => (
          <Input key={k} aria-label={ADDRESS_LABEL[k]} placeholder={ADDRESS_LABEL[k]} value={a[k] ?? ''} autoFocus={autoFocus && i === 0} onChangeText={(t: string) => set(k, t)} />
        ))}
        <XStack gap="$1">
          <Input aria-label={ADDRESS_LABEL.city} placeholder={ADDRESS_LABEL.city} flex={1} value={a.city ?? ''} onChangeText={(t: string) => set('city', t)} />
          <Input aria-label={ADDRESS_LABEL.state} placeholder={ADDRESS_LABEL.state} flex={1} value={a.state ?? ''} onChangeText={(t: string) => set('state', t)} />
        </XStack>
        <XStack gap="$1">
          <Input aria-label={ADDRESS_LABEL.postcode} placeholder={ADDRESS_LABEL.postcode} flex={1} value={a.postcode ?? ''} onChangeText={(t: string) => set('postcode', t)} />
          <YStack flex={1} minW={0}>
            <CountrySelect
              aria-label={ADDRESS_LABEL.country}
              countries={list}
              value={(a.country && /^[A-Za-z]{2}$/.test(a.country) ? a.country.toUpperCase() : null) ?? fallback?.toUpperCase() ?? null}
              onValueChange={(iso) => set('country', iso)}
            />
          </YStack>
        </XStack>
      </YStack>
    </Keys>
  )
}

// ── files (web upload; host persists) ─────────────────────────────────────────
export function FileInput({ value, onChange }: FieldInputProps) {
  const files = asArray(value)
  const nameOf = (f: unknown) => (typeof f === 'string' ? f : asStr((f as { name?: string; label?: string })?.label ?? (f as { name?: string })?.name ?? 'file'))
  const pick = () => {
    if (typeof document === 'undefined') return
    const el = document.createElement('input')
    el.type = 'file'
    el.multiple = true
    el.onchange = () => onChange(el.files ? [...files, ...Array.from(el.files)] : files)
    el.click()
  }
  const web = typeof document !== 'undefined'
  return (
    <YStack gap="$2">
      {web ? (
        <Button size="sm" variant="outline" startIcon={<Upload />} onPress={pick} self="flex-start">
          Choose files
        </Button>
      ) : (
        <Text fontSize="$2" color="$hint">
          File upload is available on the web.
        </Text>
      )}
      {files.length > 0 ? (
        <XStack gap="$1" flexWrap="wrap">
          {files.map((f, i) => (
            <XStack key={`${nameOf(f)}-${i}`} items="center" gap="$1" height={24} pl="$2" pr="$1" rounded="$xs" bg="$hover">
              <Text fontSize="$2" color="$ink" numberOfLines={1} maxW={160}>
                {nameOf(f)}
              </Text>
              <Button size="icon-2xs" variant="ghost" emphasis="subtle" aria-label={`Remove ${nameOf(f)}`} onPress={() => onChange(files.filter((_, j) => j !== i))}>
                <X />
              </Button>
            </XStack>
          ))}
        </XStack>
      ) : null}
    </YStack>
  )
}

// ── json (the kit's code editor) ──────────────────────────────────────────────
function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

/** The kit's one code editor, in JSON. Valid text is emitted parsed; invalid text is shown and not emitted. */
export function JsonInput({ field, value, onChange, onCancel }: FieldInputProps) {
  const [text, setText] = useState(() => (value == null ? '' : typeof value === 'string' ? value : safeStringify(value)))
  return (
    <YStack gap="$1" width={400} maxW="100%" {...({ onKeyDown: (e: { key?: string }) => e.key === 'Escape' && onCancel?.() } as object)}>
      <CodeEditor
        label={field.label}
        language="json"
        value={text}
        minHeight={120}
        maxHeight={300}
        onChange={(t: string) => {
          setText(t)
          const check = checkJson(t)
          if (check.kind === 'empty') onChange(null)
          else if (check.kind === 'json') onChange(check.value)
        }}
      />
    </YStack>
  )
}
