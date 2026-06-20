'use client'

import * as React from 'react'
import type {
  BillingMetric,
  Subscription,
  SubscriptionPlan,
  RetentionOffer,
  SubscriptionHistory,
  DiscountCode,
} from '../types'

export interface SubscriptionPortalProps {
  subscription: Subscription
  availablePlans: SubscriptionPlan[]
  usageMetrics?: BillingMetric[]
  retentionOffers?: RetentionOffer[]
  subscriptionHistory?: SubscriptionHistory[]
  onUpgrade?: (planId: string) => Promise<void>
  onDowngrade?: (planId: string) => Promise<void>
  onCancel?: (reason: string, feedback?: string) => Promise<void>
  onAcceptOffer?: (offerId: string) => Promise<void>
  onApplyDiscount?: (code: string) => Promise<DiscountCode | null>
  showHistory?: boolean
  defaultView?: 'overview' | 'plans' | 'history'
}

function formatCurrency(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const statusTone: Record<
  Subscription['status'],
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
  },
  canceled: {
    label: 'Canceled',
    className: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
  },
  past_due: {
    label: 'Past due',
    className: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
  },
  trialing: {
    label: 'Trialing',
    className: 'bg-sky-500/10 text-sky-500 ring-sky-500/20',
  },
  unpaid: {
    label: 'Unpaid',
    className: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
  },
  incomplete: {
    label: 'Incomplete',
    className: 'bg-text-dim/10 text-text-muted ring-text-dim/20',
  },
}

