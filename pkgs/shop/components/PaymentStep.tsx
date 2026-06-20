'use client'

/**
 * PaymentStep — renders the 3-tab payment method selector:
 * Card (Square) | Crypto (MPC) | Bank (ACH/Wire)
 */

import React from 'react'
import type { PaymentTab, TopupConfig } from '../types'
import { CardInput } from './CardInput'
import { CryptoInput } from './CryptoInput'
import { BankInput } from './BankInput'
import type { WalletAddress } from '../types'

export interface PaymentStepProps {
  config: TopupConfig
  tab: PaymentTab
  amountCents: number
  disabled?: boolean
  // card
  onCardToken: (sourceId: string) => Promise<void>
  // crypto
  onFetchCryptoAddress: (chainId: string) => Promise<void>
  onCryptoConfirmSent: () => void
  walletAddress: WalletAddress | null
  cryptoLoading: boolean
  cryptoPolling: boolean
  cryptoError: string | null
}

const TABS: { id: PaymentTab; label: string }[] = [
  { id: 'card',   label: 'Card' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'bank',   label: 'Bank / Wire' },
]

interface TabBarProps {
  active: PaymentTab
  onSelect: (tab: PaymentTab) => void
}

function TabBar({ active, onSelect }: TabBarProps) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      marginBottom: '20px',
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: active === t.id ? '600' : '400',
            color: active === t.id ? '#fafafa' : 'rgba(255,255,255,0.4)',
            background: 'none',
            border: 'none',
            borderBottom: active === t.id ? '2px solid #fafafa' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
            marginBottom: '-1px',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function PaymentStep({
  config,
  tab,
  amountCents,
  disabled,
  onCardToken,
  onFetchCryptoAddress,
  onCryptoConfirmSent,
  walletAddress,
  cryptoLoading,
  cryptoPolling,
  cryptoError,
}: PaymentStepProps) {
  const currency = config.currency ?? 'usd'

  return (
    <div>
      {tab === 'card' && (
        <CardInput
          squareAppId={config.squareAppId ?? process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? ''}
          squareLocationId={config.squareLocationId ?? process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? ''}
          squareEnv={config.squareEnv ?? (process.env.NEXT_PUBLIC_SQUARE_ENV as 'sandbox' | 'production' | undefined) ?? 'sandbox'}
          amountCents={amountCents}
          currency={currency}
          disabled={disabled}
          onToken={onCardToken}
        />
      )}

      {tab === 'crypto' && (
        <CryptoInput
          amountCents={amountCents}
          currency={currency}
          userId={config.userId}
          disabled={disabled}
          onFetchAddress={onFetchCryptoAddress}
          onConfirmSent={onCryptoConfirmSent}
          walletAddress={walletAddress}
          loading={cryptoLoading}
          polling={cryptoPolling}
          error={cryptoError}
        />
      )}

      {tab === 'bank' && (
        <BankInput
          userId={config.userId}
          amountCents={amountCents}
          currency={currency}
        />
      )}
    </div>
  )
}

export { TabBar }
