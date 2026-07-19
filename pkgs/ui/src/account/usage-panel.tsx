'use client'
/**
 * UsagePanel — per-period usage breakdown.
 *
 * A table of metered lines with a total footer, an optional period selector,
 * and a first-class empty state. Data-agnostic: pass rows + a period change
 * callback; the panel owns none of it.
 */
import * as React from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../primitives/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/select'
import { cn } from '../utils'
import { formatCurrency, formatQuantity } from './format'
import type { CurrencyCode, UsageRow } from './types'

export interface UsagePeriodOption {
  value: string
  label: string
}

export interface UsagePanelProps {
  /** Panel heading (e.g. "Usage this period"). */
  title?: string
  rows: UsageRow[]
  currency?: CurrencyCode
  /** Period options; when provided a Select is rendered in the header. */
  periods?: UsagePeriodOption[]
  /** Controlled selected period value. */
  period?: string
  onPeriodChange?: (value: string) => void
  /**
   * Total in whole currency units. When omitted it is summed from the rows.
   */
  total?: number
  /** Shown when `rows` is empty. Defaults to a neutral placeholder. */
  emptyState?: React.ReactNode
  className?: string
}

export const UsagePanel = React.forwardRef<HTMLDivElement, UsagePanelProps>(
  (
    {
      title = 'Usage',
      rows,
      currency = 'USD',
      periods,
      period,
      onPeriodChange,
      total,
      emptyState,
      className,
    },
    ref,
  ) => {
    const computedTotal =
      typeof total === 'number'
        ? total
        : rows.reduce((sum, r) => sum + r.cost, 0)
    const isEmpty = rows.length === 0

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {periods && periods.length > 0 && (
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="h-8 w-[160px] text-xs" aria-label="Billing period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isEmpty ? (
          <div className="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
            {emptyState ?? 'No usage recorded for this period.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Item
                </TableHead>
                <TableHead className="h-9 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Quantity
                </TableHead>
                <TableHead className="h-9 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cost
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatQuantity(row.quantity)}
                    {row.unit ? (
                      <span className="ml-1 text-xs">{row.unit}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.cost, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell />
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(computedTotal, currency)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </div>
    )
  },
)
UsagePanel.displayName = 'UsagePanel'
