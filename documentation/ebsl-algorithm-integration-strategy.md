# EBSL Algorithm Integration Strategy

## Overview

This document defines the comprehensive strategy for integrating the Evidence-Based Subjective Logic (EBSL) algorithm into the client-side prover infrastructure. It covers the technical approach for converting the PyTorch-based EBSL implementation to a zero-knowledge compatible format using EZKL, ensuring scalability for arbitrary network sizes, and implementing aggregate proofs.

## EBSL Algorithm Foundation

### 1. Mathematical Framework

#### 1.1 Subjective Logic Fundamentals

**Subjective Opinion Representation**
```typescript
interface SubjectiveOpinion {
  belief: number;      // b ∈ [0,1] - Positive evidence strength
  disbelief: number;   // d ∈ [0,1] - Negative evidence strength  
  uncertainty: number; // u ∈ [0,1] - Lack of evidence
  base_rate: number;   // a ∈ [0,1] - Prior probability
}

// Constraint: b + d + u = 1
// Expected value: E = b + a*u
```

**EBSL Fusion Rules**
```typescript
// Fusion of two opinions ω₁ and ω₂
function ebslFusion(ω₁: SubjectiveOpinion, ω₂: SubjectiveOpinion): SubjectiveOpinion {
  const { b1, d1, u1, a1 } = ω₁;
  const { b2, d2, u2, a2 } = ω₂;
  
  // Denominator calculation with numerical stability
  const denominator = u1 + u2 - (u1 * u2);
  
  if (Math.abs(denominator) < EPSILON) {
    // Handle degenerate case when both opinions are certain
    return handleCertainOpinionsFusion(ω₁, ω₂);
  }
  
  // Standard EBSL fusion formulas
  const b_fused = (b1 * u2 + b2 * u1) / denominator;
  const d_fused = (d1 * u2 + d2 * u1) / denominator;
  const u_fused = (u1 * u2) / denominator;
  const a_fused = (a1 * u2 + a2 * u1) / denominator;
  
  return {
    belief: clamp(b_fused, 0, 1),
    disbelief: clamp(d_fused, 0, 1),
    uncertainty: clamp(u_fused, 0, 1),
    base_rate: clamp(a_fused, 0, 1)
  };
}
```

#### 1.2 Network-Level Trust Computation

**Trust Path Aggregation**
```typescript
interface TrustPath {
  source: string;
  target: string;
  path: string[];
  opinions: SubjectiveOpinion[];
  weights: number[];
  confidence: number;
}

class TrustNetworkProcessor {
  /**
   * Compute reputation using multi-path EBSL aggregation
   */
  computeNetworkReputation(
    targetUser: string,
    trustPaths: TrustPath[],
    aggregationStrategy: AggregationStrategy
  ): ReputationResult {
    
    // 1. Validate and filter trust paths
    const validPaths = this.validateTrustPaths(trustPaths);
    
    // 2. Compute path-level opinions
    const pathOpinions = validPaths.map(path => 
      this.computePathOpinion(path)
    );
    
    // 3. Apply path weighting strategy
    const weightedOpinions = this.applyPathWeighting(
      pathOpinions, 
      aggregationStrategy
    );
    
    // 4. Perform EBSL fusion across all paths
    const finalOpinion = this.fuseManyOpinions(weightedOpinions);
    
    // 5. Convert to reputation score
    const reputationScore = this.opinionToReputation(finalOpinion);
    
    return {
      user: targetUser,
      score: reputationScore,
      opinion: finalOpinion,
      pathCount: validPaths.length,
      confidence: this.computeConfidence(finalOpinion, validPaths),
      metadata: {
        algorithm: "EBSL-Network-v1.0",
        timestamp: Date.now(),
        networkSize: trustPaths.length
      }
    };
  }
  
  private computePathOpinion(path: TrustPath): SubjectiveOpinion {
    // Sequential fusion along trust path
    let pathOpinion = path.opinions[0];
    
    for (let i = 1; i < path.opinions.length; i++) {
      // Apply path decay and distance weighting
      const decayedOpinion = this.applyPathDecay(
        path.opinions[i], 
        i, 
        path.weights[i]
      );
      
      pathOpinion = ebslFusion(pathOpinion, decayedOpinion);
    }
    
    return pathOpinion;
  }
}
```

## EZKL ZKML Integration Strategy (Following Existing Notebook)

