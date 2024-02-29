import type { HanzoUserInfo } from "../types"

interface AuthService {

  get loggedIn(): boolean 
  get user(): HanzoUserInfo | null // returns current info obj // all fields observable :)

  loginEmailAndPassword: (
    email: string, 
    password: string 
   ) => Promise<{success: boolean, userInfo: HanzoUserInfo | null}>

  loginWithProvider: (
    provider: 'google' | 'facebook' | 'github'
  ) => Promise<{success: boolean, userInfo: HanzoUserInfo | null}> 

  associateWallet: () => Promise<void>

  logout: () => Promise<{success: boolean}>
}

export {
  type AuthService as default
}
