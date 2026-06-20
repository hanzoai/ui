'use client'

/**
 * HanzoTopup — main popup dialog.
 *
 * Renders a floating dialog (no @hanzo/ui Dialog dependency — self-contained)
 * with amount selector, 3 payment tabs, and a success confirmation.
 */

import React, { useEffect } from 'react'
import type { TopupConfig } from '../types'
import { useTopup } from '../hooks/useTopup'
import { PRESET_AMOUNTS, MIN_AMOUNT_CENTS } from '../types'
import { PaymentStep, TabBar } from './PaymentStep'
import { SuccessStep } from './SuccessStep'
import { Spinner } from './CardInput'

export interface HanzoTopupProps {
  config: TopupConfig
  /** Controlled open state. If not provided, managed internally. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function HanzoTopup({ config, open: controlledOpen, onOpenChange }: HanzoTopupProps) {
  const topup = useTopup(config)
  const isOpen = controlledOpen !== undefined ? controlledOpen : topup.open

  // Sync controlled open → internal
  useEffect(() => {
    if (controlledOpen === true && !topup.open) topup.openDialog()
    if (controlledOpen === false && topup.open) topup.closeDialog()
  }, [controlledOpen])

  const handleClose = () => {
    topup.closeDialog()
    onOpenChange?.(false)
  }

  if (!isOpen) return null

  const currency = config.currency ?? 'usd'
  const isProcessing = topup.status === 'processing' || topup.status === 'loading'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add funds"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'rgb(9,9,11)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#fafafa', margin: 0 }}>
            Add Funds
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', padding: '4px',
              lineHeight: 1, fontSize: '18px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Success state */}
        {topup.status === 'success' && topup.newBalance !== null ? (
          <SuccessStep
            newBalanceCents={topup.newBalance}
            currency={currency}
            onClose={handleClose}
          />
        ) : (
          <>
            {/* Amount selector */}
            <AmountSelector
              amountCents={topup.amountCents}
              currency={currency}
              onChange={topup.setAmountCents}
              disabled={isProcessing}
            />

            {/* Payment tabs */}
            <TabBar active={topup.tab} onSelect={topup.setTab} />

            {/* Top-level error */}
            {topup.status === 'error' && topup.error && (
              <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px' }}>
                {topup.error}
              </p>
            )}

            {/* Processing overlay */}
            {topup.status === 'processing' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                <Spinner />
                Processing payment\u2026
              </div>
            )}

            <PaymentStep
              config={config}
              tab={topup.tab}
              amountCents={topup.amountCents}
              disabled={isProcessing}
              onCardToken={topup.submitCard}
              onFetchCryptoAddress={topup.fetchWalletAddress}
              onCryptoConfirmSent={topup.startCryptoPoll}
              walletAddress={topup.walletAddress}
              cryptoLoading={topup.status === 'loading' && topup.tab === 'crypto'}
              cryptoPolling={topup.pollingForCrypto}
              cryptoError={topup.tab === 'crypto' && topup.status === 'error' ? topup.error : null}
            />
          </>
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Amount selector
// ---------------------------------------------------------------------------

interface AmountSelectorProps {
  amountCents: number
  currency: string
  onChange: (cents: number) => void
  disabled?: boolean
}

function AmountSelector({ amountCents, currency, onChange, disabled }: AmountSelectorProps) {
  const [customMode, setCustomMode] = React.useState(false)
  const [customValue, setCustomValue] = React.useState('')

  const handlePreset = (cents: number) => {
    setCustomMode(false)
    onChange(cents)
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    setCustomValue(raw)
    const dollars = parseFloat(raw)
    if (!isNaN(dollars)) {
      const cents = Math.round(dollars * 100)
      if (cents >= MIN_AMOUNT_CENTS) onChange(cents)
    }
  }

  const isPreset = PRESET_AMOUNTS.some(p => p.cents === amountCents)

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>
        Amount
      </label>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {PRESET_AMOUNTS.map(p => (
          <button
            key={p.cents}
            type="button"
            disabled={!!disabled}
            onClick={() => handlePreset(p.cents)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: !customMode && amountCents === p.cents ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)',
              backgroundColor: !customMode && amountCents === p.cents ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: !customMode && amountCents === p.cents ? '#fafafa' : 'rgba(255,255,255,0.5)',
              fontSize: '14px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}

        <button
          type="button"
          disabled={!!disabled}
          onClick={() => setCustomMode(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid',
            borderColor: customMode ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)',
            backgroundColor: customMode ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: customMode ? '#fafafa' : 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          Custom
        </button>
      </div>

      {customMode && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="10.00"
            value={customValue}
            onChange={handleCustomChange}
            disabled={!!disabled}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#fafafa',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            {currency.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}
