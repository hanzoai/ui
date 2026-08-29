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
    // A CONTROL boundary, not a surface hairline. `$borderColor` is 10% white —
    // right for a card edge sitting on its own fill, and 1.26:1 against the
    // ground, where WCAG 1.4.11 asks 3:1 for the visible boundary of a control.
    // An unchecked box was therefore not quiet, it was absent. `$bound` is
    // 3.45:1. The two jobs shared one token and only one of them was satisfied.
    borderColor="$bound"
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
