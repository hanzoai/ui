'use client'

/**
 * The health pill — an Argo-CD-style mark (heart / broken heart / ghost / pause /
 * spinner / question) plus the status label, in the resolved health hue on a soft
 * chip. Semantic colors, overridable via `palette`.
 */
import { healthColors, healthLabel } from './health'
import { HealthMark } from './glyphs'
import type { HealthStatus, StatusPalette } from './types'

export interface HealthBadgeProps {
  status: HealthStatus
  /** Override text (e.g. append a message). */
  label?: string
  size?: 'sm' | 'md'
  showIcon?: boolean
  showLabel?: boolean
  palette?: Partial<Record<HealthStatus, StatusPalette>>
  title?: string
}

export function HealthBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
  showLabel = true,
  palette,
  title,
}: HealthBadgeProps) {
  const c = healthColors(status, palette)
  return (
    <span
      className={`hz-gitops-badge${size === 'sm' ? ' hz-gitops-badge--sm' : ''}`}
      style={{ background: c.soft, color: c.fg }}
      title={title ?? healthLabel(status)}
    >
      {showIcon ? <HealthMark status={status} size={size === 'sm' ? 12 : 14} palette={palette} /> : null}
      {showLabel ? (label ?? healthLabel(status)) : null}
    </span>
  )
}
