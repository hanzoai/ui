export { 
  getCurrentUser as getCurrentUserServerSide, 
  createSessionCookie,
  revokeAllSessions,
  isUserAuthenticated
} from './lib/firebase/firebase-admin'

export type { default as APIResponse}  from './lib/firebase/api-response'
