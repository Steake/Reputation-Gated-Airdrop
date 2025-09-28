import { ethers } from "ethers";

/**
 * Core EBSL Algorithm Implementation
 *
 * This module implements the Evidence-Based Subjective Logic (EBSL) algorithm
 * for computing reputation scores from trust network data.
 *
 * Enhanced with weighted fusion, incremental updates, and circuit partitioning for scalability.
 */

export interface SubjectiveOpinion {
  belief: number; // b ∈ [0,1] - Positive evidence strength
  disbelief: number; // d ∈ [0,1] - Negative evidence strength
  uncertainty: number; // u ∈ [0,1] - Lack of evidence
  base_rate: number; // a ∈ [0,1] - Prior probability
}

export interface ReputationResult {
  user_address: string;
  score: number;
  opinion: SubjectiveOpinion;
  confidence: number;
  computation_metadata: {
    algorithm_version: string;
    opinion_count: number;
    timestamp: number;
    is_incremental: boolean;
    is_partitioned: boolean;
    partition_count?: number;
    base_reputation?: SubjectiveOpinion; // For incremental updates
  };
}

export interface TrustAttestation {
  source: string;
  target: string;
  opinion: SubjectiveOpinion;
  attestation_type: "trust" | "skill" | "vouch" | "endorsement";
  weight: number;
  created_at: number;
  expires_at: number;
}

/**
 * Enhanced EBSL implementation with weighted fusion, incremental updates, and partitioning
 */
export class EBSLEngine {
  private readonly EPSILON = 1e-9;
  private readonly PARTITION_THRESHOLD = 50; // Partition if >50 attestations
  private readonly MAX_PARTITION_SIZE = 20; // Max attestations per partition

  /**
   * Validate that an opinion satisfies subjective logic constraints
   */
  validateOpinion(opinion: SubjectiveOpinion): boolean {
    const { belief, disbelief, uncertainty, base_rate } = opinion;

    // Check value ranges
    if (belief < 0 || belief > 1) return false;
    if (disbelief < 0 || disbelief > 1) return false;
    if (uncertainty < 0 || uncertainty > 1) return false;
    if (base_rate < 0 || base_rate > 1) return false;

    // Check constraint: b + d + u = 1
    const sum = belief + disbelief + uncertainty;
    return Math.abs(sum - 1.0) < this.EPSILON;
  }

  /**
   * Partition attestations into smaller groups for scalable computation
   * @param attestations Array of attestations
   * @param maxSize Maximum size per partition
   * @returns Array of partitioned attestations
   */
  private partitionAttestations(
    attestations: TrustAttestation[],
    maxSize: number = this.MAX_PARTITION_SIZE
  ): TrustAttestation[][] {
    const partitions: TrustAttestation[][] = [];
    let currentPartition: TrustAttestation[] = [];

    for (const att of attestations) {
      if (currentPartition.length >= maxSize) {
        partitions.push([...currentPartition]);
        currentPartition = [att];
      } else {
        currentPartition.push(att);
      }
    }

    if (currentPartition.length > 0) {
      partitions.push(currentPartition);
    }

    return partitions;
  }

  /**
   * Fuse two subjective opinions using weighted EBSL rules
   * @param op1 First opinion
   * @param op2 Second opinion
   * @param weight1 Weight for op1 (0-1)
   * @param weight2 Weight for op2 (0-1)
   */
  fuseOpinions(
    op1: SubjectiveOpinion,
    op2: SubjectiveOpinion,
    weight1: number = 1.0,
    weight2: number = 1.0
  ): SubjectiveOpinion {
    if (!this.validateOpinion(op1) || !this.validateOpinion(op2)) {
      throw new Error("Invalid opinion values provided");
    }

    const w1 = weight1 / (weight1 + weight2);
    const w2 = weight2 / (weight1 + weight2);

    const { belief: b1, disbelief: d1, uncertainty: u1, base_rate: a1 } = op1;
    const { belief: b2, disbelief: d2, uncertainty: u2, base_rate: a2 } = op2;

    // Weighted denominator with numerical stability
    const denominator = w1 * u1 + w2 * u2 - w1 * w2 * u1 * u2;

    // Handle edge case: both opinions are certain
    if (Math.abs(denominator) < this.EPSILON) {
      return this.handleCertainOpinionsFusion(op1, op2, w1, w2);
    }

    // Weighted EBSL fusion formulas
    let belief_fused = (w1 * b1 * u2 + w2 * b2 * u1) / denominator;
    let disbelief_fused = (w1 * d1 * u2 + w2 * d2 * u1) / denominator;
    let uncertainty_fused = (w1 * w2 * u1 * u2) / denominator;
    const base_rate_fused = (w1 * a1 * u2 + w2 * a2 * u1) / denominator;

    // Normalize to ensure b + d + u = 1 due to floating point precision
    let sum = belief_fused + disbelief_fused + uncertainty_fused;
    if (Math.abs(sum - 1) > this.EPSILON && sum > 0) {
      const scale = 1 / sum;
      belief_fused *= scale;
      disbelief_fused *= scale;
      uncertainty_fused *= scale;
      sum = 1; // Reset for clamping
    }

    return {
      belief: this.clamp(belief_fused, 0, 1),
      disbelief: this.clamp(disbelief_fused, 0, 1),
      uncertainty: this.clamp(uncertainty_fused, 0, 1),
      base_rate: this.clamp(base_rate_fused, 0, 1),
    };
  }

