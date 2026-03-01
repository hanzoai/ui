// Server-side auth stubs. Firebase has been removed from @hanzo/auth.
// For Firebase support, install @hanzo/auth-firebase.
// For Hanzo IAM, configure your IAM provider directly.
export { getUserServerSide, generateCustomToken, createSessionCookie, revokeAllSessions } from './stub-server'
export {
  handleLogin as handleLoginApiRequest,
  handleLogout as handleLogoutApiRequest
} from './rest-api-handlers'
export type { APIResponse } from '../types'
