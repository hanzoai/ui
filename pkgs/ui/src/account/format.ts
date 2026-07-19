/**
 * @hanzo/ui/account — presentation formatters
 *
 * Pure, dependency-free display helpers. All monetary inputs are whole
 * currency units (dollars, not cents) to keep the props ergonomic; apps that
 * store cents divide before passing in.
 */
import type { CurrencyCode } from './types'

/** Format a whole-unit amount as currency (e.g. 20 → "$20.00"). */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  opts?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      ...opts,
    }).format(amount)
  } catch {
    // Unknown currency code — degrade to a plain number with the code suffix.
    return `${amount.toFixed(2)} ${currency}`
  }
}

/** Compact integer formatting (e.g. 1500 → "1,500", 2_400_000 → "2.4M"). */
export function formatQuantity(n: number): string {
  if (Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)
  }
  return new Intl.NumberFormat('en-US').format(n)
}

/** Format an ISO string or epoch-ms into a short date (e.g. "Apr 17, 2026"). */
export function formatDate(input: string | number): string {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return String(input)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Clamp a percentage into the renderable [0, 100] band. */
export function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(100, Math.max(0, n))
}
