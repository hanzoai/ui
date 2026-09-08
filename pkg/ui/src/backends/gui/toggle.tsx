'use client'

/**
 * Toggle — a single two-state button: pressed or not.
 *
 * `ToggleGroup` already carries this exact recipe — the density ladder, the
 * REST/ON fill per variant, `unstyled` plus a hand-rolled focus ring — for one
 * segment among several. A bare `Toggle` is the same button standing alone, so
 * it repeats those numbers rather than reaching for `ToggleGroup`, which for a
 * group of one would still carry `role="radiogroup"` and roving arrow-key focus
 * a standalone control has no use for.
 *
 * State is driven through gui's `useControllableState`, the same mechanism
 * `ToggleGroup` drives its own value with, so an uncontrolled `<Toggle>` and a
 * controlled `<Toggle pressed onPressedChange>` are one component rather than
 * two code paths.
 *
 * The substrate is `styled(XStack)` rendered as a real `<button>` via `render`
 * — the same seam `Badge` uses for `asChild` — so `aria-pressed` and
 * `data-state` land on an actual button element, never a `<div role="button">`.
 */
import { XStack, styled, useControllableState } from '@hanzo/gui'
import type { ComponentProps, MouseEventHandler, ReactNode } from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'

export type ToggleVariant = 'default' | 'outline'
export type ToggleSize = 'default' | 'sm' | 'lg'

/** The Button ladder, so a Toggle sitting next to a Button lines up. */
const HEIGHT: Record<ToggleSize, number> = { default: 36, sm: 32, lg: 40 }
const PAD = { default: '$3', sm: '$2.5', lg: '$4' } as const

/** The system's WCAG-checked ring — `unstyled` drops gui's, so restore it. */
const RING = { outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' } as const

const ToggleFrame = styled(XStack, {
  name: 'Toggle',
  unstyled: true,
  display: 'inline-flex',
  items: 'center',
  justify: 'center',
  gap: '$1.5',
  shrink: 0,
  rounded: '$3',
  borderWidth: 1,
  select: 'none',
  cursor: 'pointer',
  focusVisibleStyle: RING,

  variants: {
    variant: {
      default: {
        bg: 'transparent',
        borderColor: 'transparent',
        hoverStyle: { bg: '$hover', color: '$quiet' },
      },
      outline: {
        bg: 'transparent',
        borderColor: '$borderColor',
        hoverStyle: { bg: '$hover', color: '$ink' },
      },
    },
    size: {
      default: { height: HEIGHT.default, minWidth: HEIGHT.default, px: PAD.default },
      sm: { height: HEIGHT.sm, minWidth: HEIGHT.sm, px: PAD.sm },
      lg: { height: HEIGHT.lg, minWidth: HEIGHT.lg, px: PAD.lg },
    },
    // The ON treatment — one step of fill, same rung `ToggleGroup` selects
    // with, kept under hover and focus by merging into those pseudo-styles
    // rather than only rest: a pressed toggle must not read as unpressed the
    // moment the pointer sits on it.
    on: {
      true: {
        bg: '$rim',
        borderColor: '$bound',
        hoverStyle: { bg: '$rim' },
        focusVisibleStyle: { ...RING, bg: '$rim' },
      },
    },
    disabled: {
      true: { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' },
    },
  } as const,

  defaultVariants: { variant: 'default', size: 'default' },
})

export type ToggleProps = Omit<
  ComponentProps<typeof ToggleFrame>,
  'variant' | 'size' | 'onPress' | 'children' | 'onClick'
> & {
  variant?: ToggleVariant | null
  size?: ToggleSize | null
  /** Controlled pressed state. */
  pressed?: boolean
  /** Initial pressed state when uncontrolled. */
  defaultPressed?: boolean
  onPressedChange?(pressed: boolean): void
  disabled?: boolean
  children?: ReactNode
  /** The DOM button type — a bare button inside a form defaults to submit. */
  type?: 'button' | 'submit' | 'reset'
  /** The DOM click, on the real `<button>` this renders as. */
  onClick?: MouseEventHandler<HTMLElement>
}

function Toggle({
  variant = 'default',
  size = 'default',
  pressed,
  defaultPressed = false,
  onPressedChange,
  disabled = false,
  type = 'button',
  onClick,
  children,
  ...props
}: ToggleProps) {
  const [on, setOn] = useControllableState<boolean>({
    prop: pressed,
    defaultProp: defaultPressed,
    onChange: onPressedChange,
  })
  const v = variant ?? 'default'
  const s = size ?? 'default'

  return (
    <ToggleFrame
      {...slot('toggle')}
      render="button"
      {...({ type } as object)}
      data-variant={v}
      data-size={s}
      data-state={on ? 'on' : 'off'}
      data-disabled={disabled || undefined}
      aria-pressed={on}
      variant={v}
      size={s}
      on={on}
      disabled={disabled}
      onClick={((e: MouseEvent) => {
        onClick?.(e as never)
        if (!(e as unknown as { defaultPrevented?: boolean }).defaultPrevented && !disabled)
          setOn(!on)
      }) as never}
      {...touch(HEIGHT[s], 44, 'y')}
      {...(props as object)}
    >
      {ink(children, undefined, { size: '$3', fontWeight: '500', color: on ? '$ink' : '$quiet' })}
    </ToggleFrame>
  )
}

export { Toggle }
