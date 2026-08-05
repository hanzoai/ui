'use client'

/**
 * Grid — a real CSS grid whose tracks come from the CONTAINER, not the children.
 *
 * This exists to kill a specific shipped defect: hand-rolled
 * `width="calc(25% - 7.5px)"` grids that collapse asymmetrically. That shape is
 * broken by construction — each child computes its own width, so the row is only
 * even while every child agrees, and one long word or one `box-sizing` surprise
 * makes the row ragged. Nothing about it can be fixed by tuning the number.
 *
 * Here the parent declares the tracks once and the children have no say. Equal
 * columns are structural, not arithmetic, and no child can widen its own track.
 *
 * Why a plain div and not a gui YStack: gui's box model is Yoga, which is
 * flexbox and has no grid — a YStack would compile its own `display:flex`
 * atomic class and fight the grid. Inline styles, not a stylesheet class, so
 * there is no rule to fail to ship: this package's own checker exists because
 * "class with no rule" has shipped here three times.
 *
 * The two track formulas, both deliberate:
 *
 *   auto  repeat(auto-fill, minmax(min(Npx, 100%), 1fr))
 *         The `min(Npx, 100%)` is what makes it safe below N: a bare
 *         `minmax(240px, 1fr)` forces a 240px track inside a 200px phone and
 *         overflows the viewport horizontally. Responsive with ZERO breakpoint
 *         props — the wrap count follows the container, so the same tree is
 *         right at 390 and at 1280.
 *
 *   cols  repeat(n, minmax(0, 1fr))
 *         `1fr` alone means `minmax(auto, 1fr)`, and `auto` floors the track at
 *         the content's min-content width — so one long unbroken string pushes
 *         its own column wider and every sibling narrower. That IS the ragged
 *         row. `minmax(0, 1fr)` is the fix.
 *
 * `[data-slot='grid'] > *` also gets `min-width: 0` in the stylesheet, for the
 * same reason: a grid item's default `min-width: auto` lets its content set the
 * floor and blow the track out.
 */
import { getTokenValue } from '@hanzo/gui'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'

export interface GridProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Narrowest a column may get before the grid drops one. The whole responsive
   * story: no breakpoints, no props per screen size.
   */
  min?: number
  /** Fixed column count. Overrides `min` — use it when the count is the design. */
  cols?: number
  /** A `$n` space token or a raw px number. */
  gap?: number | string
  children?: ReactNode
}

/** `'$3'` -> 12. A raw number passes through as px. */
const space = (v: number | string | undefined, fallback: number): number => {
  if (v == null) return fallback
  if (typeof v === 'number') return v
  const t = getTokenValue(v as never, 'space')
  return typeof t === 'number' ? t : fallback
}

const Grid = ({ min = 240, cols, gap = '$3', style, ...props }: GridProps) => {
  const g = space(gap, 12)
  const columns = cols
    ? `repeat(${cols}, minmax(0, 1fr))`
    : `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`
  const grid: CSSProperties = { display: 'grid', gridTemplateColumns: columns, gap: g }
  return <div data-slot="grid" style={{ ...grid, ...style }} {...props} />
}

export { Grid }
