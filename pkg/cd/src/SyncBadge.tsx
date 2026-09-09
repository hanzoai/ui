'use client'

/**
 * The sync pill — an Argo-CD-style mark (check-circle / arrow-up-circle / spinner)
 * plus the status label, in the resolved sync hue on a soft chip. Semantic colors,
 * overridable via `palette`.
 */
import { syncColors, syncLabel } from './sync'
import { SyncMark } from './glyphs'
import type { StatusPalette, SyncStatus } from './types'

export interface SyncBadgeProps {
  status: SyncStatus
  label?: string
  size?: 'sm' | 'md'
  showIcon?: boolean
  showLabel?: boolean
  palette?: Partial<Record<SyncStatus, StatusPalette>>
  title?: string
}

export function SyncBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
  showLabel = true,
  palette,
  title,
}: SyncBadgeProps) {
  const c = syncColors(status, palette)
  return (
    <span
      className={`hz-gitops-badge${size === 'sm' ? ' hz-gitops-badge--sm' : ''}`}
      style={{ background: c.soft, color: c.fg }}
      title={title ?? syncLabel(status)}
    >
      {showIcon ? <SyncMark status={status} size={size === 'sm' ? 12 : 14} palette={palette} /> : null}
      {showLabel ? (label ?? syncLabel(status)) : null}
    </span>
  )
}