**Important**: This implementation follows the proven PyTorch → ONNX → EZKL pipeline as demonstrated in `Notebooks/ebsl_full_script.py` and `EBSL_Pipeline_Complete.ipynb`, NOT Circom circuits.

### 1. PyTorch Model Architecture (Based on Notebook)

The notebook already provides a complete EZKL integration. We build upon this foundation:

```python
# From notebook: EBSLFusionModule already implemented
class EBSLFusionModule(nn.Module):
    """
    PyTorch module for EBSL fusion compatible with EZKL compilation
    Already implemented and tested in the notebook
    """
    
    def __init__(self, max_opinions: int = 16, precision_bits: int = 32):
        super().__init__()
        self.max_opinions = max_opinions
        self.scale_factor = 2 ** (precision_bits - 8)
        self.epsilon = torch.tensor(1.0 / self.scale_factor)
        self.one = torch.tensor(1.0)
        
    def forward(self, opinions_tensor: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        # Implementation already proven in notebook
        # Uses overflow-safe operations for ZK compatibility
        return fused_opinion
```

### 2. Local Client Integration Strategy

**Approach**: Leverage the notebook's proven EZKL pipeline for client-side use:

```typescript
class LocalEZKLProver {
  /**
   * Generate ZK proof using the notebook's proven EZKL pipeline
   * Runs entirely locally in the client without backend dependencies
   */
  async generateLocalProof(
    userAttestations: TrustAttestation[]
  ): Promise<LocalZKProof> {
    
    // 1. Use local EBSL computation (already implemented)
    const reputation = this.localEBSL.computeReputation(userAddress, userAttestations);
    
    // 2. Prepare data in ONNX format (matching notebook)
    const onnxInput = this.prepareONNXInput(userAttestations);
    
    // 3. Use pre-compiled EZKL circuit (from notebook pipeline)
    const proof = await this.ezkl.generateProof(onnxInput, this.precompiledCircuit);
    
    return {
      reputation: reputation.score,
      proof: proof,
      generated_locally: true,
      computation_method: 'EZKL-ONNX-PyTorch'
    };
  }
  
  private prepareONNXInput(attestations: TrustAttestation[]): ONNXInput {
    // Format data exactly as expected by notebook's PyTorch model
    const maxOpinions = 16;
    const opinions = Array(maxOpinions).fill([0, 0, 1, 0.5]);
    const mask = Array(maxOpinions).fill(false);
    
    attestations.slice(0, maxOpinions).forEach((att, i) => {
      opinions[i] = [
        att.opinion.belief,
        att.opinion.disbelief, 
        att.opinion.uncertainty,
        att.opinion.base_rate
      ];
      mask[i] = true;
    });
    
    return { opinions, mask };
  }
}

**Precision Management**
```typescript
class ZKEBSLProcessor {
  private readonly PRECISION_BITS = 32;
  private readonly SCALE_FACTOR = 2 ** (this.PRECISION_BITS - 8);
  private readonly EPSILON = 1 / this.SCALE_FACTOR;
  
  /**
   * Convert floating point opinion to fixed-point representation
   */
  encodeOpinion(opinion: SubjectiveOpinion): FixedPointOpinion {
    return {
      belief: Math.round(opinion.belief * this.SCALE_FACTOR),
      disbelief: Math.round(opinion.disbelief * this.SCALE_FACTOR),
      uncertainty: Math.round(opinion.uncertainty * this.SCALE_FACTOR),
      base_rate: Math.round(opinion.base_rate * this.SCALE_FACTOR)
    };
  }
  
  /**
   * ZK-safe fusion with overflow protection
   */
  zkSafeFusion(
    op1: FixedPointOpinion, 
    op2: FixedPointOpinion
  ): FixedPointOpinion {
    
    const { b1, d1, u1, a1 } = op1;
    const { b2, d2, u2, a2 } = op2;
    
    // Compute denominator with overflow checking
    const denom_raw = u1 + u2 - this.fixedPointMultiply(u1, u2);
    const denominator = Math.max(denom_raw, this.EPSILON * this.SCALE_FACTOR);
    
    // Perform division with rounding
    const b_fused = this.fixedPointDivide(
      this.fixedPointMultiply(b1, u2) + this.fixedPointMultiply(b2, u1),
      denominator
    );
    
    const d_fused = this.fixedPointDivide(
      this.fixedPointMultiply(d1, u2) + this.fixedPointMultiply(d2, u1),
      denominator
    );
    
    const u_fused = this.fixedPointDivide(
      this.fixedPointMultiply(u1, u2),
      denominator
    );
    
    const a_fused = this.fixedPointDivide(
      this.fixedPointMultiply(a1, u2) + this.fixedPointMultiply(a2, u1),
      denominator
    );
    
    return {
      belief: this.clampFixed(b_fused),
      disbelief: this.clampFixed(d_fused),
      uncertainty: this.clampFixed(u_fused),
      base_rate: this.clampFixed(a_fused)
    };
  }
  
