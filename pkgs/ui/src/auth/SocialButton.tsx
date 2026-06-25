'use client'

import React, { useCallback, useState } from 'react'
import { cn } from '../utils'
import { startIamLogin } from './iam'
import type { SignInConfig, LoginStarter } from './types'

/** Built-in provider glyphs. `currentColor` only — the button stays monochrome
 *  and inherits the brand from CSS tokens. Pass `icon` to override. */
const GLYPHS: Record<string, React.ReactNode> = {
  google: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21.35 11.1h-9.17v2.96h5.27c-.23 1.4-1.66 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.9 3.5 14.76 2.6 12.18 2.6 6.98 2.6 2.8 6.78 2.8 12.3s4.18 9.7 9.38 9.7c5.42 0 9-3.8 9-9.16 0-.62-.07-1.09-.18-1.74z"
        fill="currentColor"
      />
    </svg>
  ),
  github: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.36 1.11 2.94.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  ),
  web3: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 12l9 4 9-4M3 17l9 4 9-4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
}

/** Human label for a provider. Override with `label`. */
const LABELS: Record<string, string> = {
  google: 'Continue with Google',
  github: 'Continue with GitHub',
  web3: 'Connect Wallet',
}

export interface SocialButtonProps {
  /** Provider hint delegated to IAM's shared OAuth client (e.g. "google"). */
  provider: string
  /** Brand IAM wiring. Required unless an `onLogin` starter is injected. */
  config?: SignInConfig
  /**
   * Injected login starter (composition over coupling). Defaults to the
   * `@hanzo/iam`-shaped `startIamLogin`. Pass the SDK's `startLogin` to drop
   * the embedded copy.
   */
  onLogin?: LoginStarter
  /** Override the label (default derived from provider). */
  label?: string
  /** Override the glyph (default derived from provider; `currentColor`). */
  icon?: React.ReactNode
  className?: string
}

/**
 * One social / web3 sign-in method. Atomic and brand-neutral: colors come from
 * the host's CSS tokens (`bg-background`, `text-foreground`, `border-input`,
 * `hover:bg-accent`), never literals. Delegates to the login starter with the
 * `provider` knob — no token exchange here.
 */
export function SocialButton({
  provider,
  config,
  onLogin,
  label,
  icon,
  className,
}: SocialButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(() => {
    const start =
      onLogin ??
      ((opts: SignInConfig & { provider: string }) => startIamLogin(opts))
    if (!onLogin && !config) {
      throw new Error('SocialButton: provide `config` (serverUrl + clientId) or an `onLogin` starter.')
    }
    setLoading(true)
    void Promise.resolve(start({ ...(config as SignInConfig), provider })).catch(() => setLoading(false))
  }, [onLogin, config, provider])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      data-provider={provider}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5',
        'text-sm font-medium text-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {icon ?? GLYPHS[provider] ?? null}
      {loading ? 'Redirecting…' : label ?? LABELS[provider] ?? `Continue with ${provider}`}
    </button>
  )
}
