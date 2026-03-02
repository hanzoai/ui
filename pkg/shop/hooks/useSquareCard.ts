'use client'

/**
 * useSquareCard — loads Square Web Payments SDK and manages the card element lifecycle.
 *
 * The Square card element is embedded inside an iframe injected by the SDK.
 * This hook abstracts script loading, initialization, and tokenization.
 */

import { useEffect, useRef, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Square SDK minimal types
// ---------------------------------------------------------------------------

interface SquareCard {
  attach(selector: string): Promise<void>
  tokenize(): Promise<SquareTokenizeResult>
  destroy(): Promise<void>
}

interface SquarePayments {
  card(options?: SquareCardOptions): Promise<SquareCard>
}

interface SquareSDK {
  payments(appId: string, locationId: string): Promise<SquarePayments>
}

interface SquareTokenizeResult {
  status: string
  token?: string
  errors?: Array<{ message: string }>
}

interface SquareCardOptions {
  style?: Record<string, unknown>
}

declare global {
  interface Window {
    Square?: SquareSDK
  }
}

// ---------------------------------------------------------------------------
// Script loader — singleton promise per env
// ---------------------------------------------------------------------------

let scriptPromise: Promise<void> | null = null

function loadSquareScript(scriptUrl: string): Promise<void> {
  if (scriptPromise) return scriptPromise
  if (typeof window !== 'undefined' && window.Square) {
    return (scriptPromise = Promise.resolve())
  }
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`)
    if (existing) {
      // Script tag exists — wait for it
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Square script load failed')), { once: true })
      return
    }
    const el = document.createElement('script')
    el.src = scriptUrl
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error('Failed to load Square Web Payments SDK'))
    document.head.appendChild(el)
  })
  return scriptPromise
}

// Dark-theme card style matching Hanzo UI
const SQUARE_DARK_STYLE = {
  '.input-wrapper': { backgroundColor: 'transparent' },
  input: {
    backgroundColor: 'transparent',
    color: '#fafafa',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',
  },
  'input::placeholder': { color: '#52525b' },
  '.message-text': { color: '#f87171' },
  '.message-icon': { color: '#f87171' },
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSquareCardOptions {
  /** Square application ID */
  appId: string
  /** Square location ID */
  locationId: string
  /** 'sandbox' | 'production'. Determines which CDN URL is used. */
  env?: 'sandbox' | 'production'
  /** DOM container ID where the card element will be mounted. */
  containerId: string
}

export interface UseSquareCardReturn {
  /** True once the card element is attached and ready */
  ready: boolean
  /** True while script or card is loading */
  loading: boolean
  /** Error message if initialization failed */
  error: string | null
  /** Tokenize the card. Calls onToken with the Square sourceId on success. */
  tokenize: () => Promise<string>
}

export function useSquareCard({
  appId,
  locationId,
  env = 'sandbox',
  containerId,
}: UseSquareCardOptions): UseSquareCardReturn {
  const scriptUrl =
    env === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'

  const cardRef = useRef<SquareCard | null>(null)
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    setReady(false)
    setLoading(true)
    setError(null)
    // Reset singleton if env/appId changes (important for tab switching)
    scriptPromise = null

    let card: SquareCard | null = null

    async function init() {
      try {
        if (!appId) throw new Error('Square App ID is not configured')
        if (!locationId) throw new Error('Square Location ID is not configured')

        await loadSquareScript(scriptUrl)
        if (!mountedRef.current) return

        if (!window.Square) throw new Error('Square SDK not available after script load')

        const payments = await window.Square.payments(appId, locationId)
        card = await payments.card({ style: SQUARE_DARK_STYLE })
        await card.attach(`#${containerId}`)

        if (mountedRef.current) {
          cardRef.current = card
          setReady(true)
        } else {
          await card.destroy()
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Square initialization failed')
        }
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    void init()

    return () => {
      mountedRef.current = false
      cardRef.current?.destroy().catch(() => undefined)
      cardRef.current = null
    }
  // containerId should be stable per render; include appId/locationId/env in deps
  }, [appId, locationId, env, scriptUrl, containerId])

  const tokenize = useCallback(async (): Promise<string> => {
    if (!cardRef.current || !ready) throw new Error('Card element not ready')
    const result = await cardRef.current.tokenize()
    if (result.status === 'OK' && result.token) {
      return result.token
    }
    const msg = result.errors?.map(e => e.message).join('; ') ?? 'Tokenization failed'
    throw new Error(msg)
  }, [ready])

  return { ready, loading, error, tokenize }
}
