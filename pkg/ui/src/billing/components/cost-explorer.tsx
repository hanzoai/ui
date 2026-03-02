'use client'

import { useState, useMemo } from 'react'
import type { UsageSummary, UsageRecord } from '../types'

export interface CostExplorerProps {
  usage: UsageSummary | null
  usageLoading: boolean
}

type TimeRange = '7d' | '30d' | '90d'
type SortKey = 'cost' | 'usage' | 'label'

function fmt(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

const meterLabels: Record<string, string> = {
  ai: 'LLM / Chat',
  api_calls: 'API Requests',
  storage: 'Storage',
  gpu: 'GPU Compute',
  network: 'Network',
  network_egress: 'Egress',
}

const meterColors: Record<string, string> = {
  ai: 'bg-violet-500',
  api_calls: 'bg-indigo-500',
  storage: 'bg-blue-500',
  gpu: 'bg-amber-500',
  network: 'bg-emerald-500',
  network_egress: 'bg-teal-500',
}

export function CostExplorer({ usage, usageLoading }: CostExplorerProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('cost')
  const [sortAsc, setSortAsc] = useState(false)

  const records = usage?.records ?? []
  const totalCost = usage?.totalCost ?? 0
  const currency = usage?.currency ?? 'usd'

  // Available product types from records
  const productTypes = useMemo(() => {
    const types = new Set(records.map(r => r.meterId))
    return Array.from(types)
  }, [records])

  // Filtered + sorted records
  const filtered = useMemo(() => {
    let list = productFilter === 'all' ? records : records.filter(r => r.meterId === productFilter)
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'cost') cmp = a.cost - b.cost
      else if (sortKey === 'usage') cmp = a.current - b.current
      else cmp = a.label.localeCompare(b.label)
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [records, productFilter, sortKey, sortAsc])

  // Top 5 drivers by cost
  const topDrivers = useMemo(() =>
    [...records].sort((a, b) => b.cost - a.cost).slice(0, 5),
    [records]
  )

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortAsc ? ' \u2191' : ' \u2193') : ''

  if (usageLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-dim border-t-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-card p-4">
        {/* Time range */}
        <div className="flex gap-1 rounded-lg bg-bg p-0.5">
          {(['7d', '30d', '90d'] as TimeRange[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeRange(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                timeRange === t ? 'bg-bg-elevated text-text' : 'text-text-muted hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Product */}
        <select
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-input px-3 py-1.5 text-xs text-text outline-none"
        >
          <option value="all">All products</option>
          {productTypes.map(t => (
            <option key={t} value={t}>{meterLabels[t] ?? t}</option>
          ))}
        </select>

        {/* Placeholders for future filters */}
        <select disabled className="rounded-lg border border-border bg-bg-input px-3 py-1.5 text-xs text-text-dim opacity-50 cursor-not-allowed">
          <option>Model (coming soon)</option>
        </select>
        <select disabled className="rounded-lg border border-border bg-bg-input px-3 py-1.5 text-xs text-text-dim opacity-50 cursor-not-allowed">
          <option>Project (coming soon)</option>
        </select>
      </div>

      {/* Total + chart placeholder */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-dim">Total Cost ({timeRange})</p>
            <p className="text-3xl font-bold text-text mt-1">{fmt(totalCost, currency)}</p>
          </div>
          {usage?.period && (
            <p className="text-xs text-text-muted">
              {new Date(usage.period.start).toLocaleDateString()} {'\u2014'} {new Date(usage.period.end).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center h-32 rounded-lg bg-bg border border-dashed border-border">
          <p className="text-xs text-text-dim">Cost trend chart {'\u2014'} coming soon</p>
        </div>
      </div>

      {/* Top drivers */}
      {topDrivers.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-text-dim mb-3">Top Drivers</h3>
          <div className="space-y-2">
            {topDrivers.map(rec => {
              const pct = totalCost > 0 ? (rec.cost / totalCost) * 100 : 0
              const color = meterColors[rec.meterId] ?? 'bg-gray-500'
              return (
                <div key={rec.meterId} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-text-muted truncate">{meterLabels[rec.meterId] ?? rec.label}</span>
                  <div className="flex-1 h-4 rounded bg-bg-elevated overflow-hidden">
                    <div className={`h-full rounded ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs font-medium text-text">{fmt(rec.cost)}</span>
                  <span className="w-12 shrink-0 text-right text-[11px] text-text-muted">{pct.toFixed(1)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-elevated text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => handleSort('label')}>
                Product{sortIndicator('label')}
              </th>
              <th className="px-4 py-3 text-left">Meter</th>
              <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => handleSort('usage')}>
                Usage{sortIndicator('usage')}
              </th>
              <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => handleSort('cost')}>
                Cost{sortIndicator('cost')}
              </th>
              <th className="px-4 py-3 text-right">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">
                  No usage data for this period.
                </td>
              </tr>
            ) : (
              filtered.map(rec => {
                const pct = totalCost > 0 ? (rec.cost / totalCost) * 100 : 0
                return (
                  <tr key={rec.meterId} className="hover:bg-bg-card transition-colors">
                    <td className="px-4 py-3 text-text font-medium">{meterLabels[rec.meterId] ?? rec.label}</td>
                    <td className="px-4 py-3 text-text-muted">{rec.meterId}</td>
                    <td className="px-4 py-3 text-right text-text">
                      {rec.current.toLocaleString()} {rec.unit}
                      {rec.limit ? <span className="text-text-dim"> / {rec.limit.toLocaleString()}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-right text-text font-medium">{fmt(rec.cost)}</td>
                    <td className="px-4 py-3 text-right text-text-muted">{pct.toFixed(1)}%</td>
                  </tr>
                )
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-bg-elevated font-medium">
                <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-wide text-text-muted">Total</td>
                <td className="px-4 py-3 text-right text-text">{fmt(totalCost, currency)}</td>
                <td className="px-4 py-3 text-right text-text-muted">100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
