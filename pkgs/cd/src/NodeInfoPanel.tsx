'use client'

/**
 * The node drill-in — tabs over a selected resource: the live manifest (YAML), the
 * desired-vs-live diff, Kubernetes events, and container logs. Data-prop-driven:
 * the host passes the `{name}/resource`, `/events` and `/logs` payloads; this
 * renders them. Self-sufficient (sets its own theme vars) so it works standalone
 * or embedded in the app detail shell.
 */
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { relativeTime } from '@hanzo/canvas/pure'

import { GitopsDiffView } from './DiffView'
import { HealthBadge } from './HealthBadge'
import { ResourceKindGlyph } from './glyphs'
import { GitopsStyles, themeStyle } from './styles'
import { SyncBadge } from './SyncBadge'
import type {
  AppEvent,
  AppTreeNode,
  HealthStatus,
  LogLine,
  ManagedResource,
  StatusPalette,
  SyncStatus,
} from './types'

export type NodeInfoTab = 'manifest' | 'diff' | 'events' | 'logs'

export interface GitopsNodeInfoProps {
  node: AppTreeNode
  /** Managed-resource payload (live/target manifests and/or a unified diff). */
  resource?: ManagedResource
  /** Live manifest, if not carried on `resource.liveState`. */
  manifest?: string
  events?: AppEvent[]
  logs?: LogLine[]
  /** Controlled active tab; else internal, starting at `defaultTab`. */
  tab?: NodeInfoTab
  defaultTab?: NodeInfoTab
  onTabChange?: (tab: NodeInfoTab) => void
  onClose?: () => void
  theme?: 'light' | 'dark'
  healthPalette?: Partial<Record<HealthStatus, StatusPalette>>
  syncPalette?: Partial<Record<SyncStatus, StatusPalette>>
  /** `now` for deterministic relative time (tests/SSR). */
  now?: number
  style?: CSSProperties
}

const TABS: { id: NodeInfoTab; label: string }[] = [
  { id: 'manifest', label: 'Manifest' },
  { id: 'diff', label: 'Diff' },
  { id: 'events', label: 'Events' },
  { id: 'logs', label: 'Logs' },
]

export function GitopsNodeInfo({
  node,
  resource,
  manifest,
  events,
  logs,
  tab,
  defaultTab = 'manifest',
  onTabChange,
  onClose,
  theme = 'dark',
  healthPalette,
  syncPalette,
  now,
  style,
}: GitopsNodeInfoProps) {
  const [internal, setInternal] = useState<NodeInfoTab>(defaultTab)
  const active = tab ?? internal
  const setTab = (t: NodeInfoTab) => {
    if (tab === undefined) setInternal(t)
    onTabChange?.(t)
  }

  const liveManifest = resource?.liveState ?? manifest
  const health = node.health?.status ?? 'Unknown'

  return (
    <div className="hz-gitops hz-gitops-panel" style={themeStyle(theme, { display: 'flex', flexDirection: 'column', minHeight: 0, ...style })}>
      <GitopsStyles />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--hz-border)' }}>
        <span className="hz-gitops-muted" style={{ display: 'inline-flex' }}>
          <ResourceKindGlyph kind={node.kind} size={16} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--hz-fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.name}
          </div>
          <div className="hz-gitops-muted" style={{ fontSize: 11 }}>
            {node.kind}
            {node.namespace ? ` · ${node.namespace}` : ''}
          </div>
        </div>
        <HealthBadge status={health} size="sm" palette={healthPalette} />
        {node.sync ? <SyncBadge status={node.sync} size="sm" palette={syncPalette} /> : null}
        {onClose ? (
          <button type="button" className="hz-gitops-btn" onClick={onClose} title="Close" style={{ padding: '4px 8px' }}>
            ✕
          </button>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="hz-gitops-tabs" style={{ padding: '0 8px' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`hz-gitops-tab${active === t.id ? ' hz-gitops-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {active === 'manifest' ? (
          liveManifest ? (
            <pre className="hz-gitops-code">{liveManifest}</pre>
          ) : (
            <Empty>No live manifest.</Empty>
          )
        ) : null}

        {active === 'diff' ? (
          <GitopsDiffView diff={resource?.diff} live={resource?.liveState} desired={resource?.targetState} />
        ) : null}

        {active === 'events' ? (
          events && events.length ? (
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {events.map((e, i) => (
                <div key={i} className="hz-gitops-card" style={{ padding: '8px 10px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span
                    className="hz-gitops-chip"
                    style={e.type === 'Warning' ? { color: '#E96D76', borderColor: 'rgba(233,109,118,0.4)' } : undefined}
                  >
                    {e.reason ?? e.type ?? 'Event'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}>{e.message}</div>
                    <div className="hz-gitops-muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {e.count && e.count > 1 ? `×${e.count} · ` : ''}
                      {e.lastTimestamp ? relativeTime(e.lastTimestamp, now) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No events.</Empty>
          )
        ) : null}

        {active === 'logs' ? (
          logs && logs.length ? (
            <div className="hz-gitops-logs">
              {logs.map((l, i) => (
                <div key={i} className="hz-gitops-log">
                  {l.timestamp ? <span className="hz-gitops-log-ts">{relativeTime(l.timestamp, now)}</span> : null}
                  <span style={{ flex: 1 }}>{l.content}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No logs.</Empty>
          )
        ) : null}
      </div>
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="hz-gitops-muted" style={{ padding: 16, fontSize: 13 }}>
      {children}
    </div>
  )
}