  /**
   * Fuse multiple opinions with weights iteratively
   * @param attestations Array of attestations with weights
   */
  fuseMultipleOpinions(attestations: TrustAttestation[]): SubjectiveOpinion {
    if (attestations.length === 0) {
      return { belief: 0, disbelief: 0, uncertainty: 1, base_rate: 0.5 };
    }

    if (attestations.length === 1) {
      return attestations[0].opinion;
    }

    let fused = attestations[0].opinion;
    const totalWeight = attestations.reduce((sum, att) => sum + att.weight, 0);

    for (let i = 1; i < attestations.length; i++) {
      const currentWeight = attestations[i].weight / totalWeight;
      const prevWeight = attestations[i - 1].weight / totalWeight;
      fused = this.fuseOpinions(fused, attestations[i].opinion, prevWeight, currentWeight);
    }

    return fused;
  }

  /**
   * Compute reputation using partitioned fusion for large networks
   * @param userAddress User address
   * @param attestations All attestations
   * @param usePartitioning Force partitioning (for testing)
   * @returns Reputation result with partitioning metadata
   */
  computeReputation(
    userAddress: string,
    attestations: TrustAttestation[],
    usePartitioning: boolean = false
  ): ReputationResult {
    // Filter valid attestations for the target user
    const validAttestations = attestations.filter(
      (att) =>
        att.target === userAddress &&
        att.expires_at > Date.now() &&
        this.validateOpinion(att.opinion)
    );

    const opinionCount = validAttestations.length;
    const isPartitioned = usePartitioning || opinionCount > this.PARTITION_THRESHOLD;

    let fusedOpinion: SubjectiveOpinion;
    let partitionCount = 1;

    if (isPartitioned) {
      // Partition attestations
      const partitions = this.partitionAttestations(validAttestations);
      partitionCount = partitions.length;

      // Fuse each partition
      const partitionOpinions: SubjectiveOpinion[] = [];
      for (const partition of partitions) {
        const partitionFused = this.fuseMultipleOpinions(partition);
        partitionOpinions.push(partitionFused);
      }

      // Fuse partition results
      fusedOpinion = this.fuseSubjectiveOpinions(partitionOpinions);
    } else {
      // Standard fusion
      fusedOpinion = this.fuseMultipleOpinions(validAttestations);
    }

    // Convert to reputation score
    const reputationScore = this.opinionToReputation(fusedOpinion);

    // Compute confidence based on uncertainty and evidence count
    const confidence = this.computeConfidence(fusedOpinion, opinionCount);

    return {
      user_address: userAddress,
      score: reputationScore,
      opinion: fusedOpinion,
      confidence,
      computation_metadata: {
        algorithm_version: "EBSL-Classical-v1.0",
        opinion_count: opinionCount,
        timestamp: Date.now(),
        is_incremental: false,
        is_partitioned: isPartitioned,
        partition_count: isPartitioned ? partitionCount : undefined,
      },
    };
  }

  /**
   * Incrementally update reputation with new attestations
   * @param baseReputation Previous reputation result
   * @param newAttestations New attestations to incorporate
   * @param baseWeight Weight of base reputation (decays over time)
   */
  incrementalUpdateReputation(
    baseReputation: ReputationResult,
    newAttestations: TrustAttestation[],
    baseWeight: number = 0.7 // Decay factor for old reputation
  ): ReputationResult {
    if (newAttestations.length === 0) {
      return baseReputation;
    }

    // Fuse new attestations
    const newFusedOpinion = this.fuseMultipleOpinions(newAttestations);

    // Weight the base and new opinions
    const updatedOpinion = this.fuseOpinions(
      baseReputation.opinion,
      newFusedOpinion,
      baseWeight,
      1 - baseWeight
    );

    const updatedScore = this.opinionToReputation(updatedOpinion);
    const updatedConfidence = this.computeConfidence(
      updatedOpinion,
      baseReputation.computation_metadata.opinion_count + newAttestations.length
    );

    return {
      ...baseReputation,
      score: updatedScore,
      opinion: updatedOpinion,
      confidence: updatedConfidence,
      computation_metadata: {
        ...baseReputation.computation_metadata,
        opinion_count: baseReputation.computation_metadata.opinion_count + newAttestations.length,
        timestamp: Date.now(),
        is_incremental: true,
        base_reputation: baseReputation.opinion,
      },
    };
  }

