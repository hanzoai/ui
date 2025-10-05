'use client'

import type { Invoice, InvoiceFilters } from '../types'

export interface InvoiceManagerProps {
  invoices?: Invoice[]
  onDownload?: (invoice: Invoice) => Promise<void>
  onFilter?: (filters: InvoiceFilters) => void
  defaultView?: 'table' | 'grid'
  pageSize?: number
}

export function InvoiceManager(props: InvoiceManagerProps) {
  const { invoices = [] } = props

  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold">Invoices</div>
      <div className="text-muted-foreground">
        {invoices.length} invoice(s) found
      </div>
    </div>
  )
}
