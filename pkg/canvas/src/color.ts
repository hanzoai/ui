/**
 * Minimal color helpers — turn a `#rrggbb`/`#rgb` hex into an `rgba()` string so
 * an accent can tint a soft surface. Any non-hex input (e.g. already `rgba()`)
 * is returned unchanged.
 */
export function withAlpha(color: string, alpha: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return color
  let hex = m[1]
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const a = Math.max(0, Math.min(1, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const KIND_LABEL: Record<string, string> = {
  app: "App",
  web: "Web",
  worker: "Worker",
  database: "Database",
  cache: "Cache",
  vector: "Vector",
  search: "Search",
  storage: "Storage",
  queue: "Queue",
  domain: "Domain",
  function: "Function",
  cron: "Cron",
  ai: "AI",
  service: "Service",
}

/** Human label for a service kind (falls back to a capitalized id). */
export const kindLabel = (kind: string): string =>
  KIND_LABEL[kind] ??
  (kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : "Service")
