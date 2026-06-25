export { IAMLoginButton } from './IAMLoginButton'
export type { IAMLoginButtonProps } from './IAMLoginButton'
export { AuthGuard } from './AuthGuard'
export type { AuthGuardProps } from './AuthGuard'
export { startIamLogin, iamUrl, IAM_OIDC_PATHS } from './iam'
export type { StartIamLoginOptions } from './iam'

// Re-export auth-related navigation components for convenience
export { useHanzoAuth } from '../navigation/hanzo-shell/useHanzoAuth'
export { UserOrgDropdown } from '../navigation/hanzo-shell/UserOrgDropdown'
export type { HanzoUser, HanzoOrg } from '../navigation/hanzo-shell/types'
