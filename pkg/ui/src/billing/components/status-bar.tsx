'use client'

import type { Subscription, SubscriptionPlan, PaymentMethod } from '../types'

export type BillingSection =
  | 'overview' | 'usage' | 'invoices' | 'pricing'
  | 'credits' | 'transactions' | 'alerts'
  | 'payment' | 'team' | 'settings'

export interface StatusBarProps {
  subscription: Subscription
  currentPlan: SubscriptionPlan | undefined
  mtdSpend: number
  currency: string
  paymentMethods: PaymentMethod[]
  onNavigate: (target: string) => void
}

function fmt(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function StatusBar({ subscription, currentPlan, mtdSpend, currency, paymentMethods, onNavigate }: StatusBarProps) {
  const planName = currentPlan?.name ?? 'Pay-as-you-go'
  const hasActivePlan = !!subscription.id && subscription.status === 'active'
  const renewalDate = subscription.currentPeriodEnd ? fmtDate(new Date(subscription.currentPeriodEnd)) : null
  const defaultPm = paymentMethods.find(m => m.is_default || m.isDefault)
  const hasPm = paymentMethods.length > 0
  const isPastDue = subscription.status === 'past_due'

  // Dynamic CTA
  let ctaLabel: string
  let ctaSection: string
  if (!hasPm) {
    ctaLabel = 'Add payment method'
    ctaSection = 'invoices:payment-methods'
  } else if (!hasActivePlan) {
    ctaLabel = 'Choose a plan'
    ctaSection = 'overview'
  } else {
    ctaLabel = 'View costs'
    ctaSection = 'usage'
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-1">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
        {/* Plan */}
        <div className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-dim mb-1">Plan</p>
          <p className="text-sm font-semibold text-text">{planName}</p>
          {renewalDate && hasActivePlan && (
            <p className="text-xs text-text-muted mt-0.5">
              {subscription.cancelAt ? 'Cancels' : 'Renews'} {renewalDate}
            </p>
          )}
        </div>

        {/* MTD Spend */}
        <div className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-dim mb-1">This Period</p>
          <p className="text-sm font-semibold text-text">{fmt(mtdSpend, currency)}</p>
          <p className="text-xs text-text-muted mt-0.5">Month-to-date</p>
        </div>

        {/* Payment Health */}
        <div className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-text-dim mb-1">Payment</p>
          {isPastDue ? (
            <p className="text-sm font-semibold text-warning">Past due</p>
          ) : hasPm ? (
            <p className="text-sm font-semibold text-text">
              {defaultPm?.card ? `${defaultPm.card.brand} \u00B7\u00B7\u00B7\u00B7${defaultPm.card.last4}` : 'Active'}
            </p>
          ) : (
            <p className="text-sm font-semibold text-danger">No payment method</p>
          )}
          {hasPm && !isPastDue && (
            <p className="text-xs text-success mt-0.5">Healthy</p>
          )}
        </div>

        {/* CTA */}
        <div className="p-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() => onNavigate(ctaSection)}
            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
