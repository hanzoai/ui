/**
 * `AutoGrid` — zero-JS responsive card & KPI grid using native CSS:
 *
 *   grid-template-columns: repeat(auto-fit, minmax(min(100%, <minWidth>), 1fr))
 *
 * Reflows cleanly from container space alone with zero ResizeObserver, zero
 * viewport breakpoint boilerplate, and zero horizontal overflow on narrow screens.
 */
import type { ReactElement } from 'react'

import { Grid, type GridProps } from './Grid'
import { autoGridTracks, resolveSpace } from './tokens'

export interface AutoGridProps extends Omit<GridProps, 'cols' | 'columns'> {
  /**
   * Minimum width of each track before wrapping (number = px, or CSS length).
   * Defaults to `@hanzo/design`'s `--grid-card-min` (`18rem` / 288px).
   */
  minWidth?: number | string
  /** Optional upper cap on column count without media queries. */
  maxCols?: number
  /**
   * Repetition mode:
   * - `'auto-fit'` (default): stretches filled tracks to fill the row
   * - `'auto-fill'`: preserves empty trailing column tracks at their min size
   */
  mode?: 'auto-fit' | 'auto-fill'
}

export function AutoGrid({
  minWidth = 'var(--grid-card-min, 18rem)',
  maxCols,
  mode = 'auto-fit',
  gap = '$4',
  colGap,
  ...props
}: AutoGridProps): ReactElement {
  const trackGap = colGap !== undefined ? resolveSpace(colGap) : resolveSpace(gap)
  const columns = autoGridTracks(minWidth, { maxCols, gap: trackGap, mode })

  return (
    <Grid
      data-slot="auto-grid"
      cols={columns}
      gap={gap}
      colGap={colGap}
      {...props}
    />
  )
}
