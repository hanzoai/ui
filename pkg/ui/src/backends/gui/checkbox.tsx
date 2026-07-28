'use client'

/**
 * Checkbox — 16px box, `hitSlop` to the 44px touch floor.
 * @hanzogui/checkbox owns the checked/indeterminate state and a11y.
 */
import { Checkbox as GuiCheckbox } from '@hanzo/gui'
import { Check } from '@hanzogui/lucide-icons-2'
import type { ComponentProps } from 'react'
import { slot } from './slot'

const BOX = 16
const HIT_SLOP = (44 - BOX) / 2

export type CheckboxProps = ComponentProps<typeof GuiCheckbox>

const Checkbox = (props: CheckboxProps) => (
  <GuiCheckbox
    {...slot('checkbox')}
    width={BOX}
    height={BOX}
    shrink={0}
    rounded="$2"
    borderWidth={1}
    borderColor="$borderColor"
    bg="transparent"
    hitSlop={HIT_SLOP}
    {...props}
  >
    <GuiCheckbox.Indicator {...slot('checkbox-indicator')} items="center" justify="center">
      <Check size={BOX - 3} />
    </GuiCheckbox.Indicator>
  </GuiCheckbox>
)

export { Checkbox }
