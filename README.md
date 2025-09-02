# Shadowgraph Reputation Protocol

This repository contains two primary components:

1.  **EBSL Web of Trust with ZKML**: A Python-based implementation of the Evidence-Based Subjective Logic (EBSL) algorithm for trust computation in a P2P key-signing web of trust, with Zero-Knowledge Machine Learning (ZKML) proof generation using EZKL.
2.  **Shadowgraph Reputation-Scaled Airdrop Client**: A SvelteKit dApp client for participating in a reputation-scaled airdrop campaign.

---

## 1. EBSL Web of Trust with ZKML

This component, detailed in the `Notebooks/EBSL_Torch_EZKL.ipynb` notebook, focuses on computing trust in a P2P key-signing web of trust using the Evidence-Based Subjective Logic (EBSL) algorithm.

### Features

-   **Parallelized EBSL Algorithm**: Implemented in PyTorch for efficient, parallelized computation of trust and reputation.
-   **Realistic P2P Network Modeling**: Generates a web of trust network with a scale-free topology using NetworkX.
-   **Subjective Logic Opinions**: Represents trust using subjective logic opinions, which consist of belief, disbelief, uncertainty, and a base rate.
-   **Zero-Knowledge Machine Learning (ZKML)**: Uses the EZKL library to generate ZK-SNARK proofs of the trust computation. This allows for verifiable trust attestations while preserving the privacy of the computation's internal parameters.

### Workflow

The workflow for this component is as follows:

1.  **Generate Trust Network**: A scale-free network of nodes is generated to simulate a realistic P2P web of trust.
2.  **Compute Reputations**: The EBSL algorithm is used to compute the reputation of each node based on attestations from other nodes in the network.
3.  **Export to ONNX**: The PyTorch model that implements the EBSL fusion logic is exported to the ONNX format.
4.  **Generate ZK Proof**: The ONNX model is used with the EZKL library to generate a zero-knowledge proof of the trust computation.
5.  **Verify Computation**: The generated proof can be verified by anyone to ensure the correctness of the trust computation without revealing private parameters.

### Benefits of the ZKML Approach

-   **Privacy**: Trust computations can be verified without revealing the internal parameters of the algorithm.
-   **Integrity**: ZK proofs guarantee the correct execution of the trust model.
-   **Decentralization**: Any node in the network can independently verify trust computations.
-   **Transparency**: Public verification of proofs ensures trust in the overall system.

---

## 2. Shadowgraph Reputation-Scaled Airdrop Client

This is a SvelteKit dApp client for participating in a Shadowgraph reputation-scaled airdrop campaign. It supports both ECDSA-based claims and ZK-proof-based claims.

### Features

-   **Wallet Connection**: Connect via MetaMask, WalletConnect, or Coinbase Wallet.
-   **Score Checking**: Fetches your reputation score from the Shadowgraph backend.
-   **Payout Preview**: See your potential airdrop amount based on your score and the configured curve.
-   **Claim Flow**: A guided process to claim your tokens via an on-chain transaction.
-   **Chain Awareness**: Automatically detects and prompts for switching to the correct network.
-   **Debug Mode**: A special view for developers to inspect configuration and state.

### Tech Stack

-   **Framework**: SvelteKit
-   **Styling**: TailwindCSS
-   **Blockchain**: `viem` for EVM interactions, `@web3-onboard` for wallet connections.
-   **Validation**: `zod` for environment and API response validation.
-   **Icons**: `lucide-svelte`
-   **Testing**: Vitest (unit), Playwright (e2e)

---

## Getting Started (Airdrop Client)

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

## Development Modes (Airdrop Client)

### Mock Mode

If the `VITE_API_BASE` environment variable is **not set**, the application will run in **Mock Mode**. In this mode, it does not make real network requests to a backend. Instead, it uses mock data generators to simulate API responses. This is useful for UI development and testing without needing a live backend.

-   `/scores/:addr` returns a deterministic score based on the address.
-   `/claim-artifact` and `/proof-meta` return fake but correctly-shaped data.

### Production Mode

Set `VITE_API_BASE` to your backend's URL to connect to the live services.

## Claim Paths (ECDSA vs. ZK)

The application can be configured for one or both claim paths:

-   **ECDSA Path**: Requires `VITE_AIRDROP_ECDSA_ADDR` to be set. The client fetches a signed EIP-712 artifact from the backend and submits it to the `ReputationAirdropScaled` contract.
-   **ZK Path**: Requires `VITE_AIRDROP_ZK_ADDR` and `VITE_VERIFIER_ADDR` to be set. The client fetches ZK proof calldata from the backend and submits it to the `ReputationAirdropZKScaled` contract.

If both are configured, the UI will prioritize the ZK path by default.

## Available Scripts (Airdrop Client)

-   `npm run dev`: Start the dev server.
-   `npm run build`: Build the application for production.
-   `npm run preview`: Preview the production build locally.
-   `npm run test:unit`: Run unit tests with Vitest.
-   `npm run test:e2e`: Run end-to-end tests with Playwright.
-   `npm run lint`: Check for linting and formatting issues.
-   `npm run format`: Automatically format the code.

## Repository Structure

-   **`/`**: The root of the repository contains the SvelteKit dApp for the airdrop client.
-   **`Notebooks/`**: This directory contains the Jupyter notebook `EBSL_Torch_EZKL.ipynb`, which details the research and implementation of the EBSL algorithm and ZKML proof generation.
