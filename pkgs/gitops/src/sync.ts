/**
 * Pure sync logic — the one place a free-form sync string is folded into the
 * `SyncStatus` vocabulary, plus the default status palette (Argo CD hues) and the
 * sort priority. No React, no DOM — unit-tested in isolation.
 */
import { withAlpha } from '@hanzo/canvas/pure'

import type { StatusPalette, SyncStatus } from './types'

/** Argo CD's sync hues (shared/components/colors.ts). */
const HUE: Record<SyncStatus, string> = {
  Synced: '#18BE94',
  OutOfSync: '#f4c030',
  Unknown: '#CCD6DD',
}

const CANONICAL: Record<string, SyncStatus> = {
  synced: 'Synced',
  outofsync: 'OutOfSync',
  unknown: 'Unknown',
}

const SYNONYM: Record<string, SyncStatus> = {
  insync: 'Synced',
  'in-sync': 'Synced',
  uptodate: 'Synced',
  'up-to-date': 'Synced',
  drift: 'OutOfSync',
  drifted: 'OutOfSync',
  diverged: 'OutOfSync',
  modified: 'OutOfSync',
}

/**
 * Fold any sync string to a `SyncStatus`. Separators are normalized (whitespace,
 * `-`, `_` stripped) so the canonical `out-of-sync` folds at the source; then a
 * canonical match, a small synonym table, and a substring fallback for the BAD
 * (needs-attention) direction only. There is DELIBERATELY no positive substring
 * up-guess: `notsynced`/`unsynced` contain `synced` and would be painted green —
 * an out-of-sync app shown Synced is worse than one shown Unknown. Exact positive
 * values are covered by CANONICAL + SYNONYM; anything else stays Unknown.
 */
export function foldSync(raw: string | undefined | null): SyncStatus {
  const s = (raw ?? '').toString().toLowerCase().trim().replace(/[\s_-]+/g, '')
  if (!s) return 'Unknown'
  if (CANONICAL[s]) return CANONICAL[s]
  if (SYNONYM[s]) return SYNONYM[s]
  if (s.includes('outofsync') || s.includes('drift') || s.includes('diverge')) return 'OutOfSync'
  return 'Unknown'
}

/** Default sync palette — Argo CD hues, tuned to read on light and dark. */
export const SYNC_PALETTE: Record<SyncStatus, StatusPalette> = Object.fromEntries(
  (Object.keys(HUE) as SyncStatus[]).map((k) => [
    k,
    { dot: HUE[k], fg: HUE[k], soft: withAlpha(HUE[k], 0.15) },
  ]),
) as Record<SyncStatus, StatusPalette>

/** Resolve a sync status → its palette entry, honoring an override map. */
export function syncColors(
  status: SyncStatus,
  override?: Partial<Record<SyncStatus, StatusPalette>>,
): StatusPalette {
  return override?.[status] ?? SYNC_PALETTE[status]
}

/** Human label for a sync status (the canonical name reads as-is). */
export const syncLabel = (s: SyncStatus): string => (s === 'OutOfSync' ? 'OutOfSync' : s)

/**
 * Sort priority — lower ranks first, so `OutOfSync` (the state that needs a sync)
 * sorts to the top of a list ahead of `Synced`.
 */
export const SYNC_RANK: Record<SyncStatus, number> = {
  OutOfSync: 0,
  Unknown: 1,
  Synced: 2,
}

export const syncRank = (s: SyncStatus): number => SYNC_RANK[s]

/** Whether the sync mark should spin (`Unknown` is still resolving). */
export const syncSpins = (s: SyncStatus): boolean => s === 'Unknown'

/** Roll a set of resource sync states up to one app verdict — any drift wins. */
export function rollupSync(statuses: Iterable<SyncStatus>): SyncStatus {
  let worst: SyncStatus | undefined
  for (const s of statuses) {
    if (worst === undefined || SYNC_RANK[s] < SYNC_RANK[worst]) worst = s
  }
  return worst ?? 'Unknown'
}
