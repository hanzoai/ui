'use client'

import * as React from 'react'

import type { TransactionRecord, TransactionType } from '../types'

export interface TransactionsPanelProps {
  transactions: TransactionRecord[]
  loading?: boolean
  pageSize?: number
}

function formatCurrency(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

const TYPE_LABELS: Record<TransactionType, { label: string; color: string }> = {
  deposit: { label: 'Deposit', color: 'text-emerald-500' },
  withdraw: { label: 'Withdrawal', color: 'text-rose-500' },
  hold: { label: 'Hold', color: 'text-amber-500' },
  'hold-removed': { label: 'Hold Released', color: 'text-sky-500' },
  transfer: { label: 'Transfer', color: 'text-violet-500' },
}

const typeFilterOptions: Array<TransactionType | 'all'> = [
  'all',
  'deposit',
  'withdraw',
  'hold',
  'hold-removed',
  'transfer',
]

export function TransactionsPanel({ transactions, loading = false, pageSize = 20 }: TransactionsPanelProps) {
  const [typeFilter, setTypeFilter] = React.useState<TransactionType | 'all'>('all')
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    if (typeFilter === 'all') return transactions
    return transactions.filter((t) => t.type === typeFilter)
  }, [transactions, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = React.useMemo(() => {
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize, totalPages])

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card p-8 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-text-dim border-t-brand" />
        <p className="mt-3 text-sm text-text-muted">Loading transactions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Transactions</h3>
            <p className="text-sm text-text-muted">{filtered.length} transaction(s)</p>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as TransactionType | 'all')
              setPage(1)
            }}
            className="rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text-secondary outline-none transition focus:border-brand"
          >
            {typeFilterOptions.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All types' : TYPE_LABELS[t].label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                pageRows.map((tx) => {
                  const typeInfo = TYPE_LABELS[tx.type] ?? { label: tx.type, color: 'text-text-muted' }
                  const isPositive = tx.type === 'deposit' || tx.type === 'hold-removed'

                  return (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-medium ${
                        isPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isPositive ? '+' : '-'}{formatCurrency(Math.abs(tx.amountCents) / 100, tx.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {tx.description || '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text-secondary">
                        {tx.balanceAfter != null ? formatCurrency(tx.balanceAfter / 100, tx.currency) : '\u2014'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4">
            <p className="text-xs text-text-muted">
              Page {Math.min(page, totalPages)} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
