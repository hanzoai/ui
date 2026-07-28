'use client'

/**
 * The desired-vs-live diff — a two-gutter (old/new line number) colorized view.
 * Takes either a pre-computed unified `diff` string (→ `classifyDiff`) or the raw
 * `live` + `desired` manifests (→ `lineDiff`, an LCS line diff). A header tallies
 * additions/deletions. Pure presentation over the diff folds.
 */
import { useMemo } from 'react'

import { classifyDiff, diffStats, lineDiff } from './diff'
import type { DiffLine } from './types'

export interface GitopsDiffViewProps {
  /** A pre-computed unified diff; takes precedence over `live`/`desired`. */
  diff?: string
  /** Live (old) manifest. */
  live?: string
  /** Desired (new) manifest. */
  desired?: string
  /** Hide the additions/deletions header. */
  hideStats?: boolean
  emptyLabel?: string
  maxHeight?: number | string
}

const SIGN: Record<DiffLine['type'], string> = { add: '+', del: '-', context: ' ', hunk: '', meta: '' }
const ROW_CLASS: Record<DiffLine['type'], string> = {
  add: 'hz-gitops-diff-add',
  del: 'hz-gitops-diff-del',
  hunk: 'hz-gitops-diff-hunk',
  meta: 'hz-gitops-diff-meta',
  context: '',
}

export function GitopsDiffView({
  diff,
  live,
  desired,
  hideStats,
  emptyLabel = 'No differences — live matches desired.',
  maxHeight = 460,
}: GitopsDiffViewProps) {
  const lines = useMemo<DiffLine[]>(() => {
    if (diff && diff.trim()) return classifyDiff(diff)
    if (live !== undefined || desired !== undefined) return lineDiff(live ?? '', desired ?? '')
    return []
  }, [diff, live, desired])

  const stats = useMemo(() => diffStats(lines), [lines])
  const hasChange = stats.additions > 0 || stats.deletions > 0

  if (!lines.length || !hasChange) {
    return <div className="hz-gitops-muted" style={{ padding: 16, fontSize: 13 }}>{emptyLabel}</div>
  }

  return (
    <div>
      {hideStats ? null : (
        <div style={{ display: 'flex', gap: 12, padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--hz-border)' }}>
          <span style={{ color: '#3fb950', fontWeight: 700 }}>+{stats.additions}</span>
          <span style={{ color: '#f85149', fontWeight: 700 }}>−{stats.deletions}</span>
        </div>
      )}
      <div style={{ overflow: 'auto', maxHeight }}>
        <table className="hz-gitops-diff">
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className={ROW_CLASS[l.type]}>
                <td className="hz-gitops-diff-gutter">{l.oldLine ?? ''}</td>
                <td className="hz-gitops-diff-gutter">{l.newLine ?? ''}</td>
                <td>
                  <span className="hz-gitops-diff-sign">{SIGN[l.type]}</span>
                  {l.text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
