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
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  unpaid: {
    label: 'Unpaid',
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  },
  void: {
    label: 'Void',
    className: 'bg-zinc-100 text-zinc-700 ring-zinc-600/20',
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
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Invoice history</h3>
            <p className="text-sm text-zinc-500">{filtered.length} invoice(s) matching current filters</p>
          </div>
          <div className="inline-flex rounded-lg border border-zinc-200 p-1">
            <button
              type="button"
              onClick={() => setView('table')}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                view === 'table'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                view === 'grid'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-zinc-200 p-4">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search invoices by id, number, or status"
            className="min-w-[250px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Invoice['status'] | 'all')
              setPage(1)
            }}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-900"
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
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {currentPageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  currentPageRows.map((invoice) => (
                    <tr key={invoice.id} className="bg-white">
                      <td className="px-4 py-3 text-sm text-zinc-900">
                        {invoice.number || invoice.invoiceNumber || invoice.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">{formatDate(invoice.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900">
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
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyInvoiceId === invoice.id ? 'Downloading…' : 'Download PDF'}
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
              <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-zinc-200 p-8 text-center text-sm text-zinc-500">
                No invoices found.
              </div>
            ) : (
              currentPageRows.map((invoice) => (
                <div key={invoice.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-zinc-900">
                      {invoice.number || invoice.invoiceNumber || invoice.id}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusTone[invoice.status].className}`}
                    >
                      {statusTone[invoice.status].label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">Issued {formatDate(invoice.date)}</p>
                  <p className="mt-2 text-xl font-semibold text-zinc-900">
                    {formatCurrency(invoiceAmount(invoice), invoice.currency || 'USD')}
                  </p>
                  <button
                    type="button"
                    disabled={!onDownload || busyInvoiceId === invoice.id}
                    onClick={() => handleDownload(invoice)}
                    className="mt-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyInvoiceId === invoice.id ? 'Downloading…' : 'Download PDF'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">
            Page {Math.min(page, totalPages)} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
