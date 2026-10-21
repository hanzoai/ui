'use client'

/**
 * Progress — a horizontal bar; `value` is 0–100, or `null` for "working, how
 * far unknown".
 *
 * Two shapes. `pill` (the default, unchanged) is a rounded bar on the edge
 * track. `line` is the record kit's (ProgressBar, MIT — NOTICE): no
 * track unless asked, square ends unless `ends="round"`, the ink as the fill, and a
 * minimum fill of min(12px, 50%) for any value strictly between 0 and 100 — a
 * job 1% done is visibly started, which a 3px sliver is not. Its width eases
 * over 300ms.
 *
 * `value={null}` on either draws the indeterminate sweep: a quarter-width bar
 * crossing the track every 1.5s (`data-motion="sweep"`, stopped under reduced
 * motion). `size` is the thickness, `md` 8 (both shapes' default) or `sm` 6.
 */
import { Progress as GuiProgress, View } from '@hanzo/gui'
import { sx } from '../../sx'
import type { ComponentProps } from 'react'
import { slot } from './slot'

export type ProgressProps = Omit<ComponentProps<typeof GuiProgress>, 'size'> & {
  /**
   * Class for the moving bar, not the track. Callers colour the bar by
   * threshold (green/amber/red), which the track's own className cannot express
   * because they are different elements. Reaches the DOM on web; inert on
   * native, where gui paints from tokens.
   */
  indicatorClassName?: string
  /** The moving bar's colour, a theme token: a status rung where the value is a state. */
  indicatorColor?: ComponentProps<typeof GuiProgress.Indicator>['bg']
  /** `pill` (default) or the record kit's `line`. */
  variant?: 'pill' | 'line'
  /** Thickness: `md` 8 (default) or `sm` 6. */
  size?: 'sm' | 'md'
  /** `line` only: `square` ends (default) or `round`. A name of its own, since `rounded` is gui's corner style. */
  ends?: 'square' | 'round'
  /** `line` only: draw the track under the bar. */
  track?: boolean
}

const HEIGHT = { sm: 6, md: 8 } as const

const Progress = ({
  value,
  indicatorClassName,
  indicatorColor,
  variant = 'pill',
  size = 'md',
  ends = 'square',
  track = false,
  ...props
}: ProgressProps) => {
  const indeterminate = value === null
  const line = variant === 'line'
  const v = Math.max(0, Math.min(100, value ?? 0))
  const rounded = ends === 'round'
  return (
    <GuiProgress
      {...slot('progress')}
      data-variant={variant}
      value={indeterminate ? null : v}
      height={HEIGHT[size]}
      width="100%"
      bg={line ? (track ? '$edge' : 'transparent') : '$edge'}
      rounded={line && !rounded ? 0 : '$10'}
      overflow="hidden"
      {...props}
    >
      {indeterminate ? (
        <View
          {...slot('progress-indicator')}
          data-motion="sweep"
          width="25%"
          height="100%"
          rounded={line && !rounded ? 0 : '$10'}
          bg={indicatorColor ?? (line ? '$ink' : '$soft')}
          {...sx(indicatorClassName)}
        />
      ) : line ? (
        <View
          {...slot('progress-indicator')}
          height="100%"
          minW={v > 0 && v < 100 ? 'min(12px, 50%)' : 0}
          rounded={rounded ? '$10' : 0}
          bg={indicatorColor ?? '$ink'}
          // Inline, as Textarea's grown height is: a style prop would mint an
          // atomic class per value, and no sheet can ship a hundred of them.
          style={{ width: `${v}%`, transition: 'width 300ms linear' }}
          {...sx(indicatorClassName)}
        />
      ) : (
        <GuiProgress.Indicator
          {...slot('progress-indicator')}
          // Same reason as the slider's fill: `$ink` is the foreground rung, and
          // a type colour stretched across a bar is a lit slab. 6.93:1 over the
          // track against WCAG 1.4.11's 3:1 — legible with room to spare, and no
          // longer competing with the text beside it for attention.
          bg={indicatorColor ?? '$soft'}
          {...sx(indicatorClassName)}
        />
      )}
    </GuiProgress>
  )
}

export { Progress }
