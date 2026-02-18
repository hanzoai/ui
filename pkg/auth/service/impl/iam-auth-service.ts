/**
 * IAM Authentication Service
 *
 * Primary auth implementation using Hanzo IAM (hanzo.id).
 * Uses OIDC/PKCE for all login flows — Google, GitHub, email/password,
 * and any other identity providers are configured in IAM, not client-side.
 *
 * Usage:
 * ```ts
 * import { registerAuthProvider, IamAuthService } from '@hanzo/auth'
 * registerAuthProvider('iam', IamAuthService)
 * ```
 */

import { makeAutoObservable, makeObservable, computed } from 'mobx'

import type AuthService from '../auth-service'
import type { AuthServiceConf, HanzoUserInfo, HanzoUserInfoValue } from '../../types'

// ---------------------------------------------------------------------------
// User info store (MobX observable)
// ---------------------------------------------------------------------------

class IamUserInfoStore implements HanzoUserInfo {
  constructor() {
    makeAutoObservable(this)
  }

  _email: string = ''
  _displayName: string | null = null
  _walletAddress: string | null = null
  _avatar: string | null = null
  _organization: string | null = null

  get email(): string { return this._email }
  get displayName(): string | null { return this._displayName }
  get walletAddress(): string | null { return this._walletAddress }
  get avatar(): string | null { return this._avatar }
  get organization(): string | null { return this._organization }

  clear(): void {
    this._email = ''
    this._displayName = null
    this._walletAddress = null
    this._avatar = null
    this._organization = null
  }

  set(v: HanzoUserInfoValue): void {
    this._email = v.email
    this._displayName = v.displayName
    this._walletAddress = v.walletAddress
    this._avatar = v.avatar ?? null
    this._organization = v.organization ?? null
  }

  setFromIamProfile(profile: Record<string, unknown>): void {
    this._email = (profile.email as string) ?? ''
    this._displayName = (profile.name as string)
      ?? (profile.preferred_username as string)
      ?? (profile.displayName as string)
      ?? null
    this._avatar = (profile.picture as string)
      ?? (profile.avatar as string)
      ?? null
    // Extract org from sub claim (format: "org/username")
    const sub = profile.sub as string | undefined
    if (sub && sub.includes('/')) {
      this._organization = sub.split('/')[0]
    }
  }

  get isValid(): boolean {
    return this._email.length > 0
  }
}

// ---------------------------------------------------------------------------
// Storage keys (same as BrowserIamSdk for shared token state)
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'hanzo_iam_'
const KEY_ACCESS_TOKEN = `${STORAGE_PREFIX}access_token`
const KEY_REFRESH_TOKEN = `${STORAGE_PREFIX}refresh_token`
const KEY_ID_TOKEN = `${STORAGE_PREFIX}id_token`
const KEY_EXPIRES_AT = `${STORAGE_PREFIX}expires_at`
const KEY_STATE = `${STORAGE_PREFIX}state`
const KEY_CODE_VERIFIER = `${STORAGE_PREFIX}code_verifier`

// ---------------------------------------------------------------------------
// PKCE utilities (inline to avoid @hanzo/iam dependency)
// ---------------------------------------------------------------------------

function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const array = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(array, (b) => chars[b % chars.length]).join('')
}

async function generatePkceChallenge(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = randomString(64)
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return { codeVerifier, codeChallenge }
}

// ---------------------------------------------------------------------------
// OIDC Discovery cache
// ---------------------------------------------------------------------------

interface OidcEndpoints {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
}

let discoveryCache: OidcEndpoints | null = null

