'use client'

/**
 * Pill — a small rounded label for a status, a tag or a filter, with an
 * optional remove control. `variant`, `onRemove`, `pillVariants`, and the
 * `data-slot`/`data-variant` markers, rendering through @hanzo/gui so the
 * same component runs on web, native and Tauri.
 *
 * Surface and label are two styled parts sharing one `variant` through a
 * styled context, the same split Badge uses — the frame owns background and
 * text color, the label owns type. The remove control reuses this backend's
 * own Button (ghost, icon-sized, shrunk to fit the pill) rather than a raw
 * element, so it already carries the real `<button type="button">` host and
 * the 44px touch floor.
 */
import { SizableText, XStack, createStyledContext, styled } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import * as React from 'react'
import { sx } from '../../sx'
import { Button } from './button'
import { ink } from './ink'
import { touch } from './gesture'
import { slot } from './slot'

export type PillVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error'

/** A pill is a 28px capsule; the slop makes its remove control meet the 44px floor. */
const MIN_TOUCH = 44
const HEIGHT = 28
const REMOVE = 16

const PillContext = /* @__PURE__ */ createStyledContext<{ variant: PillVariant }>({ variant: 'default' })

const PillFrame = styled(XStack, {
  name: 'Pill',
  context: PillContext,
  display: 'inline-flex',
  self: 'flex-start',
  items: 'center',
  justify: 'center',
  shrink: 0,
  gap: '$1.5',
  minH: HEIGHT,
  px: '$3',
  py: '$1',
  rounded: 999,
  borderWidth: 1,
  borderColor: 'transparent',
  overflow: 'hidden',

  variants: {
    variant: {
      default: { bg: '$accentBackground' },
      secondary: { bg: '$edge' },
      outline: { bg: '$background', borderColor: '$borderColor' },
      success: { bg: '$green4' },
      warning: { bg: '$yellow4' },
      error: { bg: '$red4' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

const PillText = styled(SizableText, {
  name: 'PillText',
  context: PillContext,
  size: '$2',
  fontWeight: '500',

  variants: {
    variant: {
      default: { color: '$accentColor' },
      secondary: { color: '$ink' },
      outline: { color: '$ink' },
      success: { color: '$green11' },
      warning: { color: '$yellow11' },
      error: { color: '$red11' },
    },
  } as const,
})

/** A pill's classes, for hosts that hook it from CSS. Styling lives in the tokens. */
export const pillVariants = ({ variant }: { variant?: PillVariant | null } = {}) =>
  `pill pill-${variant ?? 'default'}`

export type PillProps = React.ComponentProps<'span'> & {
  variant?: PillVariant | null
  onRemove?: () => void
}

export function Pill({ className, variant = 'default', onRemove, children, ...props }: PillProps) {
  const resolved = variant ?? 'default'
  return (
    <PillFrame
      {...slot('pill')}
      data-variant={resolved}
      variant={resolved}
      {...sx([pillVariants({ variant: resolved }), className].filter(Boolean).join(' '))}
      {...(props as React.ComponentProps<typeof PillFrame>)}
    >
      {ink(children, PillText)}
      {onRemove ? (
        <Button
          {...slot('pill-remove')}
          variant="ghost"
          size="icon"
          minH={REMOVE}
          minW={REMOVE}
          rounded={999}
          {...touch(REMOVE, MIN_TOUCH)}
          aria-label="Remove"
          onPress={onRemove}
        >
          <X size={12} />
        </Button>
      ) : null}
    </PillFrame>
  )
}
