'use client'

import React from 'react'
import { cn } from '../utils'
import { SocialButton } from './SocialButton'
import { Web3Connect } from './Web3Connect'
import { PasswordForm } from './PasswordForm'
import type { SignInConfig, SignInMethod, LoginStarter, PasswordSubmit } from './types'

export interface SignInProps {
  /**
   * The method set to render, in order. `'password'` renders the embedded
   * form; everything else is a provider hint (`'google'`, `'github'`,
   * `'web3'`, …). This is the ONLY app-level configuration — apps pass
   * `brand.providers` and write zero auth code.
   */
  providers: SignInMethod[]
  /** Brand IAM wiring threaded to every social/web3 atom. */
  config?: SignInConfig
  /** Injected login starter (defaults to the embedded `startIamLogin`). */
  onLogin?: LoginStarter
  /** Password submit handler (canonical: the SDK's `loginWithPassword`). */
  onPasswordSubmit?: PasswordSubmit
  /** "Forgot password" affordance. */
  onForgot?: () => void
  /** Optional heading rendered above the methods. */
  title?: React.ReactNode
  className?: string
}

const isPassword = (m: SignInMethod): boolean => m === 'password'

/**
 * The composable sign-in surface. Renders the chosen method set — a
 * `<PasswordForm>` and/or one `<SocialButton>` per provider (`<Web3Connect>`
 * for `'web3'`) — each wired to the SDK. Brand-neutral: all color comes from
 * the host's CSS tokens, nothing hardcoded. Apps just choose `providers`.
 *
 * @example
 *   <SignIn
 *     providers={['password', 'google', 'github', 'web3']}
 *     config={{ serverUrl: 'https://hanzo.id', clientId: 'hanzo-app' }}
 *     onPasswordSubmit={(c) => iam.loginWithPassword(c.email, c.password)}
 *   />
 */
export function SignIn({
  providers,
  config,
  onLogin,
  onPasswordSubmit,
  onForgot,
  title,
  className,
}: SignInProps) {
  const social = providers.filter((p) => !isPassword(p))
  const hasPassword = providers.some(isPassword)
  const showDivider = hasPassword && social.length > 0

  return (
    <div className={cn('flex w-full max-w-sm flex-col gap-4', className)}>
      {title && <div className="text-lg font-semibold text-foreground">{title}</div>}

      {hasPassword && (
        <PasswordForm onSubmit={onPasswordSubmit} onForgot={onForgot} />
      )}

      {showDivider && (
        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      {social.length > 0 && (
        <div className="flex flex-col gap-2">
          {social.map((provider) =>
            provider === 'web3' ? (
              <Web3Connect key={provider} config={config} onLogin={onLogin} />
            ) : (
              <SocialButton key={provider} provider={provider} config={config} onLogin={onLogin} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
