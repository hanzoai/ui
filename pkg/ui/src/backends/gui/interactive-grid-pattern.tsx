'use client'

/**
 * InteractiveGridPattern — a grid of squares tiled across its parent, each one
 * lighting up while the pointer is over it and fading back out on its own.
 *
 * It draws with a plain <svg>, the same choice GridPattern makes — gui has no
 * vector primitive of its own. One `<rect>` per cell carries its own
 * mouse-enter/mouse-leave pair; only the hovered cell's index is state, so a
 * 24x24 board is one number, not 576 booleans.
 */
import * as React from 'react'
import { slot } from './slot'

export type InteractiveGridPatternProps = React.SVGProps<SVGSVGElement> & {
  /** Width of one cell, in px. */
  width?: number
  /** Height of one cell, in px. */
  height?: number
  /** `[horizontal, vertical]` cell counts. */
  squares?: [number, number]
  /** Cell fill while hovered. */
  hoverColor?: string
  /** Cell fill while idle. */
  idleColor?: string
  /** Cell border color. */
  strokeColor?: string
  /** Extra props merged onto every `<rect>`. */
  squareProps?: React.SVGProps<SVGRectElement>
}

export const InteractiveGridPattern = React.forwardRef<SVGSVGElement, InteractiveGridPatternProps>(
  (
    {
      width = 40,
      height = 40,
      squares = [24, 24],
      hoverColor = 'currentColor',
      idleColor = 'transparent',
      strokeColor = 'currentColor',
      squareProps,
      ...props
    },
    ref,
  ) => {
    const [horizontal, vertical] = squares
    const [hovered, setHovered] = React.useState<number | null>(null)

    return (
      <svg
        ref={ref}
        {...slot('interactive-grid-pattern')}
        width={horizontal * width}
        height={vertical * height}
        {...props}
      >
        {Array.from({ length: horizontal * vertical }).map((_, index) => {
          const x = (index % horizontal) * width
          const y = Math.floor(index / horizontal) * height
          return (
            <rect
              key={index}
              {...slot('interactive-grid-pattern-square')}
              data-hovered={hovered === index}
              x={x}
              y={y}
              width={width}
              height={height}
              fill={hovered === index ? hoverColor : idleColor}
              stroke={strokeColor}
              strokeOpacity={0.3}
              style={{
                transition: hovered === index ? 'fill 100ms ease-in-out' : 'fill 1000ms ease-in-out',
              }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
              {...squareProps}
            />
          )
        })}
      </svg>
    )
  },
)
InteractiveGridPattern.displayName = 'InteractiveGridPattern'
