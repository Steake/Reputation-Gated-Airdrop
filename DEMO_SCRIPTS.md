# Quick Demo Scripts for Shadowgraph Reputation Airdrop

## Overview

These are concise, ready-to-use demo scripts for showcasing the Shadowgraph Reputation Airdrop system. Each script is designed for different audiences and time constraints.

---

## 2-Minute Lightning Demo

**Audience**: Executives, quick overviews
**Goal**: Show value proposition and key features

### Script

**[0:00-0:30] Opening**
"This is Shadowgraph's reputation-based airdrop system. Instead of random token distribution, users earn tokens based on their verified reputation in our trust network."

**[0:30-1:00] Core Value**

- Navigate to homepage
- "Users connect their wallet and see their reputation score"
- "Higher reputation = more tokens, creating incentives for positive contribution"
- Show statistics: "12,547 active users, average 72% reputation score"

**[1:00-1:30] Trust Network**

- Click to Explore page
- "This visualization shows real trust relationships"
- "Green lines are verified attestations, blue are endorsements"
- "Users build reputation through community verification"

**[1:30-2:00] Privacy & Security**

- "Zero-knowledge proofs protect user privacy"
- "Smart contracts ensure fair, transparent distribution"
- "No gaming the system - reputation must be genuinely earned"

---

## 5-Minute Product Demo

**Audience**: Potential users, community members
**Goal**: Show user journey and benefits

### Script

**[0:00-1:00] Problem & Solution**

- "Traditional airdrops often go to bots and farmers"
- "Shadowgraph rewards genuine community contributors"
- "Your reputation score determines your token allocation"

**[1:00-2:00] Getting Started**

- Navigate to "Earn Reputation" page
- "Build reputation through attestations and vouches"
- "Connect with trusted community members"
- "Participate in verification activities"

**[2:00-3:00] Checking Your Score**

- Go to Claim page
- "Connect wallet to see personalized score"
- "View potential token payout"
- "Understand how score translates to rewards"

**[3:00-4:00] Trust Network Exploration**

- Visit Explore page
- "See your position in the global trust network"
- "Understand how relationships build reputation"
- "Identify opportunities for network growth"

**[4:00-5:00] Claiming Process**

- Return to Claim page
- "Simple one-click token claiming"
- "Options for ECDSA signatures or ZK proofs"
- "Transparent, secure smart contract execution"

---

## 10-Minute Technical Demo

**Audience**: Developers, technical stakeholders
**Goal**: Show architecture and implementation

### Script

**[0:00-2:00] Architecture Overview**

- "Three-layer architecture: Frontend, Smart Contracts, Trust Network"
- "SvelteKit frontend with Web3 integration"
- "Hardhat-based smart contract development"
- "EBSL algorithm for reputation calculation"

**[2:00-4:00] Smart Contract Deep Dive**

- Navigate to Debug page
- "ZKMLOnChainVerifier for proof verification"
- "ReputationAirdropScaled for ECDSA claims"
- "ReputationAirdropZKScaled for ZK claims"
- Show contract interactions and state

**[4:00-6:00] Zero-Knowledge Implementation**

- "EZKL integration for ZK proof generation"
- "Privacy-preserving reputation verification"
- "On-chain proof validation without revealing data"
- Demonstrate proof generation process

**[6:00-8:00] Trust Network Technology**

- "D3.js visualization with real-time updates"
- "Force-directed graph algorithms"
- "Interactive filtering and exploration"
- "Mock data system for development"

**[8:00-10:00] Deployment & Scaling**

- "Netlify deployment with environment configuration"
- "Smart contract deployment automation"
- "Performance optimizations for large networks"
- "Future scaling plans and enhancements"

---

## Demo Scenarios by User Type

### Scenario A: High Reputation User (Score: 950,000)

**Setup**: Use wallet address ending in 8 or 9
**Expected Experience**:

- High reputation score displayed
- Maximum tier token allocation
- Dense trust network connections
- Multiple attestation relationships

**Demo Flow**:

1. Connect wallet → See high score immediately
2. View payout → Maximum allocation available
3. Explore network → Central position, many connections
4. Claim tokens → Smooth, high-value transaction

### Scenario B: Medium Reputation User (Score: 750,000)

**Setup**: Use wallet address ending in 4, 5, or 6
**Expected Experience**:

- Medium reputation score
- Mid-tier token allocation
- Moderate network connections
- Growth opportunities visible

**Demo Flow**:

1. Connect wallet → See medium score with growth potential
2. View payout → Mid-tier allocation, room for improvement
3. Explore network → Some connections, expansion opportunities
4. Understand growth → Path to higher reputation clear

### Scenario C: Threshold User (Score: 620,000)

**Setup**: Use wallet address ending in 0, 1, 2, or 3
**Expected Experience**:

- Just above minimum threshold
- Minimum token allocation
- Sparse network connections
- Clear improvement pathways

**Demo Flow**:

1. Connect wallet → See threshold score, barely eligible
2. View payout → Minimum allocation, motivation to grow
3. Explore network → Few connections, clear expansion needs
4. Learn growth → Understand reputation building strategies

### Scenario D: Ineligible User (Score: 580,000)

**Setup**: Simulated low-score user
**Expected Experience**:

- Below threshold message
- Eligibility requirements explained
- Guidance on reputation building
- Clear path to qualification

**Demo Flow**:

1. Connect wallet → See ineligible status
2. Understand requirements → Clear threshold explanation
3. Learn building → Reputation improvement strategies
4. Motivation → Path to future eligibility

---

## Interactive Demo Elements

### 1. Wallet Connection Demo

