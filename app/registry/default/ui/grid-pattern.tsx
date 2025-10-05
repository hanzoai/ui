"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface GridPatternProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid pattern variant */
  variant?: "dots" | "lines" | "crosses" | "plus" | "squares"
  /** Size of grid elements */
  size?: number | { width?: number; height?: number }
  /** Spacing between grid elements */
  gap?: number | { x?: number; y?: number }
  /** Color of grid elements */
  color?: string
  /** Opacity of grid elements */
  opacity?: number
  /** Stroke width for line-based patterns */
  strokeWidth?: number
  /** Enable fade effect */
  fade?: boolean | "edges" | "center" | "radial"
  /** Gradient overlay */
  gradient?: {
    from?: string
    via?: string
    to?: string
    opacity?: number
  }
  /** Animation configuration */
  animation?: {
    duration?: number
    direction?: "normal" | "reverse" | "alternate"
    timing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }
  /** Position offset */
  offset?: { x?: number; y?: number }
  /** Maximum render area (for performance) */
  maxArea?: { width?: number; height?: number }
}

const GridPattern = React.forwardRef<HTMLDivElement, GridPatternProps>(
  (
    {
      variant = "dots",
      size = 4,
      gap = 20,
      color = "currentColor",
      opacity = 0.4,
      strokeWidth = 1,
      fade = false,
      gradient,
      animation,
      offset,
      maxArea,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const patternId = React.useId()
    const maskId = React.useId()
    const gradientId = React.useId()

    const normalizedSize =
      typeof size === "number"
        ? { width: size, height: size }
        : { width: size.width ?? 4, height: size.height ?? 4 }

    const normalizedGap =
      typeof gap === "number"
        ? { x: gap, y: gap }
        : { x: gap.x ?? 20, y: gap.y ?? 20 }

    const normalizedOffset = {
      x: offset?.x ?? 0,
      y: offset?.y ?? 0,
    }

    const renderPattern = () => {
      switch (variant) {
        case "dots":
          return (
            <circle
              cx={normalizedSize.width / 2}
              cy={normalizedSize.height / 2}
              r={normalizedSize.width / 2}
              fill={color}
              opacity={opacity}
            />
          )

        case "lines":
          return (
            <>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={normalizedGap.y}
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={opacity}
              />
              <line
                x1="0"
                y1="0"
                x2={normalizedGap.x}
                y2="0"
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={opacity}
              />
            </>
          )

        case "crosses":
          return (
            <>
              <line
                x1={normalizedSize.width / 2}
                y1="0"
                x2={normalizedSize.width / 2}
                y2={normalizedSize.height}
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={opacity}
              />
              <line
                x1="0"
                y1={normalizedSize.height / 2}
                x2={normalizedSize.width}
                y2={normalizedSize.height / 2}
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={opacity}
              />
            </>
          )

        case "plus":
          return (
            <path
              d={`M ${normalizedSize.width / 2} 0 L ${normalizedSize.width / 2} ${normalizedSize.height} M 0 ${normalizedSize.height / 2} L ${normalizedSize.width} ${normalizedSize.height / 2}`}
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={opacity}
              fill="none"
              strokeLinecap="round"
            />
          )

        case "squares":
          return (
            <rect
              width={normalizedSize.width}
              height={normalizedSize.height}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          )

        default:
          return null
      }
    }

    const renderFadeMask = () => {
      if (!fade) return null

      switch (fade) {
        case "edges":
        case true:
          return (
            <linearGradient id={maskId} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="10%" stopColor="white" stopOpacity="1" />
              <stop offset="90%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          )

        case "center":
          return (
            <radialGradient id={maskId} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          )

        case "radial":
          return (
            <radialGradient id={maskId} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="30%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </radialGradient>
          )

        default:
          return null
      }
    }

    const animationStyle = animation
      ? {
          animation: `grid-pattern-move ${animation.duration ?? 10}s ${
            animation.timing ?? "linear"
          } infinite ${animation.direction ?? "normal"}`,
        }
      : {}

    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden",
          className
        )}
        style={{
          ...style,
          ...animationStyle,
        }}
        {...props}
      >
        <svg
          className="absolute h-full w-full"
          style={{
            transform: `translate(${normalizedOffset.x}px, ${normalizedOffset.y}px)`,
          }}
        >
          <defs>
            <pattern
              id={patternId}
              x="0"
              y="0"
              width={normalizedGap.x}
              height={normalizedGap.y}
              patternUnits="userSpaceOnUse"
            >
              {renderPattern()}
            </pattern>
            {renderFadeMask()}
            {gradient && (
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={gradient.from ?? "transparent"} />
                {gradient.via && <stop offset="50%" stopColor={gradient.via} />}
                <stop offset="100%" stopColor={gradient.to ?? "transparent"} />
              </linearGradient>
            )}
          </defs>

          <rect
            width={maxArea?.width ?? "100%"}
            height={maxArea?.height ?? "100%"}
            fill={`url(#${patternId})`}
            mask={fade ? `url(#${maskId})` : undefined}
          />

          {gradient && (
            <rect
              width={maxArea?.width ?? "100%"}
              height={maxArea?.height ?? "100%"}
              fill={`url(#${gradientId})`}
              opacity={gradient.opacity ?? 0.5}
              className="mix-blend-multiply dark:mix-blend-screen"
            />
          )}
        </svg>

        <style jsx>{`
          @keyframes grid-pattern-move {
            0% {
              transform: translate(0, 0);
            }
            100% {
              transform: translate(${normalizedGap.x}px, ${normalizedGap.y}px);
            }
          }
        `}</style>
      </div>
    )
  }
)

GridPattern.displayName = "GridPattern"

// Preset configurations
export const GridPatternPresets = {
  dotMatrix: {
    variant: "dots" as const,
    size: 3,
    gap: 30,
    opacity: 0.3,
  },
  fineDots: {
    variant: "dots" as const,
    size: 1,
    gap: 10,
    opacity: 0.4,
  },
  gridLines: {
    variant: "lines" as const,
    gap: 40,
    strokeWidth: 1,
    opacity: 0.2,
  },
  crosshatch: {
    variant: "crosses" as const,
    size: 10,
    gap: 20,
    strokeWidth: 1,
    opacity: 0.3,
  },
  blueprint: {
    variant: "lines" as const,
    gap: 20,
    strokeWidth: 0.5,
    color: "#3b82f6",
    opacity: 0.3,
  },
  graph: {
    variant: "lines" as const,
    gap: { x: 50, y: 50 },
    strokeWidth: 1,
    opacity: 0.15,
    fade: "edges" as const,
  },
  isometric: {
    variant: "lines" as const,
    gap: { x: 30, y: 17.32 }, // 30deg isometric
    strokeWidth: 0.5,
    opacity: 0.2,
  },
  hexagon: {
    variant: "dots" as const,
    size: 2,
    gap: { x: 30, y: 26 }, // Hexagonal pattern
    opacity: 0.3,
  },
}

export { GridPattern }
