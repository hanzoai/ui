'use client'

/**
 * AvatarGroup — overlapping avatars with a "+N" for the rest: an event's
 * attendees, a thread's participants, who has a record open.
 *
 * Each avatar after the first pulls `overlapOffset` over its neighbour on the
 * reading direction's start side (`marginStart`), so the edge item never carries
 * a negative margin in either direction. `overlap` decides which neighbour is on
 * top. A server-side `total` larger than the list supplied still counts the
 * rest. With nothing to show it renders nothing.
 *
 * The record kit's AvatarGroup (MIT, see NOTICE): four visible,
 * a 3px overlap, the overflow box on the hover rung behind a ground-coloured
 * edge, 12px medium quiet text.
 */
import { SizableText, XStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'
import { slot } from './slot'
import type { AvatarShape } from './avatar'

export type AvatarGroupProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  /** The avatars, in order. */
  avatars: ReactNode[]
  /** How many are drawn before the rest become "+N". */
  maxVisible?: number
  /** Everyone, when the list supplied is a page of a larger set. */
  total?: number
  /** Draw the overflow yourself, given how many are hidden. */
  renderOverflow?: (hidden: number) => ReactNode
  overflowShape?: AvatarShape
  /** Which neighbour is on top: `right` draws each later avatar over the one before. */
  overlap?: 'right' | 'left'
  overlapOffset?: number
}

export function AvatarGroup({
  avatars,
  maxVisible = 4,
  total,
  renderOverflow,
  overflowShape = 'square',
  overlap = 'right',
  overlapOffset = 3,
  ...props
}: AvatarGroupProps) {
  const shown = avatars.slice(0, Math.max(0, maxVisible))
  const hidden = Math.max(0, (total ?? avatars.length) - shown.length)
  if (shown.length === 0 && hidden === 0) return null

  return (
    <XStack {...slot('avatar-group')} items="center" self="flex-start" {...props}>
      {shown.map((avatar, i) => (
        <XStack
          key={i}
          {...slot('avatar-group-item')}
          {...(i > 0 ? { marginStart: -overlapOffset } : null)}
          z={overlap === 'right' ? i : shown.length - i}
          position="relative"
        >
          {avatar}
        </XStack>
      ))}
      {hidden > 0 ? (
        <XStack
          {...slot('avatar-group-overflow')}
          {...(shown.length > 0 ? { marginStart: -overlapOffset } : null)}
          z={overlap === 'right' ? shown.length : 0}
          position="relative"
          self="stretch"
          items="center"
          px="$1"
          bg="$hover"
          borderWidth={1}
          borderColor="$background"
          rounded={overflowShape === 'circle' ? '$3' : '$xs'}
        >
          {renderOverflow ? (
            renderOverflow(hidden)
          ) : (
            <SizableText size="$1" lineHeight={13} fontWeight="500" color="$aside">
              {`+${hidden}`}
            </SizableText>
          )}
        </XStack>
      ) : null}
    </XStack>
  )
}
