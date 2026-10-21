import type { ReactNode } from 'react'
import { Text, XStack } from '@hanzo/gui'

import { fontMono } from '../core/fonts'
import { ProgressRing } from '../backends/gui/progress-ring'

export type FactProps = {
  /** The row's left-hand label. */
  label: string
  /** The row's right-hand value. A string renders in the value color and
   *  weight; anything else (a badge, a link, a stack of controls) renders as
   *  given. */
  value: ReactNode
  /** Render a string value in the monospace face — an id, a hash, a path. */
  mono?: boolean
  /**
   * `row` (default) is the property-list row. `metric` is the record kit's
   * metric row (MetricRow, MIT — NOTICE): no rule, a 24px floor,
   * 12px medium, the label quiet beside an optional icon, the value at the end,
   * and an optional progress ring that the value labels.
   */
  variant?: 'row' | 'metric'
  /** `metric`: an icon before the label. */
  startIcon?: ReactNode
  /** `metric`: a 14px ring at the end, 0–100 or `null` for indeterminate. */
  progress?: number | null
  /** `metric`: the ring's colour. */
  progressColor?: string
  /** `metric`: the ring's accessible value, when the value text is not it. */
  progressValueText?: string
}

/**
 * Fact — one row of a property list: a label on the left, a value on the
 * right, a hairline separator beneath. The read-only counterpart to `Field`'s
 * editable row — a detail pane is a stack of these where a settings form is a
 * stack of `Field`s.
 *
 * Written twice, near-identically, in two console detail drawers before
 * either could find the other. This is the one definition; the wider of the
 * two shapes won (a non-string `value` renders as given, not stringified).
 */
export function Fact({ label, value, mono, variant = 'row', startIcon, progress, progressColor, progressValueText }: FactProps) {
  if (variant === 'metric') {
    const shown =
      typeof value === 'string' || typeof value === 'number' ? (
        <Text fontSize="$1" fontWeight="500" color="$ink" numberOfLines={1} style={mono ? { fontFamily: fontMono } : undefined}>
          {value}
        </Text>
      ) : (
        value
      )
    return (
      <XStack data-slot="fact" data-variant="metric" items="center" gap="$2" minH={24}>
        <XStack flex={1} minW={0} items="center" gap="$1">
          {startIcon}
          <Text fontSize="$1" fontWeight="500" color="$hint" numberOfLines={1}>
            {label}
          </Text>
        </XStack>
        {progress !== undefined ? (
          <ProgressRing
            value={progress}
            size="sm"
            {...(progressColor ? { barColor: progressColor } : null)}
            aria-label={`${label}${progressValueText ? `: ${progressValueText}` : ''}`}
          >
            {shown}
          </ProgressRing>
        ) : (
          shown
        )}
      </XStack>
    )
  }
  return (
    <XStack
      justify="space-between"
      items="center"
      py="$1.5"
      borderBottomWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      <Text fontSize="$2" color="$color11">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text
          fontSize="$2"
          color="$color12"
          fontWeight="600"
          numberOfLines={1}
          style={mono ? { fontFamily: fontMono } : undefined}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </XStack>
  )
}
