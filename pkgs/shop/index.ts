/**
 * @hanzo/shop
 *
 * Unified embeddable payment topup widget for Hanzo apps.
 * Drop a single <TopupButton> anywhere to let users add funds.
 *
 * @example
 * ```tsx
 * import { TopupButton } from '@hanzo/shop'
 *
 * // Minimal usage — token falls back to localStorage 'hanzo-auth-token'
 * <TopupButton userId="user_123" />
 *
 * // With explicit token and custom amount
 * <TopupButton
 *   userId="user_123"
 *   token={iamToken}
 *   defaultAmount={50_00}  // cents
 *   onSuccess={(balance) => console.log('new balance', balance)}
 * />
 * ```
 */

// Components
export { TopupButton } from './components/TopupButton'
export { HanzoTopup } from './components/HanzoTopup'
export { PaymentStep } from './components/PaymentStep'
export { CardInput } from './components/CardInput'
export { CryptoInput } from './components/CryptoInput'
export { BankInput } from './components/BankInput'
export { SuccessStep } from './components/SuccessStep'

// Hooks
export { useTopup } from './hooks/useTopup'
export { useSquareCard } from './hooks/useSquareCard'

// Types
export type {
  TopupConfig,
  PaymentTab,
  TopupStatus,
  PresetAmount,
  CryptoChain,
  WalletAddress,
} from './types'

export { PRESET_AMOUNTS, MIN_AMOUNT_CENTS, CRYPTO_CHAINS } from './types'