  private fixedPointMultiply(a: number, b: number): number {
    // Multiply with overflow protection
    const result = (a * b) / this.SCALE_FACTOR;
    return Math.min(result, this.SCALE_FACTOR); // Clamp to max value
  }
  
  private fixedPointDivide(a: number, b: number): number {
    // Division with precision preservation
    return Math.round((a * this.SCALE_FACTOR) / b);
  }
}
```

#### 2.2 PyTorch to EZKL Conversion Pipeline

**Model Architecture**
```python
import torch
import torch.nn as nn
import ezkl

class EBSLFusionModule(nn.Module):
    """
    PyTorch module for EBSL fusion compatible with EZKL compilation
    """
    
    def __init__(self, max_opinions: int = 16, precision_bits: int = 32):
        super().__init__()
        self.max_opinions = max_opinions
        self.scale_factor = 2 ** (precision_bits - 8)
        self.epsilon = torch.tensor(1.0 / self.scale_factor)
        self.one = torch.tensor(1.0)
        
    def forward(self, opinions_tensor: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        """
        Forward pass for EBSL fusion
        
        Args:
            opinions_tensor: [batch_size, max_opinions, 4] - [b,d,u,a] values
            mask: [batch_size, max_opinions] - boolean mask for valid opinions
            
        Returns:
            [batch_size, 4] - fused opinion [b,d,u,a]
        """
        
        batch_size = opinions_tensor.shape[0]
        
        # Apply mask to filter valid opinions
        masked_opinions = opinions_tensor * mask.unsqueeze(-1)
        valid_counts = torch.sum(mask, dim=1)
        
        # Initialize with first valid opinion for each batch
        fused_opinions = torch.zeros(batch_size, 4)
        
        for batch_idx in range(batch_size):
            valid_ops = masked_opinions[batch_idx][mask[batch_idx]]
            if len(valid_ops) == 0:
                # Default to uncertain opinion
                fused_opinions[batch_idx] = torch.tensor([0.0, 0.0, 1.0, 0.5])
            elif len(valid_ops) == 1:
                fused_opinions[batch_idx] = valid_ops[0]
            else:
                # Sequential fusion
                fused = valid_ops[0]
                for i in range(1, len(valid_ops)):
                    fused = self.fuse_two_opinions(fused, valid_ops[i])
                fused_opinions[batch_idx] = fused
                
        return fused_opinions
    
    def fuse_two_opinions(self, op1: torch.Tensor, op2: torch.Tensor) -> torch.Tensor:
        """
        Fuse two opinions with numerical stability
        """
        b1, d1, u1, a1 = op1[0], op1[1], op1[2], op1[3]
        b2, d2, u2, a2 = op2[0], op2[1], op2[2], op2[3]
        
        # Compute denominator with clamping
        denom = u1 + u2 - (u1 * u2)
        denom = torch.clamp(denom, min=self.epsilon)
        
        # Compute fused components
        b_fused = (b1 * u2 + b2 * u1) / denom
        d_fused = (d1 * u2 + d2 * u1) / denom
        u_fused = (u1 * u2) / denom
        a_fused = (a1 * u2 + a2 * u1) / denom
        
        # Clamp to valid ranges
        return torch.stack([
            torch.clamp(b_fused, 0.0, 1.0),
            torch.clamp(d_fused, 0.0, 1.0),
            torch.clamp(u_fused, 0.0, 1.0),
            torch.clamp(a_fused, 0.0, 1.0)
        ])

class ReputationCalculator(nn.Module):
    """
    Convert fused opinion to reputation score
    """
    
    def forward(self, fused_opinion: torch.Tensor) -> torch.Tensor:
        """
        Convert opinion to reputation score using expected value
        
        Args:
            fused_opinion: [batch_size, 4] - [b,d,u,a] values
            
        Returns:
            [batch_size, 1] - reputation scores
        """
        belief = fused_opinion[:, 0]
        uncertainty = fused_opinion[:, 2]
        base_rate = fused_opinion[:, 3]
        
        # Expected value calculation: E = b + a*u
        reputation = belief + (base_rate * uncertainty)
        
        return reputation.unsqueeze(-1)
```

**EZKL Compilation Pipeline (From Notebook)**
```python
class EZKLPipeline:
    """
    Client-side EZKL pipeline based on proven notebook implementation
    Enables local proof generation without backend dependencies
    """
    
    def __init__(self, max_opinions: int = 16):
        self.max_opinions = max_opinions
        # Use the proven model architecture from notebook
        self.model = EBSLFusionModule(max_opinions)
        
    async def setupLocalCircuit(self, output_dir: str) -> LocalCircuitArtifacts:
        """
        Set up EZKL circuit for local client use
        Following the exact pipeline from ebsl_full_script.py
        """
        
        # 1. Export PyTorch model to ONNX (notebook approach)
        model = self.model
        model.eval()
        
        dummy_opinions = torch.randn(1, self.max_opinions, 4)
        dummy_mask = torch.ones(1, self.max_opinions, dtype=torch.bool)
        
        onnx_path = f"{output_dir}/ebsl_model.onnx"
        torch.onnx.export(
            model,
            (dummy_opinions, dummy_mask),
            onnx_path,
            export_params=True,
            opset_version=11,  # Match notebook settings
            do_constant_folding=True,
            input_names=['opinions', 'mask'],
            output_names=['fused_opinion']
        )
        
        # 2. Generate EZKL settings (notebook configuration)
        settings_path = f"{output_dir}/settings.json"
        await ezkl.gen_settings(onnx_path, settings_path, py_run_args={
            "input_scales": [32, 32],
            "param_scales": [32], 
            "scale_rebase_multiplier": 32,
            "lookup_safety_margin": 2,
            "num_inner_cols": 8
        })
        
        # 3. Use notebook's calibration approach
        calibration_data = self.generateCalibrationData() # From notebook
        await ezkl.calibrate_settings(calibration_data, onnx_path, settings_path)
        
        # 4. Compile circuit for local use
        circuit_path = f"{output_dir}/circuit.ezkl"
        await ezkl.compile_circuit(onnx_path, settings_path, circuit_path)
        
        # 5. Generate proving/verifying keys
        pk_path = f"{output_dir}/proving_key.pk"
        vk_path = f"{output_dir}/verifying_key.vk"
        await ezkl.setup(circuit_path, pk_path, vk_path)
        
        return LocalCircuitArtifacts({
            circuit: circuit_path,
            proving_key: pk_path,
            verifying_key: vk_path,
            onnx_model: onnx_path,
            settings: settings_path
        });
    }
