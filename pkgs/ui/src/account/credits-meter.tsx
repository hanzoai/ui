'use client'
/**
 * CreditsMeter — balance / quota surface.
 *
 * Two shapes, one component:
 *   • quota   → pass `used` + `total`; renders an animated fill + "N of M".
 *   • balance → pass `balance` alone; renders a large figure, no bar.
 *
 * Two variants:
 *   • full    → card-framed, for a settings/billing page.
 *   • compact → single dense row, fits inside a DropdownMenu.
 *
 * Monochrome by design: the fill is the foreground color, depth comes from an
 * inset track and a subtle gradient sheen — motion, not hue.
 */
import * as React from 'react'

import { cn } from '../utils'
import { clampPct, formatCurrency, formatQuantity } from './format'
import type { CurrencyCode, MeterUnit } from './types'

export interface CreditsMeterProps {
  /** Row/section label (e.g. "Monthly credits"). */
  label: string
  /** Amount consumed. Provide with `total` for a quota meter. */
  used?: number
  /** Quota ceiling. Provide with `used` for a quota meter. */
  total?: number
  /** Standalone balance. Use instead of used/total for a plain figure. */
  balance?: number
  /** How numbers read: money or credit counts. Default "credits". */
  unit?: MeterUnit
  currency?: CurrencyCode
  /** Small note under the meter (e.g. "Resets monthly"). */
  resetNote?: string
  variant?: 'full' | 'compact'
  className?: string
}

function fmt(n: number, unit: MeterUnit, currency: CurrencyCode): string {
  return unit === 'currency' ? formatCurrency(n, currency) : formatQuantity(n)
}

/** Track + animated fill. Animates from 0 → pct on mount for a premium reveal. */
function MeterBar({ pct, compact }: { pct: number; compact?: boolean }) {
  const [width, setWidth] = React.useState(0)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])
  const near = pct >= 90
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/60',
        compact ? 'h-1.5' : 'h-2',
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out',
          near
            ? 'from-foreground to-foreground'
            : 'from-foreground/70 to-foreground',
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export const CreditsMeter = React.forwardRef<HTMLDivElement, CreditsMeterProps>(
  (
    {
      label,
      used,
      total,
      balance,
      unit = 'credits',
      currency = 'USD',
      resetNote,
      variant = 'full',
      className,
    },
    ref,
  ) => {
    const isQuota = typeof used === 'number' && typeof total === 'number'
    const pct = isQuota && total! > 0 ? clampPct((used! / total!) * 100) : 0
    const primary = isQuota
      ? fmt(used!, unit, currency)
      : fmt(balance ?? 0, unit, currency)

    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn('flex flex-col gap-1.5 px-2 py-1.5', className)}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-xs font-medium text-muted-foreground">
              {label}
            </span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
              {primary}
              {isQuota && (
                <span className="font-normal text-muted-foreground">
                  {' / '}
                  {fmt(total!, unit, currency)}
                </span>
              )}
            </span>
          </div>
          {isQuota && <MeterBar pct={pct} compact />}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm',
          className,
        )}
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium tracking-tight text-muted-foreground">
            {label}
          </span>
          <span className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-foreground">
            {primary}
            {isQuota && (
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / {fmt(total!, unit, currency)}
              </span>
            )}
          </span>
        </div>
        {isQuota && <MeterBar pct={pct} />}
        {resetNote && (
          <p className="text-xs text-muted-foreground">{resetNote}</p>
        )}
      </div>
    )
  },
)
CreditsMeter.displayName = 'CreditsMeter'
