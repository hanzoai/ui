/**
 * @hanzo/auth-firebase
 *
 * Firebase authentication provider for @hanzo/auth
 *
 * This package is OPTIONAL - only install if you need Firebase authentication.
 * The core @hanzo/auth package works without Firebase.
 *
 * Usage:
 * ```ts
 * import { FirebaseAuthService } from '@hanzo/auth-firebase'
 * import { registerAuthProvider } from '@hanzo/auth'
 *
 * // Register Firebase as the auth provider
 * if (FirebaseAuthService.isConfigured()) {
 *   registerAuthProvider('firebase', FirebaseAuthService)
 * }
 * ```
 */

// Client-side exports
export { FirebaseAuthService, isFirebaseConfigured } from './service'

// Re-export types from @hanzo/auth for convenience
export type {
  AuthService,
  AuthServiceConf,
  HanzoUserInfo,
  HanzoUserInfoValue
} from '@hanzo/auth'
