'use client'

/**
 * AnimatedBeam — a line of light drawn between two elements inside a shared
 * container, for showing a connection or a flow between them.
 *
 * The path is a quadratic curve from `fromRef` to `toRef`, its control point
 * bowed 50px above the higher of the two ends. It is measured from each
 * element's `getBoundingClientRect()` relative to `containerRef` and measured
 * again whenever any of the three resizes; an anchor may be a gui stack or a
 * plain element. A dim stroke marks the whole path at all times, and over it a
 * gradient stroke draws itself from start to end on a loop. The gradient runs
 * in user space from the `from` center to the `to` center, so it keeps its
 * direction whichever way the beam points and still paints when the curve is
 * vertical — a bounding-box gradient is dropped once the box has no width.
 * That path declares `pathLength={1}`, so its dash is one unit long whatever
 * the curve measures, and one keyframe slides the dash offset from 1 to 0 —
 * the stroke is hidden through `delay`, then draws. Under
 * `prefers-reduced-motion` it is shown whole and still. The keyframe rides
 * along as a hoisted `<style>` keyed by `href`, so any number of beams on a
 * page emit it once.
 *
 * The drawing is a plain <svg>, since gui has no vector primitive of its own.
 * It sits absolutely over the container, sized to it — an svg is a replaced
 * element, and `inset: 0` alone leaves it at its intrinsic 300×150 — with
 * overflow visible so the bow above the higher end still shows, and it takes
 * no pointer events.
 */
import type { GuiElement } from '@hanzo/gui'
import * as React from 'react'
import { slot } from './slot'

type Anchor = React.RefObject<HTMLElement | GuiElement | null>

export type AnimatedBeamProps = React.SVGAttributes<SVGSVGElement> & {
  /** Seconds for one pass of the flowing stroke. */
  duration?: number
  /** Seconds before its first pass. */
  delay?: number
  pathColor?: string
  pathWidth?: number
  gradientStartColor?: string
  gradientStopColor?: string
  containerRef?: Anchor
  fromRef?: Anchor
  toRef?: Anchor
}

const KEYFRAMES = `
@keyframes beam-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { [data-slot="animated-beam-flow"] { animation: none !important } }
`

/** The DOM node behind an anchor, if there is one; a native view has none. */
const node = (ref?: Anchor) =>
  typeof HTMLElement !== 'undefined' && ref?.current instanceof HTMLElement ? ref.current : null

/** The center of `el` in the coordinate space of the box `origin`. */
const center = (el: HTMLElement, origin: DOMRect): [number, number] => {
  const r = el.getBoundingClientRect()
  return [r.left - origin.left + r.width / 2, r.top - origin.top + r.height / 2]
}

export const AnimatedBeam = React.forwardRef<SVGSVGElement, AnimatedBeamProps>(
  (
    {
      style,
      duration = 3,
      delay = 0,
      pathColor = 'gray',
      pathWidth = 2,
      gradientStartColor = '#18CCFC',
      gradientStopColor = '#6344F5',
      containerRef,
      fromRef,
      toRef,
      ...props
    },
    ref,
  ) => {
    const gradientId = React.useId()
    const [ends, setEnds] = React.useState<[number, number, number, number] | null>(null)

    React.useEffect(() => {
      const container = node(containerRef)
      const from = node(fromRef)
      const to = node(toRef)
      if (!container || !from || !to) return

      const draw = () => {
        const origin = container.getBoundingClientRect()
        const next: [number, number, number, number] = [...center(from, origin), ...center(to, origin)]
        setEnds((prev) => (prev && next.every((v, i) => v === prev[i]) ? prev : next))
      }
      draw()

      if (typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', draw)
        return () => window.removeEventListener('resize', draw)
      }
      const observer = new ResizeObserver(draw)
      for (const el of [container, from, to]) observer.observe(el)
      return () => observer.disconnect()
    }, [containerRef, fromRef, toRef])

    const [x1, y1, x2, y2] = ends ?? [0, 0, 0, 0]
    const d = ends ? `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 50} ${x2} ${y2}` : ''

    // The style is a sibling, not a child: React hoists a keyed `<style>` only
    // from an HTML host, never from inside an svg.
    return (
      <>
        <style href="animated-beam" precedence="default">
          {KEYFRAMES}
        </style>
        <svg
          ref={ref}
          {...slot('animated-beam')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
            ...style,
          }}
          {...props}
        >
          <path d={d} stroke={pathColor} strokeWidth={pathWidth} fill="none" strokeOpacity={0.2} />
          <path
            {...slot('animated-beam-flow')}
            d={d}
            pathLength={1}
            strokeDasharray={1}
            stroke={`url(#${gradientId})`}
            strokeWidth={pathWidth}
            fill="none"
            style={{
              animationName: 'beam-draw',
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationFillMode: 'backwards',
            }}
          />
          <defs>
            <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
              <stop offset="0%" stopColor={gradientStartColor} />
              <stop offset="100%" stopColor={gradientStopColor} />
            </linearGradient>
          </defs>
        </svg>
      </>
    )
  },
)
AnimatedBeam.displayName = 'AnimatedBeam'
