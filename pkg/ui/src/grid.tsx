
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
 * WEB ONLY, which is why it sits at `@hanzo/ui/grid` rather than on the barrel,
 * beside `@hanzo/ui/dots`. That is a statement about this file and nothing else:
 * it renders a `div` and sets `display: grid`, and neither of those exists on
 * React Native — Yoga has grid data structures but no grid algorithm, so
 * `display: 'grid'` is not in the platform's style types at all.
 *
 * The quarantine is a pin, not a law, and the API is named so that lifting it
 * costs nothing: `columns` and `rows` are TRACK LISTS and `Cell` places and
 * spans, all of them CSS-grid concepts rather than facts about the div. When a
 * native grid engine lands, this file changes and call sites do not.
 *
 * Why a plain div and not a gui YStack: gui's box model is Yoga, which is
 * flexbox here — a YStack would compile its own `display:flex` atomic class and
 * fight the grid. Inline styles, not a stylesheet class, so there is no rule to
 * fail to ship: this package's own checker exists because "class with no rule"
 * has shipped here three times.
 *
 * The min-width floor every grid child needs is declared ONCE, as
 * `[data-slot='grid'] > *` in `styles/motion.css`. It is not restated inline
 * here: a grid item's `grid-column` only applies to a direct child of the grid,
 * so a `Cell` is always in range of that selector, and a second copy inline
 * would be a second place for the same invariant to be edited.
 */
import { getTokenValue } from '@hanzo/gui'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'

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

export interface GridProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The column tracks. A count, a list, a raw track list, or a `Fit`. */
  columns?: Tracks | Fit
  /** The row tracks. Rows size to content unless you say otherwise. */
  rows?: Tracks
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
const fitted = ({ min, max }: Fit, gap: number): string => {
  const floor = max
    ? `max(min(${min}px, 100%), calc((100% - ${(max - 1) * gap}px) / ${max}))`
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
export const tracks = (columns: Tracks | Fit, gap = 0): string =>
  fit(columns) ? fitted(columns, gap) : list(columns)

const Grid = ({ columns = { min: 240 }, rows, gap = '$3', style, ...props }: GridProps) => {
  const g = space(gap, 12)
  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: tracks(columns, g),
    gap: g,
  }
  if (rows !== undefined) grid.gridTemplateRows = list(rows)
  return <div data-slot="grid" style={{ ...grid, ...style }} {...props} />
}

export interface CellProps extends ComponentProps<'div'> {
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
  <div
    data-slot="grid-cell"
    style={{ gridColumn: place(col), gridRow: place(row), ...style }}
    {...props}
  />
)

export { Grid, Cell }
