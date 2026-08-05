'use client'

/**
 * FadeIn — the ONE entrance animation for the console.
 *
 * A thin wrapper that applies the shared `.fade-up` keyframe (defined once in
 * globals.css) plus an optional stagger delay, so sections and cards rise in the
 * way the hanzo.ai marketing surface does. Framework-free (no animation driver,
 * no JS observers) so it works under static export and honors
 * `prefers-reduced-motion` (handled in the CSS). Pass `index` to stagger a list
 * (delay = index * step), or `delayMs` for an explicit delay.
 */
import type { CSSProperties, ReactNode } from 'react'

export function FadeIn({
  children,
  index = 0,
  step = 50,
  delayMs,
  style,
}: {
  children: ReactNode
  /** Position in a list — staggers the entrance by `index * step` ms. */
  index?: number
  /** Per-index stagger in ms (default 50). */
  step?: number
  /** Explicit delay in ms; overrides the index-based stagger. */
  delayMs?: number
  /** Extra styles for the wrapper (e.g. layout/centering). */
  style?: CSSProperties
}) {
  const delay = delayMs ?? index * step
  return (
    <div className="fade-up" style={{ animationDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  )
}
