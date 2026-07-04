/**
 * Overview tile logic — the PURE decisions behind every tile, so the honest
 * empty/loading/error/reduced-motion behavior is unit-testable in the node env and
 * the `.tsx` tiles stay thin.
 *
 * Every function here answers ONE question a tile needs: how to format a value for
 * its unit, whether a live sparkline has enough real points to draw, what a delta
 * reads (or the honest "—" when there's no basis), what color a status/health dot
 * is, and — critically — how to SELECT a tile's slice out of `OverviewData` so a
 * missing slice becomes an honest empty tile instead of a crash.
 *
 * Nothing here fabricates data: a formatter turns a real number into a string, a
 * selector returns `undefined`/`[]` for absent data, and the sparkline gate returns
 * false for <2 points (the tile then renders no trend).
 */
import type {
  MetricUnit,
  OverviewData,
  OverviewKpi,
  OverviewSlice,
  OverviewEvent,
  OverviewHealth,
  OverviewSeries,
} from './config'

// ── value formatting ─────────────────────────────────────────────────────────

const compact = (n: number): string =>
  new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

const usd = (cents: number): string => {
  const d = cents / 100
  if (Math.abs(d) >= 1000) return '$' + new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(d)
  return '$' + d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const duration = (ms: number): string => {
  if (ms >= 1000) return (ms / 1000).toFixed(ms >= 10_000 ? 0 : 1) + 's'
  return Math.round(ms) + 'ms'
}

/** Format a raw metric value for its unit. The ONE place units become strings. */
export function formatMetric(value: number, unit: MetricUnit = 'count'): string {
  if (!Number.isFinite(value)) return '—'
  switch (unit) {
    case 'cents':
      return usd(value)
    case 'ms':
      return duration(value)
    case 'pct':
      return `${Math.round(value)}%`
    default:
      return compact(value)
  }
}

/**
 * The number the count-up animation should target for a unit. Money counts up in
 * DOLLARS (not cents) so the animated digits read naturally; everything else counts
 * up in its own value. The tile formats the interpolated number back via
 * `formatMetric` on the same unit. This returns the raw value; the divisor is in
 * `formatMetric`.
 */
export function metricTarget(value: number): number {
  return Number.isFinite(value) ? value : 0
}

/** A delta descriptor for a KPI, or null when there's no prior basis (honest "—"). */
export function deltaOf(kpi: OverviewKpi | undefined): { pct: number; up: boolean } | null {
  if (!kpi || kpi.prior === undefined || !Number.isFinite(kpi.prior) || kpi.prior === 0) return null
  const pct = Math.round(((kpi.value - kpi.prior) / kpi.prior) * 100)
  return { pct, up: pct >= 0 }
}

/** True when a live sparkline has ≥2 finite points to draw (else the tile shows no trend). */
export function hasTrend(series: readonly number[] | undefined): boolean {
  if (!series) return false
  return series.filter((v) => Number.isFinite(v)).length >= 2
}

// ── status / health colors (the ONE mapping) ─────────────────────────────────

export const OK = '#23c562'
export const WARN = '#f0a868'
export const BAD = '#ff5d8f'
export const MUTED = '#64748b'

/** Dot color for an activity/event status. */
export function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'error' || s === 'failed' || s === 'fail') return BAD
  if (s === 'warn' || s === 'warning' || s === 'pending') return WARN
  return OK // success or unknown/'' reads as nominal
}

/** Dot color for a service-health verdict. */
export function healthColor(health: string): string {
  const h = health.toLowerCase()
  if (h === 'green' || h === 'healthy' || h === 'ok') return OK
  if (h === 'yellow' || h === 'degraded' || h === 'warn') return WARN
  if (h === 'red' || h === 'down' || h === 'unhealthy') return BAD
  return MUTED
}

