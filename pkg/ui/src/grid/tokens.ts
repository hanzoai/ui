/**
 * Pure CSS Grid track, spacing, area, and responsive token helpers for
 * `@hanzo/ui/grid`.
 *
 * Zero React, zero DOM APIs, zero runtime dependencies — safe in SSR, RSC,
 * Node, browsers, and tree-shakeable bundlers.
 */

/**
 * `@hanzo/design` 4px / 0.25rem spacing ladder (`tokens/spacing.css`).
 * Each rung scales live with `--density` / `--hz-density`.
 */
export const SPACE_SCALE = {
  '0': '0px',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '32': '8rem',
} as const

export type SpaceStep = keyof typeof SPACE_SCALE

/** Named grid gap tokens backed by `@hanzo/design` `--space-*` & `--grid-gap*`. */
export type NamedGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'tight' | 'default' | 'loose'

/** Any spacing value accepted by `gap`, `rowGap`, or `colGap`. */
export type GapToken = NamedGap | `$${SpaceStep}` | number | (string & {})

/** Density multiplier shorthand matching `@hanzo/theme` & `@hanzo/design`. */
export type GridDensity = 'compact' | 'comfortable' | 'spacious' | number

const DENSITY_MAP: Readonly<Record<'compact' | 'comfortable' | 'spacious', number>> = {
  compact: 0.85,
  comfortable: 1,
  spacious: 1.15,
}

const densityCalc = (rem: string): string =>
  `calc(${rem} * var(--hz-density, var(--density, 1)))`

const NAMED_GAPS: Readonly<Record<NamedGap, string>> = {
  none: '0px',
  xs: `var(--space-1, ${densityCalc(SPACE_SCALE['1'])})`,
  sm: `var(--space-2, ${densityCalc(SPACE_SCALE['2'])})`,
  md: `var(--space-4, ${densityCalc(SPACE_SCALE['4'])})`,
  lg: `var(--space-6, ${densityCalc(SPACE_SCALE['6'])})`,
  xl: `var(--space-8, ${densityCalc(SPACE_SCALE['8'])})`,
  tight: `var(--grid-gap-tight, var(--space-4, ${densityCalc(SPACE_SCALE['4'])}))`,
  default: `var(--grid-gap, var(--space-6, ${densityCalc(SPACE_SCALE['6'])}))`,
  loose: `var(--grid-gap-loose, var(--space-8, ${densityCalc(SPACE_SCALE['8'])}))`,
}

/**
 * Resolve a spacing value into a CSS length or custom-property expression.
 *
 * - `'$4'` -> `var(--space-4, calc(1rem * var(--hz-density, var(--density, 1))))`
 * - `'md'` -> `var(--space-4, calc(1rem * var(--hz-density, var(--density, 1))))`
 * - `16`   -> `'16px'`
 * - `'1.5rem'` -> `'1.5rem'`
 *
 * Reading `@hanzo/design`'s `--space-*` and falling back to a `--hz-density` /
 * `--density`-scaled `calc()` guarantees live density updates whether the host
 * loads `@hanzo/design`, `@hanzo/theme`, both, or neither.
 */
export function resolveSpace(
  value: GapToken | undefined,
  fallback = `var(--space-3, ${densityCalc(SPACE_SCALE['3'])})`,
): string {
  if (value === undefined) return fallback
  if (typeof value === 'number') return value === 0 ? '0px' : `${value}px`
  if (value in NAMED_GAPS) return NAMED_GAPS[value as NamedGap]
  if (value.startsWith('$')) {
    const key = value.slice(1)
    if (key === '0') return '0px'
    if (key in SPACE_SCALE) {
      const rem = SPACE_SCALE[key as SpaceStep]
      return `var(--space-${key}, ${densityCalc(rem)})`
    }
    return `var(--space-${key}, ${fallback})`
  }
  return value
}

