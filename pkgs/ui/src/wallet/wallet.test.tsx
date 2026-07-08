/**
 * Tests for the shared wallet surface.
 *
 * Presentation (<WalletMenu/>): renders custody state from ANY adapter —
 * connect flow, address + PQ identity, network mismatch prompt.
 * Mechanism (injectedEvmAdapter): EIP-1193 connect + EIP-3326/3085
 * keep-on-network against a fake window.ethereum. No keys ever held.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import * as React from 'react'

import { selectNetwork, getNetwork } from '../network/store'
import { injectedEvmAdapter, ensureEvmNetwork } from './evm'
import { shortAddress, type WalletAdapter, type WalletState } from './types'
import { WalletMenu } from './WalletMenu'

const ADDRESS = '0x1234567890AbcdEF1234567890aBcdef12345678'

function fakeAdapter(initial: Partial<WalletState> = {}): WalletAdapter & {
  set: (next: Partial<WalletState>) => void
} {
  let state: WalletState = {
    status: 'disconnected',
    account: null,
    chainId: null,
    error: null,
    ...initial,
  }
  const listeners = new Set<() => void>()
  return {
    getState: () => state,
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    connect: vi.fn(async () => {
      state = { status: 'ready', account: { address: ADDRESS }, chainId: 36963, error: null }
      listeners.forEach((l) => l())
    }),
    disconnect: vi.fn(),
    ensureNetwork: vi.fn(async () => {}),
    set(next) {
      state = { ...state, ...next }
      listeners.forEach((l) => l())
    },
  }
}

beforeEach(() => {
  localStorage.clear()
  selectNetwork('mainnet')
})

describe('shortAddress', () => {
  it('truncates to 0xABCD…1234 form', () => {
    expect(shortAddress(ADDRESS)).toBe('0x1234…5678')
    expect(shortAddress('0xabc')).toBe('0xabc')
  })
})

describe('<WalletMenu/>', () => {
  it('connects through the adapter', async () => {
    const adapter = fakeAdapter()
    render(<WalletMenu adapter={adapter} />)
    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/ }))
    await waitFor(() => expect(screen.getByText(shortAddress(ADDRESS))).toBeTruthy())
    expect(adapter.connect).toHaveBeenCalledTimes(1)
  })

  it('auto-connects (auto-provision) when asked', async () => {
    const adapter = fakeAdapter()
    render(<WalletMenu adapter={adapter} autoConnect />)
    await waitFor(() => expect(adapter.connect).toHaveBeenCalledTimes(1))
  })

  it('shows the PQ identity and disconnects', async () => {
    const adapter = fakeAdapter({
      status: 'ready',
      account: { address: ADDRESS, pqPublicKey: '0xfeed', pqNodeId: 'NodeID-abc' },
      chainId: 36963,
    })
    render(<WalletMenu adapter={adapter} />)
    fireEvent.click(screen.getByRole('button', { name: /PQ/ }))
    expect(screen.getByText(/Post-quantum identity/i)).toBeTruthy()
    expect(screen.getByText('NodeID-abc')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))
    expect(adapter.disconnect).toHaveBeenCalled()
  })

  it('offers a network switch when the wallet chain mismatches the selection', async () => {
    const adapter = fakeAdapter({ status: 'ready', account: { address: ADDRESS }, chainId: 1 })
    render(<WalletMenu adapter={adapter} />)
    fireEvent.click(screen.getByText(shortAddress(ADDRESS)))
    const prompt = screen.getByRole('button', { name: /switch to Hanzo Mainnet/i })
    fireEvent.click(prompt)
    expect(adapter.ensureNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ evmChainID: 36963 }),
    )
  })
})

describe('injectedEvmAdapter', () => {
  interface FakeEth {
    request: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
  }

  function installEthereum(overrides: Partial<Record<string, unknown>> = {}): FakeEth {
    const eth: FakeEth = {
      on: vi.fn(),
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method in overrides) {
          const v = overrides[method]
          if (v instanceof Error) throw v
          return v
        }
        if (method === 'eth_requestAccounts') return [ADDRESS]
        if (method === 'eth_chainId') return '0x9063'
        return null
      }),
    }
    ;(window as unknown as { ethereum?: unknown }).ethereum = eth
    return eth
  }

  beforeEach(() => {
    delete (window as unknown as { ethereum?: unknown }).ethereum
  })

  it('errors clearly with no injected wallet', async () => {
    const adapter = injectedEvmAdapter()
    await expect(adapter.connect()).rejects.toThrow(/No browser wallet/)
    expect(adapter.getState().status).toBe('error')
  })

  it('connects, pins the selected network, and tracks the chain', async () => {
    const eth = installEthereum()
    const adapter = injectedEvmAdapter()
    await adapter.connect()
    const state = adapter.getState()
    expect(state.status).toBe('ready')
    expect(state.account?.address).toBe(ADDRESS)
    expect(state.chainId).toBe(36963)
    expect(eth.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x9063' }],
    })
  })

  it('adds the chain when the wallet does not know it (EIP-3085)', async () => {
    const unknown = Object.assign(new Error('Unrecognized chain'), { code: 4902 })
    const eth = installEthereum({ wallet_switchEthereumChain: unknown })
    await ensureEvmNetwork(eth as never, getNetwork())
    expect(eth.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'wallet_addEthereumChain',
        params: [
          expect.objectContaining({
            chainId: '0x9063',
            rpcUrls: ['https://rpc.hanzo.network'],
          }),
        ],
      }),
    )
  })

  it('follows accountsChanged from the wallet', async () => {
    const eth = installEthereum()
    const adapter = injectedEvmAdapter()
    await adapter.connect()
    const onAccounts = eth.on.mock.calls.find((c) => c[0] === 'accountsChanged')?.[1] as (
      a: string[],
    ) => void
    act(() => onAccounts([]))
    expect(adapter.getState().status).toBe('disconnected')
  })
})
