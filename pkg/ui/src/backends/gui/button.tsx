'use client'

/**
 * Button — the gui-backend original.
 *
 * `variant`, `size`, `asChild`, `isLoading`, `buttonVariants`, and the
 * `data-slot`/`data-variant`/`data-size` markers.
 *
 * The substrate is @hanzo/gui's Button FRAME (`Button.Frame`), not the compound
 * `Button`. The compound is `Frame.styleable(...)`, i.e. an HOC — `styled()` over
 * it does not compile style props to classes, so under `asChild` every variant
 * style leaked onto the child as an invalid lowercase HTML attribute
 * (`backgroundcolor="var(--background)"`) and nothing was styled. Extending the
 * frame keeps one component with one API and makes `asChild` a first-class
 * pattern; the frame already renders a real `<button>` on web and provides the
 * styled context that `Button.Text` reads.
 *
 * Type size rides on that Text, never on the frame: `fontSize` is not a frame
 * style prop, so setting it there leaked a `font-size="var(--f-size-3)"`
 * attribute and every size rendered at the same 16px.
 *
 * The 44px touch floor comes from `touch()`, which is platform-correct on web
 * as well as native — visual density stays at 36/32/40px.
 */
import { Button as GuiButton, Spinner, styled } from '@hanzo/gui'
import { createElement, isValidElement, type ComponentProps, type ReactNode } from 'react'

import { ink } from './ink'
import { touch } from './gesture'

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'primary'
  | 'linkFG'
  | 'linkMuted'

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

const HEIGHT: Record<ButtonSize, number> = {
  default: 36,
  sm: 32,
  lg: 40,
  icon: 36,
  'icon-sm': 32,
  'icon-lg': 40,
}

/** Type scale per size — applied to the Text host, which is what renders it. */
const TYPE: Record<ButtonSize, string> = {
  default: '$3',
  sm: '$2',
  lg: '$3',
  icon: '$3',
  'icon-sm': '$2',
  'icon-lg': '$3',
}

const Frame = styled(GuiButton.Frame, {
  name: 'Button',
  items: 'center',
  justify: 'center',
  gap: '$2',
  shrink: 0,
  rounded: '$3',
  borderWidth: 1,
  borderColor: 'transparent',
  cursor: 'pointer',

  variants: {
    variant: {
      default: { bg: '$color12', color: '$color1', hoverStyle: { opacity: 0.9 } },
      primary: { bg: '$color12', color: '$color1', hoverStyle: { opacity: 0.9 } },
      destructive: { bg: '$red9', color: '$white1', hoverStyle: { opacity: 0.9 } },
      outline: {
        bg: '$background',
        color: '$color12',
        borderColor: '$borderColor',
        hoverStyle: { bg: '$color3' },
      },
      secondary: { bg: '$color4', color: '$color12', hoverStyle: { opacity: 0.8 } },
      ghost: { bg: 'transparent', color: '$color12', hoverStyle: { bg: '$color3' } },
      link: { bg: 'transparent', color: '$color12', hoverStyle: { textDecorationLine: 'underline' } },
      linkFG: { bg: 'transparent', color: '$color12', hoverStyle: { textDecorationLine: 'underline' } },
      linkMuted: {
        bg: 'transparent',
        color: '$color11',
        hoverStyle: { color: '$color12', textDecorationLine: 'underline' },
      },
    },
    size: {
      default: { height: HEIGHT.default, px: '$4' },
      sm: { height: HEIGHT.sm, px: '$3', gap: '$1.5' },
      lg: { height: HEIGHT.lg, px: '$6' },
      icon: { height: HEIGHT.icon, width: HEIGHT.icon, px: 0 },
      'icon-sm': { height: HEIGHT['icon-sm'], width: HEIGHT['icon-sm'], px: 0 },
      'icon-lg': { height: HEIGHT['icon-lg'], width: HEIGHT['icon-lg'], px: 0 },
    },
    disabled: {
      true: { opacity: 0.5, pointerEvents: 'none', cursor: 'default' },
    },
  } as const,

  defaultVariants: { variant: 'default', size: 'default' },
})

/**
 * A stable class handle for hosts that hook buttons from CSS. Styling lives in
 * the tokens; this only names the variant and size.
 */
export const buttonVariants = ({
  variant,
  size,
  className,
}: { variant?: ButtonVariant | null; size?: ButtonSize | null; className?: string } = {}) =>
  // Variant and size share the `btn-` namespace, so the two defaults collide on
  // `btn-default`. A Set emits it once; no name is used by both a variant and a
  // size, so nothing else can merge.
  [...new Set([`btn`, `btn-${variant ?? 'default'}`, `btn-${size ?? 'default'}`, className].filter(Boolean))]
    .join(' ')

export type ButtonProps = Omit<ComponentProps<typeof Frame>, 'variant' | 'size' | 'children'> & {
  variant?: ButtonVariant | null
  size?: ButtonSize | null
  isLoading?: boolean
  children?: ReactNode
  /**
   * The DOM tooltip. Already reached the element -- every unrecognised prop is
   * spread onto Frame, which forwards it -- but the Frame's props come from the
   * cross-platform stack and name no DOM attribute, so passing it did not type.
   * Callers either dropped the tooltip or re-declared the whole component as
   * `any`, and the second hides every real error in the file.
   *
   * Declared here because it is true on web and harmless elsewhere: native
   * ignores an attribute it does not know. Widening the type to match the
   * behaviour beats asking ~60 call sites to work around it.
   */
  title?: string
  /**
   * The DOM button type. Not cosmetic: inside a form the default is "submit",
   * so a control meant to do something else submits the form instead. Callers
   * write type="button" to stop that, and dropping it would be a real bug
   * rather than a lost attribute. Reaches the element the same way title does.
   */
  type?: 'button' | 'submit' | 'reset'
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const resolved = size ?? 'default'
  // gui's own `asChild` cannot merge into the child here: the Button frame bakes
  // a `render: <button>`, so asChild WRAPS the child in a button and drops every
  // compiled style (measured: `<button class="is_View "><a>…</a></button>`).
  // `render` is the mechanism that merges — it emits the child's own tag carrying
  // the full compiled class list. So asChild is expressed through render, and
  // Button-as-link comes out as a styled <a> with valid markup.
  const host = asChild && isValidElement(children) ? children : null
  const body = host ? (host.props as { children?: ReactNode }).children : children
  return (
    <Frame
      data-slot="button"
      data-variant={variant ?? 'default'}
      data-size={resolved}
      variant={variant ?? 'default'}
      size={resolved}
      render={host ? createElement(host.type, { ...(host.props as object), children: undefined }) : undefined}
      disabled={disabled || isLoading}
      {...touch(HEIGHT[resolved], 44, 'y')}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {isLoading && <Spinner size="small" />}
      {ink(body, GuiButton.Text as never, { fontSize: TYPE[resolved] })}
    </Frame>
  )
}

export { Button }