```
    
    def generate_calibration_data(self) -> str:
        """
        Generate representative calibration data for EZKL
        """
        calibration_samples = []
        
        for _ in range(100):  # Generate 100 calibration samples
            # Random opinions with realistic distributions
            opinions = torch.rand(1, self.max_opinions, 4)
            
            # Normalize to satisfy b + d + u = 1 constraint
            for i in range(self.max_opinions):
                total = opinions[0, i, 0] + opinions[0, i, 1] + opinions[0, i, 2]
                if total > 0:
                    opinions[0, i, :3] = opinions[0, i, :3] / total
                else:
                    opinions[0, i] = torch.tensor([0.0, 0.0, 1.0, 0.5])
            
            # Random mask for variable opinion counts
            mask = torch.rand(1, self.max_opinions) > 0.3
            
            calibration_samples.append({
                "input_data": [opinions.tolist(), mask.tolist()]
            })
        
        calibration_path = "calibration_data.json"
        with open(calibration_path, 'w') as f:
            json.dump(calibration_samples, f)
            
        return calibration_path
```

### 3. Scalability Architecture

#### 3.1 Network Size Handling

**Dynamic Circuit Selection**
```typescript
interface CircuitSpec {
  maxOpinions: number;
  maxDepth: number;
  circuitPath: string;
  provingKeyPath: string;
  verifyingKeyPath: string;
  estimatedProvingTime: number;
  memoryRequirement: number;
}

class ScalableEBSLProver {
  private circuitSpecs: Map<string, CircuitSpec> = new Map([
    ["small", {
      maxOpinions: 10,
      maxDepth: 2,
      circuitPath: "circuits/ebsl_small.ezkl",
      provingKeyPath: "keys/small.pk",
      verifyingKeyPath: "keys/small.vk",
      estimatedProvingTime: 15000, // 15 seconds
      memoryRequirement: 2048 // 2GB
    }],
    ["medium", {
      maxOpinions: 50,
      maxDepth: 3,
      circuitPath: "circuits/ebsl_medium.ezkl",
      provingKeyPath: "keys/medium.pk", 
      verifyingKeyPath: "keys/medium.vk",
      estimatedProvingTime: 60000, // 1 minute
      memoryRequirement: 8192 // 8GB
    }],
    ["large", {
      maxOpinions: 200,
      maxDepth: 4,
      circuitPath: "circuits/ebsl_large.ezkl",
      provingKeyPath: "keys/large.pk",
      verifyingKeyPath: "keys/large.vk", 
      estimatedProvingTime: 300000, // 5 minutes
      memoryRequirement: 32768 // 32GB
    }]
  ]);
  
  selectOptimalCircuit(userTrustData: TrustNetworkData): string {
    const opinionCount = userTrustData.attestations.length;
    const networkDepth = userTrustData.maxPathLength;
    const availableMemory = this.getAvailableMemory();
    
    // Find smallest circuit that can handle the data
    for (const [size, spec] of this.circuitSpecs) {
      if (opinionCount <= spec.maxOpinions && 
          networkDepth <= spec.maxDepth &&
          availableMemory >= spec.memoryRequirement) {
        return size;
      }
    }
    
    // If no single circuit can handle it, use partitioning
    return this.planCircuitPartitioning(userTrustData);
  }
}
```

