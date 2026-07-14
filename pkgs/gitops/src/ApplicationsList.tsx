'use client'

/**
 * The applications list — the grid/table of every application with its health,
 * sync, current revision and source, plus search and health/sync filters and
 * sortable columns. Data-prop-driven: the host passes `/v1/gitops/applications`
 * rows (already folded to the canonical vocabularies) and handles row opens.
 */
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { relativeTime } from '@hanzo/canvas/pure'

import { HealthBadge } from './HealthBadge'
import { healthRank } from './health'
import { GitopsStyles, themeStyle } from './styles'
import { SyncBadge } from './SyncBadge'
import { syncRank } from './sync'
import type {
  GitopsApplication,
  HealthStatus,
  StatusPalette,
  SyncStatus,
} from './types'

export interface GitopsAppListProps {
  applications: GitopsApplication[]
  theme?: 'light' | 'dark'
  view?: 'table' | 'grid'
  onOpen?: (app: GitopsApplication) => void
  /** Controlled search text; else internal. */
  search?: string
  onSearchChange?: (value: string) => void
  healthPalette?: Partial<Record<HealthStatus, StatusPalette>>
  syncPalette?: Partial<Record<SyncStatus, StatusPalette>>
  now?: number
  emptyLabel?: string
  style?: CSSProperties
}

type SortKey = 'name' | 'health' | 'sync' | 'age'

const sourceRef = (app: GitopsApplication): string => {
  const s = app.source
  if (!s) return ''
  const repo = s.repoURL?.replace(/^https?:\/\/(www\.)?/, '').replace(/\.git$/, '') ?? s.chart ?? ''
  return s.path && s.path !== '.' ? `${repo}/${s.path}` : repo
}

export function GitopsAppList({
  applications,
  theme = 'dark',
  view = 'table',
  onOpen,
  search,
  onSearchChange,
  healthPalette,
  syncPalette,
  now,
  emptyLabel = 'No applications.',
  style,
}: GitopsAppListProps) {
  const [internalSearch, setInternalSearch] = useState('')
  const q = (search ?? internalSearch).toLowerCase().trim()
  const setQ = (v: string) => {
    if (search === undefined) setInternalSearch(v)
    onSearchChange?.(v)
  }

  const [healthFilter, setHealthFilter] = useState<ReadonlySet<HealthStatus>>(new Set())
  const [syncFilter, setSyncFilter] = useState<ReadonlySet<SyncStatus>>(new Set())
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 })

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }))

  const rows = useMemo(() => {
    const filtered = applications.filter((a) => {
      if (q && !(`${a.name} ${a.project ?? ''} ${a.namespace ?? ''} ${sourceRef(a)}`.toLowerCase().includes(q))) return false
      if (healthFilter.size && !healthFilter.has(a.health)) return false
      if (syncFilter.size && !syncFilter.has(a.sync)) return false
      return true
    })
    const dir = sort.dir
    return filtered.sort((a, b) => {
      switch (sort.key) {
        case 'health':
          return (healthRank(a.health) - healthRank(b.health)) * dir
        case 'sync':
          return (syncRank(a.sync) - syncRank(b.sync)) * dir
        case 'age':
          return ((a.createdAt ?? 0) - (b.createdAt ?? 0)) * dir
        default:
          return a.name.localeCompare(b.name) * dir
      }
    })
  }, [applications, q, healthFilter, syncFilter, sort])

  const toggleIn = <T,>(set: ReadonlySet<T>, v: T): ReadonlySet<T> => {
    const next = new Set(set)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }

  const HEALTHS: HealthStatus[] = ['Healthy', 'Progressing', 'Degraded', 'Missing', 'Suspended', 'Unknown']
  const SYNCS: SyncStatus[] = ['Synced', 'OutOfSync', 'Unknown']

  const arrow = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : '')

  return (
    <div className="hz-gitops" style={themeStyle(theme, { display: 'flex', flexDirection: 'column', gap: 12, ...style })}>
      <GitopsStyles />

      {/* Toolbar: search + filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="hz-gitops-input"
          style={{ maxWidth: 280 }}
          placeholder="Search applications…"
          value={search ?? internalSearch}
          onChange={(e) => setQ(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {HEALTHS.map((h) => (
            <button
              key={h}
              type="button"
              className="hz-gitops-chip"
              onClick={() => setHealthFilter((s) => toggleIn(s, h))}
              style={healthFilter.has(h) ? { borderColor: 'var(--hz-accent)', color: 'var(--hz-fg-strong)' } : undefined}
            >
              <HealthBadge status={h} size="sm" showLabel={false} palette={healthPalette} />
              {h}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {SYNCS.map((s) => (
            <button
              key={s}
              type="button"
              className="hz-gitops-chip"
              onClick={() => setSyncFilter((set) => toggleIn(set, s))}
              style={syncFilter.has(s) ? { borderColor: 'var(--hz-accent)', color: 'var(--hz-fg-strong)' } : undefined}
            >
              <SyncBadge status={s} size="sm" showLabel={false} palette={syncPalette} />
              {s}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <span className="hz-gitops-muted" style={{ fontSize: 12 }}>
          {rows.length} of {applications.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="hz-gitops-panel hz-gitops-muted" style={{ padding: 24, textAlign: 'center', fontSize: 13 }}>
          {emptyLabel}
        </div>
      ) : view === 'grid' ? (
        <div className="hz-gitops-card-grid">
          {rows.map((a) => (
            <div
              key={a.name}
              className="hz-gitops-card"
              style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, cursor: onOpen ? 'pointer' : 'default' }}
              onClick={onOpen ? () => onOpen(a) : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: 'var(--hz-fg-strong)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <HealthBadge status={a.health} size="sm" palette={healthPalette} />
                <SyncBadge status={a.sync} size="sm" palette={syncPalette} />
              </div>
              {sourceRef(a) ? (
                <div className="hz-gitops-muted hz-gitops-mono" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sourceRef(a)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="hz-gitops-panel" style={{ overflow: 'auto' }}>
          <table className="hz-gitops-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}>Name{arrow('name')}</th>
                <th onClick={() => toggleSort('sync')}>Sync{arrow('sync')}</th>
                <th onClick={() => toggleSort('health')}>Health{arrow('health')}</th>
                <th>Revision</th>
                <th>Source</th>
                <th onClick={() => toggleSort('age')}>Age{arrow('age')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.name} className="hz-gitops-row" onClick={onOpen ? () => onOpen(a) : undefined}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--hz-fg-strong)' }}>{a.name}</div>
                    {a.project || a.namespace ? (
                      <div className="hz-gitops-muted" style={{ fontSize: 11 }}>
                        {[a.project, a.namespace].filter(Boolean).join(' · ')}
                      </div>
                    ) : null}
                  </td>
                  <td><SyncBadge status={a.sync} size="sm" palette={syncPalette} /></td>
                  <td><HealthBadge status={a.health} size="sm" palette={healthPalette} /></td>
                  <td className="hz-gitops-mono hz-gitops-muted" style={{ fontSize: 12 }}>{a.revision?.slice(0, 8) ?? ''}</td>
                  <td className="hz-gitops-mono hz-gitops-muted" style={{ fontSize: 12, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sourceRef(a)}</td>
                  <td className="hz-gitops-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{a.createdAt ? relativeTime(a.createdAt, now) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
