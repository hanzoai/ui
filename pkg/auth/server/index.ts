// Server-side auth functions - use Firebase if configured, otherwise stub
// For Firebase support, also install @hanzo/auth-firebase
export { getUserServerSide, generateCustomToken, createSessionCookie, revokeAllSessions } from './firebase-support'
export {
  handleLogin as handleLoginApiRequest,
  handleLogout as handleLogoutApiRequest
} from './rest-api-handlers'
export type { APIResponse } from '../types'

// Re-export stub for explicit use
export {
  getUserServerSide as stubGetUserServerSide,
  generateCustomToken as stubGenerateCustomToken
} from './stub-server'
