'use client'

/**
 * CardInput — Square Web Payments SDK card element with topup submit button.
 */

import React, { useState } from 'react'
import { useSquareCard } from '../hooks/useSquareCard'

const CONTAINER_ID = 'hanzo-sq-card-container'

export interface CardInputProps {
  squareAppId: string
  squareLocationId: string
  squareEnv?: 'sandbox' | 'production'
  amountCents: number
  currency: string
  disabled?: boolean
  onToken: (sourceId: string) => Promise<void>
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export function CardInput({
  squareAppId,
  squareLocationId,
  squareEnv = 'sandbox',
  amountCents,
  currency,
  disabled,
  onToken,
}: CardInputProps) {
  const { ready, loading, error: initError, tokenize } = useSquareCard({
    appId: squareAppId,
    locationId: squareLocationId,
    env: squareEnv,
    containerId: CONTAINER_ID,
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!ready || submitting || disabled) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const sourceId = await tokenize()
      await onToken(sourceId)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  const error = initError ?? submitError

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Square card iframe container */}
      <div
        id={CONTAINER_ID}
        style={{
          minHeight: '120px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(255,255,255,0.04)',
          padding: '12px',
        }}
      >
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '96px' }}>
            <Spinner />
          </div>
        )}
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{error}</p>
      )}

      <button
        type="button"
        disabled={!ready || submitting || !!disabled}
        onClick={() => void handlePay()}
        style={btnStyle(!ready || submitting || !!disabled)}
      >
        {submitting
          ? 'Processing\u2026'
          : `Pay ${formatAmount(amountCents, currency)}`}
      </button>

      <SecureBadge label="Square" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export function Spinner() {
  return (
    <>
      <div style={{
        width: '20px', height: '20px',
        border: '2px solid rgba(255,255,255,0.15)',
        borderTopColor: 'rgba(255,255,255,0.7)',
        borderRadius: '50%',
        animation: 'hanzo-spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes hanzo-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

export function SecureBadge({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Secured by {label} &mdash; PCI DSS compliant tokenization
    </div>
  )
}

export function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    borderRadius: '8px',
    backgroundColor: disabled ? 'rgba(250,250,250,0.25)' : 'rgb(250,250,250)',
    color: disabled ? 'rgba(9,9,11,0.4)' : 'rgb(9,9,11)',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'opacity 0.15s',
  }
}
