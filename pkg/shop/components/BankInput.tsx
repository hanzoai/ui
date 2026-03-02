'use client'

/**
 * BankInput — ACH / wire transfer instructions.
 *
 * Shows Bank of America wire details and routing numbers.
 * No live API calls needed — static info with clipboard copy.
 */

import React, { useState } from 'react'

interface BankField {
  label: string
  value: string
}

const WIRE_FIELDS: BankField[] = [
  { label: 'Bank',              value: 'Bank of America' },
  { label: 'Beneficiary',       value: 'Hanzo AI, Inc.' },
  { label: 'Account Number',    value: '325070760' },
  { label: 'ACH Routing',       value: '113000023' },
  { label: 'Wire Routing',      value: '026009593' },
  { label: 'SWIFT / BIC',       value: 'BOFAUS3N' },
]

const MEMO_HINT = 'Include your User ID as the payment memo / reference'

export interface BankInputProps {
  userId: string
  amountCents: number
  currency: string
}

export function BankInput({ userId, amountCents, currency }: BankInputProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(label)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
        Wire or ACH transfer {formattedAmount} to:
      </p>

      <div style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {WIRE_FIELDS.map((field, i) => (
          <div
            key={field.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderBottom: i < WIRE_FIELDS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', display: 'block' }}>
                {field.label}
              </span>
              <span style={{ fontSize: '13px', color: '#fafafa', fontFamily: 'ui-monospace, monospace' }}>
                {field.value}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void copy(field.label, field.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'transparent',
                color: copiedField === field.label ? '#4ade80' : 'rgba(255,255,255,0.4)',
                fontSize: '11px',
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: '12px',
              }}
            >
              {copiedField === field.label ? 'Copied' : 'Copy'}
            </button>
          </div>
        ))}

        {/* User ID memo row */}
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'rgba(251,191,36,0.06)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '11px', color: '#fbbf24', display: 'block' }}>
            Payment Memo / Reference
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#fafafa', fontFamily: 'ui-monospace, monospace' }}>
              {userId}
            </span>
            <button
              type="button"
              onClick={() => void copy('memo', userId)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(251,191,36,0.3)',
                backgroundColor: 'transparent',
                color: copiedField === 'memo' ? '#4ade80' : '#fbbf24',
                fontSize: '11px',
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: '12px',
              }}
            >
              {copiedField === 'memo' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
        {MEMO_HINT}. ACH deposits typically clear in 1&ndash;3 business days. Wire transfers clear same day.
        Contact <a href="mailto:billing@hanzo.ai" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>billing@hanzo.ai</a> after sending.
      </p>
    </div>
  )
}
