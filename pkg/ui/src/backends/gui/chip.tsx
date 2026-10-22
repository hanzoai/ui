'use client'

/**
 * Chip — a compact inline label with something before and after it: a record
 * (avatar + name), an actor, an email or a phone, a "Not shared" lock.
 *
 * A chip is chrome, not data — it carries no hue of its own (that is `Tag`'s
 * job) — so its grounds are the surface ladder: ghost takes its parent's, soft
 * and solid lift one and two rungs, and a pressable chip lifts one more under
 * the pointer and once again while pressed. The label truncates with an
 * overflow hint, and the press area meets the 44px floor through `touch()`,
 * never through padding, so the chip keeps its 20px.
 *
 * The record kit's Chip (MIT, see NOTICE): sm 20 / md 24 tall, a
 * 4px gutter and gap, square (4px) or round, an end element behind an optional
 * hairline divider, a max width that shrinks the label and not the padding.
 */
import { XStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'
import { TruncatedText } from './truncated-text'
import { ink } from './ink'
import { press, RING } from './press'
import { touch } from './gesture'
import { slot } from './slot'

export type ChipSize = 'sm' | 'md'
export type ChipVariant = 'ghost' | 'soft' | 'solid'

const HEIGHT: Record<ChipSize, number> = { sm: 20, md: 24 }

/** Rest, hover and pressed grounds per variant: each step one rung up the ladder. */
const GROUND: Record<ChipVariant, { rest: string; hover: string; down: string }> = {
  ghost: { rest: 'transparent', hover: '$hover', down: '$raised' },
  soft: { rest: '$hover', hover: '$raised', down: '$rim' },
  solid: { rest: '$raised', hover: '$rim', down: '$bound' },
}

export type ChipProps = Omit<ComponentProps<typeof XStack>, 'children' | 'color'> & {
  label?: ReactNode
  size?: ChipSize
  variant?: ChipVariant
  color?: 'primary' | 'secondary'
  shape?: 'square' | 'round'
  weight?: 'regular' | 'medium'
  /** Before the label: an avatar, an icon. Never shrinks. */
  startElement?: ReactNode
  /** After the label: a remove button, a count. */
  endElement?: ReactNode
  /** A hairline between the label and the end element. */
  endElementDivider?: boolean
  /** One line with an ellipsis and an overflow hint. Default true. */
  truncate?: boolean
  /** The hint, when it should say more than the label. */
  tooltipContent?: ReactNode
  /** Makes the chip a button; it lifts under the pointer. */
  onPress?: () => void
  /** Makes the chip a link — a record chip opens its record. */
  href?: string
  /** Pressable without `onPress`/`href` — when the host handles the press. */
  clickable?: boolean
  disabled?: boolean
  children?: ReactNode
}

export function Chip({
  label,
  size = 'sm',
  variant = 'ghost',
  color = 'primary',
  shape = 'square',
  weight = 'regular',
  startElement,
  endElement,
  endElementDivider = false,
  truncate = true,
  tooltipContent,
  onPress,
  href,
  clickable,
  disabled = false,
  children,
  ...props
}: ChipProps) {
  const ground = GROUND[variant]
  const pressable = !disabled && (clickable ?? (onPress != null || href != null))
  const text = {
    size: '$2',
    fontWeight: weight === 'medium' ? '500' : undefined,
    color: disabled ? '$hush' : color === 'secondary' ? '$aside' : '$ink',
  } as const
  const body = label ?? children

  return (
    <XStack
      {...slot('chip')}
      data-size={size}
      data-variant={variant}
      {...(href != null && !disabled ? { render: 'a', href } : onPress != null ? press(disabled ? undefined : onPress) : null)}
      {...(disabled ? { 'aria-disabled': true } : null)}
      display="inline-flex"
      self="flex-start"
      items="center"
      gap="$1"
      height={HEIGHT[size]}
      px="$1"
      maxW="100%"
      minW={0}
      rounded={shape === 'round' ? '$10' : '$xs'}
      bg={ground.rest}
      select="none"
      cursor={disabled ? 'not-allowed' : pressable ? 'pointer' : undefined}
      {...(pressable
        ? {
            hoverStyle: { bg: ground.hover },
            pressStyle: { bg: ground.down },
            focusVisibleStyle: RING,
            ...touch(HEIGHT[size], 44, 'y'),
          }
        : null)}
      {...props}
    >
      {startElement ? (
        <XStack {...slot('chip-start')} shrink={0} items="center">
          {startElement}
        </XStack>
      ) : null}
      {typeof body === 'string' || typeof body === 'number' ? (
        truncate ? (
          <TruncatedText text={String(body)} tooltipContent={tooltipContent} {...text} />
        ) : (
          ink(body, undefined, text)
        )
      ) : (
        body
      )}
      {endElement ? (
        <XStack
          {...slot('chip-end')}
          shrink={0}
          items="center"
          self="stretch"
          {...(endElementDivider ? { borderInlineStartWidth: 1, borderColor: '$borderColor', paddingInlineStart: '$1' } : null)}
        >
          {endElement}
        </XStack>
      ) : null}
    </XStack>
  )
}
