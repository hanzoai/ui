'use client'

/**
 * The application detail shell — composes the sync panel (header), the resource
 * tree, and the node info drawer into one view, wiring selection between the tree
 * and the drawer and the rollback history dialog. Data-prop-driven: manifests,
 * diffs, events, logs and history come from injected resolver props / arrays; the
 * effects (sync, refresh, rollback) are injected callbacks.
 */
import { useState } from 'react'
import type { CSSProperties } from 'react'

import { GitopsAppTree } from './ResourceTree'
import { GitopsNodeInfo } from './NodeInfoPanel'
import { GitopsRollbackDialog } from './RollbackDialog'
import { GitopsStyles, themeStyle } from './styles'
import { GitopsSyncPanel, type SyncOptions } from './SyncPanel'
import type {
  AppEvent,
  AppTreeNode,
  GitopsApplication,
  HealthStatus,
  LogLine,
  ManagedResource,
  ResourceTree,
  RevisionHistory,
  StatusPalette,
  SyncStatus,
} from './types'

export interface GitopsAppDetailsProps {
  app: GitopsApplication
  tree: ResourceTree
  theme?: 'light' | 'dark'
  /** Resolve the manifest/diff payload for a selected node (the `/resource` call). */
  resourceFor?: (node: AppTreeNode) => ManagedResource | undefined
  eventsFor?: (node: AppTreeNode) => AppEvent[] | undefined
  logsFor?: (node: AppTreeNode) => LogLine[] | undefined
  history?: RevisionHistory[]
  onSync?: (opts: SyncOptions) => void
  onRefresh?: () => void
  onRollback?: (entry: RevisionHistory) => void
  busy?: boolean
  healthPalette?: Partial<Record<HealthStatus, StatusPalette>>
  syncPalette?: Partial<Record<SyncStatus, StatusPalette>>
  /** Height of the tree / drawer row (default 520). */
  height?: number
  now?: number
  style?: CSSProperties
}

export function GitopsAppDetails({
  app,
  tree,
  theme = 'dark',
  resourceFor,
  eventsFor,
  logsFor,
  history,
  onSync,
  onRefresh,
  onRollback,
  busy,
  healthPalette,
  syncPalette,
  height = 520,
  now,
  style,
}: GitopsAppDetailsProps) {
  const [selected, setSelected] = useState<AppTreeNode | null>(null)
  const [rollbackOpen, setRollbackOpen] = useState(false)

  return (
    <div className="hz-gitops" style={themeStyle(theme, { display: 'flex', flexDirection: 'column', gap: 12, ...style })}>
      <GitopsStyles />

      <GitopsSyncPanel
        app={app}
        theme={theme}
        onSync={onSync}
        onRefresh={onRefresh}
        onRollback={history ? () => setRollbackOpen(true) : undefined}
        busy={busy}
        healthPalette={healthPalette}
        syncPalette={syncPalette}
      />

      <div style={{ display: 'flex', gap: 12, height, minHeight: 0 }}>
        <GitopsAppTree
          tree={tree}
          theme={theme}
          onSelect={setSelected}
          healthPalette={healthPalette}
          syncPalette={syncPalette}
          height={height}
          style={{ flex: 1, minWidth: 0 }}
        />
        {selected ? (
          <GitopsNodeInfo
            node={selected}
            theme={theme}
            resource={resourceFor?.(selected)}
            events={eventsFor?.(selected)}
            logs={logsFor?.(selected)}
            onClose={() => setSelected(null)}
            healthPalette={healthPalette}
            syncPalette={syncPalette}
            now={now}
            style={{ width: 440, flexShrink: 0, height }}
          />
        ) : null}
      </div>

      {history ? (
        <GitopsRollbackDialog
          open={rollbackOpen}
          history={history}
          theme={theme}
          busy={busy}
          now={now}
          onClose={() => setRollbackOpen(false)}
          onRollback={(entry) => {
            setRollbackOpen(false)
            onRollback?.(entry)
          }}
        />
      ) : null}
    </div>
  )
}
