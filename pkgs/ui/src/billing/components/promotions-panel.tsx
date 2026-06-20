'use client'

import * as React from 'react'

import type { DiscountCode, SubscriptionDiscount } from '../types'

export interface PromotionsPanelProps {
  discount?: SubscriptionDiscount | null
  onApplyDiscount?: (code: string) => Promise<DiscountCode | null>
}

function formatDiscount(d: SubscriptionDiscount | DiscountCode) {
  if (d.kind === 'percent') return `${d.value}% off`
  return `$${d.value} off`
}

export function PromotionsPanel({ discount, onApplyDiscount }: PromotionsPanelProps) {
  const [code, setCode] = React.useState('')
  const [applying, setApplying] = React.useState(false)
  const [result, setResult] = React.useState<{ success: boolean; message: string } | null>(null)

  const handleApply = React.useCallback(async () => {
    if (!onApplyDiscount || !code.trim()) return
    setApplying(true)
    setResult(null)
    try {
      const disc = await onApplyDiscount(code.trim())
      if (disc && disc.valid) {
        setResult({
          success: true,
          message: `Applied: ${disc.name || disc.code} (${formatDiscount(disc)})`,
        })
        setCode('')
      } else {
        setResult({ success: false, message: 'Invalid or expired code' })
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Failed to apply code' })
    } finally {
      setApplying(false)
    }
  }, [onApplyDiscount, code])

  return (
    <div className="space-y-4">
      {/* Active discount */}
      {discount && (
        <div className="overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="border-b border-emerald-500/20 px-4 py-3">
            <h4 className="text-sm font-semibold text-emerald-500">Active discount</h4>
          </div>
          <div className="p-4">
            <p className="text-lg font-semibold text-text">
              {discount.name || discount.code || 'Discount'}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {formatDiscount(discount)}
              {discount.duration === 'repeating' && discount.durationInMonths
                ? ` for ${discount.durationInMonths} months`
                : discount.duration === 'forever'
                  ? ' forever'
                  : discount.duration === 'once'
                    ? ' (one-time)'
                    : ''}
            </p>
          </div>
        </div>
      )}

      {/* Enter code */}
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-lg font-semibold text-text">Promotions & Discounts</h3>
          <p className="text-sm text-text-muted">
            Enter a promo code, referral code, or discount code to apply to your subscription.
          </p>
        </div>
        <div className="p-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setResult(null)
              }}
              placeholder="Enter promo code"
              className="flex-1 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm font-mono uppercase text-text outline-none transition placeholder:text-text-dim focus:border-brand"
            />
            <button
              type="button"
              disabled={!code.trim() || applying || !onApplyDiscount}
              onClick={handleApply}
              className="rounded-lg bg-text px-5 py-2 text-sm font-medium text-bg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applying ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {result && (
            <p className={`mt-2 text-sm ${result.success ? 'text-success' : 'text-danger'}`}>
              {result.message}
            </p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-text-muted">
          Watch for promotional offers, seasonal discounts, and referral bonuses.
        </p>
        <p className="mt-1 text-xs text-text-dim">
          Credits and promotions are applied automatically at billing time.
        </p>
      </div>
    </div>
  )
}
