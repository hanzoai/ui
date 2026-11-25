/**
 * `BentoGrid` — executive dashboard & asymmetric card layout primitive.
 *
 * Defaults to `@hanzo/design`'s 12-column grid (`--grid-columns: 12`) so 2, 3,
 * 4, 6, 8, and 12-column `GridItem` spans compose cleanly. Pair with
 * `<GridItem colSpan={...} rowSpan={...} area={...}>`.
 */
import type { ReactElement } from 'react'

import { Grid, type GridProps } from './Grid'
import { track } from './tokens'

export interface BentoGridProps extends Omit<GridProps, 'flow'> {
  /**
   * Minimum row track height (`grid-auto-rows`).
   * A number `N` becomes `minmax(Npx, auto)` so tall cards expand rather than clip;
   * pass a CSS string (e.g. `'180px'`) for a fixed row height.
   */
  rowHeight?: number | string
  /**
   * Opt in to `grid-auto-flow: row dense` packing for decorative/non-interactive
   * tiles. Defaults to `false` to preserve DOM-order keyboard focus flow.
   */
  dense?: boolean
}

export function BentoGrid({
  cols,
  columns,
  rowHeight,
  dense = false,
  gap = '$4',
  autoRows,
  ...props
}: BentoGridProps): ReactElement {
  const resolvedAutoRows =
    autoRows ??
    (rowHeight === undefined
      ? undefined
      : typeof rowHeight === 'number'
        ? `minmax(${track(rowHeight)}, auto)`
        : rowHeight)

  return (
    <Grid
      data-slot="bento-grid"
      cols={cols ?? columns ?? 12}
      gap={gap}
      autoRows={resolvedAutoRows}
      flow={dense ? 'row dense' : undefined}
      {...props}
    />
  )
}
