'use client'

/**
 * GridPattern — a decorative, tiled SVG background: dots, lines, crosses,
 * plus-marks or squares repeated across the whole of its parent.
 *
 * It is purely visual, so it draws with a plain <svg>, the same choice
 * `AnimatedBeam` makes — gui has no vector primitive of its own. One `<pattern>`
 * tile carries the chosen mark and is stamped across a full-size `<rect>`; an
 * optional mask (a linear or radial gradient of white-to-transparent) fades the
 * tile at its edges, its center, or radially outward, and an optional second
 * `<rect>` paints a linear-gradient tint over the top. Motion is one CSS
 * animation, hoisted once as a `<style>` sibling the way the beam's keyframe
 * is: the keyframe itself only ever slides by the two custom properties
 * `--grid-pattern-x`/`-y`, so any number of instances at any gap share it.
 */
import * as React from 'react'
import { YStack, type GuiElement } from '@hanzo/gui'
import { slot } from './slot'

export type GridPatternVariant = 'dots' | 'lines' | 'crosses' | 'plus' | 'squares'

export type GridPatternSize = number | { width?: number; height?: number }
export type GridPatternGap = number | { x?: number; y?: number }

export type GridPatternFade = boolean | 'edges' | 'center' | 'radial'

export type GridPatternGradient = {
  from?: string
  via?: string
  to?: string
  opacity?: number
}

export type GridPatternAnimation = {
  duration?: number
  direction?: 'normal' | 'reverse' | 'alternate'
  timing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

export type GridPatternOffset = { x?: number; y?: number }
export type GridPatternMaxArea = { width?: number; height?: number }

export type GridPatternProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Which mark repeats across the tile. */
  variant?: GridPatternVariant
  /** Size of the mark itself, uniform or per axis. */
  size?: GridPatternSize
  /** Spacing between tiles, uniform or per axis. */
  gap?: GridPatternGap
  /** Color of the mark. */
  color?: string
  /** Opacity of the mark. */
  opacity?: number
  /** Stroke width for the line-based variants. */
  strokeWidth?: number
  /** Fades the whole pattern at its edges, its center, or radially. */
  fade?: GridPatternFade
  /** A linear-gradient tint painted over the pattern. */
  gradient?: GridPatternGradient
  /** Slides the whole pattern by one tile, on a loop. */
  animation?: GridPatternAnimation
  /** Shifts the pattern's origin before any animation is applied. */
  offset?: GridPatternOffset
  /** Caps the area the pattern rect covers, for very large viewports. */
  maxArea?: GridPatternMaxArea
}

const KEYFRAMES = `
@keyframes grid-pattern-move { from { transform: translate(0, 0) } to { transform: translate(var(--grid-pattern-x, 0px), var(--grid-pattern-y, 0px)) } }
@media (prefers-reduced-motion: reduce) { [data-slot="grid-pattern"] { animation: none !important } }
`