  /**
   * Convert fused opinion to reputation score using expected value
   */
  opinionToReputation(opinion: SubjectiveOpinion): number {
    const { belief, uncertainty, base_rate } = opinion;
    // Expected value: E = b + a*u
    return belief + base_rate * uncertainty;
  }

  /**
   * Handle fusion when both opinions have zero uncertainty (weighted average fallback)
   */
  private handleCertainOpinionsFusion(
    op1: SubjectiveOpinion,
    op2: SubjectiveOpinion,
    w1: number,
    w2: number
  ): SubjectiveOpinion {
    // Use weighted average when denominator approaches zero
    return {
      belief: w1 * op1.belief + w2 * op2.belief,
      disbelief: w1 * op1.disbelief + w2 * op2.disbelief,
      uncertainty: Math.min(op1.uncertainty, op2.uncertainty),
      base_rate: w1 * op1.base_rate + w2 * op2.base_rate,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private computeConfidence(opinion: SubjectiveOpinion, evidenceCount: number): number {
    // Confidence increases with more evidence and decreases with uncertainty
    const evidenceFactor = Math.min(evidenceCount / 10, 1); // Normalize to [0,1]
    const certaintyFactor = 1 - opinion.uncertainty;

    return evidenceFactor * certaintyFactor;
  }

  /**
   * Fuse multiple subjective opinions iteratively (equal weights)
   * Used for fusing partition results
   * @param opinions Array of subjective opinions
   * @returns Fused opinion
   */
  fuseSubjectiveOpinions(opinions: SubjectiveOpinion[]): SubjectiveOpinion {
    if (opinions.length === 0) {
      return { belief: 0, disbelief: 0, uncertainty: 1, base_rate: 0.5 };
    }

    if (opinions.length === 1) {
      return opinions[0];
    }

    let fused = opinions[0];
    for (let i = 1; i < opinions.length; i++) {
      fused = this.fuseOpinions(fused, opinions[i], 1.0, 1.0); // Equal weights
    }

    return fused;
  }

  /**
   * Compute set membership inputs for ZK proofs using hashed attestations
   * Placeholder for MiMC/Groth16 circuit via EZKL
   * @param attestations Array of attestations forming the trusted set
   * @param targetAttestation Specific attestation to prove membership for (optional)
   * @returns Object with set commitment and member hash for ZK public inputs
   */
  computeSetMembershipInputs(
    attestations: TrustAttestation[],
    targetAttestation?: TrustAttestation
  ): { commitment: string; memberHash?: string } {
    if (attestations.length === 0) {
      throw new Error("No attestations provided for set membership");
    }

    // Hash each attestation (placeholder: keccak256 of serialized attestation)
    const attestationHashes: string[] = attestations.map((att) => {
      const serialized = JSON.stringify({
        source: att.source,
        target: att.target,
        belief: att.opinion.belief,
        disbelief: att.opinion.disbelief,
        uncertainty: att.opinion.uncertainty,
        base_rate: att.opinion.base_rate,
        weight: att.weight,
        created_at: att.created_at,
        expires_at: att.expires_at,
      });
      return ethers.keccak256(ethers.toUtf8Bytes(serialized));
    });

    // Compute set commitment as hash of concatenated hashes (placeholder for MiMC Merkle root or multi-set hash)
    const concatenatedBytes = ethers.concat(attestationHashes.map((h) => ethers.getBytes(h)));
    const commitment = ethers.keccak256(concatenatedBytes);

    let memberHash: string | undefined;
    if (targetAttestation) {
      const targetSerialized = JSON.stringify({
        source: targetAttestation.source,
        target: targetAttestation.target,
        belief: targetAttestation.opinion.belief,
        disbelief: targetAttestation.opinion.disbelief,
        uncertainty: targetAttestation.opinion.uncertainty,
        base_rate: targetAttestation.opinion.base_rate,
        weight: targetAttestation.weight,
        created_at: targetAttestation.created_at,
        expires_at: targetAttestation.expires_at,
      });
      memberHash = ethers.keccak256(ethers.toUtf8Bytes(targetSerialized));
    }

    return { commitment, memberHash };
  }
}

// Export singleton instance for convenience
export const ebslEngine = new EBSLEngine();
