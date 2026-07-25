"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"

import { Button } from "@/registry/default/ui/button"

const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

/**
 * Connect the wallet the browser already has, over EIP-1193. There is no
 * third-party modal and no bridge service in the page — the extension is the
 * only party involved.
 */
export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm">{short(address)}</span>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    )
  }

  const injected = connectors[0]

  return (
    <Button
      onClick={() => injected && connect({ connector: injected })}
      disabled={!injected || isPending}
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </Button>
  )
}
