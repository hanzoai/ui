'use client'

import * as React from 'react'
import { cn } from '../../utils'
import type { NewsStreamItem, WorldSeverity } from './types'
import { formatRelativeTime, safeUrl } from './format'

/* ------------------------------------------------------------------ */
/*  Severity → token                                                  */
/* ------------------------------------------------------------------ */

const SEVERITY_VAR: Record<WorldSeverity, string> = {
  critical: 'var(--world-critical)',
  high: 'var(--world-high)',
  elevated: 'var(--world-elevated)',
  normal: 'var(--world-normal)',
  low: 'var(--world-normal)',
  info: 'var(--world-info)',
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface NewsStreamProps {
  /** Items to render, newest first. */
  items: NewsStreamItem[]
  /** Optional header label rendered above the stream. */
  title?: string
  /** Show a skeleton/loading state instead of items. */
  loading?: boolean
  /** Error message; replaces the list when set. */
  error?: string | null
  /** Message shown when there are no items. */
  emptyMessage?: string
  /** Cap the number of rendered rows. */
  maxItems?: number
  /** Called on row click (in addition to following `url`). */
  onItemClick?: (item: NewsStreamItem) => void
  /** Constrain height and scroll internally. CSS length. */
  maxHeight?: string
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/**
 * Vertical stream of news / signal items. Pure props — feed it any array
 * (from the `useNewsStream` hook, the /v1/world API, or your own source).
 *
 * @example
 * <NewsStream title="Live intel" items={items} maxHeight="480px" />
 */
export function NewsStream({
  items,
  title,
  loading = false,
  error = null,
  emptyMessage = 'No items',
  maxItems,
  onItemClick,
  maxHeight,
  className,
}: NewsStreamProps) {
  const rows = maxItems ? items.slice(0, maxItems) : items

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-[var(--world-radius)] border border-[var(--world-border)]',
        'bg-[var(--world-surface)] text-[var(--world-text)]',
        '[font-family:var(--world-font-sans)]',
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-[var(--world-border)] px-3 py-2">
          <span className="text-xs font-medium text-[var(--world-text-muted)]">{title}</span>
          {!loading && !error && (
            <span className="text-[11px] tabular-nums text-[var(--world-text-dim)] [font-family:var(--world-font-mono)]">
              {items.length}
            </span>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto" style={maxHeight ? { maxHeight } : undefined}>
        {error ? (
          <div className="px-3 py-8 text-center text-sm text-[var(--world-text-dim)]">{error}</div>
        ) : loading ? (
          <NewsStreamSkeleton />
        ) : rows.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-[var(--world-text-dim)]">{emptyMessage}</div>
        ) : (
          <ul className="divide-y divide-[var(--world-border)]">
            {rows.map((item, i) => (
              <NewsRow key={item.id ?? item.url ?? `${item.title}-${i}`} item={item} onItemClick={onItemClick} />
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

function NewsRow({ item, onItemClick }: { item: NewsStreamItem; onItemClick?: (item: NewsStreamItem) => void }) {
  const href = safeUrl(item.url)
  const rail = item.severity ? SEVERITY_VAR[item.severity] : undefined
  const time = formatRelativeTime(item.timestamp)

  const inner = (
    <div className="flex gap-2.5 px-3 py-2.5">
      <span
        aria-hidden
        className="mt-1 w-0.5 shrink-0 self-stretch rounded-full"
        style={{ background: rail ?? 'transparent' }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-normal leading-snug text-[var(--world-text)]">{item.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--world-text-dim)] [font-family:var(--world-font-mono)]">
          {item.source && <span className="text-[var(--world-text-muted)]">{item.source}</span>}
          {item.location && <span>{item.location}</span>}
          {item.category && (
            <span className="rounded-[var(--world-radius-sm)] bg-[var(--world-surface-active)] px-1.5 py-px text-[10px] uppercase tracking-wide text-[var(--world-text-muted)]">
              {item.category}
            </span>
          )}
          {time && <span className="ml-auto tabular-nums">{time}</span>}
        </div>
      </div>
    </div>
  )

  const interactive =
    'cursor-pointer transition-colors hover:bg-[var(--world-surface-hover)] focus-visible:bg-[var(--world-surface-hover)] focus-visible:outline-none'

  if (href) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onItemClick?.(item)}
          className={cn('block', interactive)}
        >
          {inner}
        </a>
      </li>
    )
  }

  if (onItemClick) {
    return (
      <li>
        <button type="button" onClick={() => onItemClick(item)} className={cn('block w-full text-left', interactive)}>
          {inner}
        </button>
      </li>
    )
  }

  return <li>{inner}</li>
}

function NewsStreamSkeleton() {
  return (
    <ul className="divide-y divide-[var(--world-border)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex gap-2.5 px-3 py-2.5">
          <span className="mt-1 w-0.5 shrink-0 self-stretch rounded-full bg-[var(--world-surface-active)]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-4/5 rounded bg-[var(--world-surface-active)]" />
            <div className="h-2.5 w-2/5 rounded bg-[var(--world-surface-hover)]" />
          </div>
        </li>
      ))}
    </ul>
  )
}