/** Resolve a density prop into a numeric string for `--hz-density` / `--density`. */
export function resolveDensity(density: GridDensity): string {
  if (typeof density === 'number') return String(density)
  return String(DENSITY_MAP[density])
}

/**
 * A CSS Grid track list in any ergonomic spelling:
 * - `3`               -> `repeat(3, minmax(0, 1fr))`
 * - `['2fr', 240]`    -> `2fr 240px`
 * - `'repeat(3, 1fr)'` -> passed through verbatim
 */
export type Tracks = number | string | ReadonlyArray<number | string>

/**
 * Responsive intrinsic track specification ("as many equal columns as fit,
 * never narrower than `min`, optionally capped at `max` columns").
 */
export interface Fit {
  /** Narrowest a column may get before the grid wraps (number = px). */
  min: number | string
  /** Optional upper cap on column count without media queries. */
  max?: number
  /** Track repetition mode. Defaults to `'auto-fill'` in `tracks()`, `'auto-fit'` in `AutoGrid`. */
  mode?: 'auto-fill' | 'auto-fit'
}

/**
 * Breakpoint-keyed responsive columns matching `@hanzo/design` `tokens/grid.css`:
 * `sm` (40rem), `md` (48rem), `lg` (64rem), `xl` (80rem), `2xl` (96rem).
 */
export interface ResponsiveCols {
  base?: Tracks
  sm?: Tracks
  md?: Tracks
  lg?: Tracks
  xl?: Tracks
  '2xl'?: Tracks
}

export const GRID_BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'] as const
export type GridBreakpoint = (typeof GRID_BREAKPOINTS)[number]

/** One track size: bare numbers are px, strings pass through verbatim. */
export const track = (v: number | string): string => (typeof v === 'number' ? `${v}px` : v)

export const isFit = (v: unknown): v is Fit =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && 'min' in v

export const isResponsiveCols = (v: unknown): v is ResponsiveCols =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && !('min' in v)

/**
 * Compile a `Tracks` value into a CSS `grid-template-columns` / `-rows` list.
 *
 * A bare count becomes `repeat(N, minmax(0, 1fr))` — never bare `1fr` — because
 * `1fr` implies `minmax(auto, 1fr)` which lets a long unbroken string widen its
 * own column and squeeze siblings.
 */
export function trackList(t: Tracks): string {
  if (typeof t === 'number') return `repeat(${t}, minmax(0, 1fr))`
  if (Array.isArray(t)) return t.map(track).join(' ')
  return t as string
}

/**
 * Compile a `Fit` specification into an intrinsic CSS Grid track list.
 *
 * Uses `min(<min>, 100%)` so a column floor wider than a narrow viewport never
 * causes horizontal overflow. When `max` is set, floors each track at
 * `calc((100% - (max - 1) * gap) / max)` so `auto-fill` / `auto-fit` can never
 * place a `(max + 1)`th column.
 */
export function fitTracks({ min, max, mode = 'auto-fill' }: Fit, gap = '0px'): string {
  const minCss = track(min)
  const floor = max
    ? `max(min(${minCss}, 100%), calc((100% - ${max - 1} * ${gap}) / ${max}))`
    : `min(${minCss}, 100%)`
  return `repeat(${mode}, minmax(${floor}, 1fr))`
}

/**
 * Compile any `Tracks | Fit` value into a CSS track list.
 * Preserved as the canonical helper exported by `@hanzo/ui/grid`.
 */
export function tracks(columns: Tracks | Fit, gap = '0px'): string {
  return isFit(columns) ? fitTracks(columns, gap) : trackList(columns)
}

/**
 * Compile `AutoGrid` column tracks:
 * `repeat(auto-fit, minmax(min(100%, <minWidth>), 1fr))`
 * (or capped when `maxCols` is provided). Zero JS resize observers.
 */
