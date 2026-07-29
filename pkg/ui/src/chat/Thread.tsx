'use client'

/**
 * Thread — the scrolling column of turns.
 *
 * It does the one thing every surface had re-solved: follow a streaming answer
 * to the bottom, and stop following the instant the reader scrolls up. The
 * decision is `pinned()`, asserted without a DOM; this component only wires it
 * to the platform's scroll view, so momentum and keyboard stay the host's.
 */
import { ScrollView, YStack, type GetRef } from '@hanzo/gui'
import { useCallback, useRef, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { pinned, SLACK, type Track } from './stick'

/** Reading-measure cap for prose, in px. */
const MEASURE = 768

export interface ThreadProps {
  children?: ReactNode
  /** Reading-measure cap. Pass `0` to fill the container. */
  maxWidth?: number
  /** How near the end still counts as "at the bottom", in px. */
  slack?: number
  gap?: number
}

export function Thread({ children, maxWidth = MEASURE, slack = SLACK, gap = 24 }: ThreadProps) {
  const view = useRef<GetRef<typeof ScrollView>>(null)
  const track = useRef<Track>({ offset: 0, viewport: 0, content: 0 })
  const follow = useRef(true)

  const grew = useCallback(() => {
    if (follow.current) view.current?.scrollToEnd({ animated: false })
  }, [])

  return (
    <ScrollView
      ref={view}
      {...slot('thread')}
      flex={1}
      width="100%"
      scrollEventThrottle={16}
      onLayout={(e) => {
        track.current = { ...track.current, viewport: e.nativeEvent.layout.height }
      }}
      onContentSizeChange={(_w, h) => {
        track.current = { ...track.current, content: h }
        grew()
      }}
      onScroll={(e) => {
        const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
        track.current = {
          offset: contentOffset.y,
          viewport: layoutMeasurement.height,
          content: contentSize.height,
        }
        follow.current = pinned(track.current, slack)
      }}
    >
      <YStack
        {...slot('thread-column')}
        width="100%"
        gap={gap}
        py={gap}
        {...(maxWidth ? { maxW: maxWidth, self: 'center' as const, px: '$3' } : null)}
      >
        {children}
      </YStack>
    </ScrollView>
  )
}
