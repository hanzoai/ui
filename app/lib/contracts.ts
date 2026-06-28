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
  {
    registry: `0x${string}`;
    token: `0x${string}`;
    chainConfig?: `0x${string}`;
    husd?: `0x${string}`;
    faucet?: `0x${string}`;
  }
> = {
  // Local Testnet (31337)
  31337: {
    registry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  // Hanzo Mainnet (36963) — sovereign L1, deployed 2026-06
  36963: {
    registry: "0xf3df584A4a996b5D215E740B2240886d42C7307a",
    token: "0x799586e3637E68250449e840F22F8a1a01d6E934", // AIToken (AI)
    chainConfig: "0x25C806e07bA1c7B5c3495a8C57E6b8fd346092E1",
    husd: "0xe9e32EF8aaECB68794Da3E1E9191b0a64CeC2c83", // HUSD (LUSD)
    faucet: "0xd27d8049A575A63b54aAbbC4C41dBa5963cedF56",
  },
  // Hanzo Testnet (36962) — sovereign L1, deployed 2026-06
  36962: {
    registry: "0x6EA9D7C669DAC51830219ff5d4391872a25AB147",
    token: "0x9Adf4583DDB3aFF5fA08a6788fc203e9d9908F4F", // AIToken (AI)
    chainConfig: "0x6162A52F71a1C8F0F1F86FE8D17d6DDedaEdaC3c",
    husd: "0xc57b7eCE2Ce2E74ef3Bc08Cfd5f5Fb41B6Ad4D66", // HUSD (LUSD)
    faucet: "0x88810C4F376aF0018641e98Fcc06f0b7Ba529937",
  },
  // Hanzo Devnet (36964) — sovereign L1, deployed 2026-06
  36964: {
    registry: "0xDeA8179dEc51eA55E03fbe257d51c6d0f5908E3F",
    token: "0x486809dD1bac9A17f18a1a640cdEf014C7DD809a", // AIToken (AI)
    chainConfig: "0xf911b6e4952781949Db84B478582Ca05817fECB4",
    husd: "0xBf92c933774daDF112159Be4b29e6BDc3ffAa2B1", // HUSD (LUSD)
    faucet: "0x0B2B0BF9f423C03151480e1bB63caCd4cB3B6343",
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
  36964: "hanzo-devnet",
  96369: "lux",
  96368: "lux-testnet",
  200200: "zoo",
  200201: "zoo-testnet",
}
