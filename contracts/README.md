# Smart Contract Infrastructure

This directory contains the complete smart contract infrastructure for the Shadowgraph Reputation-Gated Airdrop system.

## Architecture Overview

The system consists of three main contract types that work together to enable secure, reputation-based airdrops using zero-knowledge proofs:

### Core Contracts

#### 1. ZKMLUnchainProver.sol

The main ZKML verification contract that validates zero-knowledge proofs of reputation calculations.

**Features:**

- ZK proof verification using configurable EZKL verifiers
- Reputation score validation (600,000 - 1,000,000 scale)
- Replay attack prevention using proof hashes
- Admin controls (pause/unpause, ownership management)
- Circuit parameter validation for EBSL algorithm

**Key Functions:**

- `verifyReputationProof(proof, publicInputs)`: Verify ZK proofs and store reputation
- `getVerifiedReputation(user)`: Retrieve stored reputation and timestamp
- `isReputationValid(user, maxAge)`: Check reputation validity and freshness

#### 2. ReputationAirdropScaled.sol

ECDSA-based airdrop contract with configurable payout curves.

**Features:**

- ECDSA signature verification for claim authorization
- Multiple payout curves (Linear, Square Root, Quadratic)
- Digest-based replay protection
- Configurable score thresholds and payout ranges
- Emergency admin controls

**Key Functions:**

- `claim(circuitId, modelDigest, inputDigest, score, deadline, v, r, s)`: Claim tokens with signature
- `quotePayout(score)`: Calculate payout for a given score
- `getPayoutParameters()`: View payout configuration

#### 3. ReputationAirdropZKScaled.sol

ZK-proof-based airdrop contract that integrates with ZKMLUnchainProver.

**Features:**

- Integration with ZKMLUnchainProver for reputation verification
- Reputation age validation (configurable window)
- Same payout curve flexibility as ECDSA version
- Eligibility checking before claiming

**Key Functions:**

- `claim(proof, score)`: Claim using verified ZK reputation
- `checkEligibility(user)`: Check if user can claim and potential payout
- `getZKParameters()`: View ZK-specific configuration

### Supporting Contracts

#### MockERC20.sol

Simple ERC20 token for testing and development.

#### MockVerifier.sol

Mock implementation of EZKL verifier interface for testing.

#### IVerifier.sol

Interface definition for EZKL-generated verifier contracts.

## Payout Curve System

The airdrop contracts support three payout curve types:

1. **Linear (0)**: Direct linear scaling between min and max payouts
2. **Square Root (1)**: Rewards early contributors more heavily
3. **Quadratic (2)**: Rewards high-reputation users disproportionately

Formula: `payout = minPayout + (maxPayout - minPayout) * curve_function(normalized_score)`

## Deployment

### Prerequisites

1. Node.js 18+
2. Hardhat development environment
3. Environment variables configured

### Environment Configuration

Create `.env.sepolia` (or appropriate network file):

```bash
PRIVATE_KEY=your_private_key_here
RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_key
```

### Deploy All Contracts

```bash
# Deploy to Sepolia testnet
./scripts/deploy/deploy-contracts.sh sepolia

# Deploy to local hardhat network
./scripts/deploy/deploy-contracts.sh hardhat
```

### Individual Contract Deployment

```bash
# Deploy specific contracts
npx hardhat run scripts/deploy/01-deploy-verifier.js --network sepolia
npx hardhat run scripts/deploy/02-deploy-zkml-prover.js --network sepolia
# etc.
```

## Testing

### Unit Tests

```bash
# Run all contract tests
npx hardhat test --config hardhat.config.cjs

# Run specific test files
npx hardhat test test/ZKMLUnchainProver.test.js --config hardhat.config.cjs
npx hardhat test test/ReputationAirdropScaled.test.js --config hardhat.config.cjs
```

### Test Coverage

The test suite covers:

- Contract deployment and initialization
- Proof verification workflows
- Payout calculations across all curve types
- Security features (replay protection, access controls)
- Edge cases and error conditions

## Security Considerations

### Access Controls

- Owner-only functions for administrative operations
- Pause functionality for emergency situations
- Immutable verifier addresses prevent malicious updates

### Replay Protection

- **ZKMLUnchainProver**: Proof hash tracking prevents reuse
- **ECDSA Airdrop**: Digest-based protection with user/model/input hashes
- **ZK Airdrop**: Relies on ZKMLUnchainProver's protection

### Input Validation

- Reputation scores must be within valid range (600,000 - 1,000,000)
- Address validation for all external contract interactions
- Signature validation with proper deadline enforcement

## Gas Optimization

### Efficient Storage

- Packed struct usage where possible
- Immutable variables for deployment-time constants
- Minimal storage writes in critical paths

### Computation Efficiency

- Newton's method for square root calculations
- Scaled integer arithmetic to avoid floating point
- Optimized signature verification

## Integration with Frontend

The contracts are designed to work seamlessly with the SvelteKit frontend:

1. **ABI Files**: Located in `src/lib/abi/` and automatically updated
2. **Type Safety**: TypeScript interfaces generated from contracts
3. **Environment Integration**: Contract addresses via environment variables
4. **Error Handling**: Structured error messages for user feedback

## Production Deployment Checklist

Before mainnet deployment:

- [ ] Audit smart contracts with reputable security firm
- [ ] Deploy and test on multiple testnets
- [ ] Verify all contract source code on Etherscan
- [ ] Set up monitoring for contract events
- [ ] Prepare emergency pause procedures
- [ ] Test integration with real EZKL verifiers
- [ ] Configure proper gas limits and pricing
- [ ] Set up multisig wallets for admin functions

## Troubleshooting

### Common Issues

1. **Compilation Errors**: Ensure Solidity version 0.8.20+
2. **Deployment Failures**: Check RPC URL and private key configuration
3. **Test Failures**: Verify environment setup and Hardhat configuration

### Debug Commands

```bash
# Check contract size
npx hardhat size-contracts

# Verify deployment
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Run gas reporter
REPORT_GAS=true npx hardhat test
```
