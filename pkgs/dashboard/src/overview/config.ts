/**
 * Overview config — the DECLARATIVE contract that makes one overview
 * component serve every product. A product declares WHICH tiles it has and WHERE
 * their data comes from; `Overview` renders + animates them. No product
 * writes overview UI — it writes a `OverviewConfig`.
 *
 * Orthogonal by design:
 *   - a `LoadOverview` is the ONE async that fetches a product's REAL data and
 *     returns a normalized `OverviewData` (KPIs, series, distribution, activity,
 *     alerts, health). It owns the endpoint; the tiles know nothing about it.
 *   - each tile is a small value object naming a slice of that data by key
 *     (`kpi.tokens`, `series.spend`, …). A missing slice renders its honest empty
 *     state — the config can over-declare tiles a slow backend hasn't filled yet.
 *   - `live` is the videogame layer: a poll interval (throttled, hidden-tab-paused)
 *     and whether numbers count up. Off → a static overview, same component.
 *
 * The consumer supplies its own adapter that maps each real source (usage ledger,
 * admin aggregate, functions metrics, …) onto `OverviewData`, so wiring a product =
 * one adapter + one config, never new UI.
 */
import type { IconComponent } from '../types'

/** A KPI datum for an animated metric tile. Raw numbers; the tile formats them. */
export type OverviewKpi = {
  value: number
  /** Prior-period value for the ±% delta; omit when there is no basis (→ honest "—"). */
  prior?: number
  /** A recent dense series for the tile's live sparkline (oldest→newest). */
  series?: number[]
}

/** A point on a temporal series. */
export type OverviewPoint = { t: string; value: number }

/** A named temporal series with its bucket interval (drives the x-axis labels). */
export type OverviewSeries = { interval: 'hour' | 'day' | (string & {}); points: OverviewPoint[] }

/** A slice of a distribution (spend by model, revenue by product). */
export type OverviewSlice = { label: string; value: number; sub?: string }

/** A live activity/event row. */
export type OverviewEvent = {
  id: string
  time: string
  title: string
  subtitle?: string
  /** `success` | `error` | `warn` | '' — drives the status dot. */
  status: string
}

/** An open alert. */
export type OverviewAlert = { id: string; severity: 'critical' | 'warning' | 'info' | (string & {}); title: string; detail?: string }

/** A service-health row. */
export type OverviewHealth = { service: string; health: 'green' | 'yellow' | 'red' | (string & {}); detail?: string }

/**
 * The normalized data every tile reads. Keyed maps so a tile names its slice by a
 * stable key; every map may be partial (a slice with no data → honest empty tile).
 */
export type OverviewData = {
  kpi: Record<string, OverviewKpi>
  series: Record<string, OverviewSeries>
  distribution: Record<string, OverviewSlice[]>
  activity: OverviewEvent[]
  alerts: OverviewAlert[]
  health: OverviewHealth[]
  /** Total count behind `activity` for pagination, when the source knows it. */
  activityTotal?: number
}

/** How a number is displayed. `cents`→USD, `count`→compacted, `ms`→duration, `pct`→percent. */
export type MetricUnit = 'count' | 'cents' | 'ms' | 'pct'

/** An animated KPI tile: a count-up number + optional live sparkline + delta. */
export type MetricTile = {
  tile: 'metric'
  /** Key into `OverviewData.kpi`. */
  key: string
  label: string
  icon: IconComponent
  unit?: MetricUnit
  /** Static caption under the value (e.g. "across 3 providers"). */
  caption?: string
  /** Accent color for the sparkline (defaults to the palette by position). */
  color?: string
}

/** A timeseries panel (line or bars) over `OverviewData.series[key]`. */
export type TimeseriesTile = {
  tile: 'timeseries'
  key: string
  title: string
  kind?: 'line' | 'bar'
  unit?: MetricUnit
}

/** A distribution panel (donut + legend) over `OverviewData.distribution[key]`. */
export type DistributionTile = {
  tile: 'distribution'
  key: string
  title: string
  /** Center caption under the total. */
  centerLabel?: string
  unit?: MetricUnit
}

/** The live activity stream (virtualized, streaming/polled). */
export type ActivityTile = {
  tile: 'activity'
  title?: string
  /** Empty-state copy when there is no activity in range. */
  empty?: string
}

/** The open-alerts panel. */
export type AlertsTile = { tile: 'alerts'; title?: string }

/** The service-health board. */
export type HealthTile = { tile: 'health'; title?: string; empty?: string }

/** Any tile. Discriminated on `tile` so the renderer branches exhaustively. */
export type OverviewTile =
  | MetricTile
  | TimeseriesTile
  | DistributionTile
  | ActivityTile
  | AlertsTile
  | HealthTile

/** The "videogame" layer — live updates + motion, all off-able for a static view. */
export type LiveConfig = {
  /**
   * Poll the loader every `pollMs` (throttled to a floor, paused when the tab is
   * hidden). 0/undefined → no polling (a one-shot static overview).
   */
  pollMs?: number
  /** Count numbers up on change (respects prefers-reduced-motion). Default true. */
  countUp?: boolean
}

/** The context passed to a loader (range + org scope). */
export type OverviewContext = {
  range: OverviewRange
  /** Global-admin all-orgs god view. */
  allOrgs?: boolean
  /**
   * True when the viewer is a global (cross-tenant) admin. Loaders use this to
   * SKIP admin-only aggregates that a tenant user's browser would only ever get a
   * 403 from, going straight to the org-scoped source instead — the board renders
   * the same, minus the console noise.
   */
  isGlobalAdmin?: boolean
}

export type OverviewRange = '24h' | '7d' | '30d'

/** The ONE async that fetches a product's REAL data, normalized to `OverviewData`. */
export type LoadOverview = (ctx: OverviewContext) => Promise<OverviewData>

/**
 * A product's complete overview — its header, its tiles (in render order), its
 * real data loader, and its live/motion settings. This IS the reusable unit: a
 * consumer builds one of these; `Overview` renders it.
 */
export type OverviewConfig = {
  id: string
  title: string
  subtitle?: string
  /** Ordered rows of tiles (each row is a responsive wrap group). */
  rows: OverviewTile[][]
  load: LoadOverview
  live?: LiveConfig
  /** Show the range selector (24H/7D/30D). Default true. */
  ranged?: boolean
}
