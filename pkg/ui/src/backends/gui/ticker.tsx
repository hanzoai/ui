'use client'

/**
 * Ticker — a single row of content that scrolls sideways forever.
 *
 * `children` is laid out once, rendered twice back to back inside a track, and
 * one keyframe slides the track by exactly half its own width, so the second
 * copy lands where the first began and the seam never shows. The reader hears
 * one copy: the repeated half is `aria-hidden`. `speed` is the loop's full
 * duration in seconds — the same number however wide `children` turns out to
 * be — and `direction` picks which way the keyframe runs.
 *
 * The keyframes ride along as a hoisted `<style>`; React keys it by `href`, so
 * any number of tickers on a page emit it once.
 */
import { XStack, styled } from '@hanzo/gui'
import * as React from 'react'
import { sx } from '../../sx'
import { ink } from './ink'
import { slot } from './slot'

const Frame = styled(XStack, {
  name: 'Ticker',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
})

const KEYFRAMES = `
@keyframes ticker-scroll { to { transform: translateX(-50%) } }
[data-slot="ticker"][data-pause-hover]:hover [data-slot="ticker-track"] { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) {
  [data-slot="ticker-track"] { animation: none !important }
}
`

export type TickerDirection = 'left' | 'right'

export type TickerProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children' | 'style'> & {
  children: React.ReactNode
  /** Full loop duration, in seconds. */
  speed?: number
  direction?: TickerDirection
  pauseOnHover?: boolean
  style?: React.CSSProperties
}

export const Ticker = React.forwardRef<HTMLDivElement, TickerProps>(
  ({ children, speed = 50, direction = 'left', pauseOnHover = true, className, style, ...props }, ref) => (
    <Frame
      ref={ref as never}
      {...slot('ticker')}
      data-pause-hover={pauseOnHover || undefined}
      style={style}
      {...sx(className)}
      {...(props as React.ComponentProps<typeof Frame>)}
    >
      <style href="ticker" precedence="default">
        {KEYFRAMES}
      </style>
      <XStack
        {...slot('ticker-track')}
        shrink={0}
        style={{
          width: 'fit-content',
          willChange: 'transform',
          animationName: 'ticker-scroll',
          animationDuration: `${speed}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        <XStack {...slot('ticker-group')} shrink={0}>
          {ink(children)}
        </XStack>
        <XStack {...slot('ticker-group')} shrink={0} {...({ 'aria-hidden': 'true' } as object)}>
          {ink(children)}
        </XStack>
      </XStack>
    </Frame>
  ),
)
Ticker.displayName = 'Ticker'
