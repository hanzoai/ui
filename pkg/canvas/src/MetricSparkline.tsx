"use client"

/**
 * A tiny inline-SVG sparkline for the metric preview on a service card. Pure and
 * honest: with fewer than two points it renders a flat dashed baseline (a real
 * "no data yet" signal), never a fabricated trend.
 */
import type { CSSProperties } from "react"

export interface MetricSparklineProps {
  points: number[]
  width?: number
  height?: number
  stroke?: string
  strokeWidth?: number
  /** Area fill under the line (e.g. a translucent version of `stroke`). */
  fill?: string | null
  min?: number
  max?: number
  style?: CSSProperties
}

export function MetricSparkline({
  points,
  width = 76,
  height = 24,
  stroke = "#8b949e",
  strokeWidth = 1.5,
  fill = null,
  min,
  max,
  style,
}: MetricSparklineProps) {
  const n = points.length
  if (n < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={style}
        aria-hidden
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={stroke}
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.5}
        />
      </svg>
    )
  }
  const lo = min ?? Math.min(...points)
  const hi = max ?? Math.max(...points)
  const span = hi - lo || 1
  const pad = strokeWidth
  const innerH = height - pad * 2
  const stepX = width / (n - 1)
  const coords = points.map((p, i) => {
    const x = i * stepX
    const y = pad + innerH - ((p - lo) / span) * innerH
    return [x, y] as const
  })
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ")
  const area = fill
    ? `${line} L${width.toFixed(2)},${height} L0,${height} Z`
    : ""
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={style}
      aria-hidden
    >
      {fill ? <path d={area} fill={fill} stroke="none" /> : null}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
