'use client'

/**
 * @hanzo/checkout - useCheckout hook
 *
 * React hook for managing checkout state
 */

import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { HanzoCheckout } from '../client'
import type {
  CheckoutOptions,
  CheckoutSession,
  CheckoutState,
  CheckoutStep,
  CheckoutAddress,
  CheckoutResult,
  CheckoutError,
  CreateSessionParams
} from '../types'

interface CheckoutContextValue extends CheckoutState {
  /** Checkout client instance */
  checkout: HanzoCheckout | null

  /** Create a new session */
  createSession: (params: CreateSessionParams) => Promise<CheckoutSession>

  /** Load existing session */
  loadSession: (sessionId: string) => Promise<CheckoutSession>

  /** Update shipping address */
  updateShipping: (address: CheckoutAddress) => Promise<void>

  /** Update billing address */
  updateBilling: (address: CheckoutAddress) => Promise<void>

  /** Apply promo code */
  applyPromo: (code: string) => Promise<void>

  /** Confirm payment */
  confirmPayment: (paymentMethod: Parameters<HanzoCheckout['confirmPayment']>[1]) => Promise<CheckoutResult>

  /** Cancel checkout */
  cancel: () => Promise<void>

  /** Go to step */
  goToStep: (step: CheckoutStep) => void

  /** Go to next step */
  nextStep: () => void

  /** Go to previous step */
  prevStep: () => void

  /** Redirect to hosted checkout */
  redirectToHosted: () => void

  /** Open popup checkout */
  openPopup: () => Window | null
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

const STEP_ORDER: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirmation']

export interface CheckoutProviderProps {
  /** Checkout options */
  options: CheckoutOptions

  /** Initial session ID to load */
  sessionId?: string

  /** Children */
  children: ReactNode
}

export function CheckoutProvider({ options, sessionId, children }: CheckoutProviderProps) {
  const [checkout] = useState(() => new HanzoCheckout(options))
  const [state, setState] = useState<CheckoutState>({
    step: 'cart',
    session: null,
    isLoading: false,
    error: null,
    isProcessing: false
  })

  // Load session on mount if sessionId provided
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [sessionId])

  const createSession = useCallback(async (params: CreateSessionParams) => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const session = await checkout.createSession(params)
      setState(s => ({ ...s, session, isLoading: false }))
      return session
    } catch (err) {
      const error = err as CheckoutError
      setState(s => ({ ...s, error, isLoading: false }))
      throw error
    }
  }, [checkout])

  const loadSession = useCallback(async (id: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const session = await checkout.retrieveSession(id)
      setState(s => ({ ...s, session, isLoading: false }))
      return session
    } catch (err) {
      const error = err as CheckoutError
      setState(s => ({ ...s, error, isLoading: false }))
      throw error
    }
  }, [checkout])

  const updateShipping = useCallback(async (address: CheckoutAddress) => {
    if (!state.session) throw new Error('No session')
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const session = await checkout.updateShipping(state.session.id, address)
      setState(s => ({ ...s, session, isLoading: false }))
    } catch (err) {
      const error = err as CheckoutError
      setState(s => ({ ...s, error, isLoading: false }))
      throw error
    }
  }, [checkout, state.session])

  const updateBilling = useCallback(async (address: CheckoutAddress) => {
    if (!state.session) throw new Error('No session')
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const session = await checkout.updateBilling(state.session.id, address)
      setState(s => ({ ...s, session, isLoading: false }))
    } catch (err) {
      const error = err as CheckoutError
      setState(s => ({ ...s, error, isLoading: false }))
      throw error
    }
  }, [checkout, state.session])

  const applyPromo = useCallback(async (code: string) => {
    if (!state.session) throw new Error('No session')
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const session = await checkout.applyPromoCode(state.session.id, code)
      setState(s => ({ ...s, session, isLoading: false }))
    } catch (err) {
      const error = err as CheckoutError
      setState(s => ({ ...s, error, isLoading: false }))
      throw error
    }
  }, [checkout, state.session])

  const confirmPayment = useCallback(async (paymentMethod: Parameters<HanzoCheckout['confirmPayment']>[1]) => {
    if (!state.session) throw new Error('No session')
    setState(s => ({ ...s, isProcessing: true, error: null }))
    try {
      const result = await checkout.confirmPayment(state.session.id, paymentMethod)
      setState(s => ({ ...s, isProcessing: false, step: 'confirmation' }))
      return result
    } catch (err) {
      const error = err as CheckoutError
      setState(s => ({ ...s, error, isProcessing: false }))
      throw error
    }
  }, [checkout, state.session])

  const cancel = useCallback(async () => {
    if (!state.session) return
    await checkout.cancelSession(state.session.id)
    setState(s => ({ ...s, session: null, step: 'cart' }))
  }, [checkout, state.session])

  const goToStep = useCallback((step: CheckoutStep) => {
    setState(s => ({ ...s, step }))
  }, [])

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex < STEP_ORDER.length - 1) {
      setState(s => ({ ...s, step: STEP_ORDER[currentIndex + 1] }))
    }
  }, [state.step])

  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.step)
    if (currentIndex > 0) {
      setState(s => ({ ...s, step: STEP_ORDER[currentIndex - 1] }))
    }
  }, [state.step])

  const redirectToHosted = useCallback(() => {
    if (state.session) {
      checkout.redirectToCheckout(state.session.id)
    }
  }, [checkout, state.session])

  const openPopup = useCallback(() => {
    if (state.session) {
      return checkout.openPopup(state.session.id)
    }
    return null
  }, [checkout, state.session])

  const value: CheckoutContextValue = {
    ...state,
    checkout,
    createSession,
    loadSession,
    updateShipping,
    updateBilling,
    applyPromo,
    confirmPayment,
    cancel,
    goToStep,
    nextStep,
    prevStep,
    redirectToHosted,
    openPopup
  }

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout(): CheckoutContextValue {
  const context = useContext(CheckoutContext)
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}

export default useCheckout
