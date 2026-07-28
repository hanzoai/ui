/**
 * Pure health logic — the one place a free-form health string is folded into the
 * `HealthStatus` vocabulary, plus the default status palette (Argo CD hues) and
 * the sort priority. No React, no DOM — unit-tested in isolation.
 */
import { withAlpha } from '@hanzo/canvas/pure'

import type { HealthStatus, StatusPalette } from './types'

/** Argo CD's health hues (shared/components/colors.ts). */
const HUE: Record<HealthStatus, string> = {
  Healthy: '#18BE94',
  Progressing: '#0DADEA',
  Degraded: '#E96D76',
  Suspended: '#766f94',
  Missing: '#f4c030',
  Unknown: '#CCD6DD',
}

const CANONICAL: Record<string, HealthStatus> = {
  healthy: 'Healthy',
  progressing: 'Progressing',
  degraded: 'Degraded',
  suspended: 'Suspended',
  missing: 'Missing',
  unknown: 'Unknown',
}

// Common synonyms a non-Argo backend might report, folded to the canonical set.
const SYNONYM: Record<string, HealthStatus> = {
  ok: 'Healthy',
  ready: 'Healthy',
  running: 'Healthy',
  available: 'Healthy',
  succeeded: 'Healthy',
  live: 'Healthy',
  green: 'Healthy',
  updating: 'Progressing',
  provisioning: 'Progressing',
  pending: 'Progressing',
  creating: 'Progressing',
  yellow: 'Progressing',
  error: 'Degraded',
  errored: 'Degraded',
  failed: 'Degraded',
  failure: 'Degraded',
  down: 'Degraded',
  unhealthy: 'Degraded',
  red: 'Degraded',
  paused: 'Suspended',
  stopped: 'Suspended',
  suspend: 'Suspended',
  notfound: 'Missing',
  absent: 'Missing',
}

/**
 * Fold any health/status string to a `HealthStatus`. Canonical (case-insensitive)
 * match first, then a small synonym table, then a contained-substring fallback for
 * BAD states only. Empty/unrecognized is honest `Unknown` — never guessed up to
 * `Healthy`. There is DELIBERATELY no positive substring fallback: it would paint
 * a bad state green (`NotReady`/`unavailable`/`Broken` contain ready/available/ok),
 * and an incident shown Healthy is worse than one shown Unknown. Exact positive
 * values are covered by CANONICAL + SYNONYM; anything else stays Unknown.
 */
export function foldHealth(raw: string | undefined | null): HealthStatus {
  const s = (raw ?? '').toString().toLowerCase().trim()
  if (!s) return 'Unknown'
  if (CANONICAL[s]) return CANONICAL[s]
  if (SYNONYM[s]) return SYNONYM[s]
  // Bad-state substring fallback only (fail-safe direction: up-guess to WORSE).
  if (/(degrad|error|fail|crash|unhealthy)/.test(s)) return 'Degraded'
  if (/(progress|deploy|updat|provision|pending|creat)/.test(s)) return 'Progressing'
  if (/(suspend|paus|stop)/.test(s)) return 'Suspended'
  if (/(miss|absent|notfound|gone)/.test(s)) return 'Missing'
  return 'Unknown'
}

/** Default health palette — Argo CD hues, tuned to read on light and dark. */
export const HEALTH_PALETTE: Record<HealthStatus, StatusPalette> = Object.fromEntries(
  (Object.keys(HUE) as HealthStatus[]).map((k) => [
    k,
    { dot: HUE[k], fg: HUE[k], soft: withAlpha(HUE[k], 0.15) },
  ]),
) as Record<HealthStatus, StatusPalette>

/** Resolve a health status → its palette entry, honoring an override map. */
export function healthColors(
  status: HealthStatus,
  override?: Partial<Record<HealthStatus, StatusPalette>>,
): StatusPalette {
  return override?.[status] ?? HEALTH_PALETTE[status]
}

/** Human label for a health status (the canonical name is already title-case). */
export const healthLabel = (s: HealthStatus): string => s

/**
 * Sort priority (Argo CD `HealthPriority`) — lower ranks first, so the states that
 * most need attention sort to the top of a list.
 */
export const HEALTH_RANK: Record<HealthStatus, number> = {
  Missing: 0,
  Degraded: 1,
  Unknown: 2,
  Progressing: 3,
  Suspended: 4,
  Healthy: 5,
}

export const healthRank = (s: HealthStatus): number => HEALTH_RANK[s]

/** Whether the health mark should spin (an in-flight thing). */
export const healthSpins = (s: HealthStatus): boolean => s === 'Progressing'

/**
 * Roll a set of resource healths up to a single application verdict, the worst
 * (lowest-priority) wins — an app with one Degraded pod is Degraded.
 */
export function rollupHealth(statuses: Iterable<HealthStatus>): HealthStatus {
  let worst: HealthStatus | undefined
  for (const s of statuses) {
    if (worst === undefined || HEALTH_RANK[s] < HEALTH_RANK[worst]) worst = s
  }
  return worst ?? 'Unknown'
}
