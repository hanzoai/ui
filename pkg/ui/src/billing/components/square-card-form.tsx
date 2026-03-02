'use client'

import * as React from 'react'

// -- Square Web Payments SDK types (minimal surface) --

interface SquareCard {
  attach(selector: string): Promise<void>
  tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>
  destroy(): Promise<void>
}

interface SquarePayments {
  card(options?: Record<string, unknown>): Promise<SquareCard>
}

interface SquareSDK {
  payments(appId: string, locationId: string): Promise<SquarePayments>
}

declare global {
  interface Window {
    Square?: SquareSDK
  }
}

// -- Props --

export interface SquareCardFormProps {
  /** Called with the Square sourceId token when tokenization succeeds */
  onToken: (sourceId: string) => Promise<void>
  /** Called when cvv input is focused (for card flip animation) */
  onCvvFocus?: (focused: boolean) => void
  disabled?: boolean
}

// -- Square environment config --

const SQUARE_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? ''
const SQUARE_LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? ''
const SQUARE_ENV = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT ?? 'sandbox'

const SQUARE_SCRIPT_URL =
  SQUARE_ENV === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js'

// -- Script loader --

let scriptLoadPromise: Promise<void> | null = null

function loadSquareScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise
  if (typeof window !== 'undefined' && window.Square) {
    return (scriptLoadPromise = Promise.resolve())
  }
  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SQUARE_SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.src = SQUARE_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Square Web Payments SDK'))
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

// -- Square card appearance (dark theme) --

const SQUARE_STYLE = {
  '.input-wrapper': {
    backgroundColor: 'transparent',
  },
  input: {
    backgroundColor: 'transparent',
    color: '#fafafa',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',
  },
  'input::placeholder': {
    color: '#52525b',
  },
  '.message-text': {
    color: '#f87171',
  },
  '.message-icon': {
    color: '#f87171',
  },
}

// -- Component --

const CONTAINER_ID = 'sq-card-container'

export function SquareCardForm({ onToken, onCvvFocus, disabled }: SquareCardFormProps) {
  const cardRef = React.useRef<SquareCard | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [ready, setReady] = React.useState(false)
  const mountedRef = React.useRef(true)

  React.useEffect(() => {
    mountedRef.current = true
    let card: SquareCard | null = null

    async function init() {
      try {
        await loadSquareScript()
        if (!mountedRef.current) return

        if (!window.Square) throw new Error('Square SDK not available')
        if (!SQUARE_APP_ID) throw new Error('NEXT_PUBLIC_SQUARE_APPLICATION_ID is not set')
        if (!SQUARE_LOCATION_ID) throw new Error('NEXT_PUBLIC_SQUARE_LOCATION_ID is not set')

        const payments = await window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID)
        card = await payments.card({ style: SQUARE_STYLE })
        await card.attach(`#${CONTAINER_ID}`)

        if (mountedRef.current) {
          cardRef.current = card
          setReady(true)
        } else {
          await card.destroy()
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to initialize payment form')
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
  }, [])

  const handleSubmit = React.useCallback(async () => {
    if (!cardRef.current || !ready || submitting || disabled) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await cardRef.current.tokenize()
      if (result.status === 'OK' && result.token) {
        await onToken(result.token)
      } else {
        const msg = result.errors?.map(e => e.message).join('; ') ?? 'Tokenization failed'
        setError(msg)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing error')
    } finally {
      if (mountedRef.current) setSubmitting(false)
    }
  }, [onToken, ready, submitting, disabled])

  // Wire up CVV focus detection via DOM event listener on the Square iframe container.
  React.useEffect(() => {
    if (!onCvvFocus) return
    const container = document.getElementById(CONTAINER_ID)
    if (!container) return

    let cvvFrame: HTMLIFrameElement | null = null

    function findAndAttach() {
      const frames = container!.querySelectorAll('iframe')
      frames.forEach(frame => {
        const name = frame.getAttribute('name') ?? frame.id ?? ''
        if (name.toLowerCase().includes('cvv') || name.toLowerCase().includes('cvc')) {
          if (cvvFrame !== frame) {
            cvvFrame = frame
            try {
              frame.contentWindow?.document.body?.addEventListener('focus', () => onCvvFocus!(true), true)
              frame.contentWindow?.document.body?.addEventListener('blur', () => onCvvFocus!(false), true)
            } catch {
              // cross-origin access blocked -- Square SDK handles its own events
            }
          }
        }
      })
    }

    const observer = new MutationObserver(findAndAttach)
    observer.observe(container, { childList: true, subtree: true })
    findAndAttach()

    return () => observer.disconnect()
  }, [onCvvFocus, ready])

  return (
    <div className="space-y-3">
      {/* Square card container */}
      <div
        id={CONTAINER_ID}
        style={{
          minHeight: loading ? '120px' : undefined,
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(255,255,255,0.04)',
          padding: '12px',
          transition: 'border-color 0.2s',
        }}
      >
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '96px' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
      )}

      <button
        type="button"
        disabled={!ready || submitting || !!disabled}
        onClick={handleSubmit}
        style={{
          width: '100%',
          borderRadius: '8px',
          backgroundColor: ready && !submitting && !disabled ? 'rgb(250,250,250)' : 'rgba(250,250,250,0.3)',
          color: ready && !submitting && !disabled ? 'rgb(9,9,11)' : 'rgba(9,9,11,0.5)',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: ready && !submitting && !disabled ? 'pointer' : 'not-allowed',
          border: 'none',
          transition: 'opacity 0.15s',
        }}
      >
        {submitting ? 'Processing\u2026' : 'Add card'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Secured by Square {'\u2014'} PCI DSS compliant tokenization
      </div>
    </div>
  )
}
