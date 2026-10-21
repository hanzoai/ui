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
 *
 * Two looks. With no `size`, an item is the 16px ring and `$ink` dot it has
 * always been. Naming `size` (sm 16 | md 18), or a `<Density value="compact">`
 * around it, draws the source kit's radio (MIT, NOTICE): a quiet ring at rest that
 * FILLS when checked — the monochrome accent (`--primary`, which an org's accent
 * restates) round a dot in its foreground — a 4px hover halo, and the 32%
 * register of a disabled option.
 */
import { RadioGroup as GuiRadioGroup, XStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'
import { useDensity } from './density'

/** 16px control, 8px dot — the Checkbox's box, made round. */
const BOX = 16
const DOT = 8

export type RadioSize = 'sm' | 'md'

export type RadioGroupProps = ComponentProps<typeof GuiRadioGroup>
type GuiItemProps = ComponentProps<typeof GuiRadioGroup.Item>

/**
 * gui's item props with its `size` (a gui size token) replaced by the record
 * size. `Omit` over gui's props loses `value` from the union it is built from,
 * so `value` is restated — it is the one prop an item cannot do without.
 */
export type RadioGroupItemProps = Omit<GuiItemProps, 'size' | 'value'> & {
  value: string
  /** The record radio: `sm` a 16px ring (the default under compact) or `md` 18px. */
  size?: RadioSize
}

/** The record radio per size: the ring with its edge, and the dot inside a checked one. */
const RECORD = { sm: { ring: 16, dot: 6 }, md: { ring: 18, dot: 8 } } as const

const RadioGroup = ({ orientation = 'vertical', ...props }: RadioGroupProps) => (
  <GuiRadioGroup
    {...slot('radio-group')}
    orientation={orientation}
    flexDirection={orientation === 'horizontal' ? 'row' : 'column'}
    gap="$2"
    {...props}
  />
)

const RadioGroupItem = ({ size, ...props }: RadioGroupItemProps) => {
  const compact = useDensity() === 'compact'
  const record = size ?? (compact ? 'sm' : undefined)
  return record ? <RecordItem size={record} {...props} /> : <PlainItem {...props} />
}

/**
 * The record radio. The fill is the INDICATOR, laid over the ring edge to
 * edge: it mounts only while checked, so presence is the state here too, and
 * no part of the item has to know which state it is in to be drawn.
 */
const RecordItem = ({ size, disabled, children, ...props }: RadioGroupItemProps & { size: RadioSize }) => {
  const dim = RECORD[size]
  return (
    <GuiRadioGroup.Item
      {...slot('radio-group-item')}
      data-size={size}
      width={dim.ring}
      height={dim.ring}
      flexShrink={0}
      padding={0}
      borderRadius={1000}
      borderWidth={1}
      borderColor="$aside"
      backgroundColor="transparent"
      scale={0.95}
      disabled={disabled}
      opacity={disabled ? 0.32 : 1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      {...(disabled ? null : { hoverStyle: { bg: '$hover', boxShadow: '0 0 0 4px var(--hover)' } })}
      {...touch(dim.ring)}
      {...(props as GuiItemProps)}
    >
      <GuiRadioGroup.Indicator
        {...slot('radio-group-indicator')}
        position="absolute"
        t={-1}
        l={-1}
        width={dim.ring}
        height={dim.ring}
        borderRadius={1000}
        backgroundColor="var(--primary)"
        items="center"
        justify="center"
        // 1.05 at the item's 0.95, as the source kit grows a checked radio.
        scale={1.1}
      >
        <XStack width={dim.dot} height={dim.dot} rounded={1000} bg="var(--primary-foreground)" />
      </GuiRadioGroup.Indicator>
      {children}
    </GuiRadioGroup.Item>
  )
}

const PlainItem = ({ disabled, children, ...props }: Omit<RadioGroupItemProps, 'size'>) => (
  <GuiRadioGroup.Item
    {...slot('radio-group-item')}
    width={BOX}
    height={BOX}
    flexShrink={0}
    borderRadius={1000}
    borderWidth={1}
    // A CONTROL boundary, not a surface hairline. `$borderColor` is 10% white —
    // right for a card edge sitting on its own fill, and 1.26:1 against the
    // ground, where WCAG 1.4.11 asks 3:1 for the visible boundary of a control.
    // An unchecked box was therefore not quiet, it was absent. `$bound` is
    // 3.45:1. The two jobs shared one token and only one of them was satisfied.
    borderColor="$bound"
    backgroundColor="transparent"
    // Stated rather than left to gui's `disabled` variant, which turns off
    // pointer events without dimming: a dead control that looks live invites a
    // click that does nothing. Same treatment as Switch.
    disabled={disabled}
    opacity={disabled ? 0.5 : 1}
    cursor={disabled ? 'not-allowed' : 'pointer'}
    {...touch(BOX)}
    {...(props as GuiItemProps)}
  >
    {/* Mounts only while checked — presence IS the state, and it is the one
        affordance a 16px control has room for. `$ink` against the
        transparent well reads at any size; gui's default `$color` is the muted
        rung and vanished on a lifted surface. */}
    <GuiRadioGroup.Indicator
      {...slot('radio-group-indicator')}
      width={DOT}
      height={DOT}
      borderRadius={1000}
      backgroundColor="$ink"
    />
    {children}
  </GuiRadioGroup.Item>
)

export { RadioGroup, RadioGroupItem }
