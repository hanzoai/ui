'use client'

// Toggle — an on/off switch: @hanzo/ui's Switch, under this package's small
// `on` / `onChange` / `disabled` contract.
import { Switch } from '@hanzo/ui'

export interface ToggleProps {
  on?: boolean
  onChange?: (on: boolean) => void
  disabled?: boolean
  /** What the switch turns on, for assistive technology. */
  label?: string
}

export function Toggle({ on, onChange, disabled, label }: ToggleProps) {
  return (
    <Switch
      size="md"
      checked={Boolean(on)}
      disabled={disabled}
      onCheckedChange={(next: boolean) => onChange?.(next)}
      {...(label ? { 'aria-label': label } : null)}
    />
  )
}
