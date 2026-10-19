'use client'

// CheckBox — the row-selection box: @hanzo/ui's Checkbox in its record look
// (the 12px solid box with its hover halo), keeping this package's small
// `checked` / `indeterminate` / `onChange` contract for the table and its callers.
// `size` above 16 takes the kit's md box.
import { Checkbox } from '@hanzo/ui'

export interface CheckBoxProps {
  checked?: boolean
  /** Some-but-not-all selected (header checkbox). */
  indeterminate?: boolean
  onChange?: (checked: boolean) => void
  size?: number
  /** What the box selects, for assistive technology ("Select all", "Select Acme"). */
  label?: string
}

export function CheckBox({ checked, indeterminate, onChange, size = 16, label }: CheckBoxProps) {
  return (
    <Checkbox
      size={size > 16 ? 'md' : 'sm'}
      variant="solid"
      hoverable
      checked={indeterminate ? 'indeterminate' : Boolean(checked)}
      onCheckedChange={() => onChange?.(indeterminate ? true : !checked)}
      aria-label={label ?? (indeterminate ? 'Select all' : 'Select')}
    />
  )
}
