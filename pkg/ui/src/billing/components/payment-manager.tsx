'use client'

import * as React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId } from 'wagmi'

import type { PaymentMethod, PaymentMethodType, CryptoNetwork } from '../types'
import { AnimatedCard } from './animated-card'

export interface PaymentMethodManagerProps {
  paymentMethods?: PaymentMethod[]
  initialMethods?: PaymentMethod[]
  onAdd?: (method: PaymentMethod) => Promise<void>
  onRemove?: (id: string) => Promise<void>
  onSetDefault?: (id: string) => Promise<void>
  onMethodAdded?: (method: PaymentMethod) => void
  onMethodRemoved?: (id: string) => void
  onDefaultChanged?: (id: string) => void
}

// ── Display helpers ──────────────────────────────────────────────────────

const CRYPTO_NETWORK_LABELS: Record<CryptoNetwork, string> = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  solana: 'Solana (SOL)',
  usdc: 'USDC',
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  10: 'Optimism',
  42161: 'Arbitrum',
  8453: 'Base',
  43114: 'Avalanche',
  56: 'BSC',
}

function formatCardBrand(brand: string) {
  if (!brand) return 'Card'
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

function methodDisplay(method: PaymentMethod) {
  if (method.type === 'card') {
    return `${formatCardBrand(method.card?.brand || '')} \u2022\u2022\u2022\u2022 ${method.card?.last4 || '\u2022\u2022\u2022\u2022'}`
  }
  if (method.type === 'crypto') {
    const network = method.crypto?.network ?? 'ethereum'
    const label = CRYPTO_NETWORK_LABELS[network as CryptoNetwork] ?? network
    const addr = method.crypto?.walletAddress ?? ''
    const shortAddr = addr.length > 12 ? `${addr.slice(0, 6)}\u2026${addr.slice(-4)}` : addr
    return `${label} ${shortAddr}`
  }
  if (method.type === 'wire') {
    return method.wire?.bankName ?? 'Wire transfer'
  }
  if (method.type === 'bank_account' || method.type === 'sepa_debit') {
    return `${method.bank_account?.bankName || 'Bank account'} \u2022\u2022\u2022\u2022 ${method.bank_account?.last4 || '\u2022\u2022\u2022\u2022'}`
  }
  return method.type
}

function methodIcon(type: PaymentMethodType) {
  switch (type) {
    case 'card': return '\uD83D\uDCB3'
    case 'crypto': return '\uD83D\uDD17'
    case 'wire': return '\uD83C\uDFE6'
    case 'bank_account':
    case 'sepa_debit': return '\uD83C\uDFDB\uFE0F'
    default: return '\uD83D\uDCB0'
  }
}

function methodExpiration(method: PaymentMethod) {
  if (method.type !== 'card') return null
  const month = method.card?.exp_month
  const year = method.card?.exp_year
  if (!month || !year) return null
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
}

function methodSubtext(method: PaymentMethod) {
  if (method.type === 'crypto') return method.crypto?.label || 'Crypto wallet'
  if (method.type === 'wire') {
    const parts: string[] = []
    if (method.wire?.swift) parts.push(`SWIFT: ${method.wire.swift}`)
    if (method.wire?.country) parts.push(method.wire.country)
    return parts.join(' \u00b7 ') || 'Wire transfer'
  }
  return null
}

function copyToClipboard(text: string, label: string, setMsg: (m: string) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setMsg(`${label} copied`)
    setTimeout(() => setMsg(''), 2000)
  })
}

// ── Styling ──────────────────────────────────────────────────────────────

const TAB_CLASS = 'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition'
const TAB_ACTIVE = 'bg-bg-elevated text-text'
const TAB_INACTIVE = 'text-text-muted hover:text-text-secondary'
const INPUT_CLASS = 'w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text outline-none transition placeholder:text-text-dim focus:border-brand focus:ring-1 focus:ring-brand'
const BTN_PRIMARY = 'w-full rounded-lg bg-text px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60'

type AddMethodTab = 'card' | 'crypto' | 'wire'

// Main component

