# Shadowgraph Reputation Airdrop - Complete User Guide & Demo Flows

## Overview

This guide provides comprehensive documentation and step-by-step demos for the Shadowgraph Reputation-Gated Airdrop system. The system enables users to claim airdrop tokens based on their reputation scores using either ECDSA signatures or zero-knowledge proofs.

## Table of Contents

1. [Quick Start Demo](#quick-start-demo)
2. [Complete User Flows](#complete-user-flows)
3. [Mock System Guide](#mock-system-guide)
4. [Web of Trust Visualization](#web-of-trust-visualization)
5. [Advanced Features](#advanced-features)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start Demo

### Prerequisites

- Modern web browser with Web3 wallet support
- MetaMask, WalletConnect, or Coinbase Wallet
- Test ETH for transaction fees (on testnet)

### 5-Minute Demo Flow

#### Step 1: Access the Application

1. Navigate to the deployed application URL
2. You'll see the main landing page with "Claim Your Reputation-Based Airdrop" heading
3. Notice the navigation menu: **Earn Reputation**, **Claim**, **Explore**

#### Step 2: Connect Your Wallet

1. Click the **"Connect Wallet"** button in the top-right
2. Select your preferred wallet (MetaMask, WalletConnect, or Coinbase)
3. Approve the connection in your wallet
4. The button should change to show your connected address

#### Step 3: Check Your Reputation Score

1. Navigate to the **"Claim"** page
2. Your reputation score will be automatically calculated (using mock data)
3. See your potential payout based on the configured curve
4. View eligibility status and payout breakdown

#### Step 4: Generate ZK Proof (Optional)

1. Visit the **Debug** page to access advanced features
2. In the "ZK Proof Generation" section, click **"Generate Proof"**
3. Wait for the proof generation process (simulated)
4. Review the generated proof data and verification status

#### Step 5: Submit Claim

1. Return to the **"Claim"** page
2. Click **"Claim Tokens"** to initiate the transaction
3. Confirm the transaction in your wallet
4. Monitor transaction status and completion

---

## Complete User Flows

### Flow 1: New User Onboarding

**Scenario**: First-time user discovering the platform

**Steps**:

1. **Landing Page Discovery**
   - User arrives at homepage
   - Sees compelling value proposition
   - Reviews platform statistics (active users, avg score, ZK proofs)
   - Understands reputation-based airdrop concept

2. **Learn About Reputation**
   - Navigate to **"Earn Reputation"** page
   - Understand different ways to build reputation
   - Review attestation types and trust network mechanics
   - See examples of reputation-building activities

3. **Explore the Ecosystem**
   - Visit **"Explore"** page
   - View global reputation analytics
   - Interact with trust network visualization
   - Understand personal vs. global metrics

4. **Connect and Participate**
   - Connect wallet for personalized experience
   - Check initial reputation score
   - Plan reputation-building activities

### Flow 2: ECDSA-Based Claim Flow

**Scenario**: User with established reputation claiming via signature verification

**Prerequisites**:

- Connected wallet
- Valid reputation score (≥600,000)
- ECDSA signature from backend

**Steps**:

1. **Score Verification**
   - Navigate to claim page
   - System fetches reputation score
   - Displays eligibility status and potential payout
   - Shows payout curve visualization

2. **Claim Preparation**
   - Review claim details and gas estimates
   - Understand one-time claim restriction
   - Verify recipient address

3. **Signature-Based Claim**
   - Click "Claim Tokens" button
   - Backend generates ECDSA signature
   - Transaction prepared with signature data
   - User confirms transaction in wallet

4. **Transaction Completion**
   - Monitor transaction status
   - Receive confirmation of successful claim
   - Tokens transferred to wallet
   - Claim status updated permanently

### Flow 3: Zero-Knowledge Proof Flow

**Scenario**: Privacy-conscious user claiming via ZK proof

**Prerequisites**:

- Connected wallet
- Valid reputation data
- ZK proof generation capabilities

**Steps**:

1. **Proof Generation Setup**
   - Access ZK proof interface (Debug page)
   - Review privacy guarantees
   - Understand proof requirements

2. **Reputation Proof Generation**
   - System compiles reputation data
   - EBSL algorithm processes trust network
   - ZK circuit generates proof (simulated)
   - Proof hash and public inputs created

3. **On-Chain Verification**
   - Submit proof to ZKMLOnChainVerifier contract
   - Smart contract validates proof integrity
   - Reputation score verified without revealing data
   - Verification result stored on-chain

4. **Airdrop Claim**
   - Use verified reputation for airdrop claim
   - No additional signatures required
   - Direct interaction with ReputationAirdropZKScaled contract
   - Privacy-preserving token claim

### Flow 4: Web of Trust Exploration

**Scenario**: User exploring trust relationships and network dynamics

**Steps**:

1. **Global Network Overview**
   - Access "Explore" page
   - View network-wide statistics
   - Understand trust distribution
   - See ZK proof generation trends

2. **Interactive Visualization**
   - Engage with trust network graph
   - Filter by trust types (attestation, vouch, trust)
   - Explore node connections and relationships
   - Understand network topology

3. **Personal Network Analysis**
   - Connect wallet to view personal connections
   - See direct and indirect trust relationships
   - Understand reputation contribution sources
   - Plan network expansion strategies

4. **Reputation Analytics**
   - Compare personal score to global distribution
   - Track score changes over time
   - Understand score calculation methodology
   - Identify improvement opportunities

---

## Mock System Guide

The application includes comprehensive mock functionality for development and demonstration purposes.

### Mock Data Sources

#### 1. Reputation Scores

- **Generation**: Deterministic based on wallet address
- **Range**: 600,000 - 1,000,000 (0.6 - 1.0 reputation scale)
- **Consistency**: Same address always returns same score
- **Location**: `src/lib/api/client.ts`

#### 2. Trust Network Data

- **Structure**: Simulated multi-layered trust relationships
- **Relationships**: Attestations, vouches, direct trust
- **Visualization**: Interactive D3.js network graph
- **Location**: `src/lib/components/TrustNetworkVisualization.svelte`

#### 3. ZK Proof Generation

- **Simulation**: Mock EZKL proof generation process
- **Timing**: Realistic proof generation delays (3 seconds)
- **Data**: Placeholder proof arrays and public inputs
- **Location**: `src/lib/components/ZKMLProver.svelte`

#### 4. Transaction Simulation

- **Responses**: Simulated blockchain transaction responses
- **States**: Loading, success, error scenarios
- **Gas Estimation**: Mock gas calculations
- **Location**: `src/lib/web3/` directory

### Enabling/Disabling Mock Mode

#### Mock Mode (Default)

```env
# .env file - Mock mode enabled when API_BASE is not set
VITE_CHAIN_ID="11155111"
VITE_RPC_URL="https://rpc.sepolia.org"
# VITE_API_BASE not set = mock mode
```

#### Production Mode

```env
# .env file - Production mode with real backend
VITE_API_BASE="https://api.shadowgraph.io"
VITE_CHAIN_ID="1"
VITE_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/..."
```

### Mock Scenarios

#### Scenario 1: High Reputation User

- **Address Pattern**: Addresses ending in high digits (7-9)
- **Score Range**: 900,000 - 1,000,000
- **Payout**: Maximum tier rewards
- **Trust Network**: Dense, high-value connections

#### Scenario 2: Medium Reputation User

- **Address Pattern**: Addresses ending in medium digits (4-6)
- **Score Range**: 750,000 - 850,000
- **Payout**: Mid-tier rewards with growth potential
- **Trust Network**: Moderate connections, room for expansion

#### Scenario 3: Threshold Reputation User

- **Address Pattern**: Addresses ending in low digits (0-3)
- **Score Range**: 600,000 - 700,000
- **Payout**: Minimum tier, just eligible
- **Trust Network**: Sparse connections, needs development

---

## Web of Trust Visualization

### Overview

The Web of Trust (WoT) visualization provides interactive exploration of trust relationships within the Shadowgraph network.

### Features

#### 1. Network Graph Visualization

- **Technology**: D3.js force-directed graph
- **Nodes**: Represent users/addresses
- **Edges**: Represent trust relationships
- **Colors**: Indicate trust types and strength
- **Interactivity**: Drag, zoom, filter capabilities

#### 2. Trust Relationship Types

##### Attestation Relationships

- **Color**: Green edges
- **Meaning**: Direct verification of claims
- **Weight**: High trust value
- **Bidirectionality**: Often mutual

##### Vouch Relationships

- **Color**: Blue edges
- **Meaning**: Endorsement without direct verification
- **Weight**: Medium trust value
- **Characteristics**: Easier to establish

##### Direct Trust

- **Color**: Purple edges
- **Meaning**: Explicit trust declaration
- **Weight**: Variable based on history
- **Persistence**: Long-term relationships

#### 3. Visualization States

##### Global Network View

```typescript
// Access global trust network
const globalNetwork = {
  nodes: 12547, // Total active users
  edges: 28934, // Total trust relationships
  avgScore: 0.723, // Network average reputation
  zkProofs: 3847, // Total ZK proofs generated
};
```

##### Personal Network View (Wallet Connected)

```typescript
// Personal trust network
const personalNetwork = {
  directConnections: 12, // Direct trust relationships
  indirectConnections: 156, // 2nd degree connections
  attestationsReceived: 8, // Attestations to user
  attestationsGiven: 15, // Attestations by user
  reputationSources: [], // Sources contributing to score
};
```

##### Filtered Views

- **By Trust Type**: Show only specific relationship types
- **By Score Range**: Filter nodes by reputation score
- **By Activity**: Show only recently active users
- **By Geographic Region**: Filter by location (if available)

#### 4. Interactive Features

##### Node Interaction

- **Click**: Select node to view details
- **Hover**: Show tooltip with basic info
- **Double-click**: Center view on node
- **Right-click**: Context menu with actions

##### Edge Interaction

- **Hover**: Show relationship details
- **Click**: Highlight relationship path
- **Weight visualization**: Thickness indicates strength

##### Layout Controls

- **Force simulation**: Adjustable attraction/repulsion
- **Layout algorithms**: Various arrangement options
- **Zoom/Pan**: Full navigation control
- **Mini-map**: Overview for large networks

### Implementation Guide

#### 1. Basic Network Display

```svelte
<!-- TrustNetworkVisualization.svelte -->
<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let svg;
  let networkData = {
    nodes: [],
    links: [],
  };

  onMount(() => {
    // Initialize D3 visualization
    setupNetworkVisualization();
    loadNetworkData();
  });
</script>

<div class="network-container">
  <svg bind:this={svg} width="800" height="600"></svg>
</div>
```

#### 2. Dynamic Data Loading

```typescript
// Load trust network data
async function loadNetworkData() {
  if (mockMode) {
    // Generate mock network data
    networkData = generateMockNetwork();
  } else {
    // Fetch from backend API
    networkData = await fetchTrustNetwork();
  }

  updateVisualization(networkData);
}
```

#### 3. User Interaction Handlers

```typescript
// Handle node interactions
function handleNodeClick(event, node) {
  // Show node details panel
  showNodeDetails(node);

  // Highlight connected nodes
  highlightConnections(node);
}

function handleNodeHover(event, node) {
  // Show tooltip
  showTooltip(event, node);
}
```

### Visualization Examples

#### Example 1: Dense Network (High Activity)

- **Characteristics**: Many interconnected nodes
- **Trust Types**: All relationship types present
- **User Experience**: Rich, complex trust environment
- **Reputation Impact**: High scores due to network effects

#### Example 2: Sparse Network (Growing Community)

- **Characteristics**: Fewer connections, clear clusters
- **Trust Types**: Primarily attestations and vouches
- **User Experience**: Easier to identify key connectors
- **Reputation Impact**: Individual relationships more impactful

#### Example 3: Hub-and-Spoke (Centralized Trust)

- **Characteristics**: Central authorities with many connections
- **Trust Types**: High concentration of attestations
- **User Experience**: Clear trust hierarchy
- **Reputation Impact**: Proximity to hubs valuable

---

## Advanced Features

### 1. Reputation Score Calculation

The reputation score is calculated using the Evidence-Based Subjective Logic (EBSL) algorithm:

```typescript
// Simplified EBSL calculation
interface Opinion {
  belief: number; // b ∈ [0,1]
  disbelief: number; // d ∈ [0,1]
  uncertainty: number; // u ∈ [0,1]
  baseRate: number; // a ∈ [0,1]
}

function fuseOpinions(opinions: Opinion[]): Opinion {
  // EBSL fusion algorithm implementation
  // Combines multiple subjective logic opinions
  // Returns fused opinion representing reputation
}
```

### 2. Zero-Knowledge Proof Generation

#### Proof Structure

```typescript
interface ZKProof {
  proof: number[]; // EZKL-generated proof array
  publicInputs: number[]; // Public inputs (reputation score)
  proofHash: string; // Unique proof identifier
  timestamp: number; // Generation timestamp
}
```

#### Verification Process

```solidity
// On-chain verification in ZKMLOnChainVerifier.sol
function verifyReputationProof(
    uint256[] calldata proof,
    uint256[] calldata publicInputs
) external returns (bool) {
    // Validate proof hasn't been used
    // Extract reputation score
    // Verify with EZKL verifier
    // Store verified reputation
}
```

### 3. Payout Curve Calculations

The system supports three payout curve types:

#### Linear Curve

```typescript
function calculateLinearPayout(score: number): number {
  const normalizedScore = (score - FLOOR_SCORE) / (CAP_SCORE - FLOOR_SCORE);
  return MIN_PAYOUT + (MAX_PAYOUT - MIN_PAYOUT) * normalizedScore;
}
```

#### Square Root Curve

```typescript
function calculateSqrtPayout(score: number): number {
  const normalizedScore = (score - FLOOR_SCORE) / (CAP_SCORE - FLOOR_SCORE);
  return MIN_PAYOUT + (MAX_PAYOUT - MIN_PAYOUT) * Math.sqrt(normalizedScore);
}
```

#### Quadratic Curve

```typescript
function calculateQuadraticPayout(score: number): number {
  const normalizedScore = (score - FLOOR_SCORE) / (CAP_SCORE - FLOOR_SCORE);
  return MIN_PAYOUT + (MAX_PAYOUT - MIN_PAYOUT) * Math.pow(normalizedScore, 2);
}
```

### 4. Real-time Updates

#### WebSocket Integration (Production)

```typescript
// Real-time reputation updates
const ws = new WebSocket("wss://api.shadowgraph.io/ws");

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);

  if (update.type === "reputation_update") {
    updateReputationScore(update.score);
  }

  if (update.type === "network_update") {
    refreshTrustNetwork(update.changes);
  }
};
```

#### Polling Fallback (Mock Mode)

```typescript
// Simulated real-time updates in mock mode
setInterval(() => {
  // Simulate small reputation changes
  const currentScore = getCurrentScore();
  const newScore = currentScore + (Math.random() - 0.5) * 1000;
  updateScore(Math.max(600000, Math.min(1000000, newScore)));
}, 30000); // Update every 30 seconds
```

---

## Troubleshooting

### Common Issues

#### 1. Wallet Connection Problems

**Symptoms**: Wallet doesn't connect, connection drops
**Solutions**:

- Ensure wallet extension is installed and unlocked
- Check network configuration (should match VITE_CHAIN_ID)
- Clear browser cache and localStorage
- Try different wallet or browser

#### 2. Transaction Failures

**Symptoms**: Transactions fail or revert
**Solutions**:

- Verify sufficient gas and ETH balance
- Check contract addresses in environment config
- Ensure eligibility (reputation ≥ 600,000)
- Verify not already claimed (one-time restriction)

#### 3. Score Calculation Issues

**Symptoms**: Unexpected reputation scores
**Solutions**:

- In mock mode: Score is deterministic based on address
- Check network connection for backend API calls
- Verify trust relationships are properly established
- Review EBSL algorithm implementation

#### 4. Visualization Problems

**Symptoms**: Trust network doesn't load or render incorrectly
**Solutions**:

- Check browser WebGL support for D3.js
- Verify mock data generation in development mode
- Clear browser cache
- Check for JavaScript errors in console

### Debug Mode Features

Access the debug page at `/debug` for advanced troubleshooting:

1. **Configuration Inspection**: View all environment variables
2. **Store State**: Examine Svelte store contents
3. **Network Status**: Check API connectivity
4. **Mock Data**: View generated mock data
5. **ZK Proof Testing**: Test proof generation flow
6. **Contract Interaction**: Test smart contract calls

### Performance Optimization

#### For Large Networks

- **Pagination**: Load network data in chunks
- **Level-of-Detail**: Reduce complexity at zoom levels
- **Culling**: Hide off-screen elements
- **Caching**: Store processed network data

#### For Slow Connections

- **Progressive Loading**: Load critical data first
- **Compression**: Minimize data transfer
- **Fallbacks**: Graceful degradation for slow networks
- **Offline Mode**: Cache essential functionality

---

## Conclusion

This comprehensive guide covers all aspects of the Shadowgraph Reputation Airdrop system, from basic user flows to advanced technical features. The combination of mock data and real functionality provides an excellent foundation for development, testing, and user onboarding.

For additional support or questions, refer to the technical documentation in the `/documentation` directory or contact the development team.
