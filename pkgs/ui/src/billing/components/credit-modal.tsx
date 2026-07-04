'use client'

import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../primitives/dialog'

/**
 * Default preset top-up amounts, in cents ($10 / $25 / $50 / $100).
 * Callers may override via `topUpOptions`.
 */
const DEFAULT_TOP_UP_OPTIONS = [1000, 2500, 5000, 10000]

export interface CreditModalProps {
  /** Controls visibility. */
  open: boolean
  /** Fired on escape, overlay click, or the close affordance. */
  onClose: () => void
  /** Non-cash promotional trial credit remaining, in cents. */
  trialBalanceCents?: number
  /** Real (paid) prepaid credit remaining, in cents. */
  prepaidBalanceCents?: number
  /** Trial credit originally granted, in cents — drives the welcome copy. */
  trialGrantedCents?: number
  /** ISO 4217 currency code. */
  currency?: string
  /** Preset top-up amounts, in cents. */
  topUpOptions?: number[]
  /**
   * Injected top-up handler. The Square/HUSD payment flow lives in the caller;
   * this modal only presents amounts + buckets, then hands back the chosen cents.
   * Omit to render a read-only balance view.
   */
  onTopUp?: (amountCents: number) => void | Promise<void>
  /** First-run celebration state (e.g. trial credit just landed). */
  isNewUser?: boolean
  /** Disables actions while a payment/settlement is in flight. */
  busy?: boolean
  /** Error to surface (e.g. a failed charge). */
  error?: string | null
  /**
   * Optional caller-injected payment surface (e.g. <SquareCardForm/>),
   * rendered below the amount picker.
   */
  children?: React.ReactNode
  /** Overrides the default (non-welcome) heading. */
  title?: string
}

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100)
}

export function CreditModal({
  open,
  onClose,
  trialBalanceCents = 0,
  prepaidBalanceCents = 0,
  trialGrantedCents,
  currency = 'usd',
  topUpOptions = DEFAULT_TOP_UP_OPTIONS,
  onTopUp,
  isNewUser = false,
  busy = false,
  error,
  children,
  title = 'Credits & balance',
}: CreditModalProps) {
  const [custom, setCustom] = React.useState('')

  const totalCents = trialBalanceCents + prepaidBalanceCents
  const welcomeCents = trialGrantedCents ?? trialBalanceCents
  const showWelcome = isNewUser && welcomeCents > 0

  const customCents = React.useMemo(() => {
    const dollars = Number.parseFloat(custom)
    if (!Number.isFinite(dollars) || dollars <= 0) return 0
    return Math.round(dollars * 100)
  }, [custom])

  const topUp = React.useCallback(
    (cents: number) => {
      if (busy || cents <= 0 || !onTopUp) return
      void onTopUp(cents)
    },
    [busy, onTopUp],
  )

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-md border-border bg-bg-card text-text">
        <DialogHeader>
          <DialogTitle className="text-text">
            {showWelcome
              ? `You've got ${formatCents(welcomeCents, currency)} in free credits`
              : title}
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            {showWelcome
              ? 'Start building — trial credit is applied automatically before any charge.'
              : 'Trial credit is applied before your prepaid balance.'}
          </DialogDescription>
        </DialogHeader>

        {/* Two distinct buckets: promo trial credit vs. real prepaid money */}
        <div className="overflow-hidden rounded-xl border border-border bg-bg">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Trial</p>
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
                  Promo
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold text-text">{formatCents(trialBalanceCents, currency)}</p>
              <p className="mt-0.5 text-xs text-text-dim">Non-cash credit</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Prepaid</p>
              <p className="mt-1 text-2xl font-bold text-text">{formatCents(prepaidBalanceCents, currency)}</p>
              <p className="mt-0.5 text-xs text-text-dim">Paid credit</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
            <span className="text-sm text-text-muted">
              {formatCents(trialBalanceCents, currency)} trial + {formatCents(prepaidBalanceCents, currency)} credits
            </span>
            <span className="text-sm font-semibold text-text">Total {formatCents(totalCents, currency)}</span>
          </div>
        </div>

        {/* Top-up affordance. The payment execution is injected via onTopUp. */}
        {onTopUp && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-text">Add credits</p>
            {topUpOptions.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {topUpOptions.map((cents) => (
                  <button
                    key={cents}
                    type="button"
                    disabled={busy}
                    onClick={() => topUp(cents)}
                    className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-semibold text-text transition hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {formatCents(cents, currency)}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-dim">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Custom amount"
                  disabled={busy}
                  className="w-full rounded-lg border border-border bg-bg py-2 pl-7 pr-3 text-sm text-text placeholder:text-text-dim focus:border-brand focus:outline-none disabled:opacity-60"
                />
              </div>
              <button
                type="button"
                disabled={busy || customCents <= 0}
                onClick={() => topUp(customCents)}
                className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Processing…' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Injected payment surface (e.g. <SquareCardForm/> or an HUSD flow). */}
        {children}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
