// CheckBox — a small, self-contained selection box (no composite gui Checkbox
// API), used for row selection in the table. Checked / indeterminate states with
// the data palette; press toggles. Keeps the package on its minimal primitive
// surface so it type-checks everywhere.
import { Check, Minus } from '@hanzogui/lucide-icons-2'
import { YStack } from '@hanzo/gui'
import { tokens } from '../theme'

export interface CheckBoxProps {
  checked?: boolean
  /** Some-but-not-all selected (header checkbox). */
  indeterminate?: boolean
  onChange?: (checked: boolean) => void
  size?: number
}

export function CheckBox({ checked, indeterminate, onChange, size = 16 }: CheckBoxProps) {
  const on = checked || indeterminate
  return (
    <YStack
      width={size}
      height={size}
      rounded={4}
      items="center"
      justify="center"
      borderWidth={1}
      cursor="pointer"
      onPress={onChange ? () => onChange(!checked) : undefined}
      hoverStyle={{ borderColor: tokens.accent }}
      style={{
        backgroundColor: on ? tokens.accent : 'transparent',
        borderColor: on ? tokens.accent : tokens.border,
      }}
    >
      {indeterminate ? (
        <Minus size={size - 4} color="#0b1220" strokeWidth={3} />
      ) : checked ? (
        <Check size={size - 4} color="#0b1220" strokeWidth={3} />
      ) : null}
    </YStack>
  )
}
