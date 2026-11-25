/**
 * `Grid` — ultra-lightweight native CSS `display: grid` layout primitive.
 *
 * Zero JS resize observers, zero `@hanzo/gui` runtime overhead, RSC/SSR-safe.
 * Driven by `@hanzo/design` `--space-*` and `--hz-density` / `--density` tokens.
 */
import {
  Children,
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'

import {
  formatAreas,
  GRID_BREAKPOINTS,
  isResponsiveCols,
  resolveDensity,
  resolveSpace,
  trackList,
  tracks,
  type Fit,
  type GapToken,
  type GridDensity,
  type ResponsiveCols,
  type Tracks,
} from './tokens'

export type GridElement =
  | 'div'
  | 'section'
  | 'main'
  | 'ul'
  | 'ol'
  | 'aside'
  | 'article'
  | 'header'
  | 'footer'
  | 'nav'

export type SubgridAxis = boolean | 'columns' | 'rows' | 'both'

type CSSStyleWithVars = CSSProperties & Record<`--${string}`, string | number | undefined>

export interface GridProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Semantic HTML element to render. Defaults to `'div'`. */
  as?: GridElement
  /**
   * Column tracks: count (`3`), list (`['2fr', '1fr']`), raw CSS track string,
   * intrinsic `Fit` (`{ min: 240, max: 4 }`), or responsive breakpoint map
   * (`{ base: 1, md: 2, lg: 4 }`).
   */
  cols?: Tracks | Fit | ResponsiveCols
  /** Alias for `cols` (preserved for 100% backwards compatibility). */
  columns?: Tracks | Fit | ResponsiveCols
  /** Row tracks: count, list, or raw CSS track list. */
  rows?: Tracks
  /** Unified row & column gap (`'$3'`, `'md'`, `16`, `'1rem'`, etc.). */
  gap?: GapToken
  /** Row gap override (`row-gap`). */
  rowGap?: GapToken
  /** Column gap override (`column-gap`). */
  colGap?: GapToken
  /** Named grid template areas (raw string or array of row strings). */
  areas?: string | readonly string[]
  /** Item alignment along the block axis (`align-items`). */
  align?: CSSProperties['alignItems']
  /** Item alignment along the inline axis (`justify-items`). */
  justify?: CSSProperties['justifyItems']
  /** Track alignment along the block axis (`align-content`). */
  alignContent?: CSSProperties['alignContent']
  /** Track alignment along the inline axis (`justify-content`). */
  justifyContent?: CSSProperties['justifyContent']
  /** Shorthand for `align-items` + `justify-items`. */
  placeItems?: CSSProperties['placeItems']
  /** Shorthand for `align-content` + `justify-content`. */
  placeContent?: CSSProperties['placeContent']
  /** Grid auto-placement algorithm (`grid-auto-flow`). */
  flow?: CSSProperties['gridAutoFlow']
  /** Implicit row track sizing (`grid-auto-rows`). */
  autoRows?: CSSProperties['gridAutoRows']
  /** Implicit column track sizing (`grid-auto-columns`). */
  autoCols?: CSSProperties['gridAutoColumns']
  /** Render `display: inline-grid` instead of `display: grid`. */
  inline?: boolean
  /** Inherit parent grid tracks via CSS subgrid (`true` = `'columns'`). */
  subgrid?: SubgridAxis
  /** Optional local density multiplier override (`--hz-density` & `--density`). */
  density?: GridDensity
  /** Disable automatic `min-width: 0` flooring on direct children. */
  noFloor?: boolean
  children?: ReactNode
  ref?: Ref<HTMLElement>
}

const isGuiElement = (type: unknown): boolean =>
  (typeof type === 'function' || typeof type === 'object') &&
  type !== null &&
  'staticConfig' in type

/**
 * Floor each direct element child at `min-width: 0` so a single unbreakable
 * token (long hash, URL, `<pre>`) cannot push a track wider than its `1fr` share.
 */
const floorChild = (child: ReactNode): ReactNode => {
  if (!isValidElement(child) || child.type === Fragment || isGuiElement(child.type)) return child
  const el = child as ReactElement<{ style?: unknown }>
  const style = el.props.style
  if (Array.isArray(style)) return cloneElement(el, { style: [{ minWidth: 0 }, ...style] })
  if (style && typeof style === 'object' && 'minWidth' in style) return el
  return cloneElement(el, { style: { minWidth: 0, ...(style as CSSProperties) } })
}

