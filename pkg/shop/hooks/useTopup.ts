'use client'

/**
 * useTopup — manages topup dialog state and Commerce API calls
 */

import { useState, useCallback, useRef } from 'react'
import { Commerce } from '@hanzo/commerce/client'
import type { TopupConfig, PaymentTab, TopupStatus, WalletAddress } from '../types'
import { MIN_AMOUNT_CENTS } from '../types'

function resolveToken(config: TopupConfig): string | undefined {
  if (config.token) return config.token
  if (typeof window !== 'undefined') {
    return localStorage.getItem('hanzo-auth-token') ?? undefined
  }
  return undefined
}

export interface TopupState {
  open: boolean
  tab: PaymentTab
  amountCents: number
  status: TopupStatus
  error: string | null
  newBalance: number | null
  walletAddress: WalletAddress | null
  pollingForCrypto: boolean
}

export interface UseTopupReturn extends TopupState {
  openDialog: () => void
  closeDialog: () => void
  setTab: (tab: PaymentTab) => void
  setAmountCents: (cents: number) => void
  /** Card path: called with Square sourceId token */
  submitCard: (sourceId: string) => Promise<void>
  /** Crypto path: fetch wallet deposit address for selected chain */
  fetchWalletAddress: (chainId: string) => Promise<void>
  /** Crypto path: user claims they've sent — start polling */
  startCryptoPoll: () => void
  commerce: Commerce | null
}

export function useTopup(config: TopupConfig): UseTopupReturn {
  const [state, setState] = useState<TopupState>({
    open: false,
    tab: 'card',
    amountCents: config.defaultAmount ?? 5_000,
    status: 'idle',
    error: null,
    newBalance: null,
    walletAddress: null,
    pollingForCrypto: false,
  })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const commerceRef = useRef<Commerce | null>(null)
  function getCommerce(): Commerce {
    if (!commerceRef.current) {
      commerceRef.current = new Commerce({
        baseUrl: config.baseUrl,
        token: resolveToken(config),
      })
    }
    return commerceRef.current
  }

  const set = useCallback((patch: Partial<TopupState>) => {
    setState(s => ({ ...s, ...patch }))
  }, [])

  const openDialog = useCallback(() => {
    set({ open: true, status: 'idle', error: null, newBalance: null, walletAddress: null, pollingForCrypto: false })
  }, [set])

  const closeDialog = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    set({ open: false, status: 'idle', error: null, walletAddress: null, pollingForCrypto: false })
  }, [set])

  const setTab = useCallback((tab: PaymentTab) => {
    set({ tab, error: null, walletAddress: null, pollingForCrypto: false })
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [set])

  const setAmountCents = useCallback((cents: number) => {
    if (cents < MIN_AMOUNT_CENTS) return
    set({ amountCents: cents })
  }, [set])

  const submitCard = useCallback(async (sourceId: string) => {
    set({ status: 'processing', error: null })
    try {
      const token = resolveToken(config)
      const c = getCommerce()

      // Charge the Square source token and credit the balance in one call.
      // Commerce exposes POST /v1/billing/topup/token for exactly this:
      // a single-use card token exchanged for prepaid credit.
      const tx = await c.postBillingTopupToken<{
        amount?: number
        balance?: number
        available?: number
        transactionId?: string
        id?: string
      }>({
        body: {
          user: config.userId,
          currency: config.currency ?? 'usd',
          amount: state.amountCents,
          sourceId,
          providerRef: sourceId,
          providerType: 'square',
          tags: ['topup', 'card'],
        },
        token,
      })

      if (!mountedRef.current) return
      let newBalance = tx.balance ?? tx.available ?? tx.amount ?? state.amountCents
      if (tx.balance === undefined && tx.available === undefined) {
        try {
          const bal = await c.getBillingBalance<{ available: number }>({ token })
          if (typeof bal.available === 'number') newBalance = bal.available
        } catch {
          // Keep the deposited amount as the reported balance.
        }
      }
      set({ status: 'success', newBalance })
      config.onSuccess?.(newBalance)
    } catch (err) {
      if (!mountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Payment failed'
      set({ status: 'error', error: msg })
      config.onError?.(err instanceof Error ? err : new Error(msg))
    }
  }, [config, state.amountCents, set])

  const fetchWalletAddress = useCallback(async (chainId: string) => {
    set({ status: 'loading', error: null, walletAddress: null })
    try {
      const token = resolveToken(config)
      const c = getCommerce()
      // POST /v1/billing/crypto/deposit issues a deposit address for the chain.
      const addr = await c.postBillingCryptoDeposit<{
        address?: string
        chain?: string
        asset?: string
        memo?: string
        id?: string
        depositId?: string
      }>({
        body: { chain: chainId, asset: chainId, user: config.userId },
        token,
      })
      if (!addr.address) throw new Error('No deposit address returned')
      const walletAddress: WalletAddress = {
        chain: addr.chain ?? chainId,
        address: addr.address,
        memo: addr.memo,
      }
      if (!mountedRef.current) return
      set({ status: 'idle', walletAddress })
    } catch (err) {
      if (!mountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Failed to load wallet address'
      set({ status: 'error', error: msg })
    }
  }, [config, set])

  const startCryptoPoll = useCallback(() => {
    if (pollRef.current) return
    set({ pollingForCrypto: true, status: 'loading', error: null })

    const token = resolveToken(config)
    const c = getCommerce()
    let attempts = 0
    const MAX_ATTEMPTS = 60 // 5 min at 5s intervals
    let baseline: number | null = null

    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const balance = await c.getBillingBalance<{ available: number }>({ token })
        if (baseline === null) baseline = balance.available ?? 0
        // If balance increased past the baseline, treat as confirmed
        if ((balance.available ?? 0) > baseline) {
          clearInterval(pollRef.current!)
          pollRef.current = null
          if (!mountedRef.current) return
          set({ status: 'success', newBalance: balance.available, pollingForCrypto: false })
          config.onSuccess?.(balance.available)
        }
      } catch {
        // ignore transient errors during polling
      }
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(pollRef.current!)
        pollRef.current = null
        if (!mountedRef.current) return
        set({ status: 'idle', pollingForCrypto: false, error: 'Payment not confirmed yet. Check back later.' })
      }
    }, 5_000)
  }, [config, set])

  return {
    ...state,
    openDialog,
    closeDialog,
    setTab,
    setAmountCents,
    submitCard,
    fetchWalletAddress,
    startCryptoPoll,
    commerce: commerceRef.current,
  }
}
