/**
 * Shared types for the composable `@hanzo/ui` sign-in surface.
 *
 * The presentation layer knows nothing of token exchange — it only knows how
 * to START a login for a given method. `provider` is the one knob; everything
 * else is brand config the host supplies once.
 */

import type { StartIamLoginOptions } from './iam'

/**
 * A sign-in method. `'password'` renders the embedded credential form; any
 * other string is a provider hint delegated to IAM's shared org-level OAuth
 * client (`'google'`, `'github'`, `'web3'`, …). One union, parameterized —
 * never a component per provider.
 */
export type SignInMethod = 'password' | 'google' | 'github' | 'web3' | (string & {})

/** Brand IAM wiring the host supplies once and threads to every atom. */
export interface SignInConfig {
  /** Brand IAM origin, e.g. https://hanzo.id. */
  serverUrl: string
  /** OAuth client id (`<org>-<app>`). */
  clientId: string
  /** OAuth callback; defaults to the current origin + `/auth/callback`. */
  redirectUri?: string
  /** Scopes; defaults to `openid profile email`. */
  scope?: string
}

/**
 * The injected login starter — composition over coupling. Defaults to the
 * `@hanzo/iam`-shaped `startIamLogin`, but a host can pass its own (e.g. the
 * `@hanzo/iam` SDK's `startLogin`) so `@hanzo/ui` stays dependency-light.
 */
export type LoginStarter = (opts: StartIamLoginOptions) => void | Promise<void>

/**
 * Submit handler for the embedded password form. Defaults to undefined, in
 * which case `<PasswordForm>` is inert until a host wires it (the SDK's
 * `loginWithPassword` is the canonical implementation). Kept out of the
 * dependency-light core deliberately.
 */
export type PasswordSubmit = (creds: { email: string; password: string }) => void | Promise<void>
