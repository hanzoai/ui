import type { HanzoUserInfo } from "../types"

type AuthProvider = 'google' | 'facebook' | 'github'

interface AuthService {

  get loggedIn(): boolean 
  get user(): HanzoUserInfo | null // returns current info obj // all fields observable :)

  signupEmailAndPassword: ( email: string,  password: string ) => Promise<{success: boolean, userInfo: HanzoUserInfo | null, message?: string}> 
  loginEmailAndPassword: ( email: string,  password: string ) => Promise<{success: boolean, userInfo: HanzoUserInfo | null, message?: string}>
  loginWithProvider: ( provider: AuthProvider ) => Promise<{success: boolean, userInfo: HanzoUserInfo | null}> 
  loginWithCustomToken: ( token: string ) => Promise<{success: boolean, userInfo: HanzoUserInfo | null}>
  associateWallet: () => Promise<void>
  logout: () => Promise<{success: boolean}>
}

export {
  type AuthService as default,
  type AuthProvider
}
