"use client"

import "@rainbow-me/rainbowkit/styles.css"

import { useEffect, useState, type ReactNode } from "react"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, type Config } from "wagmi"

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    // Dynamically import wagmi config only on client side
    import("@/lib/wagmi").then((mod) => {
      setConfig(mod.getConfig())
    })
  }, [])

  // Don't render until config is loaded
  if (!config) {
    return <>{children}</>
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
