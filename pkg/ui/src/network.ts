// @hanzo/ui/network — the ONE network selector, re-exported from its home module
// @hanzo/ui-shadcn/network. `NetworkSwitcher` renders the selected environment
// and a menu of configured networks + a custom-endpoint form, backed by the
// shared selected-network store; `configureNetworks` swaps the network set so a
// downstream brand can white-label it. Thin subpath:
//
//   import { NetworkSwitcher, useNetwork, configureNetworks, HANZO_NETWORKS,
//            type Network } from '@hanzo/ui/network'
//
// Optional peer — only pulled when the subpath is used.
export * from '@hanzo/ui-shadcn/network'
