'use client'

/**
 * NumberField — a number typed, formatted and stepped in the reader's locale:
 * an amount, a quantity, a percentage, a settings counter.
 *
 * The value is a number or null and the text is the reader's: `1,234.5` in
 * en-US, `1.234,5` in de-DE, `1 234,5` in fr-FR. While the field has focus the
 * text is left as typed, and every keystroke that reads as a number reports it;
 * on blur the number is clamped to its range (unless `allowOutOfRange`) and the
 * text is formatted again. Parsing tolerates the locale's grouping, its decimal
 * mark, spaces of every width and a typographic minus, so a pasted
 * "€1.234,50" or "1 234,5" is read rather than refused.
 *
 * Keys, as a spinbutton: ArrowUp/ArrowDown move by `step`, with Shift by
 * `largeStep` and Alt by `smallStep`; Home and End jump to `min` and `max`. The
 * optional buttons step the same way and leave the keyboard to the field.
 *
 * gui has no number-field primitive, so the behaviour is written once here.
 * Props, keys and defaults after the source kit's NumberField (MIT, NOTICE): step 1,
 * smallStep 0.1, largeStep 10, no wheel scrub, out-of-range refused; its buttons
 * are the outline control at the field's height, 4px apart.
 */
import { XStack } from '@hanzo/gui'
import { Minus, Plus } from '@hanzogui/lucide-icons-2'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { Button, type ButtonSize } from './button'
import type { FieldSize } from './control'
import { fieldSize, useDensity } from './density'
import { Input, type InputProps } from './input'
import { slot } from './slot'

export type NumberFieldProps = Omit<
  InputProps,
  'value' | 'defaultValue' | 'onChangeText' | 'type' | 'secureTextEntry' | 'reveal'
> & {
  value?: number | null
  defaultValue?: number | null
  /** Every number the text reads as while typing, the clamped one on blur, and each step. */
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  /** ArrowUp/ArrowDown and the buttons. */
  step?: number
  /** With Alt held. */
  smallStep?: number
  /** With Shift held. */
  largeStep?: number
  /** How the number is written when the field is not being edited (Intl.NumberFormat). */
  format?: Intl.NumberFormatOptions
  /** The locale it is written and read in; the reader's by default. */
  locale?: string
  /** Keep a typed number outside min/max instead of clamping it on blur. */
  allowOutOfRange?: boolean
  readOnly?: boolean
  required?: boolean
  /** Decrement and increment buttons beside the field. */
  buttons?: boolean
  decrementLabel?: string
  incrementLabel?: string
}

/** The separators a locale writes, read off its own formatter. */
const marks = (locale: string | undefined) => {
  const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6)
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  }
}

/** Every space a formatter or a paste can carry: plain, no-break, narrow no-break, thin. */
const SPACES = /[\s\u00a0\u202f\u2009]/g
const SPACE = /^[\s\u00a0\u202f\u2009]$/

/**
 * The number `text` reads as in `locale`; NaN when it is empty or not a number
 * at all. A percent format reads `12%` as 0.12.
 */
export function parseNumber(text: string, locale?: string, format?: Intl.NumberFormatOptions): number {
  const { group, decimal } = marks(locale)
  let t = text.replace(SPACES, '').replace(/[\u2212\u2012\u2013]/g, '-')
  if (!t) return NaN
  if (group && !SPACE.test(group)) t = t.split(group).join('')
  const percent = format?.style === 'percent' || t.includes('%')
  t = t.replace(/[^0-9.,\-+]/g, '')
  if (decimal !== '.') t = t.replace(/\./g, '').replace(decimal, '.')
  else t = t.replace(/,/g, '')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN
  const n = Number(t)
  return percent ? n / 100 : n
}

/** Digits after the point, so a step of 0.1 from 0.2 lands on 0.3 and not 0.30000000000000004. */
const decimals = (n: number) => {
  const s = String(n)
  const e = s.match(/e-(\d+)$/)
  if (e) return Number(e[1])
  return s.includes('.') ? s.split('.')[1].length : 0
}

const clamp = (n: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))

/** The icon button that stands beside a field of each box. */
const BESIDE: Record<FieldSize, ButtonSize> = { lg: 'icon-lg', default: 'icon', sm: 'icon-sm', xs: 'icon-xs' }

