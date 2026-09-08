'use client'

/**
 * Marquee — an endless horizontal or vertical ticker.
 *
 * `children` is laid out `repeat` times as a group, the group is rendered
 * twice back to back, and one keyframe slides the pair by exactly half its own
 * length, so the second copy lands where the first began and the seam never
 * shows. A reader hears one copy: every other is `aria-hidden`. Duration comes
 * from the rendered track's length over `speed` (px/s), so a long set of items
 * moves at the same pace as a short one.
 *
 * The keyframes ride along as a hoisted `<style>`: React keys it by `href`, so
 * any number of marquees on a page emit it once.
 */
import { XStack, YStack, styled, type GuiElement } from '@hanzo/gui'
import * as React from 'react'
import { sx } from '../../sx'
import { ink } from './ink'
import { slot } from './slot'

const Frame = styled(XStack, {
  name: 'Marquee',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
})

const KEYFRAMES = `
@keyframes marquee-x { to { transform: translateX(-50%) } }
@keyframes marquee-y { to { transform: translateY(-50%) } }
[data-slot="marquee"][data-pause-hover]:hover [data-slot="marquee-track"] { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) {
  [data-slot="marquee-track"] { animation: none !important }
}
`

export type MarqueeProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children' | 'style'> & {
  children: React.ReactNode
  /** How many times `children` is laid out per loop. */
  repeat?: number
  /** Run the track backwards. */
  reverse?: boolean
  pauseOnHover?: boolean
  vertical?: boolean
  /** Track travel, px/s. */
  speed?: number
  /** Space between copies, px — across the loop's seam too. */
  gap?: number
  style?: React.CSSProperties
}

type Span = { stage: number; track: number }
const UNMEASURED: Span = { stage: 0, track: 0 }

/** The DOM box behind a ref, if there is one; a native view has none. */
const box = (el: GuiElement | null) =>
  typeof HTMLElement !== 'undefined' && el instanceof HTMLElement ? el : null

export const Marquee = React.forwardRef<GuiElement, MarqueeProps>(
  (
    {
      children,
      repeat = 2,
      reverse = false,
      pauseOnHover = false,
      vertical = false,
      speed = 50,
      gap = 0,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const Axis = vertical ? YStack : XStack

    const stageRef = React.useRef<GuiElement | null>(null)
    const trackRef = React.useRef<GuiElement | null>(null)
    const [span, setSpan] = React.useState(UNMEASURED)

    React.useEffect(() => {
      const along = (el: GuiElement | null) => {
        const b = box(el)
        return b ? (vertical ? b.offsetHeight : b.offsetWidth) : 0
      }
      const measure = () => {
        const next = { stage: along(stageRef.current), track: along(trackRef.current) }
        setSpan((s) => (s.stage === next.stage && s.track === next.track ? s : next))
      }
      measure()
      if (typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
      }
      const observer = new ResizeObserver(measure)
      const b = box(trackRef.current)
      if (b) observer.observe(b)
      return () => observer.disconnect()
    }, [vertical, children, repeat, gap])

    const duration = span.track > 0 ? span.track / 2 / speed : 20

    const group = (hidden: boolean) => (
      <Axis
        {...slot('marquee-group')}
        shrink={0}
        items="center"
        gap={gap}
        {...(vertical ? { pb: gap } : { pr: gap })}
      >
        {Array.from({ length: repeat }, (_, i) => (
          <Axis key={i} aria-hidden={hidden || undefined} {...slot('marquee-item')} shrink={0}>
            {ink(children)}
          </Axis>
        ))}
      </Axis>
    )

    return (
      <Frame
        ref={ref}
        {...slot('marquee')}
        data-pause-hover={pauseOnHover || undefined}
        style={style}
        {...sx(className)}
        {...(props as React.ComponentProps<typeof Frame>)}
      >
        <style href="marquee" precedence="default">
          {KEYFRAMES}
        </style>
        <Axis ref={stageRef} {...slot('marquee-stage')} width="100%" height="100%">
          <Axis
            ref={trackRef}
            {...slot('marquee-track')}
            shrink={0}
            style={{
              willChange: 'transform',
              animationName: `marquee-${vertical ? 'y' : 'x'}`,
              animationDuration: `${duration}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDirection: reverse ? 'reverse' : 'normal',
            }}
          >
            {group(false)}
            {group(true)}
          </Axis>
        </Axis>
      </Frame>
    )
  },
)
Marquee.displayName = 'Marquee'
