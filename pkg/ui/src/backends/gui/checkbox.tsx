'use client'

/**
 * Checkbox — 16px box, `touch()` to the 44px floor on web and native alike.
 * @hanzogui/checkbox owns the checked/indeterminate state and a11y.
 */
import { Checkbox as GuiCheckbox } from '@hanzo/gui'
import { Check } from '@hanzogui/lucide-icons-2'
import type { ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

const BOX = 16

export type CheckboxProps = ComponentProps<typeof GuiCheckbox>

const Checkbox = (props: CheckboxProps) => (
  <GuiCheckbox
    {...slot('checkbox')}
    width={BOX}
    height={BOX}
    flexShrink={0}
    borderRadius="$2"
    borderWidth={1}
    borderColor="$borderColor"
    backgroundColor="transparent"
    {...touch(BOX)}
    {...props}
  >
    <GuiCheckbox.Indicator {...slot('checkbox-indicator')} alignItems="center" justifyContent="center">
      <Check size={BOX - 3} />
    </GuiCheckbox.Indicator>
  </GuiCheckbox>
)

export { Checkbox }