export function SubscriptionPortal(props: SubscriptionPortalProps) {
  const {
    subscription,
    availablePlans,
    usageMetrics = [],
    retentionOffers = [],
    subscriptionHistory = [],
    onUpgrade,
    onDowngrade,
    onCancel,
    onApplyDiscount,
    defaultView = 'overview',
  } = props

  const [view, setView] = React.useState<'overview' | 'plans' | 'history'>(defaultView)
  const [busyPlanId, setBusyPlanId] = React.useState<string | null>(null)

  // Discount code state
  const [discountCode, setDiscountCode] = React.useState('')
  const [applyingDiscount, setApplyingDiscount] = React.useState(false)
  const [discountResult, setDiscountResult] = React.useState<{ success: boolean; message: string } | null>(null)

  // Cancel confirmation
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)
  const [cancelReason, setCancelReason] = React.useState('')
  const [canceling, setCanceling] = React.useState(false)

  const currentPlan = React.useMemo(
    () => availablePlans.find((p) => p.id === subscription.planId),
    [availablePlans, subscription.planId],
  )

  const handlePlanChange = React.useCallback(
    async (plan: SubscriptionPlan) => {
      // External / contact-sales plans
      if (plan.externalUrl) {
        window.open(plan.externalUrl, '_blank', 'noopener,noreferrer')
        return
      }
      if (plan.id === currentPlan?.id) return
      setBusyPlanId(plan.id)

      try {
        if (!currentPlan || plan.price >= (currentPlan?.price ?? 0)) {
          await onUpgrade?.(plan.id)
        } else {
          await onDowngrade?.(plan.id)
        }
      } finally {
        setBusyPlanId(null)
      }
    },
    [currentPlan, onDowngrade, onUpgrade],
  )

  const handleApplyDiscount = React.useCallback(async () => {
    if (!onApplyDiscount || !discountCode.trim()) return
    setApplyingDiscount(true)
    setDiscountResult(null)
    try {
      const result = await onApplyDiscount(discountCode.trim())
      if (result && result.valid) {
        const desc = result.kind === 'percent'
          ? `${result.value}% off`
          : `${formatCurrency(result.value)} off`
        setDiscountResult({ success: true, message: `Applied: ${result.name || result.code} (${desc})` })
        setDiscountCode('')
      } else {
        setDiscountResult({ success: false, message: 'Invalid or expired discount code' })
      }
    } catch (err) {
      setDiscountResult({ success: false, message: err instanceof Error ? err.message : 'Failed to apply code' })
    } finally {
      setApplyingDiscount(false)
    }
  }, [onApplyDiscount, discountCode])

  const handleCancel = React.useCallback(async () => {
    if (!onCancel || !cancelReason.trim()) return
    setCanceling(true)
    try {
      await onCancel(cancelReason.trim())
      setShowCancelConfirm(false)
      setCancelReason('')
    } finally {
      setCanceling(false)
    }
  }, [onCancel, cancelReason])

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Subscription
            </p>
            <h2 className="text-2xl font-semibold text-text">
              {currentPlan?.name ?? 'No active plan'}
            </h2>
            <p className="text-sm text-text-secondary">
              {subscription.id
                ? `Billing period ends on ${formatDate(subscription.currentPeriodEnd)}`
                : 'Select a plan to get started'}
            </p>
            {subscription.discount && (
              <p className="text-sm text-emerald-500">
                Discount: {subscription.discount.name || subscription.discount.code} (
                {subscription.discount.kind === 'percent'
                  ? `${subscription.discount.value}% off`
                  : `${formatCurrency(subscription.discount.value)} off`}
                {subscription.discount.duration === 'repeating' && subscription.discount.durationInMonths
                  ? ` for ${subscription.discount.durationInMonths} months`
                  : subscription.discount.duration === 'forever'
                    ? ' forever'
                    : ''})
              </p>
            )}
          </div>
          {subscription.id && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone[subscription.status].className}`}
            >
              {statusTone[subscription.status].label}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-border bg-bg-elevated p-1">
          <button
            type="button"
            onClick={() => setView('overview')}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              view === 'overview'
                ? 'bg-text text-bg'
                : 'text-text-muted hover:bg-bg-card hover:text-text'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setView('plans')}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              view === 'plans'
                ? 'bg-text text-bg'
                : 'text-text-muted hover:bg-bg-card hover:text-text'
            }`}
          >
            Plans
          </button>
          <button
            type="button"
            onClick={() => setView('history')}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              view === 'history'
                ? 'bg-text text-bg'
                : 'text-text-muted hover:bg-bg-card hover:text-text'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {view === 'overview' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Current spend</p>
            <p className="mt-2 text-2xl font-semibold text-text">
              {formatCurrency(currentPlan?.price ?? 0)}
              <span className="text-sm font-normal text-text-muted">/{currentPlan?.billingPeriod ?? 'monthly'}</span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Next invoice</p>
            <p className="mt-2 text-lg font-semibold text-text">
              {subscription.id ? formatDate(subscription.currentPeriodEnd) : '\u2014'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Status</p>
            <p className="mt-2 text-lg font-semibold text-text">
              {subscription.cancelAtPeriodEnd
                ? 'Cancels at period end'
                : subscription.id
                  ? 'Auto-renewing'
                  : 'No subscription'}
            </p>
          </div>

          {/* Discount code */}
          {onApplyDiscount && subscription.id && (
            <div className="md:col-span-3 rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">Discount code</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase())
                    setDiscountResult(null)
                  }}
                  placeholder="Enter promo code"
                  className="flex-1 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm font-mono uppercase text-text outline-none transition focus:border-brand"
                />
                <button
                  type="button"
                  disabled={!discountCode.trim() || applyingDiscount}
                  onClick={handleApplyDiscount}
                  className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applyingDiscount ? 'Applying\u2026' : 'Apply'}
                </button>
              </div>
              {discountResult && (
                <p className={`mt-2 text-sm ${discountResult.success ? 'text-success' : 'text-danger'}`}>
                  {discountResult.message}
                </p>
              )}
            </div>
          )}

          {usageMetrics.length > 0 && (
            <div className="md:col-span-3 rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">Usage metrics</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {usageMetrics.map((metric) => {
                  const utilization =
                    metric.limit && metric.limit > 0
                      ? Math.min((metric.current / metric.limit) * 100, 100)
                      : 0
                  return (
                    <div key={metric.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm text-text-secondary">{metric.label}</p>
                      <p className="mt-1 text-lg font-semibold text-text">
                        {metric.current.toLocaleString()}
                        {metric.unit ? ` ${metric.unit}` : ''}
                      </p>
                      {metric.limit ? (
                        <>
                          <p className="text-xs text-text-muted">
                            of {metric.limit.toLocaleString()} {metric.unit ?? ''}
                          </p>
                          <div className="mt-2 h-2 rounded-full bg-bg-elevated">
                            <div
                              className="h-2 rounded-full bg-brand transition-all"
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                        </>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {retentionOffers.length > 0 && (
            <div className="md:col-span-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
              <p className="text-xs uppercase tracking-wide text-warning">Retention offers</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {retentionOffers.map((offer) => (
                  <div key={offer.id} className="rounded-lg border border-warning/30 bg-bg-card p-3">
                    <p className="font-medium text-text">{offer.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">{offer.description}</p>
                    <p className="mt-2 text-sm font-semibold text-warning">
                      Save {offer.discount}% for {offer.durationMonths} months
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel subscription */}
          {subscription.id && subscription.status === 'active' && !subscription.cancelAtPeriodEnd && onCancel && (
            <div className="md:col-span-3">
              {showCancelConfirm ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <p className="text-sm font-medium text-rose-400">Cancel subscription</p>
                  <p className="mt-1 text-sm text-text-muted">
                    Your subscription will remain active until {formatDate(subscription.currentPeriodEnd)}.
                  </p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Why are you canceling? (required)"
                    rows={2}
                    className="mt-3 w-full rounded-lg border border-rose-500/30 bg-bg-input px-3 py-2 text-sm text-text outline-none transition focus:border-rose-500"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={!cancelReason.trim() || canceling}
                      onClick={handleCancel}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {canceling ? 'Canceling\u2026' : 'Confirm cancellation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelConfirm(false)
                        setCancelReason('')
                      }}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-bg-elevated"
                    >
                      Keep subscription
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-sm text-text-muted transition hover:text-rose-500"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {view === 'plans' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {availablePlans.map((plan) => {
            const isCurrent = plan.id === subscription.planId
            const isBusy = busyPlanId === plan.id
            const isFree = plan.price === 0
            const hasTrial = (plan.trialDays ?? 0) > 0
            const isExternal = !!plan.externalUrl || plan.contactSales
            const periodPrice = isFree ? 'Free' : `$${plan.price}/mo`

            const buttonLabel = isCurrent
              ? 'Current plan'
              : isBusy
                ? 'Applying\u2026'
                : isExternal
                  ? plan.contactSales ? 'Contact Sales \u2192' : 'Get started \u2192'
                  : hasTrial && !subscription.id
                    ? `Start ${plan.trialDays}-day free trial`
                    : currentPlan && plan.price < (currentPlan?.price ?? 0)
                      ? 'Downgrade'
                      : 'Upgrade'

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-5 transition ${
                  plan.highlighted && !isCurrent
                    ? 'border-white/[0.2] bg-[#141419]'
                    : isCurrent
                      ? 'border-white/[0.25] bg-[#141419]'
                      : 'border-white/[0.08] bg-[#141419]'
                }`}
              >
                {plan.highlighted && !isCurrent && (
                  <div className="absolute -top-px left-0 right-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-semibold text-white">{plan.name}</p>
                  {plan.badge ? (
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold flex-shrink-0 ${
                      isCurrent
                        ? 'bg-white/10 text-white/60'
                        : plan.contactSales
                          ? 'bg-amber-500/15 text-amber-400'
                          : hasTrial
                            ? 'bg-sky-500/15 text-sky-400'
                            : 'bg-white/[0.07] text-white/40'
                    }`}>
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-bold text-white">
                    {isExternal && !isFree ? `$${formatCurrency(plan.price).replace('$', '').split('.')[0]}` : periodPrice}
                    {!isFree && !isExternal && <span className="text-sm font-normal text-white/40">/mo</span>}
                    {isExternal && !isFree && <span className="text-sm font-normal text-white/40">/mo+</span>}
                  </p>
                  {plan.annualPrice && !isCurrent && (
                    <p className="mt-0.5 text-[12px] text-emerald-400">${plan.annualPrice}/yr {'\u2014'} save ${plan.price * 12 - plan.annualPrice}</p>
                  )}
                  {(plan.trialCreditCents ?? 0) > 0 && !isCurrent && (
                    <p className="mt-0.5 text-[12px] text-emerald-400">+${(plan.trialCreditCents! / 100).toFixed(0)} credit included</p>
                  )}
                </div>

                <p className="mt-3 text-[13px] leading-relaxed text-white/40">{plan.description}</p>

                <ul className="mt-4 flex-1 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] text-white/50">
                      <span className="mt-0.5 flex-shrink-0 text-white/30">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isCurrent || isBusy}
                  onClick={() => handlePlanChange(plan)}
                  className={`mt-5 w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                    isCurrent
                      ? 'cursor-not-allowed bg-white/[0.06] text-white/30'
                      : isBusy
                        ? 'cursor-wait bg-white/[0.06] text-white/30'
                        : plan.highlighted
                          ? 'bg-white text-black hover:bg-white/90'
                          : isExternal
                            ? 'bg-white/[0.08] text-white/70 hover:bg-white/[0.12] hover:text-white'
                            : hasTrial && !subscription.id
                              ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30'
                              : 'bg-white/[0.08] text-white/70 hover:bg-white/[0.12] hover:text-white'
                  }`}
                >
                  {buttonLabel}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {view === 'history' && (
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text">Subscription timeline</h3>
          </div>
          {subscriptionHistory.length === 0 ? (
            <div className="p-6 text-sm text-text-muted">No history entries yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {subscriptionHistory.map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-text">{entry.action}</p>
                    <p className="text-sm text-text-secondary">{entry.details}</p>
                    {entry.fromPlan || entry.toPlan ? (
                      <p className="text-xs text-text-muted">
                        {entry.fromPlan ?? '\u2014'} {'\u2192'} {entry.toPlan ?? '\u2014'}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs text-text-muted">{formatDate(entry.date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
