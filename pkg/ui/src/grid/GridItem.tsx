/**
 * `GridItem` & `Cell` — native CSS Grid placement and spanning primitives.
 *
 * Always floors `min-width: 0` so content inside a spanned or placed cell cannot
 * blow out its column track. Supports `colSpan`, `rowSpan`, `area`, explicit
 * line placement (`colStart`/`colEnd`/`rowStart`/`rowEnd` or `col`/`row`),
 * self-alignment, and CSS `subgrid` on nested items.
 */
import {
  createElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'

import type { GridElement, SubgridAxis } from './Grid'
import { formatSpan } from './tokens'

export interface GridItemProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Semantic HTML element to render. Defaults to `'div'`. */
  as?: GridElement
  /** Span across `N` columns (`span N`) or `'full'` (`1 / -1`). */
  colSpan?: number | 'full'
  /** Span across `N` rows (`span N`) or `'full'` (`1 / -1`). */
  rowSpan?: number | 'full'
  /** Explicit `grid-column-start` line. */
  colStart?: number | string
  /** Explicit `grid-column-end` line. */
  colEnd?: number | string
  /** Explicit `grid-row-start` line. */
  rowStart?: number | string
  /** Explicit `grid-row-end` line. */
  rowEnd?: number | string
  /**
   * Shorthand `grid-column`: a number spans `N` tracks (`span N`); a string
   * places directly (`'1 / 3'`, `'2 / -1'`).
   */
  col?: number | string
  /** Shorthand `grid-row`: a number spans `N` rows (`span N`); a string places directly. */
  row?: number | string
  /** Named `grid-area` region matching parent `Grid` `areas`. */
  area?: string
  /** Self-alignment along the block axis (`align-self`). */
  alignSelf?: CSSProperties['alignSelf']
  /** Self-alignment along the inline axis (`justify-self`). */
  justifySelf?: CSSProperties['justifySelf']
  /** Shorthand for `align-self` + `justify-self`. */
  placeSelf?: CSSProperties['placeSelf']
  /** Turn this item into a nested CSS subgrid inheriting parent tracks. */
  subgrid?: SubgridAxis
  children?: ReactNode
  ref?: Ref<HTMLElement>
}

export type CellProps = GridItemProps

function renderGridItem(
  defaultSlot: string,
  {
    as = 'div',
    colSpan,
    rowSpan,
    colStart,
    colEnd,
    rowStart,
    rowEnd,
    col,
    row,
    area,
    alignSelf,
    justifySelf,
    placeSelf,
    subgrid,
    style,
    children,
    ref,
    ...props
  }: GridItemProps,
): ReactElement {
  const itemStyle: CSSProperties = {
    minWidth: 0,
  }

  const gridColumn = formatSpan(colSpan ?? col)
  const gridRow = formatSpan(rowSpan ?? row)

  if (area !== undefined) itemStyle.gridArea = area
  if (gridColumn !== undefined) itemStyle.gridColumn = gridColumn
  if (gridRow !== undefined) itemStyle.gridRow = gridRow
  if (colStart !== undefined) itemStyle.gridColumnStart = colStart
  if (colEnd !== undefined) itemStyle.gridColumnEnd = colEnd
  if (rowStart !== undefined) itemStyle.gridRowStart = rowStart
  if (rowEnd !== undefined) itemStyle.gridRowEnd = rowEnd
  if (alignSelf !== undefined) itemStyle.alignSelf = alignSelf
  if (justifySelf !== undefined) itemStyle.justifySelf = justifySelf
  if (placeSelf !== undefined) itemStyle.placeSelf = placeSelf

  if (subgrid) {
    itemStyle.display = 'grid'
    if (subgrid === true || subgrid === 'columns' || subgrid === 'both') {
      itemStyle.gridTemplateColumns = 'subgrid'
    }
    if (subgrid === 'rows' || subgrid === 'both') {
      itemStyle.gridTemplateRows = 'subgrid'
    }
  }

  return createElement(
    as,
    {
      'data-slot': defaultSlot,
      ...props,
      ref,
      style: style ? { ...itemStyle, ...style } : itemStyle,
    },
    children,
  )
}

export function GridItem(props: GridItemProps): ReactElement {
  return renderGridItem('grid-item', props)
}

/**
 * Backwards-compatible alias for `GridItem` carrying `data-slot="grid-cell"`.
 */
export function Cell(props: CellProps): ReactElement {
  return renderGridItem('grid-cell', props)
}