export function autoGridTracks(
  minWidth: number | string = 'var(--grid-card-min, 18rem)',
  {
    maxCols,
    gap = '0px',
    mode = 'auto-fit',
  }: { maxCols?: number; gap?: string; mode?: 'auto-fit' | 'auto-fill' } = {},
): string {
  const minCss = track(minWidth)
  const floor = maxCols
    ? `max(min(100%, ${minCss}), calc((100% - ${maxCols - 1} * ${gap}) / ${maxCols}))`
    : `min(100%, ${minCss})`
  return `repeat(${mode}, minmax(${floor}, 1fr))`
}

/** Named proportional split ratios for `SplitGrid`. */
export type SplitRatio = '1:1' | '1:2' | '2:1' | '1:3' | '3:1' | '2:3' | '3:2' | 'golden'

const SPLIT_RATIOS: Readonly<Record<SplitRatio, string>> = {
  '1:1': 'minmax(0, 1fr) minmax(0, 1fr)',
  '1:2': 'minmax(0, 1fr) minmax(0, 2fr)',
  '2:1': 'minmax(0, 2fr) minmax(0, 1fr)',
  '1:3': 'minmax(0, 1fr) minmax(0, 3fr)',
  '3:1': 'minmax(0, 3fr) minmax(0, 1fr)',
  '2:3': 'minmax(0, 2fr) minmax(0, 3fr)',
  '3:2': 'minmax(0, 3fr) minmax(0, 2fr)',
  golden: 'minmax(0, 38.2%) minmax(0, 61.8%)',
}

export interface SplitTracksOptions {
  /** Sidebar/aside track width: number (px), `[min, max]` tuple, or raw CSS track. */
  sidebar?: number | string | readonly [number | string, number | string]
  /** Minimum width for the primary/main track (default `0` -> `minmax(0, 1fr)`). */
  minMain?: number | string
  /** Which side holds the sidebar track (`'left'` or `'right'`). Default `'left'`. */
  side?: 'left' | 'right'
  /** Proportional ratio preset (overrides `sidebar`/`minMain` when provided). */
  ratio?: SplitRatio
}

/**
 * Compile `SplitGrid` tracks using native CSS `minmax()` for master/detail and
 * sidebar/main layouts.
 */
export function splitTracks({
  sidebar = 'minmax(min(100%, 220px), 280px)',
  minMain,
  side = 'left',
  ratio,
}: SplitTracksOptions = {}): string {
  if (ratio) return SPLIT_RATIOS[ratio]

  let sidebarTrack: string
  if (Array.isArray(sidebar)) {
    const [lo, hi] = sidebar as readonly [number | string, number | string]
    sidebarTrack = `minmax(min(100%, ${track(lo)}), ${track(hi)})`
  } else if (typeof sidebar === 'number') {
    const px = `${sidebar}px`
    sidebarTrack = `minmax(min(100%, ${px}), ${px})`
  } else {
    sidebarTrack = sidebar as string
  }

  const mainTrack =
    minMain !== undefined
      ? `minmax(min(100%, ${track(minMain)}), 1fr)`
      : 'minmax(0, 1fr)'

  return side === 'right' ? `${mainTrack} ${sidebarTrack}` : `${sidebarTrack} ${mainTrack}`
}

/** Format `areas` prop (array of row strings or raw CSS string) into `grid-template-areas`. */
export function formatAreas(areas: string | readonly string[]): string {
  if (typeof areas === 'string') return areas
  return areas
    .map((row) => {
      const trimmed = row.trim()
      return trimmed.startsWith('"') || trimmed.startsWith("'") ? trimmed : `"${trimmed}"`
    })
    .join(' ')
}

/** Format a column/row span or placement (`2` -> `'span 2'`, `'full'` -> `'1 / -1'`). */
export function formatSpan(v: number | string | 'full' | undefined): string | undefined {
  if (v === undefined) return undefined
  if (v === 'full') return '1 / -1'
  return typeof v === 'number' ? `span ${v}` : v
}