export function PaymentMethodManager(props: PaymentMethodManagerProps) {
  const {
    paymentMethods,
    initialMethods,
    onAdd,
    onRemove,
    onSetDefault,
    onMethodAdded,
    onMethodRemoved,
    onDefaultChanged,
  } = props

  const [methods, setMethods] = React.useState<PaymentMethod[]>(
    paymentMethods && paymentMethods.length > 0 ? paymentMethods : initialMethods || [],
  )
  const [busyMethodId, setBusyMethodId] = React.useState<string | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<AddMethodTab>('card')
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (paymentMethods) setMethods(paymentMethods)
  }, [paymentMethods])

  const addMethod = React.useCallback(async (method: PaymentMethod) => {
    try {
      await onAdd?.(method)
      setMethods(prev => [...prev, method])
      onMethodAdded?.(method)
      setShowForm(false)
      setError(null)
      setStatus('Payment method added')
      setTimeout(() => setStatus(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment method')
    }
  }, [onAdd, onMethodAdded])

  const handleRemove = React.useCallback(async (id: string) => {
    setBusyMethodId(id)
    try {
      await onRemove?.(id)
      setMethods(prev => prev.filter(m => m.id !== id))
      onMethodRemoved?.(id)
    } finally {
      setBusyMethodId(null)
    }
  }, [onMethodRemoved, onRemove])

  const handleSetDefault = React.useCallback(async (id: string) => {
    setBusyMethodId(id)
    try {
      await onSetDefault?.(id)
      setMethods(prev => prev.map(m => ({ ...m, is_default: m.id === id, isDefault: m.id === id })))
      onDefaultChanged?.(id)
    } finally {
      setBusyMethodId(null)
    }
  }, [onDefaultChanged, onSetDefault])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Payment methods</h3>
            <p className="text-sm text-text-muted">Add a card, crypto wallet, or bank wire transfer</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(v => !v); setError(null) }}
            className="rounded-lg bg-text px-3 py-2 text-sm font-medium text-bg transition hover:opacity-80"
          >
            {showForm ? 'Cancel' : 'Add method'}
          </button>
        </div>

        {/* Add method form */}
        {showForm && (
          <div className="border-b border-border p-4">
            {/* Tab bar */}
            <div className="mb-4 flex gap-1 rounded-xl bg-bg p-1">
              {([
                ['card', 'Card'],
                ['crypto', 'Crypto'],
                ['wire', 'Bank Wire'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setActiveTab(id); setError(null) }}
                  className={`${TAB_CLASS} ${activeTab === id ? TAB_ACTIVE : TAB_INACTIVE}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'card' && (
              <CardForm
                onAdd={addMethod}
                setError={setError}
              />
            )}
            {activeTab === 'crypto' && <CryptoForm onAdd={addMethod} setError={setError} />}
            {activeTab === 'wire' && <WireForm onAdd={addMethod} />}

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          </div>
        )}

        {/* Status */}
        {status && (
          <div className="border-b border-border px-4 py-2">
            <p className="text-sm text-success">{status}</p>
          </div>
        )}

        {/* Method list */}
        <div className="divide-y divide-border">
          {methods.length === 0 ? (
            <div className="p-6 text-sm text-text-muted">No payment methods on file.</div>
          ) : (
            methods.map(method => {
              const isDefault = method.is_default || method.isDefault
              const isBusy = busyMethodId === method.id
              const sub = methodSubtext(method)
              return (
                <div key={method.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">{methodIcon(method.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-text">{methodDisplay(method)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <span>Added {new Date(method.created_at).toLocaleDateString('en-US')}</span>
                        {methodExpiration(method) ? <span>Expires {methodExpiration(method)}</span> : null}
                        {sub ? <span>{sub}</span> : null}
                        {isDefault && (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isDefault && (
                      <button type="button" disabled={isBusy} onClick={() => handleSetDefault(method.id)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? 'Saving\u2026' : 'Set default'}
                      </button>
                    )}
                    <button type="button" disabled={isBusy} onClick={() => handleRemove(method.id)}
                      className="rounded-md border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? 'Removing\u2026' : 'Remove'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// Card form -- animated preview + S2S tokenization via commerce API

interface CardFormProps {
  onAdd: (m: PaymentMethod) => Promise<void>
  setError: (e: string) => void
}

function detectBrandPM(digits: string): string {
  if (digits.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^6(?:011|5)/.test(digits)) return 'discover'
  return ''
}

function CardForm({ onAdd, setError }: CardFormProps) {
  const [number, setNumberRaw] = React.useState('')
  const [name, setName] = React.useState('')
  const [expiry, setExpiryRaw] = React.useState('')
  const [cvc, setCvc] = React.useState('')
  const [zip, setZip] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [cvvFocused, setCvvFocused] = React.useState(false)

  const rawNumber = number.replace(/\D/g, '')
  const brand = detectBrandPM(rawNumber)
  const cvcLength = brand === 'amex' ? 4 : 3

  const authToken = React.useMemo(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('hanzo-auth-token') ?? undefined) : undefined
  }, [])

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (rawNumber.length < 13) { setError('Invalid card number'); return }
    if (!expiry.includes('/')) { setError('Invalid expiry'); return }
    const [mm, yy] = expiry.split('/')
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) { setError('Invalid expiry'); return }
    if (cvc.length < 3) { setError('Invalid CVC'); return }
    if (!name.trim()) { setError('Name required'); return }

    setLoading(true)
    try {
      const base = process.env.NEXT_PUBLIC_COMMERCE_API ?? 'https://api.hanzo.ai/api/v1'
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
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? `Error ${res.status}`)
      }
      const data = await res.json()
      const method: PaymentMethod = {
        id: `pm_${Math.random().toString(36).slice(2, 12)}`,
        type: 'card',
        is_default: false,
        isDefault: false,
        created_at: new Date().toISOString(),
        card: {
          brand: data.brand,
          last4: data.last4,
          exp_month: parseInt(mm, 10),
          exp_year: parseInt(`20${yy}`, 10),
          funding: 'credit',
        },
        billing_details: { name: name.trim() },
        _sourceToken: data.token,
      } as PaymentMethod
      await onAdd(method)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Card error')
    } finally {
      setLoading(false)
    }
  }, [rawNumber, expiry, cvc, name, zip, authToken, onAdd, setError])

  const canSubmit = !loading && rawNumber.length >= 13 && !!expiry && !!cvc && !!name.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Animated card preview */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <AnimatedCard
          number={rawNumber}
          name={name}
          expiry={expiry.replace('/', '')}
          cvv={cvc}
          cvvFocused={cvvFocused}
        />
      </div>

      <input
        type="text"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="Card number"
        value={number}
        onChange={e => {
          const d = e.target.value.replace(/\D/g, '').slice(0, 16)
          setNumberRaw(d.replace(/(.{4})/g, '$1 ').trim())
        }}
        className={INPUT_CLASS}
        disabled={loading}
        maxLength={19}
      />
      <input
        type="text"
        autoComplete="cc-name"
        placeholder="Cardholder name"
        value={name}
        onChange={e => setName(e.target.value)}
        className={INPUT_CLASS}
        disabled={loading}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/YY"
          value={expiry}
          onChange={e => {
            const d = e.target.value.replace(/\D/g, '').slice(0, 4)
            setExpiryRaw(d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d)
          }}
          className={INPUT_CLASS}
          disabled={loading}
          maxLength={5}
        />
        <input
          type="password"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="CVC"
          value={cvc}
          onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, cvcLength))}
          onFocus={() => setCvvFocused(true)}
          onBlur={() => setCvvFocused(false)}
          className={INPUT_CLASS}
          disabled={loading}
          maxLength={cvcLength}
        />
      </div>
      <input
        type="text"
        autoComplete="postal-code"
        placeholder="ZIP (optional)"
        value={zip}
        onChange={e => setZip(e.target.value.slice(0, 10))}
        className={INPUT_CLASS}
        disabled={loading}
      />

      <button type="submit" className={BTN_PRIMARY} disabled={!canSubmit}>
        {loading ? 'Processing...' : 'Save card'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Secured by Hanzo Commerce {'\u00b7'} PCI DSS compliant
      </div>
    </form>
  )
}

// Crypto form -- wagmi + viem + RainbowKit

function CryptoForm({ onAdd, setError }: { onAdd: (m: PaymentMethod) => Promise<void>; setError: (e: string) => void }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [label, setLabel] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const chainName = CHAIN_NAMES[chainId] ?? `Chain ${chainId}`

  const saveWallet = React.useCallback(async () => {
    if (!address) return
    setSaving(true)
    try {
      const method: PaymentMethod = {
        id: `pm_${Math.random().toString(36).slice(2, 12)}`,
        type: 'crypto',
        is_default: false,
        isDefault: false,
        created_at: new Date().toISOString(),
        crypto: {
          network: 'ethereum',
          walletAddress: address,
          label: label || `${chainName} wallet`,
        },
        billing_details: {},
      }
      await onAdd(method)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save wallet')
    } finally {
      setSaving(false)
    }
  }, [address, chainId, chainName, label, onAdd, setError])

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        Connect your wallet to save it as a payment method. Supports Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC, and more.
      </p>

      {/* RainbowKit connect button */}
      <div className="flex justify-center">
        <ConnectButton showBalance={false} />
      </div>

      {isConnected && address && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-bg p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-dim">Connected on {chainName}</p>
            </div>
            <p className="mt-1 font-mono text-sm text-text break-all">{address}</p>
          </div>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder={`Label (e.g. "My ${chainName} wallet")`}
            className={INPUT_CLASS}
          />
          <button type="button" disabled={saving} onClick={saveWallet} className={BTN_PRIMARY}>
            {saving ? 'Saving wallet\u2026' : 'Save wallet as payment method'}
          </button>
        </div>
      )}

      <p className="text-xs text-text-dim">
        Non-EVM chains (Solana, TON, Bitcoin) coming soon.
      </p>
    </div>
  )
}

// Wire form -- bank details with copy-to-clipboard

const BANK_DETAILS = [
  { label: 'Beneficiary Bank', value: 'Bank of America, NA 222 Broadway, New York, NY 10038' },
  { label: 'Beneficiary', value: 'Hanzo, Inc, 4811 Mastin Street, Merriam, KS 66203' },
  { label: 'Routing \u2014 ACH', value: '113000023 / 111000025' },
  { label: 'Routing \u2014 Wire', value: '026009593' },
  { label: 'SWIFT', value: 'BOFAUS3N' },
  { label: 'Reference', value: 'Hanzo' },
]

function WireForm({ onAdd }: { onAdd: (m: PaymentMethod) => Promise<void> }) {
  const [copyMsg, setCopyMsg] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const saveWire = React.useCallback(async () => {
    setSaving(true)
    try {
      const method: PaymentMethod = {
        id: `pm_${Math.random().toString(36).slice(2, 12)}`,
        type: 'wire',
        is_default: false,
        isDefault: false,
        created_at: new Date().toISOString(),
        wire: {
          bankName: 'Bank of America',
          accountHolder: 'Hanzo, Inc',
          routingNumber: '026009593',
          swift: 'BOFAUS3N',
          country: 'US',
        },
        billing_details: {},
      }
      await onAdd(method)
    } finally {
      setSaving(false)
    }
  }, [onAdd])

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        Send a wire transfer to the account below. Click any field to copy.
      </p>

      <div className="space-y-2">
        {BANK_DETAILS.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            onClick={() => copyToClipboard(value, label, setCopyMsg)}
            className="w-full rounded-lg border border-border bg-bg p-3 text-left transition hover:border-border-strong group"
          >
            <p className="text-[11px] uppercase tracking-wide text-text-dim">{label}</p>
            <div className="mt-0.5 flex items-center justify-between">
              <p className="text-sm text-text">{value}</p>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-dim group-hover:text-text-muted">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {copyMsg && <p className="text-xs text-success">{copyMsg}</p>}

      <button type="button" disabled={saving} onClick={saveWire} className={BTN_PRIMARY}>
        {saving ? 'Saving\u2026' : 'Confirm wire sent'}
      </button>
    </div>
  )
}
