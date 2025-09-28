# Shadowgraph Reputation-Scaled Airdrop Client

This is a SvelteKit dApp client for participating in a Shadowgraph reputation-scaled airdrop campaign. It supports both ECDSA-based claims and ZK-proof-based claims.

## Features

- **Wallet Connection**: Connect via MetaMask, WalletConnect, or Coinbase Wallet.
- **Score Checking**: Fetches your reputation score from the Shadowgraph backend.
- **Payout Preview**: See your potential airdrop amount based on your score and the configured curve.
- **Claim Flow**: A guided process to claim your tokens via an on-chain transaction.
- **Chain Awareness**: Automatically detects and prompts for switching to the correct network.
- **Debug Mode**: A special view for developers to inspect configuration and state.

## Tech Stack

- **Framework**: SvelteKit
- **Styling**: TailwindCSS
- **Blockchain**: `viem` for EVM interactions, `@web3-onboard` for wallet connections.
- **Validation**: `zod` for environment and API response validation.
- **Icons**: `lucide-svelte`
- **Testing**: Vitest (unit), Playwright (e2e)

## Documentation & Demos 📚

### Complete User Guides

- **[User Guide](./USER_GUIDE.md)** - Comprehensive end-to-end user documentation
- **[Demo Scripts](./DEMO_SCRIPTS.md)** - Ready-to-use presentation scripts (2min, 5min, 10min)
- **[Web of Trust Guide](./WEB_OF_TRUST_GUIDE.md)** - Interactive network visualization guide

### Technical Documentation

- **[Smart Contract Documentation](./contracts/README.md)** - Complete contract infrastructure guide
- **[Architecture Documentation](./documentation/)** - ZKML and EBSL algorithm specifications

### Live Demos & Testing

- **Comprehensive E2E Tests**: `npm run test:e2e` - Full user journey validation
- **Interactive Demos**: Access `/debug` page for advanced testing features
- **Mock System**: Full functionality available without backend dependencies

---

## Getting Started

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd shadowgraph-airdrop-client
npm install
```

### 2. Environment Variables

Create a `.env` file in the root of the project. This file is critical for configuring the dApp to point to the correct contracts, chain, and backend services.

```env
# REQUIRED: Web3 & Chain Configuration
VITE_CHAIN_ID="11155111" # e.g., Sepolia
VITE_RPC_URL="https://rpc.sepolia.org"
VITE_TOKEN_ADDR="0x..." # The ERC20 token being airdropped

# REQUIRED: Airdrop Campaign Configuration
VITE_CAMPAIGN="0x..." # 32-byte campaign identifier
VITE_FLOOR_SCORE="600000"  # Min score to claim (1e6 scale)
VITE_CAP_SCORE="1000000"   # Score for max payout (1e6 scale)
VITE_MIN_PAYOUT="100"      # Min token payout (in token units, e.g., "100" for 100 tokens)
VITE_MAX_PAYOUT="1000"     # Max token payout
VITE_CURVE="SQRT"          # Payout curve: "LIN", "SQRT", or "QUAD"

# REQUIRED: Backend API
VITE_API_BASE="https://api.shadowgraph.io/v1" # Base URL for score/artifact endpoints

# REQUIRED: Web3-Onboard Project ID
# Get one from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID="YOUR_PROJECT_ID"

# OPTIONAL: Contract Addresses (at least one path must be enabled)
# To enable the ECDSA claim path:
VITE_AIRDROP_ECDSA_ADDR="0x..." # ReputationAirdropScaled contract
# To enable the ZK claim path:
VITE_AIRDROP_ZK_ADDR="0x..."     # ReputationAirdropZKScaled contract
VITE_VERIFIER_ADDR="0x..."         # EZKL Verifier contract

# OPTIONAL: Debug Mode
# Set to 'true' to enable the /debug route
VITE_DEBUG="true"
```

### 3. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

---

## Development Modes

### Mock Mode

If the `VITE_API_BASE` environment variable is **not set**, the application will run in **Mock Mode**. In this mode, it does not make real network requests to a backend. Instead, it uses mock data generators to simulate API responses. This is useful for UI development and testing without needing a live backend.

- `/scores/:addr` returns a deterministic score based on the address.
- `/claim-artifact` and `/proof-meta` return fake but correctly-shaped data.

### Production Mode

Set `VITE_API_BASE` to your backend's URL to connect to the live services.

## Claim Paths (ECDSA vs. ZK)

The application can be configured for one or both claim paths:

- **ECDSA Path**: Requires `VITE_AIRDROP_ECDSA_ADDR` to be set. The client fetches a signed EIP-712 artifact from the backend and submits it to the `ReputationAirdropScaled` contract.
- **ZK Path**: Requires `VITE_AIRDROP_ZK_ADDR` and `VITE_VERIFIER_ADDR` to be set. The client fetches ZK proof calldata from the backend and submits it to the `ReputationAirdropZKScaled` contract.

If both are configured, the UI will prioritize the ZK path by default.

## Available Scripts

- `npm run dev`: Start the dev server.
- `npm run build`: Build the application for production.
- `npm run preview`: Preview the production build locally.
- `npm run test:unit`: Run unit tests with Vitest.
- `npm run test:e2e`: Run end-to-end tests with Playwright.
- `npm run lint`: Check for linting and formatting issues.
- `npm run format`: Automatically format the code.

```

```
