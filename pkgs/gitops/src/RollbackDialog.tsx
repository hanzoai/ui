'use client'

/**
 * The rollback dialog — the deploy history as a selectable list; confirming rolls
 * the application back to the chosen revision. Data-prop-driven: the history rows
 * come in as props and the rollback effect is an injected callback.
 */
import { useState } from 'react'
import { relativeTime } from '@hanzo/canvas/pure'

import { GitopsDialog } from './Dialog'
import type { RevisionHistory } from './types'

export interface GitopsRollbackDialogProps {
  open: boolean
  history: RevisionHistory[]
  /** Revision id currently deployed (highlighted, not selectable as a target). */
  currentId?: number
  onClose?: () => void
  onRollback?: (entry: RevisionHistory) => void
  busy?: boolean
  theme?: 'light' | 'dark'
  now?: number
}

export function GitopsRollbackDialog({
  open,
  history,
  currentId,
  onClose,
  onRollback,
  busy,
  theme = 'dark',
  now,
}: GitopsRollbackDialogProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const sorted = [...history].sort((a, b) => (b.deployedAt ?? b.id) - (a.deployedAt ?? a.id))
  const target = sorted.find((h) => h.id === picked)

  return (
    <GitopsDialog
      open={open}
      theme={theme}
      onClose={onClose}
      title="Rollback"
      footer={
        <>
          <button type="button" className="hz-gitops-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            type="button"
            className="hz-gitops-btn hz-gitops-btn--danger"
            disabled={busy || !target}
            onClick={() => target && onRollback?.(target)}
          >
            {busy ? 'Rolling back…' : 'Rollback'}
          </button>
        </>
      }
    >
      {sorted.length === 0 ? (
        <div className="hz-gitops-muted" style={{ fontSize: 13 }}>No deployment history.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflow: 'auto' }}>
          {sorted.map((h) => {
            const isCurrent = h.id === currentId
            const isPicked = h.id === picked
            return (
              <button
                key={h.id}
                type="button"
                className="hz-gitops-card"
                disabled={isCurrent}
                onClick={() => setPicked(h.id)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: isCurrent ? 'default' : 'pointer',
                  borderColor: isPicked ? 'var(--hz-accent)' : 'var(--hz-border)',
                  boxShadow: isPicked ? '0 0 0 1px var(--hz-accent)' : undefined,
                  opacity: isCurrent ? 0.6 : 1,
                }}
              >
                <span className="hz-gitops-mono" style={{ fontWeight: 700, color: 'var(--hz-fg-strong)' }}>
                  {h.revision.slice(0, 8)}
                </span>
                <span style={{ flex: 1 }} />
                {isCurrent ? <span className="hz-gitops-chip">current</span> : null}
                <span className="hz-gitops-muted" style={{ fontSize: 12 }}>
                  {h.deployedAt ? relativeTime(h.deployedAt, now) : `#${h.id}`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </GitopsDialog>
  )
}
