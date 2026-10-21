'use client'

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
 *
 * `size` xs 14 · sm 16 · md 18 and `shape="circle"` are the record counts — a
 * navigation item's unread count, a filter's rule count — on the pill, with the
 * `muted`, `accent` and `inherit` colours (the record kit's Badge,
 * MIT, see NOTICE). With no `size` a badge is the 24px label it always was,
 * named `lg`.
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
  | 'muted'
  | 'accent'
  | 'inherit'

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

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
      muted: { bg: '$hover' },
      accent: { bg: 'var(--primary)' },
      // Its fill is 16% of whatever ink it sits in (inline, below): a count that
      // takes its row's colour.
      inherit: { bg: 'transparent' },
    },
    // After `variant`, so a record size's pill wins over a variant's radius.
    size: {
      xs: { minH: 14, height: 14, px: '$1', py: 0, gap: '$1', rounded: '$10' },
      sm: { minH: 16, height: 16, px: '$2', py: 0, gap: '$1', rounded: '$10' },
      md: { minH: 18, height: 18, px: '$1.5', py: 0, gap: '$0.5', rounded: '$10' },
      lg: {},
    },
    circle: {
      true: { px: 0, justify: 'center' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

/** The record sizes' type, all on the 12px rung — Hanzo's text floor (the source kit's xs is 8px). */
const TYPE: Record<Exclude<BadgeSize, 'lg'>, Record<string, unknown>> = {
  xs: { size: '$1', lineHeight: 14, fontWeight: '600' },
  sm: { size: '$1', lineHeight: 16, fontWeight: '500' },
  md: { size: '$1', lineHeight: 18, fontWeight: '500' },
}

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
      muted: { color: '$hint', fontWeight: '500' },
      accent: { color: 'var(--primary-foreground)', fontWeight: '500' },
      inherit: {},
    },
  } as const,
})

/**
 * A stable class handle for hosts that hook badges from CSS. Styling lives in
 * the tokens; this only names the variant.
 */
import { badgeVariants } from '../../style'
export { badgeVariants }

/**
 * Typed as span props because that is the contract every existing call site was
 * written against; the leftovers are handed to gui, which forwards unknown props
 * to the host element on web and drops them on native.
 */
export type BadgeProps = React.ComponentProps<'span'> & {
  variant?: BadgeVariant | null
  /** A record count's size (14 / 16 / 18). Unset, the 24px label (`lg`). */
  size?: BadgeSize | null
  /** Width equals height, for a single digit. */
  shape?: 'pill' | 'circle'
  asChild?: boolean
}

export function Badge({
  className,
  variant = 'default',
  size,
  shape = 'pill',
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  const record = size && size !== 'lg' ? size : null
  const box = record ? { xs: 14, sm: 16, md: 18 }[record] : HEIGHT
  const inherit = variant === 'inherit'
  return (
    <BadgeFrame
      data-slot="badge"
      data-variant={variant}
      {...(size ? { 'data-size': size } : null)}
      variant={variant ?? 'default'}
      {...(size ? { size } : null)}
      {...(shape === 'circle' ? { circle: true, width: box, minW: box } : null)}
      asChild={asChild}
      render={asChild ? undefined : 'span'}
      {...touch(box, MIN_TOUCH, 'y')}
      {...sx([badgeVariants({ variant }), className].filter(Boolean).join(' '))}
      {...(inherit ? { style: { backgroundColor: 'color-mix(in srgb, currentColor 16%, transparent)' } } : null)}
      {...(props as React.ComponentProps<typeof BadgeFrame>)}
    >
      {asChild
        ? children
        : ink(children, BadgeText, {
            ...(record ? TYPE[record] : null),
            ...(inherit ? { style: { color: 'inherit', fontWeight: 'inherit', fontVariantNumeric: 'tabular-nums' } } : null),
          })}
    </BadgeFrame>
  )
}
