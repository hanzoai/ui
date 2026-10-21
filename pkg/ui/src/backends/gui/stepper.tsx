'use client'

/**
 * Stepper — a number with a button either side.
 *
 * Both buttons are named for the thing counted (`label`), the count is a live
 * region, and each button disables at its bound instead of silently clamping.
 *
 * `editable` makes the count a field a person can type into, the source
 * kit's NumberStepper (MIT, NOTICE): a 64px centred value at the medium weight that
 * commits on Enter or blur — read leniently (grouping stripped, either decimal
 * mark), held to the bounds, rounded to `step` and to `decimals` — and shows
 * Latin digits, grouped only from five digits up. It is on by default under
 * `<Density value="compact">`, where the buttons are 24px; a regular surface
 * keeps the plain count it always had. `readOnly` keeps the value and the
 * layout but lets neither the buttons nor the field change it.
 */
import { VisuallyHidden, XStack } from '@hanzo/gui'
import { Minus, Plus } from '@hanzogui/lucide-icons-2'
import { useEffect, useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { SizableText } from './layout'
import { slot } from './slot'
import { useDensity } from './density'

export interface StepperProps {
  /** What is counted, plural: `Standard seats`. */
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  /** How far one press moves the value. */
  step?: number
  /** Fraction digits a typed value keeps (0: whole numbers). */
  decimals?: number
  /** The count is a field. Default: on under a compact density, off elsewhere. */
  editable?: boolean
  /** Shown and announced, never changed. */
  readOnly?: boolean
}

/** Up to `decimals` fraction digits, Latin digits, grouping from five digits up. */
export const formatCount = (n: number, decimals = 0) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Math.min(Math.max(decimals, 0), 15),
    useGrouping: Math.abs(n) >= 10000,
  }).format(n)

/**
 * What a person typed, as a number, or `null` when it is not one. Spaces are
 * dropped. With both marks present the LAST is the decimal one (`1,234.5` and
 * `1.234,5` both read 1234.5); a comma alone is a decimal mark unless it groups
 * three digits (`12,345`).
 */
export const parseCount = (text: string): number | null => {
  const t = text.trim().replace(/[\s_]/g, '')
  if (!t) return null
  const dot = t.lastIndexOf('.')
  const comma = t.lastIndexOf(',')
  const normal =
    dot >= 0 && comma >= 0
      ? dot > comma
        ? t.replace(/,/g, '')
        : t.replace(/\./g, '').replace(',', '.')
      : comma >= 0
        ? t.replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.')
        : t
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normal)) return null
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}

/** A value held to the bounds and rounded to the step (from `min`) and the decimals. */
export const settle = (n: number, { min, max, step, decimals }: { min: number; max: number; step: number; decimals: number }) => {
  const stepped = step > 0 ? min + Math.round((n - min) / step) * step : n
  const bounded = Math.min(max, Math.max(min, stepped))
  const f = 10 ** Math.min(Math.max(decimals, 0), 15)
  return Math.round(bounded * f) / f
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  decimals = 0,
  editable,
  readOnly = false,
}: StepperProps) {
  const what = label.toLowerCase()
  const compact = useDensity() === 'compact'
  const typing = editable ?? compact
  const size = compact ? 'icon-xs' : 'icon'
  const [draft, setDraft] = useState(() => formatCount(value, decimals))
  useEffect(() => setDraft(formatCount(value, decimals)), [value, decimals])

  const commit = () => {
    const n = parseCount(draft)
    if (n == null) return setDraft(formatCount(value, decimals))
    const next = settle(n, { min, max, step, decimals })
    setDraft(formatCount(next, decimals))
    if (next !== value) onChange(next)
  }
  const move = (dir: 1 | -1) => onChange(settle(value + dir * step, { min, max, step, decimals }))

  return (
    <XStack {...slot('stepper')} role="group" aria-label={label} items="center" gap="$1">
      <Button
        variant="outline"
        size={size}
        type="button"
        aria-label={`Fewer ${what}`}
        disabled={value <= min}
        {...(readOnly ? { 'aria-disabled': true, opacity: 0.5, pointerEvents: 'none' } : null)}
        onClick={() => move(-1)}
      >
        <Minus size={16} />
      </Button>
      {typing ? (
        <>
          <Input
            {...slot('stepper-value')}
            aria-label={label}
            size={compact ? 'sm' : 'default'}
            // 64 holds a short count; a longer one widens the field rather
            // than clipping its own digits (about 8px a character at 13px).
            width={Math.max(64, draft.length * 8 + 20)}
            text="center"
            fontWeight="500"
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            value={draft}
            readOnly={readOnly}
            onChangeText={(t: string) => setDraft(t)}
            onBlur={commit}
            onSubmitEditing={commit}
          />
          {/* The field is not a live region; this is, so a press is still heard. */}
          <VisuallyHidden>
            <SizableText role="status" aria-live="polite">
              {formatCount(value, decimals)}
            </SizableText>
          </VisuallyHidden>
        </>
      ) : (
        <SizableText role="status" aria-live="polite" minW={32} text="center">
          {decimals > 0 ? formatCount(value, decimals) : value}
        </SizableText>
      )}
      <Button
        variant="outline"
        size={size}
        type="button"
        aria-label={`More ${what}`}
        disabled={value >= max}
        {...(readOnly ? { 'aria-disabled': true, opacity: 0.5, pointerEvents: 'none' } : null)}
        onClick={() => move(1)}
      >
        <Plus size={16} />
      </Button>
    </XStack>
  )
}
