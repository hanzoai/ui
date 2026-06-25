'use client'

import React, { useCallback, useState } from 'react'
import { cn } from '../utils'
import { startIamLogin } from './iam'

export interface IAMLoginButtonProps {
  /** IAM server URL (e.g., https://hanzo.id) */
  iamUrl?: string
  /** OAuth client ID */
  clientId: string
  /** OAuth redirect URI (defaults to current origin + /auth/callback) */
  redirectUri?: string
  /**
   * Provider hint. Omit for the IAM login page (the default "Sign in" button);
   * pass `'google'`/`'github'`/… to jump straight to a provider. Prefer
   * `<SignIn providers>` / `<SocialButton>` for multi-method surfaces.
   */
  provider?: string
  /** Button label */
  label?: string
  /** Additional CSS classes */
  className?: string
  /** Button variant: 'default' (filled) or 'outline' */
  variant?: 'default' | 'outline'
}

/**
 * Single "Sign in" button that initiates the canonical IAM authorization-code +
 * PKCE-S256 flow (HIP-0111). Brand-neutral — colors come from CSS tokens
 * (`bg-primary`, `border-input`, `bg-background`), never literals.
 */
export function IAMLoginButton({
  iamUrl = 'https://hanzo.id',
  clientId,
  redirectUri,
  provider,
  label = 'Sign in',
  className,
  variant = 'default',
}: IAMLoginButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(() => {
    setLoading(true)
    void startIamLogin({ serverUrl: iamUrl, clientId, redirectUri, provider }).catch(() => {
      setLoading(false)
    })
  }, [iamUrl, clientId, redirectUri, provider])

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'outline'
          ? 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
          : 'bg-primary text-primary-foreground hover:bg-primary/90',
        className,
      )}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Redirecting…' : label}
    </button>
  )
}
