/**
 * @hanzo/auth
 *
 * Pluggable authentication library for the Hanzo platform.
 *
 * IAM-first: When `iamServerUrl` and `iamClientId` are provided in
 * AuthServiceConf, the IAM provider auto-registers as the default.
 * All identity providers (Google, GitHub, etc.) are configured in IAM,
 * not client-side.
 *
 * Firebase support is available via @hanzo/auth-firebase (optional legacy).
 *
 * Usage with IAM (recommended):
 * ```ts
 * <AuthServiceProvider conf={{ iamServerUrl: 'https://id.hanzo.ai', iamClientId: 'my-app' }} user={null}>
 *   <App />
 * </AuthServiceProvider>
 * ```
 *
 * Usage with custom provider:
 * ```ts
 * import { registerAuthProvider } from '@hanzo/auth'
 * registerAuthProvider('custom', MyCustomAuthService)
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
  StubAuthService,
  IamAuthService
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
