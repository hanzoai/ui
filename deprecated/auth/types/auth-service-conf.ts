interface AuthServiceConf {
  /** @deprecated Use IAM config instead. Firebase Firestore DB reference. */
  firestoreDB?: string
  /** @deprecated Use IAM config instead. Firebase user info collection name. */
  userInfoCollection?: string

  /** IAM server URL (e.g. "https://id.hanzo.ai"). */
  iamServerUrl?: string
  /** IAM application client ID. */
  iamClientId?: string
  /** IAM OAuth2 redirect URI. */
  iamRedirectUri?: string
  /** IAM application name. */
  iamAppName?: string
  /** IAM organization name. */
  iamOrgName?: string
}

export {
  type AuthServiceConf as default
}