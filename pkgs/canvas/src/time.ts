/**
 * Compact relative time — pure and deterministic given `now`. Future or invalid
 * timestamps degrade honestly (`—` / `now`), never a fabricated duration.
 */
export function relativeTime(
  epochMs: number | undefined | null,
  now: number = Date.now()
): string {
  if (epochMs == null || !Number.isFinite(epochMs) || epochMs <= 0) return "—"
  const diff = now - epochMs
  if (diff < 0) return "now"
  const s = Math.floor(diff / 1000)
  if (s < 5) return "now"
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
 * Coerce a backend timestamp to epoch **ms**. Hanzo `/v1` rows report epoch
 * SECONDS (int64) while JS uses ms; a value below ~year-2001-in-ms is treated as
 * seconds and scaled. `0`/absent → `undefined` (honest "no time").
 */
export function toEpochMs(v: number | undefined | null): number | undefined {
  if (v == null || !Number.isFinite(v) || v <= 0) return undefined
  return v < 1e12 ? Math.round(v * 1000) : Math.round(v)
}