async function getDiscovery(serverUrl: string): Promise<OidcEndpoints> {
  if (discoveryCache) return discoveryCache
  const base = serverUrl.replace(/\/+$/, '')
  const res = await fetch(`${base}/.well-known/openid-configuration`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`)
  discoveryCache = (await res.json()) as OidcEndpoints
  return discoveryCache
}

// ---------------------------------------------------------------------------
// IAM Auth Service
// ---------------------------------------------------------------------------

export class IamAuthService implements AuthService {
  private _hzUser = new IamUserInfoStore()
  private serverUrl: string
  private clientId: string
  private redirectUri: string
  private appName: string
  private orgName: string
  private storage: Storage

  constructor(conf: AuthServiceConf, user: HanzoUserInfoValue | null) {
    this.serverUrl = conf.iamServerUrl ?? ''
    this.clientId = conf.iamClientId ?? ''
    this.redirectUri = conf.iamRedirectUri ?? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '')
    this.appName = conf.iamAppName ?? 'app'
    this.orgName = conf.iamOrgName ?? 'built-in'
    this.storage = typeof window !== 'undefined' ? sessionStorage : ({
      getItem: () => null, setItem: () => {}, removeItem: () => {},
    } as unknown as Storage)

    makeObservable(this, {
      loggedIn: computed,
      user: computed
    })

    if (user) {
      this._hzUser.set(user)
    } else if (typeof window !== 'undefined') {
      // Check for existing tokens on init
      this.tryRestoreSession()
    }
  }

  get user(): HanzoUserInfo | null {
    return this._hzUser.isValid ? this._hzUser : null
  }

  get loggedIn(): boolean {
    return this._hzUser.isValid
  }

  // -----------------------------------------------------------------------
  // Auth methods — all route through IAM OIDC
  // -----------------------------------------------------------------------

  signupEmailAndPassword = async (
    _email: string,
    _password: string
  ): Promise<{ success: boolean; userInfo: HanzoUserInfo | null; message?: string }> => {
    // Redirect to IAM signup page with email pre-filled
    if (typeof window !== 'undefined') {
      const base = this.serverUrl.replace(/\/+$/, '')
      window.location.href = `${base}/signup/${this.appName}?enablePassword=true`
    }
    return { success: true, userInfo: null, message: 'Redirecting to signup...' }
  }

  loginEmailAndPassword = async (
    _email: string,
    _password: string
  ): Promise<{ success: boolean; userInfo: HanzoUserInfo | null; message?: string }> => {
    // Start OIDC redirect flow — IAM login page handles email/password
    await this.startPkceFlow()
    return { success: true, userInfo: null, message: 'Redirecting to login...' }
  }

  loginWithProvider = async (
    _provider: 'google' | 'facebook' | 'github'
  ): Promise<{ success: boolean; userInfo: HanzoUserInfo | null }> => {
    // All providers are configured in IAM — just start the OIDC flow.
    // IAM's login page shows configured identity providers.
    await this.startPkceFlow()
    return { success: true, userInfo: null }
  }

  loginWithCustomToken = async (
    token: string
  ): Promise<{ success: boolean; userInfo: HanzoUserInfo | null }> => {
    // Store the token and try to fetch user info
    this.storage.setItem(KEY_ACCESS_TOKEN, token)
    try {
      await this.fetchAndSetUserInfo()
      return { success: true, userInfo: this._hzUser }
    } catch {
      return { success: false, userInfo: null }
    }
  }

  associateWallet = async (): Promise<void> => {
    // Wallet association not supported through IAM — no-op
    console.warn('Wallet association not supported through IAM. Use a dedicated wallet service.')
  }

  logout = async (): Promise<{ success: boolean }> => {
    this.clearTokens()
    this._hzUser.clear()
    return { success: true }
  }

  // -----------------------------------------------------------------------
  // IAM-specific public methods
  // -----------------------------------------------------------------------

  /** Start the OIDC login redirect (can also be used directly). */
  login = async (): Promise<void> => {
    await this.startPkceFlow()
  }

  /** Handle the OAuth callback URL. Call on your /auth/callback page. */
  handleCallback = async (callbackUrl?: string): Promise<HanzoUserInfo | null> => {
    const url = new URL(callbackUrl ?? window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      throw new Error(`OAuth error: ${url.searchParams.get('error_description') ?? error}`)
    }
    if (!code) throw new Error('Missing authorization code')

    const savedState = this.storage.getItem(KEY_STATE)
    if (!savedState || savedState !== state) {
      throw new Error('OAuth state mismatch')
    }

    const codeVerifier = this.storage.getItem(KEY_CODE_VERIFIER)
    if (!codeVerifier) throw new Error('Missing PKCE code verifier')

    this.storage.removeItem(KEY_STATE)
    this.storage.removeItem(KEY_CODE_VERIFIER)

    const discovery = await getDiscovery(this.serverUrl)
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
    })

    const res = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Token exchange failed (${res.status}): ${text}`)
    }

    const tokens = await res.json()
    this.storeTokens(tokens)
    await this.fetchAndSetUserInfo()
    return this._hzUser
  }

  /** Get the access token (auto-refreshes if expired). */
  getAccessToken = async (): Promise<string | null> => {
    const token = this.storage.getItem(KEY_ACCESS_TOKEN)
    const expiresAt = this.storage.getItem(KEY_EXPIRES_AT)
    if (token && expiresAt && Date.now() < Number(expiresAt)) {
      return token
    }
    const refreshToken = this.storage.getItem(KEY_REFRESH_TOKEN)
    if (refreshToken) {
      try {
        const discovery = await getDiscovery(this.serverUrl)
        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          refresh_token: refreshToken,
        })
        const res = await fetch(discovery.token_endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        })
        if (res.ok) {
          const tokens = await res.json()
          this.storeTokens(tokens)
          return tokens.access_token
        }
      } catch { /* fall through */ }
    }
    return null
  }

  setServerSideUser = (user: HanzoUserInfoValue | null) => {
    if (user) {
      this._hzUser.set(user)
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async startPkceFlow(): Promise<void> {
    const discovery = await getDiscovery(this.serverUrl)
    const { codeVerifier, codeChallenge } = await generatePkceChallenge()
    const state = randomString(32)

    this.storage.setItem(KEY_STATE, state)
    this.storage.setItem(KEY_CODE_VERIFIER, codeVerifier)

    const url = new URL(discovery.authorization_endpoint)
    url.searchParams.set('client_id', this.clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', this.redirectUri)
    url.searchParams.set('scope', 'openid profile email')
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge', codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')

    window.location.href = url.toString()
  }

  private storeTokens(tokens: { access_token: string; refresh_token?: string; id_token?: string; expires_in?: number }): void {
    this.storage.setItem(KEY_ACCESS_TOKEN, tokens.access_token)
    if (tokens.refresh_token) this.storage.setItem(KEY_REFRESH_TOKEN, tokens.refresh_token)
    if (tokens.id_token) this.storage.setItem(KEY_ID_TOKEN, tokens.id_token)
    if (tokens.expires_in) {
      this.storage.setItem(KEY_EXPIRES_AT, String(Date.now() + tokens.expires_in * 1000))
    }
  }

  private clearTokens(): void {
    this.storage.removeItem(KEY_ACCESS_TOKEN)
    this.storage.removeItem(KEY_REFRESH_TOKEN)
    this.storage.removeItem(KEY_ID_TOKEN)
    this.storage.removeItem(KEY_EXPIRES_AT)
    this.storage.removeItem(KEY_STATE)
    this.storage.removeItem(KEY_CODE_VERIFIER)
  }

  private async fetchAndSetUserInfo(): Promise<void> {
    const token = this.storage.getItem(KEY_ACCESS_TOKEN)
    if (!token) return

    const discovery = await getDiscovery(this.serverUrl)
    const res = await fetch(discovery.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const profile = await res.json()
      this._hzUser.setFromIamProfile(profile)
    }
  }

  private async tryRestoreSession(): Promise<void> {
    const token = this.storage.getItem(KEY_ACCESS_TOKEN)
    if (!token || !this.serverUrl) return

    const expiresAt = this.storage.getItem(KEY_EXPIRES_AT)
    if (expiresAt && Date.now() >= Number(expiresAt)) {
      // Token expired, try refresh
      const refreshToken = this.storage.getItem(KEY_REFRESH_TOKEN)
      if (!refreshToken) return
      try {
        const discovery = await getDiscovery(this.serverUrl)
        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          refresh_token: refreshToken,
        })
        const res = await fetch(discovery.token_endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        })
        if (!res.ok) return
        const tokens = await res.json()
        this.storeTokens(tokens)
      } catch { return }
    }

    await this.fetchAndSetUserInfo()
  }
}

export default IamAuthService
