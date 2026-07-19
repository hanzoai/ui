'use client'
/**
 * InvoiceTable — billing history.
 *
 * Neutral throughout except the one place semantics earn color: the status
 * pill. paid / open / failed read at a glance via a dot + tint; everything
 * else stays monochrome. Amounts are tabular for clean vertical alignment.
 */
import * as React from 'react'
import { Download } from 'lucide-react'

import { Button } from '../../primitives/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../primitives/table'
import { cn } from '../utils'
import { formatCurrency, formatDate } from './format'
import type { CurrencyCode, Invoice, InvoiceStatus } from './types'

const STATUS: Record<
  InvoiceStatus,
  { label: string; dot: string; pill: string }
> = {
  paid: {
    label: 'Paid',
    dot: 'bg-emerald-500',
    pill: 'text-emerald-700 ring-emerald-500/25 bg-emerald-500/10 dark:text-emerald-400',
  },
  open: {
    label: 'Open',
    dot: 'bg-amber-500',
    pill: 'text-amber-700 ring-amber-500/25 bg-amber-500/10 dark:text-amber-400',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-red-500',
    pill: 'text-red-700 ring-red-500/25 bg-red-500/10 dark:text-red-400',
  },
  void: {
    label: 'Void',
    dot: 'bg-muted-foreground',
    pill: 'text-muted-foreground ring-border bg-muted',
  },
  refunded: {
    label: 'Refunded',
    dot: 'bg-muted-foreground',
    pill: 'text-muted-foreground ring-border bg-muted',
  },
}

function StatusPill({ status }: { status: InvoiceStatus }) {
  const s = STATUS[status] ?? STATUS.open
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        s.pill,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

export interface InvoiceTableProps {
  invoices: Invoice[]
  currency?: CurrencyCode
  /** When provided, downloadable invoices show a download button. */
  onDownload?: (id: string) => void
  emptyState?: React.ReactNode
  className?: string
}

export const InvoiceTable = React.forwardRef<HTMLDivElement, InvoiceTableProps>(
  ({ invoices, currency = 'USD', onDownload, emptyState, className }, ref) => {
    const isEmpty = invoices.length === 0
    const showActions = Boolean(onDownload)

    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
          className,
        )}
      >
        {isEmpty ? (
          <div className="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
            {emptyState ?? 'No invoices yet.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Invoice
                </TableHead>
                <TableHead className="h-9 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="h-9 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="h-9 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Amount
                </TableHead>
                {showActions && (
                  <TableHead className="h-9 w-10 text-right">
                    <span className="sr-only">Download</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium tabular-nums">
                    {inv.number ?? inv.id}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(inv.date)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(inv.amount, inv.currency ?? currency)}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      {inv.downloadable !== false && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Download invoice ${inv.number ?? inv.id}`}
                          onClick={() => onDownload!(inv.id)}
                        >
                          <Download className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    )
  },
)
InvoiceTable.displayName = 'InvoiceTable'
