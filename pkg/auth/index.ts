/**
 * @hanzo/auth
 *
 * Pluggable authentication library.
 * Firebase support available via @hanzo/auth-firebase (optional).
 *
 * Usage without Firebase:
 * The auth system works out of the box with a stub implementation.
 * All auth operations will return graceful failures.
 *
 * Usage with Firebase:
 * ```ts
 * import { FirebaseAuthService } from '@hanzo/auth-firebase'
 * import { registerAuthProvider } from '@hanzo/auth'
 *
 * registerAuthProvider('firebase', FirebaseAuthService)
 * ```
 */

// Types
export type {
  HanzoUserInfo,
  HanzoUserInfoValue,
  AuthServiceConf,
  APIResponse
} from './types'

// Service
export type { AuthService, AuthProvider } from './service'
export {
  useAuth,
  AuthServiceProvider,
  registerAuthProvider,
  setActiveProvider,
  getActiveProvider,
  hasAuthProvider,
  getRegisteredProviders,
  StubAuthService
} from './service'
export type { AuthServiceFactory } from './service'

// Components
export {
  LoginPanel,
  EmailPasswordForm,
  AuthWidget,
  SignupPanel,
  OrgProjectSwitcher
} from './components'
export type { OrgProjectSwitcherProps } from './components'

// Icons
export * from './icons'
