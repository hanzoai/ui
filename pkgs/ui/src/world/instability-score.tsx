'use client'

import * as React from 'react'
import { cn } from '../../utils'
import type { InstabilityScoreData, InstabilityLevel, InstabilityComponents } from './types'
import { instabilityLevel } from './format'

/* ------------------------------------------------------------------ */
/*  Level → token + label                                             */
/* ------------------------------------------------------------------ */

const LEVEL: Record<InstabilityLevel, { color: string; label: string }> = {
  low: { color: 'var(--world-normal)', label: 'Low' },
  normal: { color: 'var(--world-normal)', label: 'Moderate' },
  elevated: { color: 'var(--world-elevated)', label: 'Elevated' },
  high: { color: 'var(--world-high)', label: 'High' },
  critical: { color: 'var(--world-critical)', label: 'Critical' },
}

const COMPONENT_LABEL: Record<keyof InstabilityComponents, string> = {
  unrest: 'Unrest',
  conflict: 'Conflict',
  security: 'Security',
  information: 'Information',
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface InstabilityScoreProps {
  /** Score data. `score` is required; `level` is derived if omitted. */
  data: InstabilityScoreData
  /** Compact layout (no component breakdown, smaller number). */
  compact?: boolean
  loading?: boolean
  error?: string | null
  onClick?: (data: InstabilityScoreData) => void
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

/**
 * Instability / risk gauge card. Renders a 0-100 composite score with a
 * level band, trend, 24h delta and an optional per-driver breakdown.
 * The score is computed upstream (app or /v1/world) and passed in as data.
 *
 * @example
 * <InstabilityScore data={{ name: 'Ukraine', score: 82, trend: 'rising', change24h: 4 }} />
 */
export function InstabilityScore({ data, compact = false, loading = false, error = null, onClick, className }: InstabilityScoreProps) {
  const score = Math.max(0, Math.min(100, Math.round(data.score)))
  const level = data.level ?? instabilityLevel(score)
  const { color, label } = LEVEL[level]

  const shell = cn(
    'flex flex-col gap-3 overflow-hidden rounded-[var(--world-radius)] border border-[var(--world-border)]',
    'bg-[var(--world-surface)] p-3 text-[var(--world-text)] [font-family:var(--world-font-sans)]',
    onClick && 'cursor-pointer transition-colors hover:bg-[var(--world-surface-hover)]',
    className,
  )

  const content = (
    <>
      {error ? (
        <div className="py-6 text-center text-sm text-[var(--world-text-dim)]">{error}</div>
      ) : loading ? (
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-[var(--world-surface-active)]" />
          <div className="h-8 w-16 rounded bg-[var(--world-surface-active)]" />
          <div className="h-1.5 w-full rounded bg-[var(--world-surface-hover)]" />
        </div>
      ) : (
        <>
          {/* Header: name + level pill */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              {data.code && (
                <span className="rounded-[var(--world-radius-sm)] bg-[var(--world-surface-active)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--world-text-muted)] [font-family:var(--world-font-mono)]">
                  {data.code}
                </span>
              )}
              {data.name && <span className="truncate text-sm font-medium text-[var(--world-text)]">{data.name}</span>}
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{ color, background: 'color-mix(in srgb, ' + color + ' 14%, transparent)' }}
            >
              {label}
            </span>
          </div>

          {/* Score + trend */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn('tabular-nums leading-none [font-family:var(--world-font-mono)]', compact ? 'text-2xl' : 'text-4xl')}
                style={{ color }}
              >
                {score}
              </span>
              <span className="text-xs text-[var(--world-text-dim)]">/100</span>
            </div>
            {(data.trend || typeof data.change24h === 'number') && <Trend trend={data.trend} change24h={data.change24h} />}
          </div>

          {/* Meter */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--world-surface-active)]">
            <div className="h-full rounded-full transition-[width]" style={{ width: `${score}%`, background: color }} />
          </div>

          {/* Component breakdown */}
          {!compact && data.components && <Components components={data.components} />}
        </>
      )}
    </>
  )

  if (onClick && !loading && !error) {
    return (
      <button type="button" onClick={() => onClick(data)} className={cn(shell, 'text-left')}>
        {content}
      </button>
    )
  }
  return <div className={shell}>{content}</div>
}

/* ------------------------------------------------------------------ */
/*  Trend + components                                                */
/* ------------------------------------------------------------------ */

function Trend({ trend, change24h }: { trend?: InstabilityScoreData['trend']; change24h?: number }) {
  // Rising instability is worse (high), falling is improving (normal).
  const color = trend === 'rising' ? 'var(--world-high)' : trend === 'falling' ? 'var(--world-normal)' : 'var(--world-text-dim)'
  const arrow = trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→'
  const delta = typeof change24h === 'number' ? `${change24h > 0 ? '+' : ''}${change24h}` : null
  return (
    <div className="flex items-center gap-1 text-xs [font-family:var(--world-font-mono)]" style={{ color }}>
      <span aria-hidden>{arrow}</span>
      {delta && <span className="tabular-nums">{delta}</span>}
      <span className="text-[10px] text-[var(--world-text-dim)]">24h</span>
    </div>
  )
}

function Components({ components }: { components: InstabilityComponents }) {
  const entries = (Object.keys(COMPONENT_LABEL) as Array<keyof InstabilityComponents>)
    .filter((k) => typeof components[k] === 'number')
    .map((k) => [k, components[k] as number] as const)
  if (entries.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[var(--world-border)] pt-3">
      {entries.map(([key, value]) => {
        const v = Math.max(0, Math.min(100, Math.round(value)))
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-[var(--world-text-dim)]">{COMPONENT_LABEL[key]}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--world-surface-active)]">
              <div className="h-full rounded-full bg-[var(--world-text-muted)]" style={{ width: `${v}%` }} />
            </div>
            <span className="w-6 text-right text-[10px] tabular-nums text-[var(--world-text-muted)] [font-family:var(--world-font-mono)]">{v}</span>
          </div>
        )
      })}
    </div>
  )
}
