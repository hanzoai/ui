'use client'

/**
 * Thread — the scrolling column of turns.
 *
 * It does the one thing every surface had re-solved: follow a streaming answer
 * to the bottom, and stop following the instant the reader scrolls up. The
 * decision is `pinned()`, asserted without a DOM; this component only wires it
 * to the platform's scroll view, so momentum and keyboard stay the host's.
 *
 * That decision is now the fleet's only answer to "am I at the bottom", which
 * had five: 50px in two places, 97%-of-height in a third, an
 * `IntersectionObserver` at a 0.85 ratio in a fourth, and on the thread itself
 * nothing at all — hanzo.app `/chat` ran `scrollIntoView({behavior:'smooth'})`
 * on every `messages` change, and since a streaming turn rewrites `messages`
 * per SSE delta, scrolling up to re-read was undone several times a second.
 *
 * Measured in Chromium against the packed tarball, 2500 tokens at 4ms:
 * following holds a 0px gap through 2501 commits; parked at offset 0 the reader
 * STAYS at 0 while content grows 1015 → 1375; returning to the end resumes
 * following at 0px.
 *
 * There is no `onLayout` here any more, and nothing is lost with it. It was
 * passed to keep a `track` ref current, gui does not implement it on this
 * component so React forwarded it to the DOM as an unknown handler — the noise
 * hanzo.app reported — and the ref it fed was WRITE-ONLY: `track` was read in
 * exactly one place, `onScroll`, which rebuilds all three numbers from the
 * event before reading them. So the handler was dead, the state it kept was
 * dead, and the measurement the two together looked like they were doing was
 * being done properly a few lines below the whole time. The scroll event
 * carries `layoutMeasurement`; nothing else needs to ask.
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
  /**
   * The scroll, after the follow decision is made — with `at`, the answer.
   *
   * Three separate consumers need this element and this fact: the follow
   * decision, a scroll-to-bottom button, and a surface's own turn-offset
   * bookkeeping. Deciding privately and publishing nothing is what left each of
   * them measuring the scroller again, differently.
   */
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

  // Ours to scroll with, the caller's because three consumers need this node.
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
