'use client'

import * as React from 'react'

import type { Invoice, InvoiceFilters } from '../types'

export interface InvoiceManagerProps {
  invoices?: Invoice[]
  onDownload?: (invoice: Invoice) => Promise<void>
  onFilter?: (filters: InvoiceFilters) => void
  defaultView?: 'table' | 'grid'
  pageSize?: number
}

function formatCurrency(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function invoiceAmount(invoice: Invoice) {
  if (typeof invoice.breakdown?.totalCents === 'number') {
    return invoice.breakdown.totalCents / 100
  }
  if (typeof invoice.total === 'number') {
    return invoice.total
  }
  return invoice.amount
}

const statusTone: Record<
  Invoice['status'],
  { label: string; className: string }
> = {
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
  },
  unpaid: {
    label: 'Unpaid',
    className: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-sky-500/10 text-sky-500 ring-sky-500/20',
  },
  void: {
    label: 'Void',
    className: 'bg-text-dim/10 text-text-muted ring-text-dim/20',
  },
}

const statusOptions: Array<Invoice['status'] | 'all'> = [
  'all',
  'paid',
  'pending',
  'unpaid',
  'failed',
  'refunded',
  'void',
]

export function InvoiceManager(props: InvoiceManagerProps) {
  const {
    invoices = [],
    onDownload,
    onFilter,
    defaultView = 'table',
    pageSize = 10,
  } = props

  const [view, setView] = React.useState<'table' | 'grid'>(defaultView)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<Invoice['status'] | 'all'>('all')
  const [page, setPage] = React.useState(1)
  const [busyInvoiceId, setBusyInvoiceId] = React.useState<string | null>(null)

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()

    return invoices
      .filter((invoice) => {
        if (status !== 'all' && invoice.status !== status) {
          return false
        }

        if (!q) {
          return true
        }

        return [
          invoice.invoiceNumber,
          invoice.number ?? '',
          invoice.id,
          invoice.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [invoices, search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  const currentPageRows = React.useMemo(() => {
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize, totalPages])

  React.useEffect(() => {
    onFilter?.({
      status: status === 'all' ? undefined : status,
      search: search.trim() || undefined,
    })
  }, [onFilter, search, status])

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleDownload = React.useCallback(
    async (invoice: Invoice) => {
      if (!onDownload) return
      setBusyInvoiceId(invoice.id)
      try {
        await onDownload(invoice)
      } finally {
        setBusyInvoiceId(null)
      }
    },
    [onDownload],
  )

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Invoice history</h3>
            <p className="text-sm text-text-muted">{filtered.length} invoice(s) matching current filters</p>
          </div>
          <div className="inline-flex rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => setView('table')}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                view === 'table'
                  ? 'bg-text text-bg'
                  : 'text-text-muted hover:bg-bg-elevated'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                view === 'grid'
                  ? 'bg-text text-bg'
                  : 'text-text-muted hover:bg-bg-elevated'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search invoices by id, number, or status"
            className="min-w-[250px] flex-1 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text outline-none transition focus:border-brand"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Invoice['status'] | 'all')
              setPage(1)
            }}
            className="rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text-secondary outline-none transition focus:border-brand"
          >
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {value === 'all' ? 'All statuses' : statusTone[value].label}
              </option>
            ))}
          </select>
        </div>

        {view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-bg-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentPageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  currentPageRows.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 text-sm text-text">
                        {invoice.number || invoice.invoiceNumber || invoice.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(invoice.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {formatCurrency(invoiceAmount(invoice), invoice.currency || 'USD')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusTone[invoice.status].className}`}
                        >
                          {statusTone[invoice.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={!onDownload || busyInvoiceId === invoice.id}
                          onClick={() => handleDownload(invoice)}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyInvoiceId === invoice.id ? 'Downloading\u2026' : 'Download PDF'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {currentPageRows.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-border p-8 text-center text-sm text-text-muted">
                No invoices found.
              </div>
            ) : (
              currentPageRows.map((invoice) => (
                <div key={invoice.id} className="rounded-lg border border-border bg-bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-text">
                      {invoice.number || invoice.invoiceNumber || invoice.id}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusTone[invoice.status].className}`}
                    >
                      {statusTone[invoice.status].label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-muted">Issued {formatDate(invoice.date)}</p>
                  <p className="mt-2 text-xl font-semibold text-text">
                    {formatCurrency(invoiceAmount(invoice), invoice.currency || 'USD')}
                  </p>
                  <button
                    type="button"
                    disabled={!onDownload || busyInvoiceId === invoice.id}
                    onClick={() => handleDownload(invoice)}
                    className="mt-4 w-full rounded-md border border-border px-3 py-2 text-xs font-medium text-text-secondary transition hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyInvoiceId === invoice.id ? 'Downloading\u2026' : 'Download PDF'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

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
      </div>
    </div>
  )
}
