'use client'

/**
 * Donut — a tiny dependency-free SVG ring for a categorical breakdown
 * (e.g. machines by status). Standard library first: no chart dependency for a
 * single ring. It renders ONLY the real segments it is given and returns `null`
 * when the total is zero, so the caller shows an honest empty state instead of an
 * empty circle. Purely presentational — all values come from the caller.
 */
export type DonutSegment = { label: string; value: number; color: string }

export function Donut({
  segments,
  size = 160,
  thickness = 18,
  centerValue,
  centerLabel,
  trackColor = '#2a2d2e',
  valueColor = '#ecedee',
  labelColor = '#9ba1a6',
}: {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  /** Big number in the middle (e.g. total). */
  centerValue?: string
  /** Caption under the center value. */
  centerLabel?: string
  /** Unfilled-ring color (explicit hex so it never depends on theme var names). */
  trackColor?: string
  valueColor?: string
  labelColor?: string
}) {
  const total = segments.reduce((n, s) => n + Math.max(0, s.value), 0)
  if (total <= 0) return null

  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r

  let offset = 0
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = s.value / total
      const dash = frac * circ
      const node = (
        <circle
          key={s.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-offset}
        />
      )
      offset += dash
      return node
    })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={thickness} />
      {/* segments, drawn from 12 o'clock */}
      <g transform={`rotate(-90 ${cx} ${cy})`}>{arcs}</g>
      {centerValue ? (
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill={valueColor}>
          {centerValue}
        </text>
      ) : null}
      {centerLabel ? (
        <text x={cx} y={cy + size * 0.13} textAnchor="middle" fontSize={size * 0.08} fill={labelColor}>
          {centerLabel}
        </text>
      ) : null}
    </svg>
  )
}
