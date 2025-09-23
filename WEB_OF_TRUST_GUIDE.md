# Web of Trust Visualization Guide

## Overview

The Web of Trust (WoT) visualization is a core component of the Shadowgraph Reputation Airdrop system, providing interactive exploration of trust relationships and reputation network dynamics. This guide provides comprehensive documentation on using, understanding, and demonstrating the WoT features.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Visualization Components](#visualization-components)
3. [User Interaction Guide](#user-interaction-guide)
4. [Network States and Scenarios](#network-states-and-scenarios)
5. [Mock Data Scenarios](#mock-data-scenarios)
6. [Technical Implementation](#technical-implementation)
7. [Demo Scripts](#demo-scripts)

---

## Quick Start

### Accessing the Visualization

1. **Navigate to Explore Page**
   ```
   URL: http://localhost:5173/explore
   ```

2. **Core Features**
   - Global trust network overview
   - Interactive node and edge manipulation
   - Real-time network statistics
   - Personal network analysis (when wallet connected)

3. **First Look**
   - Network shows as force-directed graph
   - Nodes represent users/addresses
   - Edges represent trust relationships
   - Color coding indicates relationship types

### Basic Interaction

```typescript
// Hover over node: Shows user details and trust score
// Click on node: Highlights connected relationships
// Drag node: Repositions in force simulation
// Zoom/Pan: Navigate large networks
// Filter controls: Show specific relationship types
```

---

## Visualization Components

### 1. Network Graph (D3.js Force Layout)

#### Node Properties
```typescript
interface NetworkNode {
  id: string;           // User address or identifier
  label: string;        // Display name or truncated address
  score: number;        // Reputation score (0.6-1.0 scale)
  size: number;         // Visual size based on reputation
  color: string;        // Color based on score range
  connections: number;  // Total relationship count
  type: 'user' | 'authority' | 'new'; // Node classification
}
```

#### Edge Properties
```typescript
interface NetworkEdge {
  source: string;       // Source node ID
  target: string;       // Target node ID
  type: 'attestation' | 'vouch' | 'trust'; // Relationship type
  weight: number;       // Relationship strength (0-1)
  timestamp: number;    // When relationship was established
  bidirectional: boolean; // Whether trust is mutual
}
```

#### Visual Encoding

**Node Sizes**
- **Large (radius 12-16px)**: High reputation (0.9-1.0)
- **Medium (radius 8-12px)**: Medium reputation (0.7-0.9)
- **Small (radius 4-8px)**: Low reputation (0.6-0.7)

**Node Colors**
- **Green (#10B981)**: High reputation (≥0.9)
- **Blue (#3B82F6)**: Medium reputation (0.7-0.9)
- **Orange (#F59E0B)**: Threshold reputation (0.6-0.7)
- **Red (#EF4444)**: Below threshold (<0.6)

**Edge Styles**
- **Green edges**: Attestation relationships (highest trust)
- **Blue edges**: Vouch relationships (medium trust)
- **Purple edges**: Direct trust declarations
- **Thickness**: Proportional to relationship weight

### 2. Network Statistics Panel

```typescript
interface NetworkStats {
  totalNodes: number;        // Total users in network
  totalEdges: number;        // Total relationships
  averageScore: number;      // Network average reputation
  clusteringCoeff: number;   // Network density measure
  shortestPath: number;      // Average path length
  zkProofsGenerated: number; // Total ZK proofs
}
```

### 3. Interactive Controls

#### Zoom and Pan
```typescript
// Mouse wheel: Zoom in/out
// Click and drag: Pan around network
// Double-click: Center on clicked element
// Reset button: Return to default view
```

#### Filter Options
```typescript
interface FilterOptions {
  relationshipType: 'all' | 'attestation' | 'vouch' | 'trust';
  scoreRange: { min: number; max: number };
  activityPeriod: '24h' | '7d' | '30d' | 'all';
  connectionDegree: number; // Minimum connections to show
}
```

#### Layout Algorithms
```typescript
// Force-directed: Default physics-based layout
// Hierarchical: Layered by reputation score
// Circular: Arranged in concentric circles
// Geographic: If location data available
```

---

## User Interaction Guide

### 1. Exploring the Global Network

#### Initial View
```typescript
// Default view shows:
// - ~100-200 most connected nodes
// - All relationship types
// - Zoomed to fit viewport
// - Force simulation running
```

**Demo Steps:**
1. **Observe Overall Structure**
   - Note clusters of highly connected users
   - Identify central "hub" nodes
   - See peripheral users with few connections

2. **Hover Interactions**
   - Hover over nodes to see tooltips
   - Information includes: address, score, connection count
   - Connected edges highlight automatically

3. **Click Interactions**
   - Click node to select and highlight network
   - Show detailed information panel
   - Display shortest paths to other nodes

### 2. Filtering and Focus

#### Relationship Type Filtering
```typescript
// Show only attestations (green edges)
filterNetwork({ relationshipType: 'attestation' });

// Show only vouches (blue edges)  
filterNetwork({ relationshipType: 'vouch' });

// Show only direct trust (purple edges)
filterNetwork({ relationshipType: 'trust' });
```

**Demo Steps:**
1. **Attestation Network**
   - Click "Attestations Only" filter
   - Observe formal verification relationships
   - Note often bidirectional connections
   - Higher trust weight typically

2. **Vouch Network**
   - Switch to "Vouches Only"
   - See endorsement without verification
   - Often hub-and-spoke patterns
   - Easier to establish connections

3. **Trust Network**
   - Select "Direct Trust Only"
   - View explicit trust declarations
   - May show personal relationships
   - Variable weights based on history

#### Score Range Filtering
```typescript
// Show only high reputation users
filterNetwork({ scoreRange: { min: 0.9, max: 1.0 } });

// Show only threshold users
filterNetwork({ scoreRange: { min: 0.6, max: 0.7 } });
```

### 3. Personal Network Analysis

#### Wallet Connected View
```typescript
interface PersonalNetwork {
  centerNode: string;        // Connected wallet address
  directConnections: Node[]; // 1st degree connections
  indirectConnections: Node[]; // 2nd degree connections
  reputationSources: Edge[]; // Relationships contributing to score
  networkReach: number;      // Total reachable users
}
```

**Demo Steps:**
1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Select wallet provider
   - Approve connection

2. **View Personal Subgraph**
   - Network recenters on connected address
   - Shows personal connections highlighted
   - Displays reputation contribution breakdown

3. **Analyze Trust Paths**
   - See how reputation flows through network
   - Identify key connectors in personal network
   - Understand indirect trust relationships

### 4. Network Evolution Over Time

#### Time-based Filtering
```typescript
// Show recent activity (last 24 hours)
filterNetwork({ activityPeriod: '24h' });

// Show weekly patterns
filterNetwork({ activityPeriod: '7d' });

// Show monthly trends
filterNetwork({ activityPeriod: '30d' });
```

**Demo Steps:**
1. **Recent Activity**
   - Filter to last 24 hours
   - See new relationships forming
   - Identify active network areas

2. **Growth Patterns**
   - Expand to weekly view
   - Observe network expansion
   - Note reputation changes

3. **Long-term Trends**
   - View monthly evolution
   - See established vs. new relationships
   - Understand network maturation

---

## Network States and Scenarios

### Scenario 1: Dense Academic Network

**Characteristics:**
- High interconnectivity
- Many bidirectional attestations
- Hub nodes with formal credentials
- Clear authority hierarchy

**Visual Pattern:**
```
     [Authority]
    /    |    \
[User] - | - [User]
    \    |    /
     [Voucher]
```

**Reputation Dynamics:**
- Attestations carry high weight
- Formal verification processes
- Slow but stable reputation building
- Clear trust pathways

**Demo Script:**
1. Filter to attestation relationships only
2. Identify central authority nodes
3. Show how reputation flows outward
4. Demonstrate verification requirements

### Scenario 2: Sparse Emerging Community

**Characteristics:**
- Lower connection density
- Mix of relationship types
- Emerging hub formation
- Rapid growth potential

**Visual Pattern:**
```
[User]   [User]
  |       /
[Hub] - [User]
  |       \
[User]   [User]
```

**Reputation Dynamics:**
- Individual relationships high impact
- Vouches more common than attestations
- Easier entry for new users
- More volatile reputation scores

**Demo Script:**
1. Show overall sparse structure
2. Identify emerging hub nodes
3. Demonstrate growth opportunities
4. Explain reputation sensitivity

### Scenario 3: Multi-Cluster Professional Network

**Characteristics:**
- Multiple distinct clusters
- Bridge nodes connecting clusters
- Specialized domains/industries
- Cross-cluster attestations rare

**Visual Pattern:**
```
Cluster A    Bridge    Cluster B
[A1]-[A2]   [Bridge]   [B1]-[B2]
 |    |        |        |    |
[A3]-[A4]     | |      [B3]-[B4]
         \   /   \   /
          [A5]   [B5]
```

**Reputation Dynamics:**
- High intra-cluster trust
- Bridge nodes very valuable
- Domain-specific reputation
- Cross-cluster verification premium

**Demo Script:**
1. Identify distinct clusters
2. Find bridge nodes connecting clusters
3. Show reputation transfer across bridges
4. Explain network effect benefits

### Scenario 4: Celebrity/Influencer Network

**Characteristics:**
- Star topology around influencers
- Many one-way relationships
- High vouch-to-attestation ratio
- Rapid reputation propagation

**Visual Pattern:**
```
    [User]
      |
[User]-[Celebrity]-[User]
      |
    [User]
```

**Reputation Dynamics:**
- Central nodes accumulate high reputation
- Proximity to influencers valuable
- Vouch relationships dominant
- Risk of reputation bubbles

**Demo Script:**
1. Identify star-pattern formations
2. Show reputation concentration
3. Demonstrate influence propagation
4. Discuss centralization risks

---

## Mock Data Scenarios

### Mock Network Generation

```typescript
// Generate mock network with specific characteristics
function generateMockNetwork(scenario: string): NetworkData {
  switch (scenario) {
    case 'dense_academic':
      return generateDenseAcademicNetwork();
    case 'sparse_emerging':
      return generateSparseEmergingNetwork();
    case 'multi_cluster':
      return generateMultiClusterNetwork();
    case 'celebrity':
      return generateCelebrityNetwork();
    default:
      return generateRandomNetwork();
  }
}
```

### Scenario Parameters

#### Dense Academic Network
```typescript
const denseAcademicConfig = {
  nodeCount: 150,
  edgeDensity: 0.08,        // 8% of possible edges
  attestationRatio: 0.6,    // 60% attestations
  vouchRatio: 0.3,          // 30% vouches
  trustRatio: 0.1,          // 10% direct trust
  hubCount: 5,              // 5 authority nodes
  avgReputationScore: 0.85, // High average
  bidirectionalRate: 0.7    // 70% mutual relationships
};
```

#### Sparse Emerging Network
```typescript
const sparseEmergingConfig = {
  nodeCount: 80,
  edgeDensity: 0.03,        // 3% of possible edges
  attestationRatio: 0.2,    // 20% attestations
  vouchRatio: 0.6,          // 60% vouches
  trustRatio: 0.2,          // 20% direct trust
  hubCount: 2,              // 2 emerging hubs
  avgReputationScore: 0.72, // Lower average
  bidirectionalRate: 0.4    // 40% mutual relationships
};
```

### Mock Data Consistency

```typescript
// Ensure consistent mock data based on wallet address
function generateConsistentMockData(walletAddress: string): UserNetworkData {
  const seed = hashAddress(walletAddress);
  const rng = new SeededRandom(seed);
  
  return {
    personalScore: generateScore(rng),
    directConnections: generateConnections(rng, 8, 15),
    reputationSources: generateSources(rng),
    networkPosition: calculatePosition(rng)
  };
}
```

---

## Technical Implementation

### 1. D3.js Force Simulation

```typescript
// Set up force simulation
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).id(d => d.id).distance(50))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide().radius(d => d.radius + 2));

// Update positions on tick
simulation.on("tick", () => {
  // Update node positions
  nodeElements
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
    
  // Update edge positions
  linkElements
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);
});
```

### 2. Interactive Event Handlers

```typescript
// Node interaction handlers
function setupNodeInteractions() {
  nodeElements
    .on("mouseover", handleNodeHover)
    .on("mouseout", handleNodeUnhover)
    .on("click", handleNodeClick)
    .on("dblclick", handleNodeDoubleClick)
    .call(d3.drag()
      .on("start", handleDragStart)
      .on("drag", handleDrag)
      .on("end", handleDragEnd)
    );
}

// Zoom and pan handler
const zoom = d3.zoom()
  .scaleExtent([0.1, 10])
  .on("zoom", (event) => {
    container.attr("transform", event.transform);
  });

svg.call(zoom);
```

### 3. Filter Implementation

```typescript
// Apply filters to network data
function applyFilters(filters: FilterOptions): void {
  // Filter nodes by score range
  const filteredNodes = allNodes.filter(node => 
    node.score >= filters.scoreRange.min && 
    node.score <= filters.scoreRange.max
  );
  
  // Filter edges by relationship type
  const filteredEdges = allEdges.filter(edge => {
    if (filters.relationshipType === 'all') return true;
    return edge.type === filters.relationshipType;
  });
  
  // Update visualization
  updateVisualization(filteredNodes, filteredEdges);
}
```

### 4. Performance Optimization

```typescript
// Level-of-detail rendering for large networks
function optimizeRendering(nodeCount: number): void {
  if (nodeCount > 500) {
    // Reduce visual detail
    nodeElements.attr("r", d => Math.min(d.radius, 4));
    linkElements.attr("stroke-width", 1);
    
    // Disable some interactions
    simulation.alpha(0.1); // Reduce simulation intensity
  }
  
  if (nodeCount > 1000) {
    // Further optimizations
    enableCulling();
    reduceLabelDensity();
  }
}
```

---

## Demo Scripts

### Demo Script 1: Basic Network Exploration

**Duration**: 5 minutes
**Audience**: First-time users

```markdown
## Network Exploration Demo

1. **Opening (30 seconds)**
   - "Welcome to the Shadowgraph trust network visualization"
   - "This shows real trust relationships between users"
   - "Each dot is a user, lines show trust relationships"

2. **Basic Interaction (2 minutes)**
   - Hover over nodes: "See user details and reputation score"
   - Click on node: "Highlight their connections"
   - Drag node: "Reorganize the network layout"
   - Zoom/pan: "Navigate around the network"

3. **Relationship Types (2 minutes)**
   - Filter to attestations: "Green lines show verified relationships"
   - Filter to vouches: "Blue lines show endorsements"
   - Filter to trust: "Purple lines show personal trust"
   - Show all: "See the complete trust ecosystem"

4. **Personal Network (30 seconds)**
   - Connect wallet: "See your personal trust network"
   - "Your connections contribute to your reputation score"
   - "Build relationships to improve your standing"
```

### Demo Script 2: Advanced Network Analysis

**Duration**: 10 minutes
**Audience**: Power users, developers

```markdown
## Advanced Network Analysis Demo

1. **Network Topology (3 minutes)**
   - Identify clusters: "Distinct communities within the network"
   - Find bridges: "Users connecting different communities"
   - Locate hubs: "Highly connected influential users"
   - Explain metrics: "Clustering coefficient, path length, density"

2. **Reputation Dynamics (3 minutes)**
   - Score distribution: "Most users cluster around average"
   - High-reputation nodes: "Central positions, many attestations"
   - Reputation flow: "How trust propagates through network"
   - Score sensitivity: "Impact of new relationships"

3. **Network Evolution (2 minutes)**
   - Time filters: "See how network grows over time"
   - Relationship formation: "Patterns in trust building"
   - Community emergence: "How clusters form and grow"
   - Stability analysis: "Core vs. periphery dynamics"

4. **Strategic Insights (2 minutes)**
   - Optimal positioning: "Where to focus relationship building"
   - Network effects: "Benefits of connecting communities"
   - Reputation strategy: "Path to higher trust scores"
   - Risk factors: "Avoiding reputation bubbles"
```

### Demo Script 3: Mock vs. Production Comparison

**Duration**: 7 minutes
**Audience**: Technical stakeholders

```markdown
## Mock vs. Production Network Demo

1. **Mock Network Features (2 minutes)**
   - Deterministic generation: "Consistent results for testing"
   - Realistic patterns: "Based on real network analysis"
   - Configurable scenarios: "Different network types"
   - Performance optimized: "Smooth interaction for demos"

2. **Production Network Features (2 minutes)**
   - Real-time updates: "Live relationship changes"
   - Actual user data: "Genuine trust relationships"
   - Historical tracking: "Reputation evolution over time"
   - Privacy preservation: "ZK proofs protect sensitive data"

3. **Transition Planning (2 minutes)**
   - Data migration: "From mock to real network data"
   - API integration: "Backend service connectivity"
   - Performance scaling: "Handling growth in users/relationships"
   - User migration: "Preserving demo familiarity"

4. **Future Enhancements (1 minute)**
   - Machine learning: "Pattern recognition in trust formation"
   - Predictive modeling: "Reputation trend forecasting"
   - Cross-chain integration: "Multi-blockchain trust networks"
   - Mobile optimization: "Touch-optimized interactions"
```

---

## Conclusion

The Web of Trust visualization is a powerful tool for understanding and interacting with reputation networks. Through comprehensive demos and detailed scenarios, users can explore trust relationships, analyze network dynamics, and understand their position within the broader Shadowgraph ecosystem.

The combination of mock data for demonstration and real network integration for production provides a seamless path from exploration to actual participation in the reputation-based airdrop system.