/**
 * Core EBSL Algorithm Implementation
 *
 * This module implements the Evidence-Based Subjective Logic (EBSL) algorithm
 * for computing reputation scores from trust network data.
 *
 * Enhanced with weighted fusion, incremental updates, and circuit partitioning for scalability.
 */
export interface SubjectiveOpinion {
    belief: number;
    disbelief: number;
    uncertainty: number;
    base_rate: number;
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
        base_reputation?: SubjectiveOpinion;
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
export declare class EBSLEngine {
    private readonly EPSILON;
    private readonly PARTITION_THRESHOLD;
    private readonly MAX_PARTITION_SIZE;
    /**
     * Validate that an opinion satisfies subjective logic constraints
     */
    validateOpinion(opinion: SubjectiveOpinion): boolean;
    /**
     * Partition attestations into smaller groups for scalable computation
     * @param attestations Array of attestations
     * @param maxSize Maximum size per partition
     * @returns Array of partitioned attestations
     */
    private partitionAttestations;
    /**
     * Fuse two subjective opinions using weighted EBSL rules
     * @param op1 First opinion
     * @param op2 Second opinion
     * @param weight1 Weight for op1 (0-1)
     * @param weight2 Weight for op2 (0-1)
     */
    fuseOpinions(op1: SubjectiveOpinion, op2: SubjectiveOpinion, weight1?: number, weight2?: number): SubjectiveOpinion;
    /**
     * Fuse multiple opinions with weights iteratively
     * @param attestations Array of attestations with weights
     */
    fuseMultipleOpinions(attestations: TrustAttestation[]): SubjectiveOpinion;
    /**
     * Compute reputation using partitioned fusion for large networks
     * @param userAddress User address
     * @param attestations All attestations
     * @param usePartitioning Force partitioning (for testing)
     * @returns Reputation result with partitioning metadata
     */
    computeReputation(userAddress: string, attestations: TrustAttestation[], usePartitioning?: boolean): ReputationResult;
    /**
     * Incrementally update reputation with new attestations
     * @param baseReputation Previous reputation result
     * @param newAttestations New attestations to incorporate
     * @param baseWeight Weight of base reputation (decays over time)
     */
    incrementalUpdateReputation(baseReputation: ReputationResult, newAttestations: TrustAttestation[], baseWeight?: number): ReputationResult;
    /**
     * Convert fused opinion to reputation score using expected value
     */
    opinionToReputation(opinion: SubjectiveOpinion): number;
    /**
     * Handle fusion when both opinions have zero uncertainty (weighted average fallback)
     */
    private handleCertainOpinionsFusion;
    private clamp;
    private computeConfidence;
    /**
     * Fuse multiple subjective opinions iteratively (equal weights)
     * Used for fusing partition results
     * @param opinions Array of subjective opinions
     * @returns Fused opinion
     */
    fuseSubjectiveOpinions(opinions: SubjectiveOpinion[]): SubjectiveOpinion;
    /**
     * Compute set membership inputs for ZK proofs using hashed attestations
     * Placeholder for MiMC/Groth16 circuit via EZKL
     * @param attestations Array of attestations forming the trusted set
     * @param targetAttestation Specific attestation to prove membership for (optional)
     * @returns Object with set commitment and member hash for ZK public inputs
     */
    computeSetMembershipInputs(attestations: TrustAttestation[], targetAttestation?: TrustAttestation): {
        commitment: string;
        memberHash?: string;
    };
}
export declare const ebslEngine: EBSLEngine;
//# sourceMappingURL=core.d.ts.map