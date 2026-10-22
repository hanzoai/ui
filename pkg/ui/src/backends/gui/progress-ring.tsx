'use client'

/**
 * ProgressRing — a small circular progress, for a row that has no room for a
 * bar: the context left in a composer, a sync that is 40% through, a metric.
 *
 * After the source kit's ProgressRing (MIT, NOTICE): 14px (`sm`) or 16px (`md`), a
 * 2px stroke starting at 12 o'clock, the track on the strong edge rung and the
 * indicator on the accent (`--primary`, monochrome until an org picks one).
 * The indicator's dash eases over 300ms with round caps (square at 0%, where a
 * round cap would draw a dot). `value={null}` shows a quarter and turns once
 * every 1.5s (`data-motion="orbit"`, still under reduced motion).
 *
 * Children are a label drawn to the LEFT of the ring, 8px from it — a value
 * ("40%") or a name — and also name the progressbar for assistive technology
 * unless `aria-label` says otherwise.
 *
 * A plain <svg>, as Donut and the grid patterns are: the ring is drawn, not
 * laid out, and gui tokens reach it as the custom properties gui emits.
 */
import { SizableText, XStack } from '@hanzo/gui'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { slot } from './slot'

const SIZE = { sm: 14, md: 16 } as const
const STROKE = 2

export type ProgressRingProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  /** 0–100, or `null` for indeterminate. */
  value: number | null
  size?: keyof typeof SIZE
  /** The indicator's colour, any CSS colour or custom property. */
  barColor?: string
  /** A label drawn left of the ring; names it unless `aria-label` is given. */
  children?: ReactNode
  'aria-label'?: string
}

export function ProgressRing({
  value,
  size = 'md',
  barColor = 'var(--primary)',
  children,
  'aria-label': label,
  ...props
}: ProgressRingProps) {
  const id = useId()
  const d = SIZE[size]
  const r = (d - STROKE) / 2
  const circ = 2 * Math.PI * r
  const indeterminate = value === null
  const v = indeterminate ? 25 : Math.max(0, Math.min(100, value))
  const offset = circ * (1 - v / 100)
  return (
    <XStack
      {...slot('progress-ring')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : v}
      aria-label={label}
      aria-labelledby={label || !children ? undefined : `${id}-label`}
      display="inline-flex"
      items="center"
      gap="$2"
      shrink={0}
      {...props}
    >
      {children ? (
        <SizableText id={`${id}-label`} size="$1" color="$ink" numberOfLines={1} textAlign="end">
          {children}
        </SizableText>
      ) : null}
      <svg
        width={d}
        height={d}
        viewBox={`0 0 ${d} ${d}`}
        aria-hidden
        data-motion={indeterminate ? 'orbit' : undefined}
        style={{ flexShrink: 0, transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      >
        <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke="var(--rim)" strokeWidth={STROKE} />
        <circle
          cx={d / 2}
          cy={d / 2}
          r={r}
          fill="none"
          stroke={barColor}
          strokeWidth={STROKE}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap={v > 0 ? 'round' : 'butt'}
          style={{ transition: 'stroke-dashoffset 300ms ease' }}
        />
      </svg>
    </XStack>
  )
}
