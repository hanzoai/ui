'use client'

/**
 * The resource card — the one node the tree renders for every Kubernetes object,
 * and usable standalone. A left accent bar in the health hue, the kind glyph and
 * kind label, the object name, and the health + sync marks. Pure presentation over
 * an `AppTreeNode`; it never fetches.
 */
import type { CSSProperties } from 'react'

import { healthColors } from './health'
import { HealthMark, ResourceKindGlyph, SyncMark } from './glyphs'
import type { AppTreeNode, HealthStatus, StatusPalette, SyncStatus } from './types'

export interface ResourceNodeProps {
  data: AppTreeNode
  selected?: boolean
  width?: number
  height?: number
  onSelect?: (data: AppTreeNode) => void
  healthPalette?: Partial<Record<HealthStatus, StatusPalette>>
  syncPalette?: Partial<Record<SyncStatus, StatusPalette>>
  /** Absolute style (position/left/top) applied by the tree; omit when standalone. */
  style?: CSSProperties
}

export function ResourceNode({
  data,
  selected,
  width = 200,
  height = 62,
  onSelect,
  healthPalette,
  syncPalette,
  style,
}: ResourceNodeProps) {
  const health = data.health?.status ?? 'Unknown'
  const c = healthColors(health, healthPalette)
  const ns = data.namespace
  return (
    <div
      className={`hz-gitops-node${selected ? ' hz-gitops-node--selected' : ''}`}
      style={{ width, height, ...style }}
      onClick={onSelect ? () => onSelect(data) : undefined}
      role={onSelect ? 'button' : undefined}
      title={data.health?.message ? `${health}: ${data.health.message}` : health}
    >
      <div className="hz-gitops-node-accent" style={{ background: c.dot }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 4, minWidth: 0, height: '100%', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span className="hz-gitops-muted" style={{ display: 'inline-flex' }}>
            <ResourceKindGlyph kind={data.kind} size={14} />
          </span>
          <span className="hz-gitops-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.kind}
          </span>
          <span style={{ flex: 1 }} />
          <HealthMark status={health} size={13} palette={healthPalette} />
          {data.sync ? <SyncMark status={data.sync} size={13} palette={syncPalette} /> : null}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--hz-fg-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.name}
        </div>
        {ns ? (
          <div className="hz-gitops-muted" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ns}
          </div>
        ) : null}
      </div>
    </div>
  )
}