/** Dot color for an alert severity. */
export function severityColor(severity: string): string {
  const s = severity.toLowerCase()
  if (s === 'critical' || s === 'error') return BAD
  if (s === 'warning' || s === 'warn') return WARN
  return MUTED
}

// ── overall health verdict for the board header ──────────────────────────────

/** The worst verdict across health rows: red > yellow > green; '' when no rows. */
export function worstHealth(rows: readonly OverviewHealth[]): '' | 'green' | 'yellow' | 'red' {
  let sawYellow = false
  let sawGreen = false
  for (const r of rows) {
    const h = r.health.toLowerCase()
    if (h === 'red' || h === 'down' || h === 'unhealthy') return 'red' // worst — short-circuit
    if (h === 'yellow' || h === 'degraded') sawYellow = true
    else if (h === 'green' || h === 'healthy' || h === 'ok') sawGreen = true
  }
  if (sawYellow) return 'yellow'
  if (sawGreen) return 'green'
  return ''
}

/** Count healthy rows / total (for the "12/14 healthy" header). */
export function healthTally(rows: readonly OverviewHealth[]): { healthy: number; total: number } {
  const total = rows.length
  const healthy = rows.filter((r) => healthColor(r.health) === OK).length
  return { healthy, total }
}

// ── slice selectors (a missing slice → honest empty, never a crash) ──────────

export const selectKpi = (data: OverviewData, key: string): OverviewKpi | undefined => data.kpi[key]
export const selectSeries = (data: OverviewData, key: string): OverviewSeries | undefined => data.series[key]
export const selectDistribution = (data: OverviewData, key: string): OverviewSlice[] => data.distribution[key] ?? []

/** Sum a distribution's positive values (the donut center total). */
export function distributionTotal(slices: readonly OverviewSlice[]): number {
  return slices.reduce((sum, s) => sum + Math.max(0, s.value), 0)
}

/**
 * Merge freshly-polled activity into the current list, newest-first, de-duped by
 * id, capped. This is what lets the live stream GROW smoothly across polls without
 * duplicating a row already on screen or re-ordering the feed. Rows with an empty
 * id are kept (can't dedupe them) but still ordered by time.
 */
export function mergeActivity(current: readonly OverviewEvent[], incoming: readonly OverviewEvent[], cap: number): OverviewEvent[] {
  const seen = new Set<string>()
  const out: OverviewEvent[] = []
  for (const e of [...incoming, ...current]) {
    if (e.id && seen.has(e.id)) continue
    if (e.id) seen.add(e.id)
    out.push(e)
  }
  out.sort((a, b) => tOf(b.time) - tOf(a.time))
  return out.slice(0, cap)
}

const tOf = (iso: string): number => {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

/** Which rows of a virtualized list are visible for a scroll offset + viewport. */
export function windowRows<T>(rows: readonly T[], scrollTop: number, rowH: number, viewportH: number, overscan = 4): { start: number; end: number; padTop: number; padBottom: number; slice: T[] } {
  if (rows.length === 0 || rowH <= 0) return { start: 0, end: 0, padTop: 0, padBottom: 0, slice: [] }
  const start = Math.max(0, Math.floor(scrollTop / rowH) - overscan)
  const visible = Math.ceil(viewportH / rowH) + overscan * 2
  const end = Math.min(rows.length, start + visible)
  return {
    start,
    end,
    padTop: start * rowH,
    padBottom: Math.max(0, (rows.length - end) * rowH),
    slice: rows.slice(start, end),
  }
}

// ── async state (the repo idiom, shared by the driver + tests) ───────────────

export type Loadable<T> = { s: 'loading' } | { s: 'error'; message: string; status: number } | { s: 'ready'; v: T }

/** True when a tile should render its SKELETON (first load, no data yet). */
export const isSkeleton = <T>(state: Loadable<T>): boolean => state.s === 'loading'

/** Relative-time label for an event/activity timestamp (honest for a bad stamp). */
export function ago(iso: string, now: number): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return '—'
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}
