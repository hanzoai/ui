interface HanzoUserInfo {
  get email(): string
  get displayName(): string | null
  get walletAddress(): string | null
  get avatar(): string | null
  get organization(): string | null
}

export {
  type HanzoUserInfo as default
}