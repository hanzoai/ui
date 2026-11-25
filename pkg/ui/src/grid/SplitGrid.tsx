/**
 * `SplitGrid` — master/detail & sidebar/main layouts using native CSS `minmax()` tracks.
 *
 * Pure CSS `display: grid` with zero JS resize observers. Supports fixed or
 * bounded sidebar widths, proportional ratios (including `@hanzo/design`'s golden
 * split), left/right sidebar placement, and zero-JS breakpoint collapse via CSS
 * custom properties.
 */
import type { CSSProperties, ReactElement } from 'react'

import { Grid, type GridProps } from './Grid'
import { splitTracks, type SplitRatio, type SplitTracksOptions } from './tokens'

export type { SplitRatio }

export interface SplitGridProps
  extends Omit<GridProps, 'cols' | 'columns'>,
    SplitTracksOptions {
  /**
   * Optional breakpoint below which the split stacks into a single full-width
   * column (`'sm'` = 40rem, `'md'` = 48rem, `'lg'` = 64rem). Requires
   * `@hanzo/ui/theme.css`, `@hanzo/ui/styles.css`, or `@hanzo/ui/grid.css`.
   */
  collapseAt?: 'sm' | 'md' | 'lg'
}

type CSSStyleWithVars = CSSProperties & Record<`--${string}`, string | number | undefined>

export function SplitGrid({
  sidebar,
  minMain,
  side = 'left',
  ratio,
  collapseAt,
  gap = '$4',
  style,
  ...props
}: SplitGridProps): ReactElement {
  const trackExpr = splitTracks({ sidebar, minMain, side, ratio })

  const splitStyle: CSSStyleWithVars | undefined = collapseAt
    ? {
        '--hz-split-cols': trackExpr,
        ...(style as CSSStyleWithVars),
      }
    : (style as CSSStyleWithVars | undefined)

  return (
    <Grid
      data-slot="split-grid"
      {...(collapseAt ? { 'data-hz-split-collapse': collapseAt } : null)}
      cols={collapseAt ? `var(--hz-split-cols, ${trackExpr})` : trackExpr}
      gap={gap}
      style={splitStyle}
      {...props}
    />
  )
}
