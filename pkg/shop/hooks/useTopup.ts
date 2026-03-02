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

      // Add payment method with Square source token
      await c.addPaymentMethod({
        customerId: config.userId,
        type: 'card',
        providerRef: sourceId,
        providerType: 'square',
      }, token)

      // Deposit the requested amount
      const tx = await c.addDeposit({
        user: config.userId,
        currency: config.currency ?? 'usd',
        amount: state.amountCents,
        tags: ['topup', 'card'],
      }, token)

      if (!mountedRef.current) return
      const newBalance = tx.amount ?? state.amountCents
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
      // GET /v1/billing/wallet?user=&chain= returns { chain, address, memo? }
      const addr = await (c as Commerce & {
        getWalletAddress(params: { user: string; chain: string }, token?: string): Promise<WalletAddress>
      }).getWalletAddress({ user: config.userId, chain: chainId }, token)
      if (!mountedRef.current) return
      set({ status: 'idle', walletAddress: addr })
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

    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const balance = await c.getBalance(config.userId, config.currency ?? 'usd', token)
        // If balance changed, treat as confirmed
        if (balance.balance > 0) {
          clearInterval(pollRef.current!)
          pollRef.current = null
          if (!mountedRef.current) return
          set({ status: 'success', newBalance: balance.balance, pollingForCrypto: false })
          config.onSuccess?.(balance.balance)
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
