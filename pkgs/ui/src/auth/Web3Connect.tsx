'use client'

import React from 'react'
import { SocialButton, type SocialButtonProps } from './SocialButton'

export type Web3ConnectProps = Omit<SocialButtonProps, 'provider'>

/**
 * Wallet sign-in. Thin specialization of `<SocialButton provider="web3">` — the
 * web3 hop is just another provider delegated to IAM. Atomic, brand-neutral,
 * composes freely; no separate flow.
 */
export function Web3Connect(props: Web3ConnectProps) {
  return <SocialButton provider="web3" {...props} />
}
