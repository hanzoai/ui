'use client'

import React, { useCallback, useState } from 'react'

export interface IAMLoginButtonProps {
  /** IAM server URL (e.g., https://hanzo.id) */
  iamUrl?: string
  /** OAuth client ID */
  clientId: string
  /** OAuth redirect URI (defaults to current origin + /auth/callback) */
  redirectUri?: string
  /** Button label */
  label?: string
  /** Additional CSS classes */
  className?: string
  /** Button variant: 'default' (filled) or 'outline' */
  variant?: 'default' | 'outline'
}

/**
 * "Sign in with Hanzo" button that initiates IAM OAuth flow.
 * Zero-dependency — works in any React app.
 */
export function IAMLoginButton({
  iamUrl = 'https://hanzo.id',
  clientId,
  redirectUri,
  label = 'Sign in with Hanzo',
  className = '',
  variant = 'default',
}: IAMLoginButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(() => {
    setLoading(true)
    const redirect = redirectUri || `${window.location.origin}/auth/callback`
    const state = crypto.randomUUID()

    const url = new URL(`${iamUrl}/login/oauth/authorize`)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', redirect)
    url.searchParams.set('scope', 'openid profile email')
    url.searchParams.set('state', state)

    window.location.href = url.toString()
  }, [iamUrl, clientId, redirectUri])

  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  const variantStyles = variant === 'outline'
    ? 'border border-[#333] bg-transparent text-white hover:bg-[#1a1a1f]'
    : 'bg-white text-black hover:bg-[#e5e5e5]'

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles} ${className}`}
      onClick={handleClick}
      disabled={loading}
    >
      <svg width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <text x="4" y="26" fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" fontSize="28" fontWeight="700" fill="currentColor">H</text>
      </svg>
      {loading ? 'Redirecting...' : label}
    </button>
  )
}
