/**
 * The ONE network model for every Hanzo surface — identical to the
 * `hanzo` CLI (`hanzo network list|use`, cli/src/commands/network.rs)
 * and the console selector. A network is a value:
 *
 *   (env, label, networkID, evmChainID, rpcEndpoint, apiEndpoint)
 *
 * Hanzo is a sovereign L1 — its primary networkID EQUALS its EVM chainID,
 * one ID per environment. Public environments share the one cloud API
 * (api.hanzo.ai); RPC + explorer are per-env fabrics (hanzo.network /
 * hanzo-test.network / hanzo-dev.network). `local` is a self-hosted node;
 * `custom` is user-supplied endpoints.
 */

export type NetworkEnv = 'mainnet' | 'testnet' | 'devnet' | 'local' | 'custom'

export interface Network {
  env: NetworkEnv
  label: string
  /** Sovereign L1 primary network ID (=== evmChainID per environment). */
  networkID: number
  /** EVM chain ID (EIP-155). */
  evmChainID: number
  /** JSON-RPC endpoint for the chain. */
  rpcEndpoint: string
  /** Cloud control-plane / gateway API for this environment. */
  apiEndpoint: string
  /** Block explorer, when the environment has one. */
  explorerEndpoint?: string
  /** Native gas token symbol. */
  currency: string
}

/** Canonical hanzo.network environments (mirrors `hanzo network list`). */
export const HANZO_NETWORKS: readonly Network[] = [
  {
    env: 'mainnet',
    label: 'Hanzo Mainnet',
    networkID: 36963,
    evmChainID: 36963,
    rpcEndpoint: 'https://rpc.hanzo.network',
    apiEndpoint: 'https://api.hanzo.ai',
    explorerEndpoint: 'https://explorer.hanzo.network',
    currency: 'AI',
  },
  {
    env: 'testnet',
    label: 'Hanzo Testnet',
    networkID: 36964,
    evmChainID: 36964,
    rpcEndpoint: 'https://rpc.hanzo-test.network',
    apiEndpoint: 'https://api.hanzo.ai',
    explorerEndpoint: 'https://explorer.hanzo-test.network',
    currency: 'AI',
  },
  {
    env: 'devnet',
    label: 'Hanzo Devnet',
    networkID: 36965,
    evmChainID: 36965,
    rpcEndpoint: 'https://rpc.hanzo-dev.network',
    apiEndpoint: 'https://api.hanzo.ai',
    explorerEndpoint: 'https://explorer.hanzo-dev.network',
    currency: 'AI',
  },
  {
    env: 'local',
    label: 'Local',
    networkID: 31337,
    evmChainID: 31337,
    rpcEndpoint: 'http://localhost:9650/ext/bc/C/rpc',
    apiEndpoint: 'http://localhost:3690',
    currency: 'AI',
  },
]

/** EIP-3085/3326 hex chain id (e.g. 36963 → 0x9063). */
export const chainIdHex = (n: Network): string => '0x' + n.evmChainID.toString(16)

/** Find a network by env in a list (undefined for 'custom' / unknown). */
export const networkByEnv = (
  networks: readonly Network[],
  env: NetworkEnv,
): Network | undefined => networks.find((n) => n.env === env)

const URL_RE = /^https?:\/\/.+/

/** Validate a user-supplied custom network. Returns an error string or null. */
export function validateCustomNetwork(n: Network): string | null {
  if (!Number.isInteger(n.evmChainID) || n.evmChainID <= 0) return 'Chain ID must be a positive integer.'
  if (!URL_RE.test(n.rpcEndpoint)) return 'RPC endpoint must be an http(s) URL.'
  if (!URL_RE.test(n.apiEndpoint)) return 'API endpoint must be an http(s) URL.'
  return null
}
