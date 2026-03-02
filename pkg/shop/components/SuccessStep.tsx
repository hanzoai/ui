'use client'

/**
 * SuccessStep — shown after a successful topup.
 */

import React from 'react'

export interface SuccessStepProps {
  newBalanceCents: number
  currency: string
  onClose: () => void
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export function SuccessStep({ newBalanceCents, currency, onClose }: SuccessStepProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
      <div style={{
        width: '56px', height: '56px',
        borderRadius: '50%',
        backgroundColor: 'rgba(74,222,128,0.12)',
        border: '1px solid rgba(74,222,128,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <CheckIcon />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fafafa', margin: '0 0 6px' }}>
          Topup Successful
        </h3>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Your new balance is{' '}
          <strong style={{ color: '#fafafa' }}>
            {formatAmount(newBalanceCents, currency)}
          </strong>
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: '8px',
          padding: '10px 24px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: '#fafafa',
          border: '1px solid rgba(255,255,255,0.15)',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
        }}
      >
        Close
      </button>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
