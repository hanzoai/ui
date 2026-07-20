/**
 * Compact relative time — pure and deterministic given `now`. Future or invalid
 * timestamps degrade honestly (`—` / `now`), never a fabricated duration. Shared
 * by the tile's last-synced, the drawer's created/age, and the history rows.
 */
export function relativeTime(
  epochMs: number | undefined | null,
  now: number = Date.now()
): string {
  if (epochMs == null || !Number.isFinite(epochMs) || epochMs <= 0) return '—'
  const diff = now - epochMs
  if (diff < 0) return 'now'
  const s = Math.floor(diff / 1000)
  if (s < 5) return 'now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 5) return `${w}w ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  const y = Math.floor(d / 365)
  return `${y}y ago`
}

/**
 * Parse an ISO-8601 (or any `Date`-parseable) timestamp to epoch **ms**, or
 * `undefined` when absent/unparseable — so the contract's string timestamps
 * (`createdAt`, event times) flow into `relativeTime` without throwing.
 */
export function toEpochMs(v: string | number | undefined | null): number | undefined {
  if (v == null) return undefined
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v <= 0) return undefined
    // Hanzo `/v1` rows may report epoch seconds; scale sub-2001 values to ms.
    return v < 1e12 ? Math.round(v * 1000) : Math.round(v)
  }
  const t = Date.parse(v)
  return Number.isFinite(t) && t > 0 ? t : undefined
}

/** Relative time for a string/number timestamp (parses, then formats). */
export function relativeTimeOf(
  v: string | number | undefined | null,
  now: number = Date.now()
): string {
  return relativeTime(toEpochMs(v), now)
}
