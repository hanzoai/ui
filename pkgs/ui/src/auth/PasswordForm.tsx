'use client'

import React, { useCallback, useState } from 'react'
import { cn } from '../utils'
import type { PasswordSubmit } from './types'

export interface PasswordFormProps {
  /**
   * Submit handler. The canonical implementation is the `@hanzo/iam` SDK's
   * `loginWithPassword` (embedded credential → PKCE-bound code). Kept injected
   * so `@hanzo/ui` stays dependency-light. When omitted the form is inert.
   */
  onSubmit?: PasswordSubmit
  /** Optional "forgot password" affordance the host wires. */
  onForgot?: () => void
  /** Submit button label. */
  submitLabel?: string
  className?: string
}

/**
 * Atomic email + password form. Brand-neutral: borders/text/background come
 * from CSS tokens (`bg-background`, `border-input`, `text-foreground`,
 * `bg-primary`), never literals. No token exchange — it just collects the
 * credential and calls `onSubmit`.
 */
export function PasswordForm({
  onSubmit,
  onForgot,
  submitLabel = 'Sign in',
  className,
}: PasswordFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!onSubmit) return
      setBusy(true)
      setError(null)
      void Promise.resolve(onSubmit({ email, password }))
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Sign-in failed'))
        .finally(() => setBusy(false))
    },
    [onSubmit, email, password],
  )

  const fieldCls = cn(
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  )

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-3', className)}>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={fieldCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-sm font-medium text-foreground">
          Password
          {onForgot && (
            <button
              type="button"
              onClick={onForgot}
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              Forgot?
            </button>
          )}
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={fieldCls}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !onSubmit}
        className={cn(
          'inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5',
          'text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        {busy ? 'Signing in…' : submitLabel}
      </button>
    </form>
  )
}
