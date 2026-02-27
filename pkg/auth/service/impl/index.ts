import { makeAutoObservable, makeObservable, computed  } from 'mobx'

import type AuthService from '../auth-service'
import type { AuthServiceConf, HanzoUserInfo, HanzoUserInfoValue } from '../../types'

import {
  signupWithEmailAndPassword,
  loginWithCustomToken,
  loginWithEmailAndPassword,
  loginWithProvider,
  logoutBackend
} from './firebase-support'
import { associateWalletAddressWithAccount, getAssociatedWalletAddress } from './wallet-support'

class HanzoUserInfoStore implements HanzoUserInfo {

  constructor() {
    makeAutoObservable(this)
  }

  _email: string = ''
  _displayName: string | null = null
  _walletAddress: string | null = null
  _avatar: string | null = null
  _organization: string | null = null

  get email(): string { return this._email}
  get displayName(): string | null { return this._displayName}
  get walletAddress(): string | null { return this._walletAddress}
  get avatar(): string | null { return this._avatar}
  get organization(): string | null { return this._organization}

  clear():void  {
    this._email = ''
    this._displayName = null
    this._walletAddress = null
    this._avatar = null
    this._organization = null
  }

  set(v: HanzoUserInfoValue):void {
    this._email = v.email
    this._displayName = v.displayName
    this._walletAddress = v.walletAddress
    this._avatar = v.avatar ?? null
    this._organization = v.organization ?? null
  }

  get isValid(): boolean {
    return (this._email.length > 0)
  }
}

/**
 * Default AuthService implementation.
 *
 * Without an auth provider (Firebase, IAM, etc.), all operations
 * return graceful failures. Register a provider via the provider
 * registry for actual authentication.
 */
class AuthServiceImpl implements AuthService {

  private _hzUser = new HanzoUserInfoStore()

  constructor(conf: AuthServiceConf, user: HanzoUserInfoValue | null) {

    makeObservable(this, {
      loggedIn: computed,
      user: computed
    })
    if (user) {
      this._hzUser.set(user)
    }
  }

  get user(): HanzoUserInfo | null {
    return this._hzUser.isValid ? this._hzUser : null
  }

  get loggedIn(): boolean {
    return this._hzUser.isValid
  }

  signupEmailAndPassword = async (
    email: string,
    password: string
   ):  Promise<{success: boolean, userInfo: HanzoUserInfo | null, message?: string}> => {

    try {
      this._hzUser.clear()
      const res = await signupWithEmailAndPassword(email, password)
      if (res.success && res.user) {
        const walletAddress = res.user.email ? await getAssociatedWalletAddress(res.user.email) : undefined
        this._hzUser.set({
          email: res.user.email ?? '',
          displayName : res.user.displayName ?? null,
          walletAddress : walletAddress?.result ?? null
        })

        return {
          success: true,
          userInfo: this._hzUser,
          message: res.message
        }
      }
      return {
        success: false,
        userInfo: null,
        message: res.message
      }
    }
    catch (e) {
      console.error('Auth error:', e)
      return {success: false, userInfo: null, message: 'Auth provider not configured'}
    }
  }

  loginEmailAndPassword = async (
    email: string,
    password: string
   ):  Promise<{success: boolean, userInfo: HanzoUserInfo | null, message?: string}> => {

    try {
      this._hzUser.clear()
      const res = await loginWithEmailAndPassword(email, password)
      if (res.success && res.user) {
        const walletAddress = res.user.email ? await getAssociatedWalletAddress(res.user.email) : undefined
        this._hzUser.set({
          email: res.user.email ?? '',
          displayName : res.user.displayName ?? null,
          walletAddress : walletAddress?.result ?? null
        })

        return {
          success: true,
          userInfo: this._hzUser,
          message: res.message
        }
      }
      return {
        success: false,
        userInfo: null,
        message: res.message
      }
    }
    catch (e) {
      console.error('Auth error:', e)
      return {success: false, userInfo: null, message: 'Auth provider not configured'}
    }
  }

  loginWithProvider = async (
    provider: 'google' | 'facebook' | 'github'
   ):  Promise<{success: boolean, userInfo: HanzoUserInfo | null}> => {

    try {
      this._hzUser.clear()
      const res = await loginWithProvider(provider)
      if (res.success && res.user) {
        const walletAddress = res.user.email ? await getAssociatedWalletAddress(res.user.email) : undefined
        this._hzUser.set({
          email: res.user.email ?? '',
          displayName : res.user.displayName ?? null,
          walletAddress : walletAddress?.result ?? null
        })

        return {
          success: true,
          userInfo: this._hzUser
        }
      }
      return {
        success: false,
        userInfo: null
      }
    }
    catch (e) {
      console.error('Auth error:', e)
      return {success: false, userInfo: null}
    }
  }

  loginWithCustomToken = async (
    token: string
   ):  Promise<{success: boolean, userInfo: HanzoUserInfo | null}> => {

    try {
      this._hzUser.clear()
      const res = await loginWithCustomToken(token)
      if (res.success && res.user) {
        const walletAddress = res.user.email ? await getAssociatedWalletAddress(res.user.email) : undefined
        this._hzUser.set({
          email: res.user.email ?? '',
          displayName : res.user.displayName ?? null,
          walletAddress : walletAddress?.result ?? null
        })

        return {
          success: true,
          userInfo: this._hzUser
        }
      }
      return {
        success: false,
        userInfo: null
      }
    }
    catch (e) {
      console.error('Auth error:', e)
      return {success: false, userInfo: null}
    }
  }

  associateWallet = async (): Promise<void>  => {
    if (this._hzUser.isValid) {
      const res = await associateWalletAddressWithAccount(this._hzUser.email)
      if (!res.error) {
        this._hzUser._walletAddress = res.result ?? null
      }
    }
  }

  logout = async (): Promise<{ success: boolean }> => {
    this._hzUser.clear()
    return await logoutBackend()
  }

  setServerSideUser = (user: HanzoUserInfoValue | null)  => {
    if (user) {
      this._hzUser.set(user)
    }
  }
}

export default AuthServiceImpl