```javascript
// Demo script for wallet connection
async function demoWalletConnection() {
  console.log("Demo: Wallet Connection Process");

  // Step 1: Show connect button
  console.log("1. User sees 'Connect Wallet' button");

  // Step 2: Show wallet options
  console.log("2. Wallet selection modal appears");
  console.log("   - MetaMask option");
  console.log("   - WalletConnect option");
  console.log("   - Coinbase Wallet option");

  // Step 3: Simulate connection
  console.log("3. User approves connection in wallet");
  console.log("4. Address displayed in navigation");
  console.log("5. Personalized experience begins");
}
```

### 2. Reputation Score Reveal

```javascript
// Demo script for score revelation
async function demoScoreReveal(walletAddress) {
  const score = generateMockScore(walletAddress);

  console.log("Demo: Reputation Score Reveal");
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Score: ${score.toLocaleString()} (${(score / 10000).toFixed(1)}%)`);

  if (score >= 600000) {
    const payout = calculatePayout(score);
    console.log(`Eligible for: ${payout} tokens`);
  } else {
    console.log("Not eligible - need minimum 600,000 score");
  }
}
```

### 3. Network Visualization Interaction

```javascript
// Demo script for network interaction
function demoNetworkInteraction() {
  console.log("Demo: Trust Network Interaction");

  // Hover effects
  console.log("1. Hover over nodes to see user details");
  console.log("   - Address, reputation score, connections");

  // Click interactions
  console.log("2. Click nodes to highlight relationships");
  console.log("   - Direct connections emphasized");
  console.log("   - Relationship types color-coded");

  // Filter demonstrations
  console.log("3. Filter by relationship type:");
  console.log("   - Attestations (green): Verified relationships");
  console.log("   - Vouches (blue): Endorsement relationships");
  console.log("   - Trust (purple): Direct trust declarations");

  // Zoom and pan
  console.log("4. Navigate large networks:");
  console.log("   - Mouse wheel zoom");
  console.log("   - Click and drag to pan");
  console.log("   - Double-click to center");
}
```

### 4. ZK Proof Generation Demo

```javascript
// Demo script for ZK proof process
async function demoZKProofGeneration() {
  console.log("Demo: Zero-Knowledge Proof Generation");

  // Step 1: Initiate proof generation
  console.log("1. User clicks 'Generate ZK Proof'");
  console.log("2. System compiles reputation data");

  // Step 2: EBSL processing
  console.log("3. EBSL algorithm processes trust network:");
  console.log("   - Opinion fusion from multiple sources");
  console.log("   - Privacy-preserving calculation");

  // Step 3: ZK circuit execution
  console.log("4. EZKL generates zero-knowledge proof:");
  console.log("   - Proves correct reputation calculation");
  console.log("   - Hides underlying trust relationships");

  // Step 4: Verification
  console.log("5. On-chain verification:");
  console.log("   - Smart contract validates proof");
  console.log("   - Reputation score verified without revealing data");
}
```

---

## Troubleshooting Demo Issues

### Common Demo Problems

#### 1. Wallet Connection Issues

**Problem**: Demo wallet doesn't connect
**Solution**:

- Use browser with MetaMask installed
- Ensure testnet configuration
- Clear browser cache if needed
- Use mock mode if wallet unavailable

#### 2. Score Not Loading

**Problem**: Reputation score doesn't appear
**Solution**:

- Check network connectivity
- Verify mock mode is enabled
- Refresh page and reconnect wallet
- Check browser console for errors

#### 3. Visualization Not Rendering

**Problem**: Trust network doesn't display
**Solution**:

- Verify WebGL support in browser
- Check for JavaScript errors
- Ensure D3.js library loaded
- Refresh page if needed

#### 4. Slow Performance

**Problem**: Demo runs slowly or freezes
**Solution**:

- Use recommended browser (Chrome/Chromium)
- Close unnecessary browser tabs
- Check system resources
- Use smaller network view if available

### Demo Environment Setup

#### Optimal Demo Environment

```javascript
// Recommended demo configuration
const demoConfig = {
  browser: "Chrome/Chromium latest",
  viewport: "1920x1080 or larger",
  network: "Fast internet connection",
  wallet: "MetaMask with test account",
  mode: "Mock mode enabled for consistency",
};
```

#### Backup Options

```javascript
// Fallback demo options
const backupConfig = {
  noWallet: "Use mock wallet addresses",
  slowNetwork: "Enable offline mode",
  oldBrowser: "Use simplified visualization",
  smallScreen: "Mobile-responsive demo flow",
};
```

---

## Presentation Tips

### For Executive Audiences

- Focus on business value and user benefits
- Show impressive statistics and metrics
- Emphasize innovation and differentiation
- Keep technical details minimal
- Highlight competitive advantages

### For Technical Audiences

- Deep dive into implementation details
- Show code examples and architecture
- Demonstrate testing and security features
- Discuss scalability and performance
- Cover integration possibilities

### For Community Audiences

- Emphasize user empowerment and fairness
- Show how to build reputation
- Demonstrate network effects
- Highlight privacy protections
- Encourage participation

### For Investor Audiences

- Show market opportunity and traction
- Demonstrate user growth metrics
- Highlight technical innovations
- Discuss monetization strategies
- Present scaling roadmap

---

## Conclusion

These demo scripts provide comprehensive coverage of the Shadowgraph Reputation Airdrop system for various audiences and time constraints. The combination of interactive elements, troubleshooting guides, and audience-specific approaches ensures successful demonstrations across different contexts.

Remember to always test the demo environment beforehand and have backup scenarios ready for technical issues.