#### 3.2 Circuit Partitioning Strategy

**Hierarchical Trust Computation**
```typescript
class HierarchicalEBSLProver {
  /**
   * Partition large trust networks into manageable subcircuits
   */
  async generatePartitionedProof(
    userAddress: string,
    trustNetwork: LargeTrustNetwork
  ): Promise<AggregateProof> {
    
    // 1. Partition network into communities/clusters
    const communities = await this.partitionNetwork(trustNetwork);
    
    // 2. Compute community-level reputation scores
    const communityProofs: CommunityProof[] = [];
    
    for (const community of communities) {
      const communityReputation = await this.computeCommunityReputation(
        userAddress,
        community
      );
      
      const communityProof = await this.generateCommunityProof(
        communityReputation,
        community.id
      );
      
      communityProofs.push(communityProof);
    }
    
    // 3. Aggregate community proofs into final reputation
    const aggregateProof = await this.aggregateCommunityProofs(communityProofs);
    
    return aggregateProof;
  }
  
  private async partitionNetwork(network: LargeTrustNetwork): Promise<TrustCommunity[]> {
    // Use community detection algorithms (Louvain, Label Propagation, etc.)
    const communities: TrustCommunity[] = [];
    
    // Implement community detection
    const louvainResult = await this.louvainCommunityDetection(network);
    
    for (const cluster of louvainResult.clusters) {
      communities.push({
        id: cluster.id,
        nodes: cluster.nodes,
        edges: cluster.internalEdges,
        bridgeEdges: cluster.externalEdges,
        cohesionScore: cluster.modularity
      });
    }
    
    return communities;
  }
}
```

### 4. Aggregate Proof Implementation

#### 4.1 Multi-Source Aggregation

