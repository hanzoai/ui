/**
 * @hanzo/ui/world - Formatting + safety helpers
 *
 * Pure, dependency-free. Numeric formatting mirrors the hanzoai/world panels
 * so ported components read identically to world.hanzo.ai.
 */

import type { InstabilityLevel } from './types'

/** Price with adaptive precision (sub-1 values keep more decimals). */
export function formatPrice(value: number | null | undefined, currency = '$'): string {
  if (value == null || Number.isNaN(value)) return 'N/A'
  const abs = Math.abs(value)
  const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6
  return currency + value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** Signed percent change, e.g. "+1.24%" / "-0.80%". */
export function formatChange(change: number | null | undefined): string {
  if (change == null || Number.isNaN(change)) return '—'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

/** Compact magnitude, e.g. 1_240_000 -> "1.2M". */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ''
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return `${value}`
}

/** USD volume, e.g. "$1.2M". Empty string for falsy. */
export function formatVolume(volume: number | null | undefined): string {
  if (!volume) return ''
  return `$${formatCompact(volume)}`
}

/** Human relative time, e.g. "3m", "2h", "5d". */
export function formatRelativeTime(input: string | number | Date | undefined): string {
  if (input == null) return ''
  const then = input instanceof Date ? input.getTime() : new Date(input).getTime()
  if (Number.isNaN(then)) return ''
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(then).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Boundary validation: only allow http/https links. Returns undefined for
 * anything else (javascript:, data:, relative, malformed) so callers render
 * plain text instead of an unsafe anchor.
 */
export function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const u = new URL(url, 'https://invalid.local')
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      // Reject the relative-resolution sentinel origin.
      if (u.hostname === 'invalid.local' && !/^https?:\/\//i.test(url)) return undefined
      return u.href
    }
  } catch {
    return undefined
  }
  return undefined
}

/** SVG polyline points for a sparkline within a w×h box. */
export function sparklinePoints(data: number[], w: number, h: number): string {
  if (!data || data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 2) - 1
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

/** Derive a severity band from a 0-100 instability score. */
export function instabilityLevel(score: number): InstabilityLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'elevated'
  if (score >= 20) return 'normal'
  return 'low'
}