export function NumberField({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  smallStep = 0.1,
  largeStep = 10,
  format,
  locale,
  allowOutOfRange = false,
  readOnly = false,
  required,
  disabled,
  buttons = false,
  decrementLabel,
  incrementLabel,
  size,
  onFocus,
  onBlur,
  ...props
}: NumberFieldProps) {
  const { t } = useI18n()
  const density = useDensity()
  const box = fieldSize(size, density)
  const controlled = value !== undefined
  const [own, setOwn] = useState<number | null>(defaultValue)
  const current = controlled ? value : own
  const [draft, setDraft] = useState<string | null>(null)
  const last = useRef<number | null>(current)
  last.current = current

  const formatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 20, ...format }), [locale, format])
  const shown = draft ?? (current == null || Number.isNaN(current) ? '' : formatter.format(current))

  const commit = useCallback(
    (next: number | null) => {
      if (!controlled) setOwn(next)
      if (next !== last.current) onValueChange?.(next)
      last.current = next
    },
    [controlled, onValueChange],
  )

  const nudge = (by: number) => {
    if (readOnly || disabled) return
    const base = current ?? (by > 0 ? (min ?? 0) - by : (max ?? 0) - by)
    const places = Math.max(decimals(by), decimals(base))
    const raw = Number((base + by).toFixed(places))
    setDraft(null)
    commit(allowOutOfRange ? raw : clamp(raw, min, max))
  }

  const onKeyDown = (e: { key?: string; shiftKey?: boolean; altKey?: boolean; preventDefault?: () => void }) => {
    const by = e.shiftKey ? largeStep : e.altKey ? smallStep : step
    if (e.key === 'ArrowUp') nudge(by)
    else if (e.key === 'ArrowDown') nudge(-by)
    else if (e.key === 'Home' && min != null && !readOnly) {
      setDraft(null)
      commit(min)
    } else if (e.key === 'End' && max != null && !readOnly) {
      setDraft(null)
      commit(max)
    } else return
    e.preventDefault?.()
  }

  const atMin = current != null && min != null && current <= min
  const atMax = current != null && max != null && current >= max

  const field = (
    <Input
      {...slot('number-field-input')}
      {...props}
      size={box}
      // A spinbutton to assistive technology: a text field whose value is a
      // number in a range, stepped by the arrows.
      {...({
        role: 'spinbutton',
        'aria-valuenow': current ?? undefined,
        'aria-valuemin': min,
        'aria-valuemax': max,
        'aria-readonly': readOnly || undefined,
        'aria-required': required || undefined,
      } as object)}
      inputMode={format?.maximumFractionDigits === 0 ? 'numeric' : 'decimal'}
      autoComplete="off"
      disabled={disabled}
      readOnly={readOnly}
      value={shown}
      onChangeText={(text: string) => {
        setDraft(text)
        if (!text.trim()) return commit(null)
        const n = parseNumber(text, locale, format)
        if (!Number.isNaN(n)) commit(n)
      }}
      onFocus={(e: unknown) => {
        // Editing starts from the number as written, so a reader edits what
        // they see rather than an unformatted copy of it.
        setDraft(shown)
        ;(onFocus as ((e: unknown) => void) | undefined)?.(e)
      }}
      onBlur={(e: unknown) => {
        const text = draft
        setDraft(null)
        if (text != null && text.trim()) {
          const n = parseNumber(text, locale, format)
          if (!Number.isNaN(n)) commit(allowOutOfRange ? n : clamp(n, min, max))
        }
        ;(onBlur as ((e: unknown) => void) | undefined)?.(e)
      }}
      {...({ onKeyDown } as object)}
    />
  )

  if (!buttons) return field

  const beside = BESIDE[box]
  const press = (by: number) => () => nudge(by)
  return (
    <XStack {...slot('number-field')} items="center" gap="$1" width="100%" minW={0}>
      <XStack flex={1} minW={0}>
        {field}
      </XStack>
      <Button
        {...slot('number-field-decrement')}
        variant="outline"
        size={beside}
        aria-label={decrementLabel ?? t('Decrease')}
        // The keyboard belongs to the field; the buttons are for a pointer.
        tabIndex={-1}
        disabled={disabled || (!allowOutOfRange && atMin)}
        {...(readOnly ? { opacity: 0.5, cursor: 'default', hoverStyle: { bg: '$background' } } : null)}
        onPress={press(-step)}
      >
        <Minus size={16} />
      </Button>
      <Button
        {...slot('number-field-increment')}
        variant="outline"
        size={beside}
        aria-label={incrementLabel ?? t('Increase')}
        tabIndex={-1}
        disabled={disabled || (!allowOutOfRange && atMax)}
        {...(readOnly ? { opacity: 0.5, cursor: 'default', hoverStyle: { bg: '$background' } } : null)}
        onPress={press(step)}
      >
        <Plus size={16} />
      </Button>
    </XStack>
  )
}
