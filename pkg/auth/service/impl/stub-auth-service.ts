/**
 * Stub Authentication Service
 *
 * This implementation is used when no auth provider is configured.
 * All auth operations return unsuccessful results gracefully.
 */

import { makeAutoObservable, makeObservable, computed } from 'mobx'

import type AuthService from '../auth-service'
import type { AuthServiceConf, HanzoUserInfo, HanzoUserInfoValue } from '../../types'

class HanzoUserInfoStore implements HanzoUserInfo {

  constructor() {
    makeAutoObservable(this)
  }

  _email: string = ''
  _displayName: string | null = null
  _walletAddress: string | null = null

  get email(): string { return this._email}
  get displayName(): string | null { return this._displayName}
  get walletAddress(): string | null { return this._walletAddress}

  clear():void  {
    this._email = ''
    this._displayName = null
    this._walletAddress = null
  }

  set(v: HanzoUserInfoValue):void {
    this._email = v.email
    this._displayName = v.displayName
    this._walletAddress = v.walletAddress
  }

  get isValid(): boolean {
    return (this._email.length > 0)
  }
}

/**
 * Stub auth service that does nothing but returns graceful failures.
 * Used when no auth provider is configured.
 */
export class StubAuthService implements AuthService {

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
    _email: string,
    _password: string
  ):  Promise<{success: boolean, userInfo: HanzoUserInfo | null, message?: string}> => {
    console.warn('Auth provider not configured. Install @hanzo/auth-firebase or another auth provider.')
    return {
      success: false,
      userInfo: null,
      message: 'Auth provider not configured'
    }
  }

  loginEmailAndPassword = async (
    _email: string,
    _password: string
  ):  Promise<{success: boolean, userInfo: HanzoUserInfo | null, message?: string}> => {
    console.warn('Auth provider not configured. Install @hanzo/auth-firebase or another auth provider.')
    return {
      success: false,
      userInfo: null,
      message: 'Auth provider not configured'
    }
  }

  loginWithProvider = async (
    _provider: 'google' | 'facebook' | 'github'
  ):  Promise<{success: boolean, userInfo: HanzoUserInfo | null}> => {
    console.warn('Auth provider not configured. Install @hanzo/auth-firebase or another auth provider.')
    return {
      success: false,
      userInfo: null
    }
  }

  loginWithCustomToken = async (
    _token: string
  ):  Promise<{success: boolean, userInfo: HanzoUserInfo | null}> => {
    console.warn('Auth provider not configured. Install @hanzo/auth-firebase or another auth provider.')
    return {
      success: false,
      userInfo: null
    }
  }

  associateWallet = async (): Promise<void> => {
    console.warn('Auth provider not configured. Install @hanzo/auth-firebase or another auth provider.')
  }

  logout = async (): Promise<{ success: boolean }> => {
    this._hzUser.clear()
    return { success: true }
  }

  setServerSideUser = (user: HanzoUserInfoValue | null) => {
    if (user) {
      this._hzUser.set(user)
    }
  }
}

export default StubAuthService