**Cross-Platform Reputation Fusion**
```typescript
interface ReputationSource {
  platformId: string;
  userIdentity: string;
  reputationScore: number;
  trustNetworkHash: string;
  proofOfComputation: ZKProof;
  weight: number;
  validUntil: number;
}

class MultiSourceAggregator {
  /**
   * Aggregate reputation from multiple platforms/sources
   */
  async aggregateMultiSourceReputation(
    sources: ReputationSource[],
    aggregationStrategy: AggregationStrategy
  ): Promise<AggregateReputationProof> {
    
    // 1. Verify individual source proofs
    const verifiedSources = await this.verifySourceProofs(sources);
    
    // 2. Apply source weighting and normalization
    const weightedScores = this.applySourceWeights(verifiedSources, aggregationStrategy);
    
    // 3. Compute aggregate score using specified strategy
    const aggregateScore = this.computeAggregateScore(weightedScores, aggregationStrategy);
    
    // 4. Generate proof of correct aggregation
    const aggregationProof = await this.generateAggregationProof(
      verifiedSources,
      weightedScores,
      aggregateScore
    );
    
    return {
      aggregateScore,
      sourceCount: verifiedSources.length,
      aggregationStrategy,
      proof: aggregationProof,
      validity: this.computeAggregateValidity(verifiedSources),
      metadata: {
        sources: verifiedSources.map(s => ({
          platformId: s.platformId,
          weight: s.weight,
          contribution: this.computeContribution(s, aggregateScore)
        })),
        timestamp: Date.now(),
        algorithm: "MultiSourceEBSL-v1.0"
      }
    };
  }
  
  private computeAggregateScore(
    weightedScores: WeightedScore[],
    strategy: AggregationStrategy
  ): number {
    switch (strategy.type) {
      case 'weighted_average':
        return this.weightedAverage(weightedScores);
      case 'harmonic_mean':
        return this.harmonicMean(weightedScores);
      case 'ebsl_fusion':
        return this.ebslMultiSourceFusion(weightedScores);
      case 'max_entropy':
        return this.maxEntropyAggregation(weightedScores);
      default:
        throw new Error(`Unknown aggregation strategy: ${strategy.type}`);
    }
  }
}
```

#### 4.2 Temporal Aggregation

**Reputation Evolution Proofs**
```typescript
interface TemporalReputationSnapshot {
  timestamp: number;
  reputationScore: number;
  networkState: string; // Merkle root
  attestationCount: number;
  computationProof: ZKProof;
}

class TemporalAggregator {
  /**
   * Generate proof of consistent reputation over time
   */
  async generateTemporalConsistencyProof(
    userAddress: string,
    timeWindow: TimeWindow,
    snapshots: TemporalReputationSnapshot[]
  ): Promise<TemporalConsistencyProof> {
    
    // 1. Validate temporal snapshots
    const validSnapshots = this.validateTemporalSequence(snapshots, timeWindow);
    
    // 2. Compute temporal metrics
    const temporalMetrics = this.computeTemporalMetrics(validSnapshots);
    
    // 3. Generate proof of temporal properties
    const consistencyProof = await this.generateConsistencyCircuitProof({
      snapshots: validSnapshots,
      metrics: temporalMetrics,
      requirements: timeWindow.requirements
    });
    
    return {
      userAddress,
      timeWindow,
      snapshotCount: validSnapshots.length,
      temporalMetrics,
      consistencyProof,
      verified: true
    };
  }
  
  private computeTemporalMetrics(snapshots: TemporalReputationSnapshot[]): TemporalMetrics {
    const scores = snapshots.map(s => s.reputationScore);
    
    return {
      averageScore: this.average(scores),
      minimumScore: Math.min(...scores),
      maximumScore: Math.max(...scores),
      variance: this.variance(scores),
      trendDirection: this.computeTrend(scores),
      volatility: this.computeVolatility(scores),
      consistencyIndex: this.computeConsistency(scores)
    };
  }
}
```

### 5. Performance Optimization

#### 5.1 Parallel Processing

**Worker Pool Architecture**
```typescript
class EBSLWorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Queue<EBSLTask> = new Queue();
  private maxWorkers: number;
  
  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
    this.initializeWorkers();
  }
  
  async processEBSLComputation(task: EBSLTask): Promise<EBSLResult> {
    return new Promise((resolve, reject) => {
      // Add task to queue with completion callback
      this.taskQueue.enqueue({
        ...task,
        onComplete: resolve,
        onError: reject
      });
      
      this.processNextTask();
    });
  }
  
  private async processNextTask(): Promise<void> {
    if (this.taskQueue.isEmpty() || this.allWorkersActive()) {
      return;
    }
    
    const availableWorker = this.getAvailableWorker();
    const nextTask = this.taskQueue.dequeue();
    
    if (availableWorker && nextTask) {
      await this.assignTaskToWorker(availableWorker, nextTask);
    }
  }
  
  private async assignTaskToWorker(worker: Worker, task: EBSLTask): Promise<void> {
    worker.postMessage({
      type: 'EBSL_COMPUTATION',
      data: {
        opinions: task.opinions,
        networkData: task.networkData,
        circuitType: task.circuitType
      }
    });
    
    worker.onmessage = (event) => {
      if (event.data.type === 'EBSL_RESULT') {
        task.onComplete(event.data.result);
        this.processNextTask(); // Process next queued task
      } else if (event.data.type === 'EBSL_ERROR') {
        task.onError(new Error(event.data.error));
      }
    };
  }
}
```

