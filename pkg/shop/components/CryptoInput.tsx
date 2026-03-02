'use client'

/**
 * CryptoInput — chain selector, QR code display, and deposit address for crypto topup.
 */

import React, { useState, useEffect } from 'react'
import type { WalletAddress } from '../types'
import { CRYPTO_CHAINS } from '../types'
import { Spinner, btnStyle } from './CardInput'

export interface CryptoInputProps {
  amountCents: number
  currency: string
  userId: string
  disabled?: boolean
  onFetchAddress: (chainId: string) => Promise<void>
  onConfirmSent: () => void
  walletAddress: WalletAddress | null
  loading: boolean
  polling: boolean
  error: string | null
}

export function CryptoInput({
  amountCents,
  currency,
  disabled,
  onFetchAddress,
  onConfirmSent,
  walletAddress,
  loading,
  polling,
  error,
}: CryptoInputProps) {
  const [selectedChain, setSelectedChain] = useState(CRYPTO_CHAINS[0].id)
  const [copied, setCopied] = useState(false)

  // Fetch address when chain changes
  useEffect(() => {
    void onFetchAddress(selectedChain)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChain])

  const copyAddress = async () => {
    if (!walletAddress?.address) return
    await navigator.clipboard.writeText(walletAddress.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)

  const chain = CRYPTO_CHAINS.find(c => c.id === selectedChain)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Chain selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {CRYPTO_CHAINS.map(c => (
          <button
            key={c.id}
            type="button"
            disabled={!!disabled}
            onClick={() => setSelectedChain(c.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: selectedChain === c.id ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)',
              backgroundColor: selectedChain === c.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: selectedChain === c.id ? '#fafafa' : 'rgba(255,255,255,0.5)',
              fontSize: '13px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {c.symbol}
            {c.network && (
              <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.6 }}>{c.network}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <Spinner />
        </div>
      )}

      {/* Address display */}
      {!loading && walletAddress && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
          }}>
            {/* QR code (data URI via canvas — no external lib) */}
            <QRPlaceholder address={walletAddress.address} chain={chain?.symbol ?? selectedChain} />

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '12px 0 6px' }}>
              Send exactly {formattedAmount} worth of {chain?.symbol ?? selectedChain}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <code style={{
                fontSize: '11px',
                color: '#a3a3a3',
                wordBreak: 'break-all',
                textAlign: 'center',
              }}>
                {walletAddress.address}
              </code>
              <button
                type="button"
                onClick={() => void copyAddress()}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'transparent',
                  color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {walletAddress.memo && (
              <p style={{ fontSize: '11px', color: '#fbbf24', marginTop: '8px' }}>
                Memo / Tag required: <strong>{walletAddress.memo}</strong>
              </p>
            )}
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{error}</p>
          )}

          {polling ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              <Spinner />
              Waiting for confirmation\u2026
            </div>
          ) : (
            <button
              type="button"
              disabled={!!disabled}
              onClick={onConfirmSent}
              style={btnStyle(!!disabled)}
            >
              I&apos;ve sent the payment
            </button>
          )}
        </div>
      )}

      {!loading && !walletAddress && error && (
        <p style={{ fontSize: '13px', color: '#f87171' }}>{error}</p>
      )}

      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
        Deposits are credited after on-chain confirmation. Bitcoin: ~1 confirm, ETH/USDC: ~12 confirms.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// QR placeholder — shows address as text in a bordered box.
// In production swap this for a proper QR library (qrcode.react etc.)
// ---------------------------------------------------------------------------

function QRPlaceholder({ address, chain }: { address: string; chain: string }) {
  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '120px',
      height: '120px',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px',
      backgroundColor: 'rgba(255,255,255,0.06)',
      margin: '0 auto',
      padding: '8px',
      fontSize: '10px',
      color: 'rgba(255,255,255,0.3)',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '6px', opacity: 0.4 }}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01" />
      </svg>
      <span>QR for {chain}</span>
    </div>
  )
}
