'use client'

/**
 * Console metric primitives — the ONE shared set of stat tiles, panels, legend
 * rows, util bars, and "real action or honest-disabled" buttons that every
 * resource console (GPUs, Kubernetes, Containers, Training, Tasks) renders.
 *
 * These were first written for the GPU surface; promoted here so a sibling
 * product never reaches into `gpus/` for shell chrome (separation of concerns).
 * `gpus/charts.tsx` now re-exports them, so there is exactly one definition.
 *
 * Honest by construction: a `MetricCard` shows the pre-formatted `value` the
 * caller passes (an absent metric is an em-dash, never a fabricated number); a
 * `Sparkline`/`MiniBars` with no real series renders nothing; a `HintButton`
 * with no `onPress` is visibly disabled with a tooltip saying WHY. Inline SVG is
 * the house pattern (see ui/Loader, ui/HanzoMark); style props use the v5
 * shorthand set.
 */
import type { ReactElement, ReactNode } from 'react'
import { Button, Card, Text, XStack, YStack } from '@hanzo/gui'

/** Distinct, theme-neutral series colors (mid-saturation reads on dark + light). */
export const SERIES = ['#6ea8fe', '#7ee787', '#f0a868', '#c792ea', '#56d4c4', '#e879a6', '#d6c15a', '#8b9bb4'] as const
export const colorForIndex = (i: number): string => SERIES[i % SERIES.length]
const TRACK = 'rgba(128,128,128,0.18)'

/** Tone for a utilization/temperature value (green calm → red hot). */
export function utilColor(pct: number): string {
  if (pct >= 90) return '#e5534b'
  if (pct >= 70) return '#f0a868'
  return '#7ee787'
}

/**
 * A single-series sparkline over real points. Renders nothing meaningful for <2
 * points (the caller shows `—` instead). The y-range is the data's own min/max.
 */
export function Sparkline({
  points,
  width = 104,
  height = 30,
  color = SERIES[0],
}: {
  points: number[]
  width?: number
  height?: number
  color?: string
}): ReactElement | null {
  if (!points || points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const stepX = width / (points.length - 1)
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="trend">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** A small vertical-bar chart (e.g. cost per day). One bar per real datum. */
export function MiniBars({
  bars,
  width = 320,
  height = 96,
  color = SERIES[0],
}: {
  bars: { label: string; value: number }[]
  width?: number
  height?: number
  color?: string
}): ReactElement | null {
  if (!bars.length) return null
  const max = Math.max(...bars.map((b) => b.value), 1)
  const gap = 4
  const bw = (width - gap * (bars.length - 1)) / bars.length
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="bars">
      {bars.map((b, i) => {
        const h = Math.max(1, (b.value / max) * (height - 2))
        return (
          <rect key={b.label + i} x={i * (bw + gap)} y={height - h} width={bw} height={h} rx={2} fill={color} opacity={0.85}>
            <title>{`${b.label}: ${b.value}`}</title>
          </rect>
        )
      })}
    </svg>
  )
}

/**
 * A thin horizontal bar (0–100). By default the fill tones by value (green→red,
 * for utilization/temperature). Pass a fixed `color` for a neutral meter like
 * training PROGRESS, where a high value is good, not "hot".
 */
export function UtilBar({ value, width = 120, color }: { value: number; width?: number; color?: string }): ReactElement {
  const v = Math.max(0, Math.min(100, value))
  return (
    <svg width={width} height={8} viewBox={`0 0 ${width} 8`} role="img" aria-label={`${Math.round(v)}%`}>
      <rect x={0} y={1} width={width} height={6} rx={3} fill={TRACK} />
      <rect x={0} y={1} width={(v / 100) * width} height={6} rx={3} fill={color ?? utilColor(v)} />
    </svg>
  )
}

/** A legend row: color swatch + label + value. */
export function LegendDot({ color, label, value }: { color: string; label: string; value?: ReactNode }) {
  return (
    <XStack items="center" gap="$2" justify="space-between">
      <XStack items="center" gap="$2">
        <YStack width={10} height={10} rounded="$1" bg={color as never} />
        <Text fontSize="$2" color="$color11">
          {label}
        </Text>
      </XStack>
      {value != null ? (
        <Text fontSize="$2" color="$color12" fontWeight="600">
          {value}
        </Text>
      ) : null}
    </XStack>
  )
}

/**
 * One overview metric tile. `value` is pre-formatted by the caller (so an absent
 * metric is an honest `—`, never a fabricated number). The sparkline only appears
 * when the caller has a REAL series; the delta only when a real comparison exists.
 */
export function MetricCard({
  icon,
  label,
  value,
  caption,
  spark,
  sparkColor,
  delta,
}: {
  icon: ReactElement
  label: string
  value: string
  caption?: string
  spark?: number[]
  sparkColor?: string
  delta?: { pct: number }
}) {
  const up = delta ? delta.pct >= 0 : false
  return (
    <Card p="$3.5" gap="$2" borderWidth={1} borderColor="$borderColor" flex={1} minW={172}>
      <XStack items="center" gap="$2" justify="space-between">
        <XStack items="center" gap="$2">
          {icon}
          <Text fontSize="$2" color="$color11" fontWeight="600">
            {label}
          </Text>
        </XStack>
        {delta ? (
          <Text fontSize="$1" color={up ? '#7ee787' : '#e5534b'}>
            {up ? '▲' : '▼'} {Math.abs(delta.pct)}%
          </Text>
        ) : null}
      </XStack>
      <XStack items="flex-end" justify="space-between" gap="$2">
        <Text fontSize="$8" fontWeight="900" color="$color12" numberOfLines={1}>
          {value}
        </Text>
        {spark && spark.length >= 2 ? <Sparkline points={spark} color={sparkColor ?? SERIES[0]} /> : null}
      </XStack>
      {caption ? (
        <Text fontSize="$1" color="$color10" numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </Card>
  )
}

/**
 * A button that is either a real action (onPress) or HONESTLY disabled with a
 * native tooltip explaining why (the action has no backend yet). One way to
 * render the "real route or honest-disabled" affordance the consoles use.
 */
export function HintButton({
  icon,
  iconAfter,
  children,
  onPress,
  disabled,
  hint,
  theme,
}: {
  icon?: ReactElement
  iconAfter?: ReactElement
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  /** Native tooltip text (shown on hover) — say WHY it is disabled. */
  hint?: string
  theme?: 'light'
}) {
  const btn = (
    <Button
      size="$2"
      theme={theme}
      icon={icon}
      iconAfter={iconAfter}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
    >
      {children}
    </Button>
  )
  if (!hint) return btn
  return (
    <span title={hint} style={{ display: 'inline-flex' }}>
      {btn}
    </span>
  )
}

/**
 * A titled panel wrapper used across the consoles (chart + list cards). `grow`
 * (default true) sets `flex={1}` so panels SHARE width in a ROW; pass `grow={false}`
 * inside a vertical rail (a column YStack) so each panel sizes to its content and
 * stacks — flex-grow in a column with no fixed height collapses them onto each other.
 */
export function Panel({
  title,
  right,
  children,
  minW = 280,
  grow = true,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
  minW?: number
  grow?: boolean
}) {
  return (
    <Card p="$4" gap="$3" borderWidth={1} borderColor="$borderColor" flex={grow ? 1 : undefined} minW={minW} width={grow ? undefined : '100%'}>
      <XStack items="center" justify="space-between" gap="$2">
        <Text fontSize="$4" fontWeight="800" color="$color12">
          {title}
        </Text>
        {right}
      </XStack>
      {children}
    </Card>
  )
}