#### 5.2 Caching and Memoization

**Intelligent Circuit Caching**
```typescript
class EBSLCache {
  private circuitCache: Map<string, CompiledCircuit> = new Map();
  private proofCache: Map<string, CachedProof> = new Map();
  private reputationCache: Map<string, CachedReputation> = new Map();
  
  async getCachedProof(cacheKey: string): Promise<CachedProof | null> {
    const cached = this.proofCache.get(cacheKey);
    
    if (cached && !this.isExpired(cached)) {
      return cached;
    }
    
    return null;
  }
  
  async cacheProof(cacheKey: string, proof: ZKProof, ttl: number): Promise<void> {
    const cachedProof: CachedProof = {
      proof,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0
    };
    
    this.proofCache.set(cacheKey, cachedProof);
    
    // Implement LRU eviction if cache is full
    this.enforceMaxCacheSize();
  }
  
  generateCacheKey(
    userAddress: string,
    networkStateHash: string,
    circuitType: string,
    proofType: string
  ): string {
    return `${userAddress}:${networkStateHash}:${circuitType}:${proofType}`;
  }
  
  private isExpired(cached: CachedProof): boolean {
    return Date.now() > cached.expiresAt;
  }
}
```

### 6. Integration Testing Strategy

#### 6.1 Property-Based Testing

**EBSL Mathematical Properties**
```typescript
import { property, assert } from 'fast-check';

describe('EBSL Algorithm Properties', () => {
  it('should satisfy commutativity', () => {
    property(
      generateValidOpinion(),
      generateValidOpinion(),
      (op1, op2) => {
        const result1 = ebslFusion(op1, op2);
        const result2 = ebslFusion(op2, op1);
        
        return approximatelyEqual(result1, result2, 1e-10);
      }
    );
  });
  
  it('should satisfy associativity', () => {
    property(
      generateValidOpinion(),
      generateValidOpinion(),
      generateValidOpinion(),
      (op1, op2, op3) => {
        const result1 = ebslFusion(ebslFusion(op1, op2), op3);
        const result2 = ebslFusion(op1, ebslFusion(op2, op3));
        
        return approximatelyEqual(result1, result2, 1e-10);
      }
    );
  });
  
  it('should preserve probability constraints', () => {
    property(
      generateValidOpinion(),
      generateValidOpinion(),
      (op1, op2) => {
        const result = ebslFusion(op1, op2);
        
        return (
          result.belief >= 0 && result.belief <= 1 &&
          result.disbelief >= 0 && result.disbelief <= 1 &&
          result.uncertainty >= 0 && result.uncertainty <= 1 &&
          result.base_rate >= 0 && result.base_rate <= 1 &&
          Math.abs((result.belief + result.disbelief + result.uncertainty) - 1) < 1e-10
        );
      }
    );
  });
});
```

#### 6.2 End-to-End Integration Tests

**Complete Proof Generation Pipeline**
```typescript
describe('Complete EBSL Proof Pipeline', () => {
  it('should generate valid proof for realistic trust network', async () => {
    // Given: A realistic trust network
    const userAddress = "0x1234567890123456789012345678901234567890";
    const trustNetwork = await generateRealisticTrustNetwork(userAddress, {
      attestationCount: 25,
      networkSize: 500,
      averageConnectivity: 3.5
    });
    
    // When: We generate a reputation proof
    const proofResult = await ebslProver.generateProof({
      userAddress,
      trustNetwork,
      proofType: 'public_threshold',
      threshold: 0.6
    });
    
    // Then: The proof should be valid and verifiable
    expect(proofResult.success).toBe(true);
    expect(proofResult.proof).toBeDefined();
    expect(proofResult.reputationScore).toBeGreaterThanOrEqual(0.6);
    
    // And: The proof should verify on-chain
    const verificationResult = await verifyProofOnChain(proofResult.proof);
    expect(verificationResult.isValid).toBe(true);
  });
});
```

This comprehensive EBSL integration strategy provides the foundation for implementing scalable, secure, and efficient zero-knowledge reputation proofs that can handle arbitrary network sizes while maintaining mathematical rigor and performance requirements.