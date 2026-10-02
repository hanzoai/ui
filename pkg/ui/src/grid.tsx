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
 * A gui View with `display="grid"` and the grid's own props, at `@hanzo/ui/grid`
 * beside `@hanzo/ui/dots`. `columns` and `rows` are TRACK LISTS and `Cell`
 * places and spans, all CSS-grid concepts rather than facts about the element,
 * so the same call lays out wherever gui's grid props reach.
 *
 * IT FLOORS ITS OWN CHILDREN. A grid item's initial `min-width` is `auto`, which
 * floors its box at the content's min-content width: one long unbroken string —
 * a hash, a URL, a wide <pre> — pushes the item past its track and over its
 * neighbour. Grid gives every element child `min-width: 0` itself — a gui child
 * has it from its own base, any other takes it as a style — so a host needs no
 * rule for it, and a child that states its own minimum keeps it.
 *
 * A LAYOUT BOX, NOT A TYPE SCOPE. A gui View carries the body font's family,
 * weight, tracking and leading; a grid of bare tags must read in whatever face
 * surrounds it, as the `div` this replaced did. So those four inherit, and it
 * shrinks in a flex row the way a `div` does.
 */
import { View } from '@hanzo/gui'
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'

type ViewProps = ComponentProps<typeof View>

/**
 * A track list, in the spellings a caller actually has. Every one of these is
 * `grid-template-columns` / `grid-template-rows`.
 *
 *   3                 three equal tracks
 *   ['2fr', '1fr']    one entry per track; a number is px
 *   'repeat(3, 1fr)'  a track list, as written
 */
export type Tracks = number | string | Array<number | string>

/**
 * The responsive column list, which is the one shape a plain track list cannot
 * say: "as many equal columns as fit, and no fewer than this wide". It is still
 * a track list — `repeat(auto-fill, minmax(…, 1fr))` — it just needs two numbers
 * to write itself, so it is a VALUE of `columns` rather than a second prop
 * beside it. Breakpoints do not appear anywhere in it.
 */
export interface Fit {
  /** Narrowest a column may get before the grid drops one. */
  min: number
  /**
   * Never exceed this many columns, while still wrapping down on narrow
   * screens. `{ min: 160, max: 4 }` is 2-up on a phone and 4-up on a desktop,
   * with nothing in between to configure.
   *
   * A single `min` cannot express that: 2-up at 390px needs min ~170, and that
   * same 170 gives SIX columns at 1280. Capping is the missing half.
   */
  max?: number
}

export interface GridProps extends Omit<ViewProps, 'children' | 'columns' | 'rows' | 'gap'> {
  /** The column tracks. A count, a list, a raw track list, or a `Fit`. */
  columns?: Tracks | Fit
  /** The row tracks. Rows size to content unless you say otherwise. */
  rows?: Tracks
  /** A `$n` space token or a raw px number. */
  gap?: number | string
  children?: ReactNode
}

/** `'$3'` -> 12. A raw number passes through as px. */
/**
 * A gap, as a CSS length.
 *
 * This asked `getTokenValue` for a number and fell back to 12 when it did not
 * get one. It never got one: measured across a consuming app, every `$n` gap
 * rendered at 12px — `gap="$4"` drew 12 where `--space-4` is 16, and thirty of
 * thirty-four call sites were silently wrong. The four that looked right were
 * the ones passing a bare number.
 *
 * The ladder those tokens name is already in the document as custom properties
 * and already correct, so this reads it there. That fixes the number and gains
 * the property the JS lookup could not have: `var(--space-4)` follows the
 * ladder while the page is open, so a person moving density in an appearance
 * panel moves every grid with it. A number resolved at render is fixed at
 * render.
 */
const space = (v: number | string | undefined, fallback: number): string =>
  v == null ? `${fallback}px`
  : typeof v === 'number' ? `${v}px`
  : v.startsWith('$') ? `var(--space-${v.slice(1)}, ${fallback}px)`
  : v

const fit = (v: unknown): v is Fit => typeof v === 'object' && v !== null && !Array.isArray(v)

/** One track. A bare number is px; anything else is already a track size. */
const track = (v: number | string): string => (typeof v === 'number' ? `${v}px` : v)

/**
 * A track list from any of its spellings.
 *
 * A count becomes `minmax(0, 1fr)` and not `1fr`, because `1fr` alone means
 * `minmax(auto, 1fr)`, and `auto` floors the track at the content's min-content
 * width — so one long unbroken string pushes its own column wider and every
 * sibling narrower. That IS the ragged row this component exists to prevent.
 * A raw string is the caller's track list, as written.
 */
