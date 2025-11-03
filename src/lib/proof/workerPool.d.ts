/**
 * Worker pool manager for horizontal scaling of proof generation
 * Supports distributed workers, load balancing, and auto-scaling
 */
import { EventEmitter } from "events";
import type { TrustAttestation } from "./ebsl/core";
import type { ProofResult } from "./proof/queue";
export interface WorkerNode {
    id: string;
    url: string;
    status: "idle" | "busy" | "offline";
    activeJobs: number;
    maxConcurrency: number;
    totalProcessed: number;
    totalFailed: number;
    avgDurationMs: number;
    lastHeartbeat: number;
}
export interface WorkerTask {
    id: string;
    attestations: TrustAttestation[];
    proofType: "exact" | "threshold";
    priority: number;
    assignedTo?: string;
    startTime?: number;
    retries: number;
}
/**
 * Worker pool manager with load balancing and auto-scaling
 */
export declare class WorkerPoolManager extends EventEmitter {
    private workers;
    private tasks;
    private pendingTasks;
    private minWorkers;
    private maxWorkers;
    private scaleUpThreshold;
    private scaleDownThreshold;
    private heartbeatInterval;
    private heartbeatTimer;
    constructor();
    /**
     * Register a worker node
     */
    registerWorker(id: string, url: string, maxConcurrency?: number): void;
    /**
     * Unregister a worker node
     */
    unregisterWorker(id: string): void;
    /**
     * Submit a task to the worker pool
     */
    submitTask(attestations: TrustAttestation[], proofType: "exact" | "threshold", priority?: number): Promise<ProofResult>;
    /**
     * Assign pending tasks to available workers
     */
    private assignTasks;
    /**
     * Select best worker using load balancing
     */
    private selectWorker;
    /**
     * Assign task to specific worker
     */
    private assignTaskToWorker;
    /**
     * Execute task on worker (simulated)
     */
    private executeTaskOnWorker;
    /**
     * Reassign tasks from a failed worker
     */
    private reassignWorkerTasks;
    /**
     * Sort pending tasks by priority
     */
    private sortPendingTasks;
    /**
     * Check if we need to scale up or down
     */
    private checkScaling;
    /**
     * Start heartbeat monitor
     */
    private startHeartbeatMonitor;
    /**
     * Update worker heartbeat
     */
    updateWorkerHeartbeat(id: string): void;
    /**
     * Get worker pool statistics
     */
    getStats(): {
        totalWorkers: number;
        activeWorkers: number;
        idleWorkers: number;
        busyWorkers: number;
        offlineWorkers: number;
        pendingTasks: number;
        activeTasks: number;
        totalProcessed: number;
        totalFailed: number;
        avgDurationMs: number;
    };
    /**
     * Generate unique task ID
     */
    private generateTaskId;
    /**
     * Cleanup
     */
    destroy(): void;
}
/**
 * Singleton instance
 */
export declare const workerPool: WorkerPoolManager;
//# sourceMappingURL=workerPool.d.ts.map