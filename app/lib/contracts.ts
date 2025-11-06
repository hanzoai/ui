export const HANZO_REGISTRY_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint256", name: "namespace", type: "uint256" },
          { internalType: "uint256", name: "stakeAmount", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "string", name: "referrer", type: "string" },
        ],
        internalType: "struct HanzoRegistry.ClaimIdentityParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "claimIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "namespace", type: "uint256" },
      { internalType: "bool", name: "validReferrer", type: "bool" },
    ],
    name: "identityStakeRequirement",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "price1Char",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "price2Char",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "price3Char",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "price4Char",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "price5PlusChar",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "referrerDiscountBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_price1Char", type: "uint256" },
      { internalType: "uint256", name: "_price2Char", type: "uint256" },
      { internalType: "uint256", name: "_price3Char", type: "uint256" },
      { internalType: "uint256", name: "_price4Char", type: "uint256" },
      { internalType: "uint256", name: "_price5PlusChar", type: "uint256" },
      {
        internalType: "uint256",
        name: "_referrerDiscountBps",
        type: "uint256",
      },
    ],
    name: "updatePricing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "namespace", type: "uint256" },
    ],
    name: "identityAvailable",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "namespace", type: "uint256" },
    ],
    name: "identityOf",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "staked", type: "uint256" },
          { internalType: "uint256", name: "claimedAt", type: "uint256" },
          { internalType: "uint256", name: "nftId", type: "uint256" },
          { internalType: "bool", name: "active", type: "bool" },
        ],
        internalType: "struct HanzoRegistry.Identity",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

export const AI_TOKEN_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Contract addresses by chain ID
export const CONTRACT_ADDRESSES: Record<
  number,
  { registry: `0x${string}`; token: `0x${string}` }
> = {
  // Local Testnet (31337)
  31337: {
    registry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  // Hanzo Mainnet (36963)
  36963: {
    registry: "0x0000000000000000000000000000000000000000", // Deploy and update
    token: "0x0000000000000000000000000000000000000000", // Deploy and update
  },
  // Hanzo Testnet (36962)
  36962: {
    registry: "0x0000000000000000000000000000000000000000", // Deploy and update
    token: "0x0000000000000000000000000000000000000000", // Deploy and update
  },
  // Lux Mainnet (96369)
  96369: {
    registry: "0x0000000000000000000000000000000000000000", // Deploy and update
    token: "0x0000000000000000000000000000000000000000", // Deploy and update
  },
  // Lux Testnet (96368)
  96368: {
    registry: "0x0000000000000000000000000000000000000000", // Deploy and update
    token: "0x0000000000000000000000000000000000000000", // Deploy and update
  },
  // Zoo Mainnet (200200)
  200200: {
    registry: "0x0000000000000000000000000000000000000000", // Deploy and update
    token: "0x0000000000000000000000000000000000000000", // Deploy and update
  },
  // Zoo Testnet (200201)
  200201: {
    registry: "0x0000000000000000000000000000000000000000", // Deploy and update
    token: "0x0000000000000000000000000000000000000000", // Deploy and update
  },
}

export const NETWORK_NAMES: Record<number, string> = {
  31337: "localhost",
  36963: "hanzo",
  36962: "hanzo-testnet",
  96369: "lux",
  96368: "lux-testnet",
  200200: "zoo",
  200201: "zoo-testnet",
}
