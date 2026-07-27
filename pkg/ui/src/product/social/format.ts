/**
 * The ONE place a post's schedule time and body are formatted, bucketed by day,
 * and parsed. Pure (no React, no host) so the agenda, the table cells and the
 * composer all read the same clock. Extracted from Hanzo Social.
 */

/** Unix seconds → a short local timestamp, or '—' when unset (0). */
export function formatPostTime(unix: number): string {
  if (!unix) return '—'
  return new Date(unix * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Unix seconds → a day bucket key + label for the agenda (calendar) view. */
export function postDayBucket(unix: number): { key: string; label: string } {
  const d = new Date(unix * 1000)
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  return { key, label }
}

/** Truncate a post body for a table cell / agenda card. */
export function postPreview(s: string): string {
  const t = s.trim()
  return t.length > 72 ? `${t.slice(0, 72)}…` : t || '—'
}

/** Parse a user-typed datetime (ISO or local) into unix seconds; invalid → 0. */
export function parsePostTime(dt: string): number {
  const ms = Date.parse(dt.trim())
  return Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0
}
