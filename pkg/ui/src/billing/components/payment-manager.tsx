'use client'

import * as React from 'react'

import type { PaymentMethod } from '../types'

export interface PaymentMethodManagerProps {
  paymentMethods?: PaymentMethod[]
  initialMethods?: PaymentMethod[]
  onAdd?: (method: PaymentMethod) => Promise<void>
  onRemove?: (id: string) => Promise<void>
  onSetDefault?: (id: string) => Promise<void>
  onMethodAdded?: (method: PaymentMethod) => void
  onMethodRemoved?: (id: string) => void
  onDefaultChanged?: (id: string) => void
}

interface DraftMethod {
  holderName: string
  type: PaymentMethod['type']
  cardBrand: string
  last4: string
  expMonth: string
  expYear: string
}

const defaultDraft: DraftMethod = {
  holderName: '',
  type: 'card',
  cardBrand: 'visa',
  last4: '',
  expMonth: '',
  expYear: '',
}

function formatCardBrand(brand: string) {
  if (!brand) return 'Card'
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

function buildPaymentMethodFromDraft(draft: DraftMethod): PaymentMethod {
  const now = new Date().toISOString()
  const id = `pm_${Math.random().toString(36).slice(2, 12)}`

  if (draft.type === 'card') {
    return {
      id,
      type: 'card',
      is_default: false,
      created_at: now,
      isDefault: false,
      card: {
        brand: draft.cardBrand,
        last4: draft.last4,
        exp_month: Number(draft.expMonth),
        exp_year: Number(draft.expYear),
        funding: 'credit',
      },
      billing_details: {
        name: draft.holderName,
      },
    }
  }

  return {
    id,
    type: draft.type,
    is_default: false,
    created_at: now,
    isDefault: false,
    billing_details: {
      name: draft.holderName,
    },
  }
}

function methodDisplay(method: PaymentMethod) {
  if (method.type === 'card') {
    return `${formatCardBrand(method.card?.brand || '')} •••• ${method.card?.last4 || '••••'}`
  }
  if (method.type === 'paypal') {
    return `PayPal ${method.paypal?.email ? `(${method.paypal.email})` : ''}`
  }
  if (method.type === 'bank_account' || method.type === 'sepa_debit') {
    return `${method.bank_account?.bankName || 'Bank account'} •••• ${method.bank_account?.last4 || '••••'}`
  }
  if (method.type === 'apple_pay') {
    return 'Apple Pay'
  }
  return 'Google Pay'
}

function methodExpiration(method: PaymentMethod) {
  if (method.type !== 'card') return null
  const month = method.card?.exp_month
  const year = method.card?.exp_year
  if (!month || !year) return null
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
}

export function PaymentMethodManager(props: PaymentMethodManagerProps) {
  const {
    paymentMethods,
    initialMethods,
    onAdd,
    onRemove,
    onSetDefault,
    onMethodAdded,
    onMethodRemoved,
    onDefaultChanged,
  } = props

  const [methods, setMethods] = React.useState<PaymentMethod[]>(
    paymentMethods && paymentMethods.length > 0
      ? paymentMethods
      : initialMethods || [],
  )
  const [draft, setDraft] = React.useState<DraftMethod>(defaultDraft)
  const [isAdding, setIsAdding] = React.useState(false)
  const [busyMethodId, setBusyMethodId] = React.useState<string | null>(null)
  const [showForm, setShowForm] = React.useState(false)

  React.useEffect(() => {
    if (paymentMethods) {
      setMethods(paymentMethods)
    }
  }, [paymentMethods])

  const canCreate =
    draft.holderName.trim().length > 1 &&
    (draft.type !== 'card' || (draft.last4.length === 4 && draft.expMonth && draft.expYear))

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return
    setIsAdding(true)

    const method = buildPaymentMethodFromDraft(draft)
    try {
      await onAdd?.(method)
      setMethods((prev) => [...prev, method])
      onMethodAdded?.(method)
      setDraft(defaultDraft)
      setShowForm(false)
    } finally {
      setIsAdding(false)
    }
  }, [canCreate, draft, onAdd, onMethodAdded])

  const handleRemove = React.useCallback(
    async (id: string) => {
      setBusyMethodId(id)
      try {
        await onRemove?.(id)
        setMethods((prev) => prev.filter((m) => m.id !== id))
        onMethodRemoved?.(id)
      } finally {
        setBusyMethodId(null)
      }
    },
    [onMethodRemoved, onRemove],
  )

  const handleSetDefault = React.useCallback(
    async (id: string) => {
      setBusyMethodId(id)
      try {
        await onSetDefault?.(id)
        setMethods((prev) =>
          prev.map((method) => ({
            ...method,
            is_default: method.id === id,
            isDefault: method.id === id,
          })),
        )
        onDefaultChanged?.(id)
      } finally {
        setBusyMethodId(null)
      }
    },
    [onDefaultChanged, onSetDefault],
  )

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Payment methods</h3>
            <p className="text-sm text-zinc-500">Securely manage cards, wallets, and bank methods</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            {showForm ? 'Cancel' : 'Add method'}
          </button>
        </div>

        {showForm ? (
          <div className="grid gap-3 border-b border-zinc-200 p-4 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={draft.holderName}
              onChange={(e) => setDraft((prev) => ({ ...prev, holderName: e.target.value }))}
              placeholder="Cardholder name"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
            />
            <select
              value={draft.type}
              onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as PaymentMethod['type'] }))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
            >
              <option value="card">Card</option>
              <option value="paypal">PayPal</option>
              <option value="apple_pay">Apple Pay</option>
              <option value="google_pay">Google Pay</option>
              <option value="bank_account">Bank account</option>
            </select>
            <input
              value={draft.last4}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  last4: e.target.value.replace(/\D/g, '').slice(0, 4),
                }))
              }
              placeholder="Last 4 digits"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
            />
            <input
              value={draft.expMonth}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  expMonth: e.target.value.replace(/\D/g, '').slice(0, 2),
                }))
              }
              placeholder="MM"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
            />
            <div className="flex gap-2">
              <input
                value={draft.expYear}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    expYear: e.target.value.replace(/\D/g, '').slice(0, 4),
                  }))
                }
                placeholder="YYYY"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
              />
              <button
                type="button"
                disabled={!canCreate || isAdding}
                onClick={handleCreate}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAdding ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="divide-y divide-zinc-200">
          {methods.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">No payment methods on file.</div>
          ) : (
            methods.map((method) => {
              const isDefault = method.is_default || method.isDefault
              const isBusy = busyMethodId === method.id

              return (
                <div key={method.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{methodDisplay(method)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>
                        Added {new Date(method.created_at).toLocaleDateString('en-US')}
                      </span>
                      {methodExpiration(method) ? <span>Expires {methodExpiration(method)}</span> : null}
                      {isDefault ? (
                        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Default
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDefault ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSetDefault(method.id)}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? 'Saving…' : 'Set default'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRemove(method.id)}
                      className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
