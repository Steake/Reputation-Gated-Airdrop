/**
 * End-to-end proof generation pipeline with reliability and error recovery
 */
import type { TrustAttestation } from "$lib/ebsl/core";
import { ProofPriority, ProofStatus, type ProofResult } from "./queue";
export interface ProofGenerationOptions {
    priority?: ProofPriority;
    circuitType?: string;
    maxRetries?: number;
    timeoutMs?: number;
    enableFallback?: boolean;
    userId?: string;
}
export interface ProofGenerationProgress {
    requestId: string;
    status: ProofStatus;
    progress: number;
    stage: string;
    estimatedRemainingMs?: number;
    error?: string;
}
export type ProgressCallback = (progress: ProofGenerationProgress) => void;
/**
 * Main proof generation pipeline
 */
export declare class ProofPipeline {
    private retryStrategy;
    private fallbackStrategy;
    private resourceStrategy;
    private activeWorkers;
    private maxWorkers;
    constructor();
    /**
     * Generate proof with full pipeline features
     */
    generateProof(attestations: TrustAttestation[], proofType: "exact" | "threshold", options?: ProofGenerationOptions, onProgress?: ProgressCallback): Promise<ProofResult>;
    /**
     * Process proof generation with retry logic
     */
    private processWithRetry;
    /**
     * Execute actual proof generation using worker
     */
    private executeProofGeneration;
    /**
     * Cancel proof generation
     */
    cancelProof(requestId: string): boolean;
    /**
     * Get queue statistics
     */
    getQueueStats(): import("./queue").QueueStats;
    /**
     * Get metrics snapshot
     */
    getMetricsSnapshot(): import("./metrics").MetricsSnapshot;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
/**
 * Singleton pipeline instance
 */
export declare const proofPipeline: ProofPipeline;
//# sourceMappingURL=pipeline.d.ts.map