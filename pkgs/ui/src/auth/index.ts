// Composable sign-in surface — atoms + the <SignIn> composer.
// Brand-neutral (CSS tokens), each wired to the canonical IAM PKCE flow.
export { SignIn } from './SignIn'
export type { SignInProps } from './SignIn'
export { SocialButton } from './SocialButton'
export type { SocialButtonProps } from './SocialButton'
export { PasswordForm } from './PasswordForm'
export type { PasswordFormProps } from './PasswordForm'
export { Web3Connect } from './Web3Connect'
export type { Web3ConnectProps } from './Web3Connect'

// Single-button entry + guard (kept for the "Sign in with Hanzo" affordance).
export { IAMLoginButton } from './IAMLoginButton'
export type { IAMLoginButtonProps } from './IAMLoginButton'
export { AuthGuard } from './AuthGuard'
export type { AuthGuardProps } from './AuthGuard'

// Mechanism mirror (paths + PKCE authorize) — same contract as `@hanzo/iam`.
export { startIamLogin, buildIamAuthorizeUrl, iamUrl, IAM_OIDC_PATHS } from './iam'
export type { StartIamLoginOptions } from './iam'
export type { SignInConfig, SignInMethod, LoginStarter, PasswordSubmit } from './types'

// Re-export auth-related navigation components for convenience
export { useHanzoAuth } from '../navigation/hanzo-shell/useHanzoAuth'
export { UserOrgDropdown } from '../navigation/hanzo-shell/UserOrgDropdown'
export type { HanzoUser, HanzoOrg } from '../navigation/hanzo-shell/types'
