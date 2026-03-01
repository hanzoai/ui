/**
 * Firebase Auth Service exports
 */

export { default as FirebaseAuthService } from './firebase-auth-service'
export {
  auth,
  db,
  isFirebaseConfigured,
  firebaseConfig,
  loginWithProvider,
  signupWithEmailAndPassword,
  loginWithEmailAndPassword,
  loginWithCustomToken,
  logoutBackend
} from './firebase-support'
export {
  associateWalletAddressWithAccount,
  getAssociatedWalletAddress
} from './wallet-support'
