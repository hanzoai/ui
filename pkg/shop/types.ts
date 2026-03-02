/**
 * @hanzo/shop — type definitions
 */

export type PaymentTab = 'card' | 'crypto' | 'bank'

export type TopupStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error'

export interface TopupConfig {
  /** User ID for the balance account */
  userId: string

  /** IAM access token. Falls back to localStorage 'hanzo-auth-token'. */
  token?: string

  /** Commerce API base URL. Defaults to https://api.hanzo.ai */
  baseUrl?: string

  /** Square application ID. Falls back to NEXT_PUBLIC_SQUARE_APP_ID env var. */
  squareAppId?: string

  /** Square location ID. Falls back to NEXT_PUBLIC_SQUARE_LOCATION_ID env var. */
  squareLocationId?: string

  /** Square environment. Falls back to NEXT_PUBLIC_SQUARE_ENV env var. Defaults to 'sandbox'. */
  squareEnv?: 'sandbox' | 'production'

  /** Default amount in cents. Defaults to 5000 ($50). */
  defaultAmount?: number

  /** Currency code. Defaults to 'usd'. */
  currency?: string

  /** Called after successful topup with new balance in cents. */
  onSuccess?: (newBalanceCents: number) => void

  /** Called on error. */
  onError?: (err: Error) => void
}

export interface PresetAmount {
  label: string
  cents: number
}

export const PRESET_AMOUNTS: PresetAmount[] = [
  { label: '$10',  cents: 1_000 },
  { label: '$50',  cents: 5_000 },
  { label: '$100', cents: 10_000 },
  { label: '$500', cents: 50_000 },
]

export const MIN_AMOUNT_CENTS = 1_000 // $10

export interface CryptoChain {
  id: string
  name: string
  symbol: string
  /** Optional short network label */
  network?: string
}

export const CRYPTO_CHAINS: CryptoChain[] = [
  { id: 'eth',   name: 'Ethereum',  symbol: 'ETH' },
  { id: 'usdc',  name: 'USD Coin',  symbol: 'USDC', network: 'ERC-20' },
  { id: 'btc',   name: 'Bitcoin',   symbol: 'BTC' },
  { id: 'sol',   name: 'Solana',    symbol: 'SOL' },
  { id: 'lux',   name: 'Lux',       symbol: 'LUX' },
  { id: 'avax',  name: 'Avalanche', symbol: 'AVAX' },
  { id: 'matic', name: 'Polygon',   symbol: 'MATIC' },
]

export interface WalletAddress {
  chain: string
  address: string
  /** Memo/tag if required (e.g. XRP) */
  memo?: string
}
