/**
 * Wallet contract for every Hanzo surface. ONE presentation
 * (<WalletMenu/>), per-surface custody behind a small adapter:
 *
 *   - desktop  → the lux-wallet stack (@luxfi/crypto HD + PQ ML-DSA-65
 *                identity, keychain-held; auto-provisioned on connect)
 *   - web      → the injected EIP-1193 wallet (non-custodial — the
 *                browser never holds keys; see `injectedEvmAdapter`)
 *
 * Adapters expose values, not places: a snapshot + a subscription.
 * `getState()` MUST return a stable reference that changes identity
 * only when the state changes (useSyncExternalStore contract).
 */

import type { Network } from '../network/networks'

export type WalletStatus = 'disconnected' | 'connecting' | 'ready' | 'error'

export interface WalletAccount {
  /** EIP-55 EVM address. */
  address: string
  label?: string
  /** 0x-hex ML-DSA-65 public key when the surface holds a PQ identity. */
  pqPublicKey?: string
  /** Node ID derived from the PQ identity. */
  pqNodeId?: string
}

export interface WalletState {
  status: WalletStatus
  account: WalletAccount | null
  /** EVM chain the wallet is currently on, when knowable. */
  chainId: number | null
  error: string | null
}

export interface WalletAdapter {
  getState(): WalletState
  /** Subscribe to state changes. Returns the unsubscriber. */
  subscribe(cb: () => void): () => void
  /** Connect — or auto-provision, where the surface owns custody. */
  connect(): Promise<void>
  disconnect?(): void | Promise<void>
  /** Point the wallet at the given network (switch/add chain). */
  ensureNetwork?(network: Network): Promise<void>
}

/** 0x1234…abcd — the one address truncation. */
export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}
