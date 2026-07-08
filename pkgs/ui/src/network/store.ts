'use client'

/**
 * Selected-network store — ONE selection shared by every component and
 * API client in a surface. Framework-light: a module store + a React hook
 * (useSyncExternalStore); persisted to localStorage; cross-tab via the
 * `storage` event. SSR-safe (defaults to the first configured network).
 *
 * Only the SELECTION is stored (env name, or the full custom network the
 * user typed). Endpoints for the named envs always come from the
 * configured network list, never from storage — so shipping new endpoints
 * updates every client on next load.
 */

import * as React from 'react'

import {
  HANZO_NETWORKS,
  networkByEnv,
  validateCustomNetwork,
  type Network,
  type NetworkEnv,
} from './networks'

const STORAGE_KEY = 'hanzo.network'

interface Selection {
  env: NetworkEnv
  /** Present only when env === 'custom'. */
  custom?: Network
}

let networks: readonly Network[] = HANZO_NETWORKS
let selection: Selection = { env: 'mainnet' }
let loaded = false
const listeners = new Set<() => void>()

/**
 * Configure the network list for this surface (call once at bootstrap for
 * non-Hanzo brands; Hanzo surfaces need not call it). Resets nothing the
 * user chose — the persisted env is re-resolved against the new list.
 */
export function configureNetworks(list: readonly Network[]): void {
  if (list.length === 0) throw new Error('configureNetworks: list must not be empty')
  networks = list
  emit()
}

export const getNetworks = (): readonly Network[] => networks

function load(): void {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Selection
      if (parsed && typeof parsed.env === 'string') selection = parsed
    }
  } catch {
    // Corrupt storage falls back to the default selection.
  }
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return
    try {
      const parsed = e.newValue ? (JSON.parse(e.newValue) as Selection) : null
      if (parsed && typeof parsed.env === 'string') {
        selection = parsed
        emit()
      }
    } catch {
      // Ignore malformed cross-tab writes.
    }
  })
}

function persist(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
  } catch {
    // Private mode / quota — selection still works for this session.
  }
}

function emit(): void {
  for (const l of listeners) l()
}

/** The currently selected network, resolved against the configured list. */
export function getNetwork(): Network {
  load()
  if (selection.env === 'custom' && selection.custom) return selection.custom
  return networkByEnv(networks, selection.env) ?? networks[0]
}

/** Select a named environment from the configured list. */
export function selectNetwork(env: Exclude<NetworkEnv, 'custom'>): Network {
  load()
  const found = networkByEnv(networks, env)
  if (!found) throw new Error(`selectNetwork: no '${env}' network configured`)
  selection = { env }
  persist()
  emit()
  return found
}

/** Select a user-supplied custom network. Throws on invalid endpoints. */
export function selectCustomNetwork(custom: Omit<Network, 'env'>): Network {
  load()
  const network: Network = { ...custom, env: 'custom' }
  const invalid = validateCustomNetwork(network)
  if (invalid) throw new Error(invalid)
  selection = { env: 'custom', custom: network }
  persist()
  emit()
  return network
}

/** Subscribe to selection changes. Returns the unsubscriber. */
export function subscribeNetwork(cb: () => void): () => void {
  load()
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** React view of the selected network. */
export function useNetwork(): {
  network: Network
  networks: readonly Network[]
  select: typeof selectNetwork
  selectCustom: typeof selectCustomNetwork
} {
  const network = React.useSyncExternalStore(subscribeNetwork, getNetwork, getNetwork)
  return { network, networks, select: selectNetwork, selectCustom: selectCustomNetwork }
}
