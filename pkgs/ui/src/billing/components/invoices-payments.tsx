'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import type { Invoice } from '../types'

export interface InvoicesPaymentsProps {
  invoices: Invoice[]
  onDownloadInvoice?: (invoice: Invoice) => Promise<void>
}

function fmt(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 20

/* -- Fade-in animation -- */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px)'
    const timer = setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])
  return <div ref={ref}>{children}</div>
}

export function InvoicesPayments(props: InvoicesPaymentsProps) {
  const [page, setPage] = useState(0)
  const { invoices } = props
  const totalPages = Math.ceil(invoices.length / PAGE_SIZE)
  const pageInvoices = invoices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <FadeIn delay={0}>
      <div className="rounded-2xl border border-white/[0.08] bg-[#141419] overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-[15px] font-semibold text-white">All invoices</h3>
        </div>
        <div className="border-t border-white/[0.06]">
          {invoices.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                  <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/40">No invoices yet</p>
                <p className="mt-1 text-[13px] text-white/25">Invoices appear here once you subscribe or make a purchase.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-6 py-3 text-[13px] font-medium text-white/40">Invoice #</th>
                      <th className="px-6 py-3 text-[13px] font-medium text-white/40">Date</th>
                      <th className="px-6 py-3 text-[13px] font-medium text-white/40">Type</th>
                      <th className="px-6 py-3 text-[13px] font-medium text-white/40 text-right">Amount</th>
                      <th className="px-6 py-3 text-[13px] font-medium text-white/40 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageInvoices.map((inv, i) => (
                      <tr
                        key={inv.id}
                        className="group border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => props.onDownloadInvoice?.(inv)}
                      >
                        <td className="px-6 py-4 text-[13px] text-white font-medium">
                          #{inv.invoiceNumber || inv.number || inv.id.slice(0, 15)}
                        </td>
                        <td className="px-6 py-4 text-[13px] text-white/50">
                          {fmtDate(inv.date)}
                        </td>
                        <td className="px-6 py-4 text-[13px] text-white/50">
                          {inv.items?.length === 1 ? 'Single Purchase' : 'Monthly Invoice'}
                        </td>
                        <td className="px-6 py-4 text-[13px] text-white font-semibold text-right tabular-nums">
                          {fmt(inv.total, inv.currency)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="border-t border-white/[0.06] px-6 py-3 flex items-center justify-between bg-white/[0.02]">
                  <p className="text-[13px] text-white/30">
                    Showing {page * PAGE_SIZE + 1}{'\u2013'}{Math.min((page + 1) * PAGE_SIZE, invoices.length)} of {invoices.length}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      className="rounded-full border border-white/[0.1] px-3.5 py-1.5 text-[13px] font-medium text-white/70 transition-all hover:bg-white/[0.05] hover:border-white/[0.2] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                      className="rounded-full border border-white/[0.1] px-3.5 py-1.5 text-[13px] font-medium text-white/70 transition-all hover:bg-white/[0.05] hover:border-white/[0.2] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </FadeIn>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === 'paid' || status === 'active'
  const isFailed = status === 'failed' || status === 'uncollectible'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
        isPaid
          ? 'bg-white/[0.08] text-white/80'
          : isFailed
            ? 'bg-red-500/15 text-red-400'
            : 'bg-amber-500/15 text-amber-400'
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
