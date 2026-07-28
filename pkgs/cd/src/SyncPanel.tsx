'use client'

/**
 * The sync panel + sync dialog — an app-level action bar (health, sync, current
 * revision, and Sync / Refresh / History actions) and the modal that collects
 * sync options (prune, dry-run). Data-prop-driven: the effects (POST sync) are
 * injected as callbacks; this only renders state and gathers intent.
 */
import { useState } from 'react'
import type { CSSProperties } from 'react'

import { GitopsDialog } from './Dialog'
import { HealthBadge } from './HealthBadge'
import { GitopsStyles, themeStyle } from './styles'
import { SyncBadge } from './SyncBadge'
import type { GitopsApplication, HealthStatus, StatusPalette, SyncStatus } from './types'

/** Options for a sync operation. */
export interface SyncOptions {
  prune?: boolean
  dryRun?: boolean
}

export interface GitopsSyncDialogProps {
  open: boolean
  app?: Pick<GitopsApplication, 'name'>
  onClose?: () => void
  onConfirm?: (opts: SyncOptions) => void
  busy?: boolean
  theme?: 'light' | 'dark'
}

export function GitopsSyncDialog({ open, app, onClose, onConfirm, busy, theme = 'dark' }: GitopsSyncDialogProps) {
  const [opts, setOpts] = useState<SyncOptions>({ prune: false, dryRun: false })
  const set = (patch: Partial<SyncOptions>) => setOpts((o) => ({ ...o, ...patch }))
  return (
    <GitopsDialog
      open={open}
      theme={theme}
      onClose={onClose}
      title={app ? `Sync ${app.name}` : 'Sync application'}
      footer={
        <>
          <button type="button" className="hz-gitops-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="hz-gitops-btn hz-gitops-btn--primary" onClick={() => onConfirm?.(opts)} disabled={busy}>
            {busy ? 'Syncing…' : opts.dryRun ? 'Dry run' : 'Synchronize'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="hz-gitops-muted" style={{ margin: 0, fontSize: 13 }}>
          Reconcile live state to the desired manifests at the target revision.
        </p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!opts.prune} onChange={(e) => set({ prune: e.target.checked })} />
          <span>
            <strong>Prune</strong>
            <div className="hz-gitops-muted" style={{ fontSize: 12 }}>Delete resources no longer present in the source.</div>
          </span>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!opts.dryRun} onChange={(e) => set({ dryRun: e.target.checked })} />
          <span>
            <strong>Dry run</strong>
            <div className="hz-gitops-muted" style={{ fontSize: 12 }}>Preview the changes without applying them.</div>
          </span>
        </label>
      </div>
    </GitopsDialog>
  )
}

export interface GitopsSyncPanelProps {
  app: GitopsApplication
  theme?: 'light' | 'dark'
  /** Invoked with the chosen options when a sync is confirmed. */
  onSync?: (opts: SyncOptions) => void
  onRefresh?: () => void
  /** Open the rollback history (the parent renders `GitopsRollbackDialog`). */
  onRollback?: () => void
  busy?: boolean
  healthPalette?: Partial<Record<HealthStatus, StatusPalette>>
  syncPalette?: Partial<Record<SyncStatus, StatusPalette>>
  style?: CSSProperties
}

export function GitopsSyncPanel({
  app,
  theme = 'dark',
  onSync,
  onRefresh,
  onRollback,
  busy,
  healthPalette,
  syncPalette,
  style,
}: GitopsSyncPanelProps) {
  const [syncOpen, setSyncOpen] = useState(false)
  return (
    <div className="hz-gitops hz-gitops-panel" style={themeStyle(theme, { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', flexWrap: 'wrap', ...style })}>
      <GitopsStyles />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--hz-fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
        {app.revision ? <div className="hz-gitops-muted hz-gitops-mono" style={{ fontSize: 11 }}>{app.revision.slice(0, 8)}</div> : null}
      </div>
      <HealthBadge status={app.health} palette={healthPalette} />
      <SyncBadge status={app.sync} palette={syncPalette} />
      <span style={{ flex: 1 }} />
      {onRefresh ? <button type="button" className="hz-gitops-btn" onClick={onRefresh} disabled={busy}>Refresh</button> : null}
      {onRollback ? <button type="button" className="hz-gitops-btn" onClick={onRollback} disabled={busy}>History</button> : null}
      {onSync ? (
        <button type="button" className="hz-gitops-btn hz-gitops-btn--primary" onClick={() => setSyncOpen(true)} disabled={busy}>
          Sync
        </button>
      ) : null}
      <GitopsSyncDialog
        open={syncOpen}
        app={app}
        theme={theme}
        busy={busy}
        onClose={() => setSyncOpen(false)}
        onConfirm={(opts) => {
          setSyncOpen(false)
          onSync?.(opts)
        }}
      />
    </div>
  )
}
