'use client'

import * as React from 'react'
import { cn } from '../../utils'
import type { MarketQuote } from './types'
import { formatPrice, formatChange, sparklinePoints } from './format'

/* ------------------------------------------------------------------ */
/*  Sparkline                                                         */
/* ------------------------------------------------------------------ */

function Sparkline({ data, change, w = 56, h = 18 }: { data?: number[]; change: number | null; w?: number; h?: number }) {
  const points = data ? sparklinePoints(data, w, h) : ''
  if (!points) return <span className="inline-block" style={{ width: w, height: h }} />
  const color = change != null && change < 0 ? 'var(--world-down)' : 'var(--world-up)'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function changeColor(change: number | null): string {
  if (change == null) return 'text-[var(--world-text-dim)]'
  if (change > 0) return 'text-[var(--world-up)]'
  if (change < 0) return 'text-[var(--world-down)]'
  return 'text-[var(--world-text-muted)]'
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface MarketTickerProps {
  /** Quotes to render. */
  items: MarketQuote[]
  /** `list` = vertical rows; `strip` = horizontal scrolling tape. */
  variant?: 'list' | 'strip'
  /** Optional header label (list variant only). */
  title?: string
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  onItemClick?: (quote: MarketQuote) => void
  /** Constrain height and scroll internally (list variant). CSS length. */
  maxHeight?: string
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/**
 * Market quotes with inline sparklines and color-coded change. Two layouts:
 * a vertical `list` panel or a horizontal `strip` ticker tape.
 *
 * @example
 * <MarketTicker title="Markets" items={quotes} />
 * <MarketTicker variant="strip" items={quotes} />
 */
export function MarketTicker({
  items,
  variant = 'list',
  title,
  loading = false,
  error = null,
  emptyMessage = 'No market data',
  onItemClick,
  maxHeight,
  className,
}: MarketTickerProps) {
  if (variant === 'strip') {
    return <MarketStrip items={items} loading={loading} error={error} onItemClick={onItemClick} className={className} />
  }

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
        ) : items.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-[var(--world-text-dim)]">{emptyMessage}</div>
        ) : (
          <ul className="divide-y divide-[var(--world-border)]">
            {items.map((q, i) => (
              <MarketRow key={q.symbol ?? i} quote={q} onItemClick={onItemClick} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  List row                                                          */
/* ------------------------------------------------------------------ */

function MarketRow({ quote, onItemClick }: { quote: MarketQuote; onItemClick?: (q: MarketQuote) => void }) {
  const body = (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-[var(--world-text)]">{quote.symbol}</div>
        {quote.name && <div className="truncate text-[11px] text-[var(--world-text-dim)]">{quote.name}</div>}
      </div>
      <Sparkline data={quote.sparkline} change={quote.change} />
      <div className="w-20 text-right [font-family:var(--world-font-mono)]">
        <div className="text-[13px] tabular-nums text-[var(--world-text)]">{formatPrice(quote.price, quote.currency ?? '$')}</div>
        <div className={cn('text-[11px] tabular-nums', changeColor(quote.change))}>{formatChange(quote.change)}</div>
      </div>
    </div>
  )

  if (onItemClick) {
    return (
      <li>
        <button
          type="button"
          onClick={() => onItemClick(quote)}
          className="block w-full text-left transition-colors hover:bg-[var(--world-surface-hover)]"
        >
          {body}
        </button>
      </li>
    )
  }
  return <li>{body}</li>
}

/* ------------------------------------------------------------------ */
/*  Strip (ticker tape)                                               */
/* ------------------------------------------------------------------ */

function MarketStrip({
  items,
  loading,
  error,
  onItemClick,
  className,
}: {
  items: MarketQuote[]
  loading: boolean
  error: string | null
  onItemClick?: (q: MarketQuote) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-5 overflow-x-auto rounded-[var(--world-radius)] border border-[var(--world-border)]',
        'bg-[var(--world-surface)] px-3 py-2 [font-family:var(--world-font-mono)]',
        className,
      )}
    >
      {error ? (
        <span className="text-xs text-[var(--world-text-dim)]">{error}</span>
      ) : loading ? (
        <span className="text-xs text-[var(--world-text-dim)]">Loading…</span>
      ) : (
        items.map((q, i) => (
          <button
            key={q.symbol ?? i}
            type="button"
            onClick={onItemClick ? () => onItemClick(q) : undefined}
            className={cn('flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs', onItemClick && 'cursor-pointer')}
          >
            <span className="font-medium text-[var(--world-text)] [font-family:var(--world-font-sans)]">{q.symbol}</span>
            <span className="tabular-nums text-[var(--world-text-muted)]">{formatPrice(q.price, q.currency ?? '$')}</span>
            <span className={cn('tabular-nums', changeColor(q.change))}>{formatChange(q.change)}</span>
          </button>
        ))
      )}
    </div>
  )
}

function MarketSkeleton() {
  return (
    <ul className="divide-y divide-[var(--world-border)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-16 rounded bg-[var(--world-surface-active)]" />
            <div className="h-2.5 w-24 rounded bg-[var(--world-surface-hover)]" />
          </div>
          <div className="h-[18px] w-14 rounded bg-[var(--world-surface-hover)]" />
          <div className="w-20 space-y-1.5">
            <div className="ml-auto h-3 w-14 rounded bg-[var(--world-surface-active)]" />
            <div className="ml-auto h-2.5 w-10 rounded bg-[var(--world-surface-hover)]" />
          </div>
        </li>
      ))}
    </ul>
  )
}
