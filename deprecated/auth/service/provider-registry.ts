/**
 * Auth Provider Registry
 *
 * Allows registration of pluggable auth providers.
 * Firebase support is available via @hanzo/auth-firebase (optional).
 */

import type AuthService from './auth-service'
import type { AuthServiceConf, HanzoUserInfoValue } from '../types'

export type AuthServiceFactory = new (
  conf: AuthServiceConf,
  user: HanzoUserInfoValue | null
) => AuthService

// Registry of available auth providers
const providers = new Map<string, AuthServiceFactory>()

// Current active provider
let activeProvider: string | null = null

/**
 * Register an auth provider
 *
 * @example
 * ```ts
 * import { FirebaseAuthService } from '@hanzo/auth-firebase'
 * import { registerAuthProvider } from '@hanzo/auth'
 *
 * registerAuthProvider('firebase', FirebaseAuthService)
 * ```
 */
export function registerAuthProvider(name: string, factory: AuthServiceFactory): void {
  providers.set(name, factory)
  // Auto-activate if this is the first provider
  if (!activeProvider) {
    activeProvider = name
  }
}

/**
 * Set the active auth provider by name
 */
export function setActiveProvider(name: string): void {
  if (!providers.has(name)) {
    throw new Error(`Auth provider '${name}' is not registered`)
  }
  activeProvider = name
}

/**
 * Get the active auth provider factory
 */
export function getActiveProvider(): AuthServiceFactory | null {
  if (!activeProvider) return null
  return providers.get(activeProvider) ?? null
}

/**
 * Check if any auth provider is registered
 */
export function hasAuthProvider(): boolean {
  return providers.size > 0
}

/**
 * Get list of registered provider names
 */
export function getRegisteredProviders(): string[] {
  return Array.from(providers.keys())
}
