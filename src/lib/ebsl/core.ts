/**
 * Core EBSL Algorithm Implementation
 * 
 * This module implements the Evidence-Based Subjective Logic (EBSL) algorithm
 * for computing reputation scores from trust network data.
 */

export interface SubjectiveOpinion {
  belief: number;      // b ∈ [0,1] - Positive evidence strength
  disbelief: number;   // d ∈ [0,1] - Negative evidence strength  
  uncertainty: number; // u ∈ [0,1] - Lack of evidence
  base_rate: number;   // a ∈ [0,1] - Prior probability
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
  };
}

export interface TrustAttestation {
  source: string;
  target: string;
  opinion: SubjectiveOpinion;
  attestation_type: 'trust' | 'skill' | 'vouch' | 'endorsement';
  weight: number;
  created_at: number;
  expires_at: number;
}

/**
 * Classical EBSL implementation with floating-point arithmetic
 */
export class EBSLEngine {
  private readonly EPSILON = 1e-9;

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
   * Fuse two subjective opinions using EBSL rules
   */
  fuseOpinions(op1: SubjectiveOpinion, op2: SubjectiveOpinion): SubjectiveOpinion {
    if (!this.validateOpinion(op1) || !this.validateOpinion(op2)) {
      throw new Error('Invalid opinion values provided');
    }

    const { belief: b1, disbelief: d1, uncertainty: u1, base_rate: a1 } = op1;
    const { belief: b2, disbelief: d2, uncertainty: u2, base_rate: a2 } = op2;
    
    // Compute denominator with numerical stability
    const denominator = u1 + u2 - (u1 * u2);
    
    // Handle edge case: both opinions are certain
    if (Math.abs(denominator) < this.EPSILON) {
      return this.handleCertainOpinionsFusion(op1, op2);
    }
    
    // Standard EBSL fusion formulas
    const belief_fused = (b1 * u2 + b2 * u1) / denominator;
    const disbelief_fused = (d1 * u2 + d2 * u1) / denominator;
    const uncertainty_fused = (u1 * u2) / denominator;
    const base_rate_fused = (a1 * u2 + a2 * u1) / denominator;
    
    return {
      belief: this.clamp(belief_fused, 0, 1),
      disbelief: this.clamp(disbelief_fused, 0, 1),
      uncertainty: this.clamp(uncertainty_fused, 0, 1),
      base_rate: this.clamp(base_rate_fused, 0, 1)
    };
  }

  /**
   * Fuse multiple opinions iteratively
   */
  fuseMultipleOpinions(opinions: SubjectiveOpinion[]): SubjectiveOpinion {
    if (opinions.length === 0) {
      return { belief: 0, disbelief: 0, uncertainty: 1, base_rate: 0.5 };
    }
    
    if (opinions.length === 1) {
      return opinions[0];
    }

    let fused = opinions[0];
    for (let i = 1; i < opinions.length; i++) {
      fused = this.fuseOpinions(fused, opinions[i]);
    }
    
    return fused;
  }

  /**
   * Convert fused opinion to reputation score using expected value
   */
  opinionToReputation(opinion: SubjectiveOpinion): number {
    const { belief, uncertainty, base_rate } = opinion;
    // Expected value: E = b + a*u
    return belief + (base_rate * uncertainty);
  }

  /**
   * Compute reputation from trust attestations
   */
  computeReputation(
    userAddress: string,
    attestations: TrustAttestation[]
  ): ReputationResult {
    // Filter valid attestations for the target user
    const validAttestations = attestations.filter(att => 
      att.target === userAddress && 
      att.expires_at > Date.now() &&
      this.validateOpinion(att.opinion)
    );

    if (validAttestations.length === 0) {
      return {
        user_address: userAddress,
        score: 0.5, // Default neutral score
        opinion: { belief: 0, disbelief: 0, uncertainty: 1, base_rate: 0.5 },
        confidence: 0,
        computation_metadata: {
          algorithm_version: 'EBSL-Classical-v1.0',
          opinion_count: 0,
          timestamp: Date.now()
        }
      };
    }

    // Extract opinions from attestations
    const opinions = validAttestations.map(att => att.opinion);
    
    // Perform EBSL fusion
    const fusedOpinion = this.fuseMultipleOpinions(opinions);
    
    // Convert to reputation score
    const reputationScore = this.opinionToReputation(fusedOpinion);
    
    // Compute confidence based on uncertainty and evidence count
    const confidence = this.computeConfidence(fusedOpinion, validAttestations.length);

    return {
      user_address: userAddress,
      score: reputationScore,
      opinion: fusedOpinion,
      confidence,
      computation_metadata: {
        algorithm_version: 'EBSL-Classical-v1.0',
        opinion_count: validAttestations.length,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Handle fusion when both opinions have zero uncertainty
   */
  private handleCertainOpinionsFusion(op1: SubjectiveOpinion, op2: SubjectiveOpinion): SubjectiveOpinion {
    // Use weighted average when denominator approaches zero
    const weight1 = (1 - op1.uncertainty) / (2 - op1.uncertainty - op2.uncertainty);
    const weight2 = 1 - weight1;
    
    return {
      belief: weight1 * op1.belief + weight2 * op2.belief,
      disbelief: weight1 * op1.disbelief + weight2 * op2.disbelief,
      uncertainty: Math.min(op1.uncertainty, op2.uncertainty),
      base_rate: weight1 * op1.base_rate + weight2 * op2.base_rate
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
}

// Export singleton instance for convenience
export const ebslEngine = new EBSLEngine();