const mark = (
  variant: GridPatternVariant,
  size: { width: number; height: number },
  step: { x: number; y: number },
  color: string,
  opacity: number,
  strokeWidth: number,
) => {
  switch (variant) {
    case 'dots':
      return <circle cx={size.width / 2} cy={size.height / 2} r={size.width / 2} fill={color} opacity={opacity} />
    case 'lines':
      // Spans the full tile (gap), not the mark size, so adjoining tiles meet into one continuous grid line.
      return (
        <>
          <line x1={0} y1={0} x2={0} y2={step.y} stroke={color} strokeWidth={strokeWidth} opacity={opacity} />
          <line x1={0} y1={0} x2={step.x} y2={0} stroke={color} strokeWidth={strokeWidth} opacity={opacity} />
        </>
      )
    case 'crosses':
      return (
        <>
          <line
            x1={size.width / 2}
            y1={0}
            x2={size.width / 2}
            y2={size.height}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
          <line
            x1={0}
            y1={size.height / 2}
            x2={size.width}
            y2={size.height / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        </>
      )
    case 'plus':
      return (
        <path
          d={`M ${size.width / 2} 0 L ${size.width / 2} ${size.height} M 0 ${size.height / 2} L ${size.width} ${size.height / 2}`}
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          fill="none"
          strokeLinecap="round"
        />
      )
    case 'squares':
      return <rect width={size.width} height={size.height} fill="none" stroke={color} strokeWidth={strokeWidth} opacity={opacity} />
  }
}

const fadeStops = (fade: GridPatternFade) => {
  if (fade === 'center')
    return (
      <>
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="70%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor="white" stopOpacity={0} />
      </>
    )
  if (fade === 'radial')
    return (
      <>
        <stop offset="0%" stopColor="white" stopOpacity={0} />
        <stop offset="30%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor="white" stopOpacity={1} />
      </>
    )
  // 'edges' and `true` share the same edge-to-edge fade.
  return (
    <>
      <stop offset="0%" stopColor="white" stopOpacity={0} />
      <stop offset="10%" stopColor="white" stopOpacity={1} />
      <stop offset="90%" stopColor="white" stopOpacity={1} />
      <stop offset="100%" stopColor="white" stopOpacity={0} />
    </>
  )
}

export const GridPattern = React.forwardRef<GuiElement, GridPatternProps>(
  (
    {
      variant = 'dots',
      size = 4,
      gap = 20,
      color = 'currentColor',
      opacity = 0.4,
      strokeWidth = 1,
      fade = false,
      gradient,
      animation,
      offset,
      maxArea,
      style,
      ...props
    },
    ref,
  ) => {
    const patternId = React.useId()
    const maskId = React.useId()
    const gradientId = React.useId()

    const tile = typeof size === 'number' ? { width: size, height: size } : { width: size.width ?? 4, height: size.height ?? 4 }
    const step = typeof gap === 'number' ? { x: gap, y: gap } : { x: gap.x ?? 20, y: gap.y ?? 20 }
    const shift = { x: offset?.x ?? 0, y: offset?.y ?? 0 }

    const animationStyle: React.CSSProperties = animation
      ? ({
          animationName: 'grid-pattern-move',
          animationDuration: `${animation.duration ?? 10}s`,
          animationTimingFunction: animation.timing ?? 'linear',
          animationDirection: animation.direction ?? 'normal',
          animationIterationCount: 'infinite',
          '--grid-pattern-x': `${step.x}px`,
          '--grid-pattern-y': `${step.y}px`,
        } as React.CSSProperties)
      : {}

    return (
      <>
        <style href="grid-pattern" precedence="default">
          {KEYFRAMES}
        </style>
        <YStack
          ref={ref}
          {...slot('grid-pattern')}
          position="absolute"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
          style={{ ...animationStyle, ...style }}
          {...(props as object)}
        >
          <svg
            {...slot('grid-pattern-svg')}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: `translate(${shift.x}px, ${shift.y}px)`,
            }}
          >
            <defs>
              <pattern id={patternId} x={0} y={0} width={step.x} height={step.y} patternUnits="userSpaceOnUse">
                {mark(variant, tile, step, color, opacity, strokeWidth)}
              </pattern>
              {fade && (
                fade === 'center' || fade === 'radial' ? (
                  <radialGradient id={maskId}>{fadeStops(fade)}</radialGradient>
                ) : (
                  <linearGradient id={maskId}>{fadeStops(fade)}</linearGradient>
                )
              )}
              {gradient && (
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={gradient.from ?? 'transparent'} />
                  {gradient.via && <stop offset="50%" stopColor={gradient.via} />}
                  <stop offset="100%" stopColor={gradient.to ?? 'transparent'} />
                </linearGradient>
              )}
            </defs>

            <rect
              {...slot('grid-pattern-tiles')}
              width={maxArea?.width ?? '100%'}
              height={maxArea?.height ?? '100%'}
              fill={`url(#${patternId})`}
              mask={fade ? `url(#${maskId})` : undefined}
            />

            {gradient && (
              <rect
                {...slot('grid-pattern-tint')}
                width={maxArea?.width ?? '100%'}
                height={maxArea?.height ?? '100%'}
                fill={`url(#${gradientId})`}
                opacity={gradient.opacity ?? 0.5}
              />
            )}
          </svg>
        </YStack>
      </>
    )
  },
)
GridPattern.displayName = 'GridPattern'

/** Named, ready-to-spread configurations for the common backgrounds. */
export const GridPatternPresets: Record<string, GridPatternProps> = {
  dotMatrix: { variant: 'dots', size: 3, gap: 30, opacity: 0.3 },
  fineDots: { variant: 'dots', size: 1, gap: 10, opacity: 0.4 },
  gridLines: { variant: 'lines', gap: 40, strokeWidth: 1, opacity: 0.2 },
  crosshatch: { variant: 'crosses', size: 10, gap: 20, strokeWidth: 1, opacity: 0.3 },
  blueprint: { variant: 'lines', gap: 20, strokeWidth: 0.5, color: '#3b82f6', opacity: 0.3 },
  graph: { variant: 'lines', gap: { x: 50, y: 50 }, strokeWidth: 1, opacity: 0.15, fade: 'edges' },
  isometric: { variant: 'lines', gap: { x: 30, y: 17.32 }, strokeWidth: 0.5, opacity: 0.2 },
  hexagon: { variant: 'dots', size: 2, gap: { x: 30, y: 26 }, opacity: 0.3 },
}