const list = (t: Tracks): string => {
  if (typeof t === 'number') return `repeat(${t}, minmax(0, 1fr))`
  if (Array.isArray(t)) return t.map(track).join(' ')
  return t
}

/**
 * The responsive list. `min(Npx, 100%)` is what makes it safe below N: a bare
 * `minmax(240px, 1fr)` forces a 240px track inside a 200px phone and overflows
 * the viewport horizontally.
 *
 * With `max` the floor also has to be at least "one Mth of the row", so
 * auto-fill can never fit an (M+1)th track: subtract the M-1 gaps first, then
 * divide. Below that width the max() picks Npx again and the grid wraps
 * normally — so the cap costs nothing on small screens, which is the whole point
 * of expressing it as a floor rather than a breakpoint.
 */
const fitted = ({ min, max }: Fit, gap: string): string => {
  const floor = max
    ? `max(min(${min}px, 100%), calc((100% - ${max - 1} * ${gap}) / ${max}))`
    : `min(${min}px, 100%)`
  return `repeat(auto-fill, minmax(${floor}, 1fr))`
}

/**
 * Any spelling of `columns` to the one track list it means. Exported because it
 * IS the component's decision, and because the invariants inside it
 * (`minmax(0, 1fr)` over a bare `1fr`, `min(Npx, 100%)` over a bare `Npx`) are
 * the whole reason this component exists and are each one edit away from being
 * tidied back into the ragged row.
 */
export const tracks = (columns: Tracks | Fit, gap = '0px'): string =>
  fit(columns) ? fitted(columns, gap) : list(columns)

/** The four type properties a gui View sets and a layout box must not. */
const TYPE: CSSProperties = {
  fontFamily: 'inherit',
  fontWeight: 'inherit',
  letterSpacing: 'inherit',
  lineHeight: 'inherit',
}

/** A gui component: its box already floors at `min-width: 0` unless it says otherwise. */
const gui = (type: unknown): boolean =>
  (typeof type === 'function' || typeof type === 'object') && type !== null && 'staticConfig' in type

/**
 * One child with its min-width floor. A gui child has it already and a child
 * that names its own minimum keeps it; a fragment is left alone, since it has
 * no box to floor.
 */
const floor = (child: ReactNode): ReactNode => {
  if (!isValidElement(child) || child.type === Fragment || gui(child.type)) return child
  const el = child as ReactElement<{ style?: unknown }>
  const style = el.props.style
  if (Array.isArray(style)) return cloneElement(el, { style: [{ minWidth: 0 }, ...style] })
  if (style && typeof style === 'object' && 'minWidth' in style) return el
  return cloneElement(el, { style: { minWidth: 0, ...(style as object) } })
}

const Grid = ({ columns = { min: 240 }, rows, gap = '$3', style, children, ...props }: GridProps) => {
  const g = space(gap, 12)
  return (
    <View
      data-slot="grid"
      display="grid"
      gridTemplateColumns={tracks(columns, g) as never}
      {...(rows !== undefined ? { gridTemplateRows: list(rows) as never } : null)}
      gap={g as never}
      shrink={1}
      minW={'auto' as never}
      minH={'auto' as never}
      style={{ ...TYPE, ...(style as object) }}
      {...props}
    >
      {Children.map(children, floor)}
    </View>
  )
}

export interface CellProps extends Omit<ViewProps, 'col' | 'row'> {
  /**
   * Where this cell sits across the columns, as `grid-column`. A NUMBER spans
   * that many tracks (`span 2`); a string places it (`'1 / 3'`, `'2 / -1'`).
   * One name per axis, because CSS already has one.
   */
  col?: number | string
  /** The same, down the rows, as `grid-row`. */
  row?: number | string
}

/** A cell only exists to span or to place; a plain child needs neither. */
const place = (v: number | string | undefined): string | undefined =>
  v === undefined ? undefined : typeof v === 'number' ? `span ${v}` : v

const Cell = ({ col, row, style, ...props }: CellProps) => (
  <View
    data-slot="grid-cell"
    {...(col !== undefined ? { gridColumn: place(col) as never } : null)}
    {...(row !== undefined ? { gridRow: place(row) as never } : null)}
    minW={0}
    shrink={1}
    style={{ ...TYPE, ...(style as object) }}
    {...props}
  />
)

export { Grid, Cell }
