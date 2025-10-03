/**
 * Proof generation queue management with priority support
 */

import { writable, type Writable } from "svelte/store";
import type { TrustAttestation } from "$lib/ebsl/core";

export enum ProofPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum ProofStatus {
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
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
  progress: number; // 0-100
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
export class ProofQueue {
  private queue: ProofRequest[] = [];
  private processing = new Map<string, ProofRequest>();
  private completed: ProofRequest[] = [];
  private maxQueueSize = 100;
  private maxConcurrent = 4;
  private maxCompletedHistory = 50;

  public queueStore: Writable<ProofRequest[]>;
  public processingStore: Writable<ProofRequest[]>;
  public completedStore: Writable<ProofRequest[]>;

  constructor() {
    this.queueStore = writable([]);
    this.processingStore = writable([]);
    this.completedStore = writable([]);
  }

  /**
   * Add a proof request to the queue
   */
  enqueue(
    attestations: TrustAttestation[],
    proofType: "exact" | "threshold",
    priority: ProofPriority = ProofPriority.NORMAL,
    threshold?: number,
    circuitType?: string
  ): string {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Proof queue is full");
    }

    const request: ProofRequest = {
      id: this.generateRequestId(),
      priority,
      attestations,
      proofType,
      threshold,
      circuitType,
      createdAt: Date.now(),
      status: ProofStatus.QUEUED,
      progress: 0,
    };

    // Insert based on priority
    this.insertByPriority(request);
    this.updateQueueStore();

    return request.id;
  }

  /**
   * Get the next request to process
   */
  dequeue(): ProofRequest | undefined {
    if (this.processing.size >= this.maxConcurrent) {
      return undefined;
    }

    const request = this.queue.shift();
    if (request) {
      request.status = ProofStatus.PROCESSING;
      request.startedAt = Date.now();
      this.processing.set(request.id, request);
      this.updateStores();
    }

    return request;
  }

  /**
   * Update progress of a processing request
   */
  updateProgress(requestId: string, progress: number, estimatedDurationMs?: number): void {
    const request = this.processing.get(requestId);
    if (request) {
      request.progress = Math.min(100, Math.max(0, progress));
      if (estimatedDurationMs !== undefined) {
        request.estimatedDurationMs = estimatedDurationMs;
      }
      this.updateProcessingStore();
    }
  }

  /**
   * Mark request as completed
   */
  complete(requestId: string, result: ProofResult): void {
    const request = this.processing.get(requestId);
    if (request) {
      request.status = ProofStatus.COMPLETED;
      request.completedAt = Date.now();
      request.progress = 100;
      request.result = result;

      this.processing.delete(requestId);
      this.addToCompleted(request);
      this.updateStores();
    }
  }

  /**
   * Mark request as failed
   */
  fail(requestId: string, error: string): void {
    const request = this.processing.get(requestId);
    if (request) {
      request.status = ProofStatus.FAILED;
      request.completedAt = Date.now();
      request.error = error;

      this.processing.delete(requestId);
      this.addToCompleted(request);
      this.updateStores();
    }
  }

  /**
   * Cancel a queued request
   */
  cancel(requestId: string): boolean {
    const index = this.queue.findIndex((r) => r.id === requestId);
    if (index !== -1) {
      const request = this.queue[index];
      request.status = ProofStatus.CANCELLED;
      request.completedAt = Date.now();
      this.queue.splice(index, 1);
      this.addToCompleted(request);
      this.updateStores();
      return true;
    }
    return false;
  }

  /**
   * Get request by ID
   */
  getRequest(requestId: string): ProofRequest | undefined {
    // Check queue
    let request = this.queue.find((r) => r.id === requestId);
    if (request) return request;

    // Check processing
    request = this.processing.get(requestId);
    if (request) return request;

    // Check completed
    return this.completed.find((r) => r.id === requestId);
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const completedSuccessful = this.completed.filter((r) => r.status === ProofStatus.COMPLETED);
    const failed = this.completed.filter((r) => r.status === ProofStatus.FAILED);

    const waitTimes = this.completed
      .filter((r) => r.startedAt)
      .map((r) => r.startedAt! - r.createdAt);
    const avgWaitTime =
      waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;

    const processingTimes = completedSuccessful
      .filter((r) => r.completedAt && r.startedAt)
      .map((r) => r.completedAt! - r.startedAt!);
    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    return {
      totalQueued: this.queue.length,
      totalProcessing: this.processing.size,
      totalCompleted: completedSuccessful.length,
      totalFailed: failed.length,
      averageWaitTimeMs: avgWaitTime,
      averageProcessingTimeMs: avgProcessingTime,
    };
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get number of active processing requests
   */
  getActiveCount(): number {
    return this.processing.size;
  }

  /**
   * Check if queue is at capacity
   */
  isAtCapacity(): boolean {
    return this.queue.length >= this.maxQueueSize;
  }

  /**
   * Clear all completed requests
   */
  clearCompleted(): void {
    this.completed = [];
    this.updateCompletedStore();
  }

  /**
   * Insert request into queue based on priority
   */
  private insertByPriority(request: ProofRequest): void {
    let insertIndex = this.queue.length;

    for (let i = 0; i < this.queue.length; i++) {
      if (request.priority > this.queue[i].priority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, request);
  }

  /**
   * Add request to completed history with size limit
   */
  private addToCompleted(request: ProofRequest): void {
    this.completed.push(request);

    if (this.completed.length > this.maxCompletedHistory) {
      this.completed = this.completed.slice(-this.maxCompletedHistory);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `proof-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Update all stores
   */
  private updateStores(): void {
    this.updateQueueStore();
    this.updateProcessingStore();
    this.updateCompletedStore();
  }

  /**
   * Update queue store
   */
  private updateQueueStore(): void {
    this.queueStore.set([...this.queue]);
  }

  /**
   * Update processing store
   */
  private updateProcessingStore(): void {
    this.processingStore.set(Array.from(this.processing.values()));
  }

  /**
   * Update completed store
   */
  private updateCompletedStore(): void {
    this.completedStore.set([...this.completed]);
  }
}

/**
 * Singleton proof queue instance
 */
export const proofQueue = new ProofQueue();
