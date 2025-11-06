# Hanzo Identity Registration System

A decentralized identity registration system for Hanzo, Lux, and Zoo networks.

## Overview

The identity system allows users to claim unique identities across multiple blockchain networks with a tiered pricing structure based on name length.

## Features

- **Multi-Network Support**: Register identities on Hanzo, Lux, and Zoo (mainnet and testnet)
- **Tiered Pricing**: 
  - Single character (1): 100,000 AI
  - Two characters (2): 10,000 AI
  - Three characters (3): 1,000 AI
  - Four characters (4): 100 AI
  - Five or more (5+): 10 AI
- **Referral System**: 50% discount with valid referrer
- **Web3 Wallet Integration**: RainbowKit for seamless wallet connection
- **Real-time Validation**: Check name availability and format validation
- **Responsive UI**: Modern, accessible interface built with Radix UI

## Project Structure

```
/Users/z/work/hanzo/ui/app/
├── app/(app)/identity/page.tsx      # Identity registration page
├── components/web3-provider.tsx      # Web3/Wagmi provider wrapper
├── lib/
│   ├── wagmi.ts                      # Wagmi config with custom networks
│   └── contracts.ts                  # Contract ABIs and addresses
└── .env.example                      # Environment variable template
```

## Smart Contracts

Located in `/Users/z/work/lux/standard/src/`:

- **HanzoRegistry.sol**: Core identity registration contract
  - Manages identity claims
  - Handles staking requirements
  - Supports delegation and referrals
  - Implements reward distribution

- **AIToken.sol**: ERC20 governance token
  - Staking and vesting functionality
  - Voting power for governance
  - Deflationary burn mechanism

- **AIFaucet.sol**: Token distribution faucet
  - 100 AI tokens per authenticated user
  - 24-hour cooldown period
  - Daily limits and rate limiting

## Setup

### 1. Install Dependencies

```bash
cd /Users/z/work/hanzo/ui/app
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Get a WalletConnect Project ID from https://cloud.walletconnect.com/ and update:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Deploy Contracts

Deploy the smart contracts to your target networks:

```bash
cd /Users/z/work/lux/standard

# For Hanzo Mainnet
forge script script/DeployIdentitySystem.s.sol:DeployIdentitySystem \
  --rpc-url https://rpc.hanzo.ai \
  --broadcast

# For Hanzo Testnet
forge script script/DeployIdentitySystem.s.sol:DeployIdentitySystem \
  --rpc-url https://testnet-rpc.hanzo.ai \
  --broadcast

# For Lux Mainnet
forge script script/DeployIdentitySystem.s.sol:DeployIdentitySystem \
  --rpc-url https://api.lux.network/ext/bc/C/rpc \
  --broadcast

# For Zoo Mainnet
forge script script/DeployIdentitySystem.s.sol:DeployIdentitySystem \
  --rpc-url https://rpc.zoo.network \
  --broadcast
```

### 4. Update Contract Addresses

After deployment, update the contract addresses in `lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES: Record<number, { registry: `0x${string}`; token: `0x${string}` }> = {
  36963: { // Hanzo Mainnet
    registry: '0xYourRegistryAddress',
    token: '0xYourTokenAddress',
  },
  // ... update other networks
}
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3333/identity` to access the identity registration page.

## Networks

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| Hanzo Mainnet | 36963 | https://rpc.hanzo.ai | https://explorer.hanzo.ai |
| Hanzo Testnet | 36962 | https://testnet-rpc.hanzo.ai | https://testnet-explorer.hanzo.ai |
| Lux Mainnet | 96369 | https://api.lux.network/ext/bc/C/rpc | https://explorer.lux.network |
| Lux Testnet | 96368 | https://testnet-api.lux.network/ext/bc/C/rpc | https://testnet-explorer.lux.network |
| Zoo Mainnet | 200200 | https://rpc.zoo.network | https://explorer.zoo.network |
| Zoo Testnet | 200201 | https://testnet-rpc.zoo.network | https://testnet-explorer.zoo.network |

## Identity Format

Identities follow the format: `@username.network/profile/type/name`

- **Username**: Letters, numbers, dots, and underscores
- **Network**: Automatically determined by connected chain
  - `.hanzo` or `.ai` for Hanzo mainnet
  - `.hanzo-testnet` for Hanzo testnet
  - `.lux` for Lux mainnet
  - `.lux-testnet` for Lux testnet
  - `.zoo` for Zoo mainnet
  - `.zoo-testnet` for Zoo testnet
- **Profile**: Optional profile path (default: `/profile`)

## Faucet Integration

Users can get AI tokens from the faucet to register identities:

- **Location**: `/faucet` page
- **Amount**: 100 AI tokens per authenticated user
- **Cooldown**: 24 hours between drips
- **Networks**: Hanzo mainnet and testnet only

Configuration in `/Users/z/work/hanzo/faucet/config.json`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Web3**: Wagmi, Viem, RainbowKit
- **State Management**: TanStack Query
- **Smart Contracts**: Solidity, Foundry
- **Networks**: Hanzo, Lux, Zoo (mainnet + testnet)

## Development

### Testing Locally

1. Use a testnet for development (Hanzo Testnet recommended)
2. Connect your wallet to the testnet
3. Get test AI tokens from the faucet
4. Test identity registration flow

### Building for Production

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
pnpm lint:fix
```

## Contract Deployment Scripts

Located in `/Users/z/work/lux/standard/script/`:

- `DeployIdentitySystem.s.sol`: Deploys complete identity system
  - Deploys AIToken with treasury allocation
  - Deploys HanzoNft for identity binding
  - Deploys HanzoRegistry with UUPS proxy
  - Deploys AIFaucet with 100 AI drip amount
  - Configures initial permissions and transfers

## Security Considerations

- All contracts use OpenZeppelin's upgradeable patterns
- Registry uses UUPS proxy for upgradeability
- Access control with Ownable2Step for safe ownership transfer
- Pausable functionality for emergency stops
- Rate limiting on faucet to prevent abuse
- Input validation for identity names
- Proper allowance checks before token transfers

## Troubleshooting

### "Insufficient balance" error
- Get AI tokens from the faucet at `/faucet`
- Ensure you're connected to the correct network

### "Name already taken" error
- Try a different identity name
- Check if the name is available on your current network

### "Invalid format" error
- Use only letters, numbers, dots, and underscores
- No spaces or special characters allowed

### Contract not deployed
- Ensure contracts are deployed to your connected network
- Update contract addresses in `lib/contracts.ts`
- Check RPC URL is correct for your network

## Contributing

When adding new features:

1. Update contracts in `/Users/z/work/lux/standard/src/`
2. Update ABIs in `lib/contracts.ts`
3. Update UI in `app/(app)/identity/page.tsx`
4. Add tests for new functionality
5. Update this README with new features

## License

MIT
