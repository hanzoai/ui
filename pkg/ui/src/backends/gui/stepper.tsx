'use client'

/**
 * Stepper — a whole number with a button either side.
 *
 * Both buttons are named for the thing counted (`label`), the count is a live
 * region, and each button disables at its bound instead of silently clamping.
 */
import { XStack } from '@hanzo/gui'
import { Minus, Plus } from '@hanzogui/lucide-icons-2'
import { Button } from './button'
import { SizableText } from './layout'
import { slot } from './slot'

export interface StepperProps {
  /** What is counted, plural: `Standard seats`. */
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}

export function Stepper({ label, value, onChange, min = 0, max = Number.MAX_SAFE_INTEGER }: StepperProps) {
  const what = label.toLowerCase()
  return (
    <XStack {...slot('stepper')} role="group" aria-label={label} items="center" gap="$1">
      <Button variant="outline" size="icon" type="button" aria-label={`Fewer ${what}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={16} />
      </Button>
      <SizableText role="status" aria-live="polite" minW={32} text="center">
        {value}
      </SizableText>
      <Button variant="outline" size="icon" type="button" aria-label={`More ${what}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={16} />
      </Button>
    </XStack>
  )
}
