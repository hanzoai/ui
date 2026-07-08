'use client'

/**
 * Injected EIP-1193 wallet adapter — the web-surface custody model.
 * NON-custodial: keys live in the user's extension (MetaMask/Rabby/…);
 * this adapter only requests accounts and keeps the wallet pointed at
 * the selected hanzo.network environment (EIP-3326 switch, EIP-3085
 * add-on-unknown). No signing library, no key material, no storage.
 */

import { chainIdHex, type Network } from '../network/networks'
import { getNetwork } from '../network/store'
import type { WalletAdapter, WalletState } from './types'

interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
  on?(event: string, handler: (...args: unknown[]) => void): void
}

function injected(): Eip1193 | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { ethereum?: Eip1193 }).ethereum ?? null
}

/** True when a browser wallet (window.ethereum) is available. */
export const walletAvailable = (): boolean => injected() !== null

/** EIP-3326 switch to `network`, EIP-3085 add when the chain is unknown. */
export async function ensureEvmNetwork(eth: Eip1193, network: Network): Promise<void> {
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex(network) }],
    })
  } catch (e) {
    const code = (e as { code?: number })?.code
    // 4902 = unrecognized chain → add it (some wallets surface -32603).
    if (code !== 4902 && code !== -32603) throw e
    await eth.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: chainIdHex(network),
          chainName: network.label,
          rpcUrls: [network.rpcEndpoint],
          nativeCurrency: { name: network.currency, symbol: network.currency, decimals: 18 },
          ...(network.explorerEndpoint ? { blockExplorerUrls: [network.explorerEndpoint] } : {}),
        },
      ],
    })
  }
}

export interface InjectedEvmAdapterOptions {
  /** Network to keep the wallet on; defaults to the shared selection. */
  getNetwork?: () => Network
}

/** The ONE injected-wallet adapter for web surfaces. */
export function injectedEvmAdapter(opts: InjectedEvmAdapterOptions = {}): WalletAdapter {
  const resolveNetwork = opts.getNetwork ?? getNetwork
  const listeners = new Set<() => void>()
  let state: WalletState = { status: 'disconnected', account: null, chainId: null, error: null }
  let wired = false

  const set = (next: Partial<WalletState>) => {
    state = { ...state, ...next }
    for (const l of listeners) l()
  }

  const wire = (eth: Eip1193) => {
    if (wired || !eth.on) return
    wired = true
    eth.on('accountsChanged', (...args: unknown[]) => {
      const accounts = args[0] as string[]
      if (!accounts?.length) set({ status: 'disconnected', account: null })
      else set({ status: 'ready', account: { address: accounts[0] }, error: null })
    })
    eth.on('chainChanged', (...args: unknown[]) => {
      set({ chainId: Number.parseInt(String(args[0]), 16) || null })
    })
  }

  return {
    getState: () => state,
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    async connect() {
      const eth = injected()
      if (!eth) {
        set({ status: 'error', error: 'No browser wallet detected. Install MetaMask or a compatible wallet.' })
        throw new Error('No browser wallet detected.')
      }
      set({ status: 'connecting', error: null })
      try {
        const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[]
        if (!accounts?.length) throw new Error('No accounts authorized.')
        await ensureEvmNetwork(eth, resolveNetwork())
        const chainHex = (await eth.request({ method: 'eth_chainId' })) as string
        wire(eth)
        set({
          status: 'ready',
          account: { address: accounts[0] },
          chainId: Number.parseInt(chainHex, 16) || null,
        })
      } catch (e) {
        set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
        throw e
      }
    },
    disconnect() {
      // EIP-1193 has no programmatic disconnect; forget the session state.
      set({ status: 'disconnected', account: null, chainId: null, error: null })
    },
    async ensureNetwork(network) {
      const eth = injected()
      if (!eth) throw new Error('No browser wallet detected.')
      await ensureEvmNetwork(eth, network)
    },
  }
}
