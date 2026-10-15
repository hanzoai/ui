'use client'

/**
 * Checkbox — 16px box, `touch()` to the 44px floor on web and native alike.
 * @hanzogui/checkbox owns the checked/indeterminate state and a11y.
 */
import { Checkbox as GuiCheckbox, CheckboxContext } from '@hanzo/gui'
import { Check, Minus } from '@hanzogui/lucide-icons-2'
import { useContext, type ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

const BOX = 16

export type CheckboxProps = ComponentProps<typeof GuiCheckbox>

/**
 * The mark: a tick when checked, a dash when indeterminate. `$ink` on the
 * transparent well, as the RadioGroup dot, so it reads on either theme's ground.
 * Stroke 3 of lucide's 24-unit box is 1.6px at 13px.
 */
const Mark = () => {
  const Icon = useContext(CheckboxContext).checked === 'indeterminate' ? Minus : Check
  return <Icon size={BOX - 3} color="$ink" strokeWidth={3} />
}

const Checkbox = (props: CheckboxProps) => (
  <GuiCheckbox
    {...slot('checkbox')}
    width={BOX}
    height={BOX}
    flexShrink={0}
    // The frame is a <button>, which the user agent pads 1px 6px: on a 16px
    // border box that leaves a 2px-wide content box and squeezes the 13px mark
    // to 2px. Zero padding gives the mark the whole 14px inside the border.
    padding={0}
    borderRadius="$2"
    borderWidth={1}
    // A CONTROL boundary, not a surface hairline. `$borderColor` is 10% white —
    // right for a card edge sitting on its own fill, and 1.26:1 against the
    // ground, where WCAG 1.4.11 asks 3:1 for the visible boundary of a control.
    // An unchecked box was therefore not quiet, it was absent. `$bound` is
    // 3.45:1. The two jobs shared one token and only one of them was satisfied.
    borderColor="$bound"
    backgroundColor="transparent"
    // gui fills a checked box with `$backgroundActive` unless `activeStyle` is
    // given; the well stays transparent so the `$ink` mark keeps its contrast.
    activeStyle={{ bg: 'transparent' }}
    {...touch(BOX)}
    {...props}
  >
    <GuiCheckbox.Indicator {...slot('checkbox-indicator')} alignItems="center" justifyContent="center">
      <Mark />
    </GuiCheckbox.Indicator>
  </GuiCheckbox>
)

export { Checkbox }
