'use client'

/**
 * Thread — the scrolling column of turns.
 *
 * Follows a streaming answer to the bottom and stops the moment the reader
 * scrolls up. The decision is `pinned()`; this only wires it to the platform's
 * scroll view, so momentum and keyboard stay the host's.
 */
import { ScrollView, YStack, type GetRef } from '@hanzo/gui'
import { forwardRef, useCallback, useRef, type ComponentProps, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { pinned, SLACK, type Track } from './stick'

/** Reading-measure cap for prose, in px. */
const MEASURE = 768

type Scroller = GetRef<typeof ScrollView> & { scrollToEnd(o: { animated: boolean }): void }

export interface ThreadProps
  extends Omit<ComponentProps<typeof ScrollView>, 'children' | 'onScroll'> {
  children?: ReactNode
  /** Reading-measure cap. Pass `0` to fill the container. */
  maxWidth?: number
  /** How near the end still counts as "at the bottom", in px. */
  slack?: number
  gap?: number
  /** The scroll, with the follow decision and the numbers it was made from. */
  onScroll?: (event: unknown, at: { pinned: boolean; track: Track }) => void
  /** The column that holds the turns, for a surface that needs to reach it. */
  column?: Omit<ComponentProps<typeof YStack>, 'children'>
}

export const Thread = /* @__PURE__ */ forwardRef<Scroller, ThreadProps>(function Thread(
  { children, maxWidth = MEASURE, slack = SLACK, gap = 24, onScroll, column, ...props },
  ref,
) {
  const view = useRef<Scroller | null>(null)
  const follow = useRef(true)

  // Ours to scroll with, and the caller's.
  const hold = useCallback(
    (el: Scroller | null) => {
      view.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<Scroller | null>).current = el
    },
    [ref],
  )

  const grew = useCallback(() => {
    if (follow.current) view.current?.scrollToEnd({ animated: false })
  }, [])

  return (
    <ScrollView
      ref={hold as never}
      {...slot('thread')}
      flex={1}
      width="100%"
      // A thread CONTAINS its turns. gui's ScrollView leaves `overflow` visible
      // on web, so a thread given less room than its content did not scroll —
      // it painted every turn straight over the composer below it and kept
      // going. `minHeight: 0` is the other half: a flex item's automatic minimum
      // is its content, so without it the item refuses to shrink under 976px and
      // there is nothing to scroll inside.
      overflowY="auto"
      minH={0}
      scrollEventThrottle={16}
      onContentSizeChange={grew}
      onScroll={(e: any) => {
        const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
        const track: Track = {
          offset: contentOffset.y,
          viewport: layoutMeasurement.height,
          content: contentSize.height,
        }
        follow.current = pinned(track, slack)
        onScroll?.(e, { pinned: follow.current, track })
      }}
      {...props}
    >
      <YStack
        {...slot('thread-column')}
        width="100%"
        gap={gap}
        py={gap}
        {...(maxWidth ? { maxW: maxWidth, self: 'center' as const, px: '$3' } : null)}
        {...column}
      >
        {children}
      </YStack>
    </ScrollView>
  )
})
