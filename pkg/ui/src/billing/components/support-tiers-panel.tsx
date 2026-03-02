'use client'

import * as React from 'react'

import type { SupportTier } from '../types'

export interface SupportTiersPanelProps {
  currentTier?: string
  onSubscribe?: (tierId: string) => Promise<void>
}

const SUPPORT_TIERS: SupportTier[] = [
  {
    id: 'community',
    name: 'Community',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      'Community forum access',
      'Public documentation',
      'GitHub issues',
      '72-hour response SLA',
    ],
  },
  {
    id: 'priority',
    name: 'Priority',
    price: 99,
    billingPeriod: 'monthly',
    highlighted: true,
    features: [
      'Email support',
      'Dedicated support channel',
      '24-hour response SLA',
      'Priority bug fixes',
      'Quarterly architecture review',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    billingPeriod: 'monthly',
    features: [
      'Dedicated support engineer',
      'Slack/Teams integration',
      '4-hour response SLA',
      'Custom SLAs available',
      'Onboarding assistance',
      'Monthly strategy calls',
    ],
  },
]

function formatCurrency(value: number) {
  if (value === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function SupportTiersPanel({ currentTier, onSubscribe }: SupportTiersPanelProps) {
  const [busyTierId, setBusyTierId] = React.useState<string | null>(null)

  const handleSubscribe = React.useCallback(async (tierId: string) => {
    if (!onSubscribe) return
    setBusyTierId(tierId)
    try {
      await onSubscribe(tierId)
    } finally {
      setBusyTierId(null)
    }
  }, [onSubscribe])

  const activeTier = currentTier ?? 'community'

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-lg font-semibold text-text">Support plans</h3>
          <p className="text-sm text-text-muted">
            Choose the level of support that fits your needs. Upgrade anytime.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SUPPORT_TIERS.map((tier) => {
          const isCurrent = tier.id === activeTier
          const isBusy = busyTierId === tier.id

          return (
            <div
              key={tier.id}
              className={`relative rounded-xl border p-5 transition ${
                tier.highlighted && !isCurrent
                  ? 'border-2 border-brand bg-bg-card'
                  : isCurrent
                    ? 'border-brand bg-brand/10'
                    : 'border-border bg-bg-card'
              }`}
            >
              {tier.highlighted && !isCurrent && (
                <span className="absolute -top-3 left-4 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-brand-foreground">
                  Recommended
                </span>
              )}

              <p className="text-lg font-semibold text-text">{tier.name}</p>
              <p className="mt-2 text-2xl font-bold text-text">
                {formatCurrency(tier.price)}
                {tier.price > 0 && (
                  <span className="text-sm font-normal text-text-muted">/{tier.billingPeriod}</span>
                )}
              </p>

              <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-500">{'\u2713'}</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent || isBusy || !onSubscribe}
                onClick={() => handleSubscribe(tier.id)}
                className={`mt-5 w-full rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isCurrent
                    ? 'cursor-not-allowed bg-bg-elevated text-text-dim'
                    : isBusy
                      ? 'cursor-wait bg-bg-elevated text-text-muted'
                      : tier.highlighted
                        ? 'bg-brand text-brand-foreground hover:bg-brand-hover active:scale-[0.97]'
                        : 'bg-text text-bg hover:opacity-80'
                }`}
              >
                {isCurrent
                  ? 'Current plan'
                  : isBusy
                    ? 'Subscribing...'
                    : tier.price === 0
                      ? 'Downgrade'
                      : 'Upgrade'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
