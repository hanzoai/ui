'use client'

import * as React from 'react'
import type { BillingAccount, BillingRole } from '../types'

export interface AccountSwitcherProps {
  accounts: BillingAccount[]
  activeAccountId: string | null
  onSwitch: (accountId: string) => void
  onCreate?: () => void
}

function roleBadgeClass(role: BillingRole): string {
  switch (role) {
    case 'owner':
      return 'bg-brand/20 text-brand'
    case 'admin':
      return 'bg-amber-500/20 text-amber-400'
    case 'viewer':
      return 'bg-text-dim/20 text-text-muted'
  }
}

function planBadgeClass(_plan: string): string {
  return 'bg-text-dim/20 text-text-muted'
}

function formatBalance(balance: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(balance / 100)
}

export function AccountSwitcher({ accounts, activeAccountId, onSwitch, onCreate }: AccountSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null

  if (accounts.length === 0 && !onCreate) return null

  return (
    <div ref={ref} className="relative mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-card px-4 py-3 text-left transition hover:bg-bg-elevated"
      >
        {active ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/20 text-sm font-bold text-brand">
              {active.orgName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text">{active.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${planBadgeClass(active.plan)}`}>
                  {active.plan}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(active.role)}`}>
                  {active.role}
                </span>
              </div>
              <span className="text-xs text-text-muted">
                {active.orgName} &middot; {formatBalance(active.balance, active.currency)}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-text-muted">No billing account</span>
        )}
        <svg
          className={`h-4 w-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-bg-card shadow-lg">
          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {accounts.map((account) => {
              const isActive = account.id === activeAccountId
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    onSwitch(account.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-bg-elevated ${
                    isActive ? 'bg-bg-elevated' : ''
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/20 text-sm font-bold text-brand">
                    {account.orgName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text truncate">{account.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${planBadgeClass(account.plan)}`}>
                        {account.plan}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(account.role)}`}>
                        {account.role}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {account.orgName} &middot; {formatBalance(account.balance, account.currency)}
                    </span>
                  </div>
                  {isActive && (
                    <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
          {onCreate && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => {
                  onCreate()
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted transition hover:bg-bg-elevated hover:text-text"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create billing account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
