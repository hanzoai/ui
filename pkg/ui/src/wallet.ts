// @hanzo/ui/wallet — the ONE wallet surface, re-exported from its home module
// @hanzo/ui-shadcn/wallet. `WalletMenu` is presentation only (address, PQ
// identity, selected-network alignment, explorer link, connect/disconnect);
// custody lives in the injected `WalletAdapter` (desktop wallet, web EIP-1193).
// Thin subpath so every console imports the same wallet surface:
//
//   import { WalletMenu, injectedEvmAdapter, walletAvailable, ensureEvmNetwork,
//            shortAddress, type WalletAdapter } from '@hanzo/ui/wallet'
//
// Optional peer — only pulled when the subpath is used.
export * from '@hanzo/ui-shadcn/wallet'
