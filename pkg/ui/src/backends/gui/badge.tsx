
/**
 * Badge — the gui-backend original.
 *
 * `Badge`, `badgeVariants`, `data-slot`/`data-variant`, `asChild`. The substrate
 * is @hanzo/gui: `styled()` variants and theme tokens, so it renders on web,
 * native (expo) and Tauri.
 *
 * Surface and ink are two concerns, so they are two styled parts sharing one
 * `variant` through a styled context — the frame owns background/border, the
 * text owns color/weight/case. Nothing reads `variant` twice by hand.
 */
import { SizableText, XStack, createStyledContext, styled } from '@hanzo/gui'
import { sx } from '../../sx'
import * as React from 'react'
import { ink } from './ink'
import { touch } from './gesture'

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

const BadgeContext = /* @__PURE__ */ createStyledContext<{ variant: BadgeVariant }>({ variant: 'default' })

const BadgeFrame = styled(XStack, {
  name: 'Badge',
  context: BadgeContext,
  // A badge shrink-wraps its label, always. `self: 'flex-start'` alone only
  // achieves that inside a FLEX parent — alignSelf is inert in a block one, so
  // an XStack (display: flex) placed in a plain <div> becomes a block-level flex
  // container and stretches the full width. Both are kept: inline-flex handles
  // the block parent, alignSelf still governs when the parent is flex.
  display: 'inline-flex',
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
      default: { bg: '$ink' },
      secondary: { bg: '$edge' },
      destructive: { bg: '$red9' },
      outline: { bg: '$background', borderColor: '$borderColor' },
      ghost: { bg: 'transparent', hoverStyle: { bg: '$hover' } },
      link: { bg: 'transparent' },
      inputAdornment: { bg: '$hover', px: '$2' },
      tags: { bg: '$hover', borderColor: '$borderColor', rounded: '$3' },
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
      default: { color: '$sunken' },
      secondary: { color: '$ink' },
      destructive: { color: '$white1' },
      outline: { color: '$ink' },
      ghost: { color: '$ink' },
      link: { color: '$ink', textDecorationLine: 'underline' },
      inputAdornment: { color: '$ink', fontWeight: '500' },
      tags: { color: '$quiet', fontWeight: '400', textTransform: 'capitalize' },
    },
  } as const,
})

/**
 * A stable class handle for hosts that hook badges from CSS. Styling lives in
 * the tokens; this only names the variant.
 */
export const badgeVariants = ({ variant }: { variant?: BadgeVariant | null } = {}) =>
  `badge badge-${variant ?? 'default'}`

/**
 * Typed as span props because that is the contract every existing call site was
 * written against; the leftovers are handed to gui, which forwards unknown props
 * to the host element on web and drops them on native.
 */
export type BadgeProps = React.ComponentProps<'span'> & {
  variant?: BadgeVariant | null
  asChild?: boolean
}

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
      {...touch(HEIGHT, MIN_TOUCH, 'y')}
      {...sx([badgeVariants({ variant }), className].filter(Boolean).join(' '))}
      {...(props as React.ComponentProps<typeof BadgeFrame>)}
    >
      {asChild ? children : ink(children, BadgeText)}
    </BadgeFrame>
  )
}
