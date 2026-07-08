/**
 * Tests for the shared network model + selector.
 *
 * Model: canonical envs mirror the `hanzo` CLI (sovereign L1 ⇒
 * networkID === evmChainID; one api.hanzo.ai for public envs).
 * Store: selection persists (env name only — endpoints re-resolve from
 * code), custom networks validate, subscribers fire.
 * Presentation: <NetworkSwitcher/> lists envs, switches, takes customs.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'

import { HANZO_NETWORKS, chainIdHex, networkByEnv } from './networks'
import {
  getNetwork,
  selectCustomNetwork,
  selectNetwork,
  subscribeNetwork,
} from './store'
import { NetworkSwitcher } from './NetworkSwitcher'

beforeEach(() => {
  localStorage.clear()
  selectNetwork('mainnet')
})

describe('network model', () => {
  it('is the sovereign-L1 model: networkID === evmChainID per env', () => {
    for (const n of HANZO_NETWORKS) expect(n.networkID).toBe(n.evmChainID)
  })

  it('mirrors the hanzo CLI env ids', () => {
    expect(networkByEnv(HANZO_NETWORKS, 'mainnet')?.evmChainID).toBe(36963)
    expect(networkByEnv(HANZO_NETWORKS, 'testnet')?.evmChainID).toBe(36964)
    expect(networkByEnv(HANZO_NETWORKS, 'devnet')?.evmChainID).toBe(36965)
    expect(networkByEnv(HANZO_NETWORKS, 'local')?.evmChainID).toBe(31337)
  })

  it('public envs share the one cloud API', () => {
    for (const env of ['mainnet', 'testnet', 'devnet'] as const) {
      expect(networkByEnv(HANZO_NETWORKS, env)?.apiEndpoint).toBe('https://api.hanzo.ai')
    }
  })

  it('encodes the EIP-3085 hex chain id', () => {
    expect(chainIdHex(networkByEnv(HANZO_NETWORKS, 'mainnet')!)).toBe('0x9063')
    expect(chainIdHex(networkByEnv(HANZO_NETWORKS, 'local')!)).toBe('0x7a69')
  })
})

describe('network store', () => {
  it('defaults to mainnet and switches envs', () => {
    expect(getNetwork().env).toBe('mainnet')
    selectNetwork('testnet')
    expect(getNetwork().evmChainID).toBe(36964)
    expect(getNetwork().rpcEndpoint).toBe('https://rpc.hanzo-test.network')
  })

  it('persists only the selection, notifies subscribers', () => {
    let fired = 0
    const off = subscribeNetwork(() => {
      fired += 1
    })
    selectNetwork('devnet')
    off()
    expect(fired).toBe(1)
    const stored = JSON.parse(localStorage.getItem('hanzo.network')!)
    expect(stored).toEqual({ env: 'devnet' })
  })

  it('accepts a valid custom network and rejects junk', () => {
    const custom = selectCustomNetwork({
      label: 'My L1',
      networkID: 4242,
      evmChainID: 4242,
      rpcEndpoint: 'https://rpc.example.com',
      apiEndpoint: 'https://api.example.com',
      currency: 'AI',
    })
    expect(custom.env).toBe('custom')
    expect(getNetwork().evmChainID).toBe(4242)
    expect(() =>
      selectCustomNetwork({
        label: 'bad',
        networkID: 0,
        evmChainID: 0,
        rpcEndpoint: 'not-a-url',
        apiEndpoint: '',
        currency: 'AI',
      }),
    ).toThrow()
    // Failed select leaves the previous selection intact.
    expect(getNetwork().evmChainID).toBe(4242)
  })

  it('throws on selecting an unconfigured env', () => {
    expect(() => selectNetwork('nope' as never)).toThrow()
  })
})

describe('<NetworkSwitcher/>', () => {
  it('renders the selection and switches networks', () => {
    render(<NetworkSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /Hanzo Mainnet/ }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Hanzo Testnet/ }))
    expect(getNetwork().env).toBe('testnet')
    expect(screen.getByRole('button', { name: /Hanzo Testnet/ })).toBeTruthy()
  })

  it('connects a custom network through the inline form', () => {
    render(<NetworkSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /Hanzo Mainnet/ }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Custom/ }))
    fireEvent.change(screen.getByPlaceholderText('Chain ID'), { target: { value: '4242' } })
    fireEvent.change(screen.getByPlaceholderText(/RPC endpoint/), {
      target: { value: 'https://rpc.example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/API endpoint/), {
      target: { value: 'https://api.example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }))
    expect(getNetwork()).toMatchObject({ env: 'custom', evmChainID: 4242 })
  })

  it('shows a validation error instead of selecting a bad custom network', () => {
    render(<NetworkSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /Hanzo Mainnet/ }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Custom/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }))
    expect(screen.getByText(/Chain ID must be/)).toBeTruthy()
    expect(getNetwork().env).toBe('mainnet')
  })
})