export function Grid({
  as = 'div',
  cols,
  columns,
  rows,
  gap,
  rowGap,
  colGap,
  areas,
  align,
  justify,
  alignContent,
  justifyContent,
  placeItems,
  placeContent,
  flow,
  autoRows,
  autoCols,
  inline = false,
  subgrid,
  density,
  noFloor = false,
  style,
  children,
  ref,
  ...props
}: GridProps): ReactElement {
  const hasExplicitAxisGap = rowGap !== undefined || colGap !== undefined
  const resolvedGap =
    gap !== undefined
      ? resolveSpace(gap)
      : hasExplicitAxisGap
        ? undefined
        : resolveSpace('$3')
  const resolvedRowGap = rowGap !== undefined ? resolveSpace(rowGap) : undefined
  const resolvedColGap = colGap !== undefined ? resolveSpace(colGap) : undefined
  const trackGap = resolvedColGap ?? resolvedGap ?? '0px'

  const colSpec = cols ?? columns
  const useSubgridCols = subgrid === true || subgrid === 'columns' || subgrid === 'both'
  const useSubgridRows = subgrid === 'rows' || subgrid === 'both'

  const gridStyle: CSSStyleWithVars = {
    display: inline ? 'inline-grid' : 'grid',
    flexShrink: 1,
  }

  const responsiveAttrs: Record<string, string> = {}

  if (useSubgridCols) {
    gridStyle.gridTemplateColumns = 'subgrid'
  } else if (colSpec !== undefined && isResponsiveCols(colSpec)) {
    const baseTrack = colSpec.base !== undefined ? trackList(colSpec.base) : 'minmax(0, 1fr)'
    responsiveAttrs['data-hz-grid-responsive'] = ''
    gridStyle['--hz-grid-cols-base'] = baseTrack
    gridStyle.gridTemplateColumns = `var(--hz-grid-cols, ${baseTrack})`
    for (const bp of GRID_BREAKPOINTS) {
      const value = colSpec[bp]
      if (value !== undefined) {
        responsiveAttrs[`data-hz-grid-${bp}`] = ''
        gridStyle[`--hz-grid-cols-${bp}`] = trackList(value)
      }
    }
  } else if (colSpec !== undefined) {
    gridStyle.gridTemplateColumns = tracks(colSpec, trackGap)
  } else if (areas === undefined) {
    gridStyle.gridTemplateColumns = tracks({ min: 240 }, trackGap)
  }

  if (useSubgridRows) {
    gridStyle.gridTemplateRows = 'subgrid'
  } else if (rows !== undefined) {
    gridStyle.gridTemplateRows = trackList(rows)
  }

  if (resolvedGap !== undefined) gridStyle.gap = resolvedGap
  if (resolvedRowGap !== undefined) gridStyle.rowGap = resolvedRowGap
  if (resolvedColGap !== undefined) gridStyle.columnGap = resolvedColGap
  if (areas !== undefined) gridStyle.gridTemplateAreas = formatAreas(areas)
  if (align !== undefined) gridStyle.alignItems = align
  if (justify !== undefined) gridStyle.justifyItems = justify
  if (alignContent !== undefined) gridStyle.alignContent = alignContent
  if (justifyContent !== undefined) gridStyle.justifyContent = justifyContent
  if (placeItems !== undefined) gridStyle.placeItems = placeItems
  if (placeContent !== undefined) gridStyle.placeContent = placeContent
  if (flow !== undefined) gridStyle.gridAutoFlow = flow
  if (autoRows !== undefined) gridStyle.gridAutoRows = autoRows
  if (autoCols !== undefined) gridStyle.gridAutoColumns = autoCols

  if (density !== undefined) {
    const d = resolveDensity(density)
    gridStyle['--hz-density'] = d
    gridStyle['--density'] = d
  }

  return createElement(
    as,
    {
      'data-slot': 'grid',
      ...responsiveAttrs,
      ...props,
      ref,
      style: style ? { ...gridStyle, ...style } : gridStyle,
    },
    noFloor ? children : Children.map(children, floorChild),
  )
}
