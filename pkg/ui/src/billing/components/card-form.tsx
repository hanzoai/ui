'use client'

import * as React from 'react'

export interface CardFormProps {
  /** Called with tokenization result when card is saved */
  onSuccess: (result: {
    token: string
    brand: string
    last4: string
    expiryMonth: string
    expiryYear: string
    provider: string
  }) => Promise<void>
  /** Base URL for commerce API, e.g. https://api.hanzo.ai/api/v1 */
  apiBaseUrl?: string
  /** Auth token for API calls */
  authToken?: string
  disabled?: boolean
}

// -- Card number formatting --

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

function detectBrand(digits: string): string {
  if (digits.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^6(?:011|5)/.test(digits)) return 'discover'
  return ''
}

// -- Shared input style --

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#fafafa',
  fontSize: '14px',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const,
}

const inputFocusStyle: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.35)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

// -- Component --

const COMMERCE_API = process.env.NEXT_PUBLIC_COMMERCE_API ?? 'https://api.hanzo.ai/api/v1'

export function CardForm({ onSuccess, apiBaseUrl, authToken, disabled }: CardFormProps) {
  const [number, setNumber] = React.useState('')
  const [name, setName] = React.useState('')
  const [expiry, setExpiry] = React.useState('')
  const [cvc, setCvc] = React.useState('')
  const [zip, setZip] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [focusedField, setFocusedField] = React.useState<string | null>(null)

  const rawNumber = number.replace(/\D/g, '')
  const brand = detectBrand(rawNumber)
  const cvcLength = brand === 'amex' ? 4 : 3

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rawNumber.length < 13) { setError('Invalid card number'); return }
    if (!expiry.includes('/')) { setError('Invalid expiry (MM/YY)'); return }
    const [mm, yy] = expiry.split('/')
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) { setError('Invalid expiry'); return }
    if (cvc.length < 3) { setError('Invalid CVC'); return }
    if (!name.trim()) { setError('Cardholder name is required'); return }

    setLoading(true)
    try {
      const base = apiBaseUrl ?? COMMERCE_API
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`

      const res = await fetch(`${base}/billing/card/tokenize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          number: rawNumber,
          expiry_month: mm,
          expiry_year: `20${yy}`,
          cvc,
          name: name.trim(),
          zip: zip.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Tokenization failed (${res.status})`)
      }

      const data = await res.json()
      await onSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Card processing error')
    } finally {
      setLoading(false)
    }
  }, [rawNumber, expiry, cvc, name, zip, apiBaseUrl, authToken, onSuccess])

  const fieldStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    ...(focusedField === field ? inputFocusStyle : {}),
  })

  const canSubmit = !disabled && !loading && rawNumber.length >= 13 && !!expiry && !!cvc && !!name.trim()

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Card number */}
      <div>
        <label style={labelStyle}>Card number</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={number}
            onChange={e => setNumber(formatCardNumber(e.target.value))}
            onFocus={() => setFocusedField('number')}
            onBlur={() => setFocusedField(null)}
            style={{ ...fieldStyle('number'), paddingRight: brand ? '44px' : '12px' }}
            disabled={disabled || loading}
            maxLength={19}
          />
          {brand && (
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              {brand}
            </span>
          )}
        </div>
      </div>

      {/* Cardholder name */}
      <div>
        <label style={labelStyle}>Cardholder name</label>
        <input
          type="text"
          autoComplete="cc-name"
          placeholder="Jane Smith"
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          style={fieldStyle('name')}
          disabled={disabled || loading}
        />
      </div>

      {/* Expiry + CVC row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Expiry</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            onFocus={() => setFocusedField('expiry')}
            onBlur={() => setFocusedField(null)}
            style={fieldStyle('expiry')}
            disabled={disabled || loading}
            maxLength={5}
          />
        </div>
        <div>
          <label style={labelStyle}>{brand === 'amex' ? 'CID (4 digits)' : 'CVC'}</label>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === 'amex' ? '1234' : '123'}
            value={cvc}
            onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, cvcLength))}
            onFocus={() => setFocusedField('cvc')}
            onBlur={() => setFocusedField(null)}
            style={fieldStyle('cvc')}
            disabled={disabled || loading}
            maxLength={cvcLength}
          />
        </div>
      </div>

      {/* ZIP (optional) */}
      <div>
        <label style={labelStyle}>
          ZIP / Postal code{' '}
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
        </label>
        <input
          type="text"
          autoComplete="postal-code"
          placeholder="10001"
          value={zip}
          onChange={e => setZip(e.target.value.slice(0, 10))}
          onFocus={() => setFocusedField('zip')}
          onBlur={() => setFocusedField(null)}
          style={fieldStyle('zip')}
          disabled={disabled || loading}
        />
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: '13px', color: '#f87171' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: '100%',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: canSubmit ? 'rgb(250,250,250)' : 'rgba(250,250,250,0.3)',
          color: canSubmit ? 'rgb(9,9,11)' : 'rgba(9,9,11,0.5)',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'opacity 0.15s',
        }}
      >
        {loading ? 'Processing...' : 'Save card'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Encrypted · PCI-compliant · Powered by Hanzo Commerce
      </div>
    </form>
  )
}
