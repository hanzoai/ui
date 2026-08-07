'use client'

/**
 * RadioGroup — one-of-many, on @hanzogui/radio-group.
 *
 * gui's `RadioGroup` already ships everything the Radix original shipped:
 * `role="radiogroup"` on the frame, `role="radio"` + `aria-checked` +
 * `data-state` on each item, roving arrow-key focus that loops, Enter/Space to
 * select, and the hidden bubbling `<input type="radio">` that makes the group a
 * real form control. This file only FLATTENS `RadioGroup.Item` +
 * `RadioGroup.Indicator` into the two shadcn names and dresses them in Hanzo
 * tokens, so `<RadioGroupItem value="x" />` carries its own dot exactly as the
 * Radix fork it replaces did.
 *
 * NO RENAMES. value / defaultValue / onValueChange / name / required / disabled
 * / orientation / id all mean what they meant under Radix.
 *
 * NOT EXPRESSIBLE — `loop` and `dir`. gui builds the roving focus group inside
 * RadioGroup with `loop: true` fixed and takes direction from its own context,
 * so neither prop has anywhere to land. Both are the Radix defaults, so no call
 * site loses behaviour, and one that passed `loop={false}` gets a type error
 * instead of a silent no-op — the failure you want from a layer that otherwise
 * drops what it does not recognise.
 *
 * WORKED AROUND — `orientation="horizontal"` reached gui as `aria-orientation`
 * and as the roving-focus axis but NOT as layout: `RadioGroup` destructures
 * `orientation` for those two and never forwards it, so the frame's own
 * `orientation` variant never runs and the group stays a COLUMN while
 * announcing itself a row. The direction is restored here, from the same prop.
 */
import { RadioGroup as GuiRadioGroup } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

/** 16px control, 8px dot — the Checkbox's box, made round. */
const BOX = 16
const DOT = 8

export type RadioGroupProps = ComponentProps<typeof GuiRadioGroup>
export type RadioGroupItemProps = ComponentProps<typeof GuiRadioGroup.Item>

const RadioGroup = ({ orientation = 'vertical', ...props }: RadioGroupProps) => (
  <GuiRadioGroup
    {...slot('radio-group')}
    orientation={orientation}
    flexDirection={orientation === 'horizontal' ? 'row' : 'column'}
    gap="$2"
    {...props}
  />
)

const RadioGroupItem = ({ disabled, children, ...props }: RadioGroupItemProps) => (
  <GuiRadioGroup.Item
    {...slot('radio-group-item')}
    width={BOX}
    height={BOX}
    flexShrink={0}
    borderRadius={1000}
    borderWidth={1}
    borderColor="$borderColor"
    backgroundColor="transparent"
    // Stated rather than left to gui's `disabled` variant, which turns off
    // pointer events without dimming: a dead control that looks live invites a
    // click that does nothing. Same treatment as Switch.
    disabled={disabled}
    opacity={disabled ? 0.5 : 1}
    cursor={disabled ? 'not-allowed' : 'pointer'}
    {...touch(BOX)}
    {...props}
  >
    {/* Mounts only while checked — presence IS the state, and it is the one
        affordance a 16px control has room for. `$color12` against the
        transparent well reads at any size; gui's default `$color` is the muted
        rung and vanished on a lifted surface. */}
    <GuiRadioGroup.Indicator
      {...slot('radio-group-indicator')}
      width={DOT}
      height={DOT}
      borderRadius={1000}
      backgroundColor="$color12"
    />
    {children}
  </GuiRadioGroup.Item>
)

export { RadioGroup, RadioGroupItem }
