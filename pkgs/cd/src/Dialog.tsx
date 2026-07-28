'use client'

/**
 * A minimal modal dialog — a fixed overlay + centered panel, closed on backdrop
 * click or Escape. Portal-free and dependency-free (position: fixed covers the
 * viewport); sets its own theme vars so it renders correctly wherever it mounts.
 */
import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { GitopsStyles, themeStyle } from './styles'

export interface GitopsDialogProps {
  open: boolean
  title?: ReactNode
  onClose?: () => void
  children?: ReactNode
  footer?: ReactNode
  theme?: 'light' | 'dark'
  width?: number
}

export function GitopsDialog({ open, title, onClose, children, footer, theme = 'dark', width }: GitopsDialogProps) {
  useEffect(() => {
    if (!open || !onClose) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="hz-gitops hz-gitops-overlay"
      style={themeStyle(theme)}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <GitopsStyles />
      <div className="hz-gitops-dialog" style={width ? { maxWidth: width } : undefined} role="dialog" aria-modal>
        {title ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--hz-border)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--hz-fg-strong)', flex: 1 }}>{title}</div>
            {onClose ? (
              <button type="button" className="hz-gitops-btn" onClick={onClose} title="Close" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            ) : null}
          </div>
        ) : null}
        <div style={{ padding: 16 }}>{children}</div>
        {footer ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--hz-border)' }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
