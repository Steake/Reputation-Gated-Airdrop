/**
 * Proof generation queue management with priority support
 */
import { type Writable } from "svelte/store";
import type { TrustAttestation } from "$lib/ebsl/core";
export declare enum ProofPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}
export declare enum ProofStatus {
    QUEUED = "QUEUED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export interface ProofRequest {
    id: string;
    priority: ProofPriority;
    attestations: TrustAttestation[];
    proofType: "exact" | "threshold";
    threshold?: number;
    circuitType?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    status: ProofStatus;
    progress: number;
    estimatedDurationMs?: number;
    result?: ProofResult;
    error?: string;
}
export interface ProofResult {
    proof: number[];
    publicInputs: number[];
    hash: string;
    fusedOpinion: {
        belief: number;
        disbelief: number;
        uncertainty: number;
        base_rate: number;
    };
}
export interface QueueStats {
    totalQueued: number;
    totalProcessing: number;
    totalCompleted: number;
    totalFailed: number;
    averageWaitTimeMs: number;
    averageProcessingTimeMs: number;
}
/**
 * Priority queue for proof generation requests
 */
export declare class ProofQueue {
    private queue;
    private processing;
    private completed;
    private maxQueueSize;
    private maxConcurrent;
    private maxCompletedHistory;
    queueStore: Writable<ProofRequest[]>;
    processingStore: Writable<ProofRequest[]>;
    completedStore: Writable<ProofRequest[]>;
    constructor();
    /**
     * Add a proof request to the queue
     */
    enqueue(attestations: TrustAttestation[], proofType: "exact" | "threshold", priority?: ProofPriority, threshold?: number, circuitType?: string): string;
    /**
     * Get the next request to process
     */
    dequeue(): ProofRequest | undefined;
    /**
     * Update progress of a processing request
     */
    updateProgress(requestId: string, progress: number, estimatedDurationMs?: number): void;
    /**
     * Mark request as completed
     */
    complete(requestId: string, result: ProofResult): void;
    /**
     * Mark request as failed
     */
    fail(requestId: string, error: string): void;
    /**
     * Cancel a queued request
     */
    cancel(requestId: string): boolean;
    /**
     * Get request by ID
     */
    getRequest(requestId: string): ProofRequest | undefined;
    /**
     * Get queue statistics
     */
    getStats(): QueueStats;
    /**
     * Get queue length
     */
    getQueueLength(): number;
    /**
     * Get number of active processing requests
     */
    getActiveCount(): number;
    /**
     * Check if queue is at capacity
     */
    isAtCapacity(): boolean;
    /**
     * Clear all completed requests
     */
    clearCompleted(): void;
    /**
     * Insert request into queue based on priority
     */
    private insertByPriority;
    /**
     * Add request to completed history with size limit
     */
    private addToCompleted;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
    /**
     * Update all stores
     */
    private updateStores;
    /**
     * Update queue store
     */
    private updateQueueStore;
    /**
     * Update processing store
     */
    private updateProcessingStore;
    /**
     * Update completed store
     */
    private updateCompletedStore;
}
/**
 * Singleton proof queue instance
 */
export declare const proofQueue: ProofQueue;
//# sourceMappingURL=queue.d.ts.map