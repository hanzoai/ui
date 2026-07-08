'use client'

import * as React from 'react'
import { cn } from '../../utils'
import type { PredictionMarketItem } from './types'
import { formatVolume, safeUrl } from './format'

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface PredictionMarketProps {
  /** Markets to render. */
  items: PredictionMarketItem[]
  /** Optional header label. */
  title?: string
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  maxItems?: number
  /** Constrain height and scroll internally. CSS length. */
  maxHeight?: string
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/**
 * Prediction-market widget: each row shows a question and a yes/no
 * probability split bar. Pure props — feed it Polymarket-shaped data
 * (title / yesPrice / volume / url) from any source.
 *
 * @example
 * <PredictionMarket title="Markets" items={[{ title: 'Rate cut by Q3?', yesPrice: 63, volume: 1_200_000, url }]} />
 */
export function PredictionMarket({
  items,
  title,
  loading = false,
  error = null,
  emptyMessage = 'No markets',
  maxItems,
  maxHeight,
  className,
}: PredictionMarketProps) {
  const rows = maxItems ? items.slice(0, maxItems) : items

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-[var(--world-radius)] border border-[var(--world-border)]',
        'bg-[var(--world-surface)] text-[var(--world-text)] [font-family:var(--world-font-sans)]',
        className,
      )}
    >
      {title && (
        <div className="border-b border-[var(--world-border)] px-3 py-2 text-xs font-medium text-[var(--world-text-muted)]">
          {title}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto" style={maxHeight ? { maxHeight } : undefined}>
        {error ? (
          <div className="px-3 py-8 text-center text-sm text-[var(--world-text-dim)]">{error}</div>
        ) : loading ? (
          <MarketSkeleton />
        ) : rows.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-[var(--world-text-dim)]">{emptyMessage}</div>
        ) : (
          <ul className="divide-y divide-[var(--world-border)]">
            {rows.map((m, i) => (
              <PredictionRow key={m.url ?? `${m.title}-${i}`} market={m} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Row                                                               */
/* ------------------------------------------------------------------ */

function PredictionRow({ market }: { market: PredictionMarketItem }) {
  const yes = Math.max(0, Math.min(100, Math.round(market.yesPrice)))
  const no = 100 - yes
  const href = safeUrl(market.url)
  const volume = formatVolume(market.volume)

  return (
    <li className="px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-normal leading-snug text-[var(--world-text)] transition-colors hover:text-[var(--world-accent)]"
          >
            {market.title}
          </a>
        ) : (
          <span className="text-[13px] font-normal leading-snug text-[var(--world-text)]">{market.title}</span>
        )}
        {volume && (
          <span className="shrink-0 text-[11px] tabular-nums text-[var(--world-text-dim)] [font-family:var(--world-font-mono)]">{volume}</span>
        )}
      </div>

      <div className="mt-2 flex h-5 overflow-hidden rounded-[var(--world-radius-sm)] bg-[var(--world-surface-active)] text-[10px] font-medium [font-family:var(--world-font-mono)]">
        <div
          className="flex items-center justify-start overflow-hidden whitespace-nowrap px-1.5 text-black"
          style={{ width: `${yes}%`, background: 'var(--world-up)' }}
        >
          {yes >= 18 && <span>Yes {yes}%</span>}
        </div>
        <div className="flex items-center justify-end overflow-hidden whitespace-nowrap px-1.5 text-[var(--world-text-muted)]" style={{ width: `${no}%` }}>
          {no >= 18 && <span>No {no}%</span>}
        </div>
      </div>
    </li>
  )
}

function MarketSkeleton() {
  return (
    <ul className="divide-y divide-[var(--world-border)]">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="space-y-2 px-3 py-2.5">
          <div className="h-3 w-3/4 rounded bg-[var(--world-surface-active)]" />
          <div className="h-5 w-full rounded-[var(--world-radius-sm)] bg-[var(--world-surface-hover)]" />
        </li>
      ))}
    </ul>
  )
}
