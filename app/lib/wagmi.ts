"use client"

import { defineChain } from "viem"
import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"

// Localhost (Anvil)
export const localhost = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"],
    },
  },
  testnet: true,
})

// Hanzo Mainnet
export const hanzoMainnet = defineChain({
  id: 36963,
  name: "Hanzo",
  nativeCurrency: {
    decimals: 18,
    name: "AI",
    symbol: "AI",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hanzo.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hanzo Explorer",
      url: "https://explorer.hanzo.ai",
    },
  },
})

// Hanzo Testnet
export const hanzoTestnet = defineChain({
  id: 36962,
  name: "Hanzo Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "AI",
    symbol: "AI",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.hanzo.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hanzo Testnet Explorer",
      url: "https://testnet-explorer.hanzo.ai",
    },
  },
  testnet: true,
})

// Lux Mainnet
export const luxMainnet = defineChain({
  id: 96369,
  name: "Lux",
  nativeCurrency: {
    decimals: 18,
    name: "LUX",
    symbol: "LUX",
  },
  rpcUrls: {
    default: {
      http: ["https://api.lux.network/v1/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lux Explorer",
      url: "https://explorer.lux.network",
    },
  },
})

// Lux Testnet
export const luxTestnet = defineChain({
  id: 96368,
  name: "Lux Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "LUX",
    symbol: "LUX",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-api.lux.network/v1/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lux Testnet Explorer",
      url: "https://testnet-explorer.lux.network",
    },
  },
  testnet: true,
})

// Zoo Mainnet
export const zooMainnet = defineChain({
  id: 200200,
  name: "Zoo",
  nativeCurrency: {
    decimals: 18,
    name: "ZOO",
    symbol: "ZOO",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.zoo.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Zoo Explorer",
      url: "https://explorer.zoo.network",
    },
  },
})

// Zoo Testnet
export const zooTestnet = defineChain({
  id: 200201,
  name: "Zoo Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "ZOO",
    symbol: "ZOO",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.zoo.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Zoo Testnet Explorer",
      url: "https://testnet-explorer.zoo.network",
    },
  },
  testnet: true,
})

const chains = [
  localhost,
  hanzoMainnet,
  hanzoTestnet,
  luxMainnet,
  luxTestnet,
  zooMainnet,
  zooTestnet,
] as const

type Config = ReturnType<typeof createConfig>

let _config: Config | undefined

export const getConfig = (): Config => {
  if (!_config) {
    _config = createConfig({
      chains,
      // The browser wallet speaks EIP-1193 directly. No third-party bridge, no
      // vendor project id, and nothing phoning home from a docs page.
      connectors: [injected()],
      transports: Object.fromEntries(
        chains.map((chain) => [chain.id, http()])
      ) as Record<(typeof chains)[number]["id"], ReturnType<typeof http>>,
      ssr: true,
    })
  }

  return _config
}

export const config = getConfig()
