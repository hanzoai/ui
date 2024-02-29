interface HanzoUserInfo {
  get email(): string
  get displayName(): string | null     
  get walletAddress(): string | null   
}

export {
  type HanzoUserInfo as default
}