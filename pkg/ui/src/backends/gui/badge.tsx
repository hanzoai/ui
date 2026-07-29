'use client'

/**
 * Badge — the gui-backend original.
 *
 * Same public surface as the shadcn backend's badge (`Badge`, `badgeVariants`,
 * `data-slot`/`data-variant`, `asChild`) so call sites move over untouched, but
 * the substrate is @hanzo/gui: `styled()` variants instead of cva, theme tokens
 * instead of Tailwind utilities. Renders on web, native (expo) and Tauri.
 *
 * Surface and ink are two concerns, so they are two styled parts sharing one
 * `variant` through a styled context — the frame owns background/border, the
 * text owns color/weight/case. Nothing reads `variant` twice by hand.
 */
import { SizableText, XStack, createStyledContext, styled } from '@hanzo/gui'
import * as React from 'react'

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'inputAdornment'
  | 'tags'

/** A badge is a 24px pill; the slop makes its press area meet the 44px floor. */
const MIN_TOUCH = 44
const HEIGHT = 24
const HIT_SLOP = (MIN_TOUCH - HEIGHT) / 2

const BadgeContext = createStyledContext<{ variant: BadgeVariant }>({ variant: 'default' })

const BadgeFrame = styled(XStack, {
  name: 'Badge',
  context: BadgeContext,
  self: 'flex-start',
  items: 'center',
  justify: 'center',
  shrink: 0,
  minH: HEIGHT,
  px: '$2.5',
  py: '$1',
  gap: '$1.5',
  rounded: '$2',
  borderWidth: 1,
  borderColor: 'transparent',
  overflow: 'hidden',

  variants: {
    variant: {
      default: { bg: '$color12' },
      secondary: { bg: '$color4' },
      destructive: { bg: '$red9' },
      outline: { bg: '$background', borderColor: '$borderColor' },
      ghost: { bg: 'transparent', hoverStyle: { bg: '$color3' } },
      link: { bg: 'transparent' },
      inputAdornment: { bg: '$color3', px: '$2' },
      tags: { bg: '$color3', borderColor: '$borderColor', rounded: '$3' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

const BadgeText = styled(SizableText, {
  name: 'BadgeText',
  context: BadgeContext,
  size: '$1',
  fontWeight: '600',

  variants: {
    variant: {
      default: { color: '$color1' },
      secondary: { color: '$color12' },
      destructive: { color: '$white1' },
      outline: { color: '$color12' },
      ghost: { color: '$color12' },
      link: { color: '$color12', textDecorationLine: 'underline' },
      inputAdornment: { color: '$color12', fontWeight: '500' },
      tags: { color: '$color11', fontWeight: '400', textTransform: 'capitalize' },
    },
  } as const,
})

/**
 * The class hook kept for parity with the shadcn backend's `badgeVariants` —
 * still callable, still returns a string, but semantic names rather than
 * Tailwind utilities. Styling lives in the tokens; this is only a handle.
 */
export const badgeVariants = ({ variant }: { variant?: BadgeVariant | null } = {}) =>
  `hanzo-badge hanzo-badge--${variant ?? 'default'}`

/**
 * Typed as span props because that is the contract every existing call site was
 * written against; the leftovers are handed to gui, which forwards unknown props
 * to the host element on web and drops them on native.
 */
export type BadgeProps = React.ComponentProps<'span'> & {
  variant?: BadgeVariant | null
  asChild?: boolean
}

/**
 * Bare text needs a Text host to render on native; elements pass through.
 * Skipped under `asChild`, where the caller's element owns its own content and
 * gui requires it to arrive as a lone child.
 */
const ink = (children: React.ReactNode) =>
  React.Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number' ? <BadgeText>{child}</BadgeText> : child,
  )

export function Badge({
  className,
  variant = 'default',
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <BadgeFrame
      data-slot="badge"
      data-variant={variant}
      variant={variant ?? 'default'}
      asChild={asChild}
      render={asChild ? undefined : 'span'}
      hitSlop={HIT_SLOP}
      className={[badgeVariants({ variant }), className].filter(Boolean).join(' ')}
      {...(props as React.ComponentProps<typeof BadgeFrame>)}
    >
      {asChild ? children : ink(children)}
    </BadgeFrame>
  )
}
