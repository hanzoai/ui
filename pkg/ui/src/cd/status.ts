/**
 * CD status → colour, tone, label, priority — the ONE semantic mapping, pure and
 * unit-tested. Everything visual reads from here so a health/sync verdict looks
 * identical in a pill, a tree node's accent, a mini-bar, and the minimap.
 *
 * The hues keep the GitOps meaning (green = healthy/synced, amber = out-of-sync /
 * missing, red = degraded, blue = progressing, purple = suspended, grey =
 * unknown) but are re-tuned for a dark-first surface so they stay legible on
 * near-black without the washed-out look of the light-theme originals.
 */
import type { HealthStatus, OperationPhase, PodPhase, SyncStatus } from './types'

/** A coarse tone bucket, shared with the rest of @hanzo/ui's tag vocabulary. */
export type StatusTone = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'neutral'

/** The concrete swatch a status renders in: dot/text hue + a soft chip fill. */
export interface StatusColor {
  /** The saturated hue — the dot, the accent bar, the pill text. */
  hue: string
  tone: StatusTone
}

// Dark-tuned semantic hues. Bright enough to read as the pill's own text on a
// near-black surface; the soft chip fill is derived from these at low alpha.
const HUES: Record<StatusTone, string> = {
  green: '#22c55e',
  yellow: '#f5b544',
  red: '#f4636e',
  blue: '#38a0f5',
  purple: '#a684f5',
  neutral: '#8b96a5',
}

const HEALTH_TONE: Record<HealthStatus, StatusTone> = {
  Healthy: 'green',
  Progressing: 'blue',
  Degraded: 'red',
  Suspended: 'purple',
  Missing: 'yellow',
  Unknown: 'neutral',
}

const SYNC_TONE: Record<SyncStatus, StatusTone> = {
  Synced: 'green',
  OutOfSync: 'yellow',
  Unknown: 'neutral',
}

const OPERATION_TONE: Record<OperationPhase, StatusTone> = {
  Succeeded: 'green',
  Running: 'blue',
  Pending: 'blue',
  Terminating: 'red',
  Failed: 'red',
  Error: 'red',
}

const POD_TONE: Record<PodPhase, StatusTone> = {
  Running: 'green',
  Succeeded: 'green',
  Pending: 'blue',
  Failed: 'red',
  Unknown: 'neutral',
}

/**
 * Worst-first ordering (lower = worse), so a rollup surfaces the most broken
 * verdict and a sort puts problems on top — matching the GitOps engine's own
 * health precedence.
 */
export const HEALTH_PRIORITY: Record<HealthStatus, number> = {
  Missing: 0,
  Degraded: 1,
  Unknown: 2,
  Progressing: 3,
  Suspended: 4,
  Healthy: 5,
}

export const SYNC_PRIORITY: Record<SyncStatus, number> = {
  OutOfSync: 0,
  Unknown: 1,
  Synced: 2,
}

const HEALTH_SET = new Set<string>(Object.keys(HEALTH_TONE))
const SYNC_SET = new Set<string>(Object.keys(SYNC_TONE))

/** Coerce a free-form backend string into a known health code (fails to Unknown). */
export function normalizeHealth(s?: string): HealthStatus {
  return s && HEALTH_SET.has(s) ? (s as HealthStatus) : 'Unknown'
}

/** Coerce a free-form backend string into a known sync code (fails to Unknown). */
export function normalizeSync(s?: string): SyncStatus {
  return s && SYNC_SET.has(s) ? (s as SyncStatus) : 'Unknown'
}

export function healthColor(status: HealthStatus): StatusColor {
  const tone = HEALTH_TONE[status] ?? 'neutral'
  return { hue: HUES[tone], tone }
}

export function syncColor(status: SyncStatus): StatusColor {
  const tone = SYNC_TONE[status] ?? 'neutral'
  return { hue: HUES[tone], tone }
}

export function operationColor(phase: OperationPhase): StatusColor {
  const tone = OPERATION_TONE[phase] ?? 'neutral'
  return { hue: HUES[tone], tone }
}

export function podColor(phase: PodPhase): StatusColor {
  const tone = POD_TONE[phase] ?? 'neutral'
  return { hue: HUES[tone], tone }
}

/** The saturated hue for a tone (for callers that already have a tone). */
export function toneHue(tone: StatusTone): string {
  return HUES[tone]
}

/**
 * Roll a set of resource healths up to the single verdict that best describes
 * the whole — the worst one present. Empty ⇒ `Unknown` (honest, never `Healthy`).
 */
export function worstHealth(statuses: HealthStatus[]): HealthStatus {
  if (statuses.length === 0) return 'Unknown'
  return statuses.reduce((worst, s) =>
    HEALTH_PRIORITY[s] < HEALTH_PRIORITY[worst] ? s : worst
  )
}

/** Roll a set of sync verdicts up to one — OutOfSync wins, then Unknown. */
export function worstSync(statuses: SyncStatus[]): SyncStatus {
  if (statuses.length === 0) return 'Unknown'
  return statuses.reduce((worst, s) =>
    SYNC_PRIORITY[s] < SYNC_PRIORITY[worst] ? s : worst
  )
}

/**
 * Parse a `#rgb`/`#rrggbb` hue into an `rgba()` at the given alpha — for the
 * soft chip fills and translucent accents. Non-hex input passes through (so a
 * caller may hand a hue that's already `rgba(...)`).
 */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex)
  if (!m) return hex
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const a = Math.max(0, Math.min(1, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
