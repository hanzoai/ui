'use client'

/**
 * ButtonGroup — buttons joined into one control: "Update view" with its chevron
 * menu, a cell's hover actions, a diagram's zoom pair.
 *
 * Two independent choices, as twenty-ui's ButtonGroup has them (MIT, NOTICE):
 *
 *   attached (default)  the buttons share their edges — each after the first
 *                       steps 1px back over its neighbour's border, the inner
 *                       corners go square, and a focused button rises above
 *                       the neighbours so its whole ring shows.
 *   framed              the buttons sit inside a bordered frame: a `$rim` edge,
 *                       a 4px corner and 2px of padding on the panel ground, the
 *                       buttons' own corners cut to 1px so the two radii stay
 *                       concentric (4 − 2 − 1).
 *
 * Attached rides gui's own `XGroup`, which already squares the corners between
 * items by placement (`XGroup.Item` zeroes the connecting radii of every child it
 * wraps); this file adds the 1px overlap and the focus lift gui does not draw.
 * Unattached is a plain row with a 2px gap.
 *
 * `size`, `variant` and `tone` set here reach every Button inside through
 * context, and a Button that names its own keeps it.
 */
import { XGroup, XStack } from '@hanzo/gui'
import { Children, createContext, isValidElement, type ComponentProps, type ReactNode } from 'react'
import type { ButtonSize, ButtonTone, ButtonVariant } from './button'
import { slot } from './slot'

/** What a Button inside a group takes when it names none of its own. */
export type ButtonGroupDefaults = { size?: ButtonSize; variant?: ButtonVariant; tone?: ButtonTone; framed?: boolean }

export const ButtonGroupContext = /* @__PURE__ */ createContext<ButtonGroupDefaults | null>(null)

export type ButtonGroupProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  /** The buttons share their edges (default) or stand 2px apart. */
  attached?: boolean
  /** The buttons sit inside a bordered frame. */
  framed?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
  tone?: ButtonTone
  /** Names the group for assistive technology, which reads it as one control. */
  'aria-label'?: string
  children?: ReactNode
}

/** The frame: a $rim edge, 4px corner, 2px padding, on the panel ground. */
const FRAME = { borderWidth: 1, borderColor: '$rim', rounded: '$xs', p: '$0.5', bg: '$panel' } as const

export function ButtonGroup({
  attached = true,
  framed = false,
  size,
  variant,
  tone,
  children,
  ...props
}: ButtonGroupProps) {
  const items = Children.toArray(children).filter(isValidElement)
  const ctx = { size, variant, tone, framed }
  const frame = framed ? FRAME : null

  if (!attached)
    return (
      <ButtonGroupContext.Provider value={ctx}>
        <XStack {...slot('button-group')} role="group" display="inline-flex" self="flex-start" items="center" gap="$0.5" {...frame} {...props}>
          {items}
        </XStack>
      </ButtonGroupContext.Provider>
    )

  return (
    <ButtonGroupContext.Provider value={ctx}>
      <XGroup
        {...slot('button-group')}
        data-attached=""
        role="group"
        unstyled
        display="inline-flex"
        self="flex-start"
        items="center"
        {...frame}
        {...(props as object)}
      >
        {items.map((child, i) => (
          // `ml` and `focusStyle` ride the item into the child (XGroup.Item merges
          // its props under the child's own): every button after the first steps
          // back over its neighbour's edge, and the focused one is drawn on top.
          <XGroup.Item key={child.key ?? i} {...(i > 0 ? { ml: -1 } : null)} focusStyle={{ zIndex: 1 }}>
            {child}
          </XGroup.Item>
        ))}
      </XGroup>
    </ButtonGroupContext.Provider>
  )
}
