/**
 * Proof generation queue management with priority support
 */
import { writable } from "svelte/store";
export var ProofPriority;
(function (ProofPriority) {
  ProofPriority[(ProofPriority["LOW"] = 0)] = "LOW";
  ProofPriority[(ProofPriority["NORMAL"] = 1)] = "NORMAL";
  ProofPriority[(ProofPriority["HIGH"] = 2)] = "HIGH";
  ProofPriority[(ProofPriority["CRITICAL"] = 3)] = "CRITICAL";
})(ProofPriority || (ProofPriority = {}));
export var ProofStatus;
(function (ProofStatus) {
  ProofStatus["QUEUED"] = "QUEUED";
  ProofStatus["PROCESSING"] = "PROCESSING";
  ProofStatus["COMPLETED"] = "COMPLETED";
  ProofStatus["FAILED"] = "FAILED";
  ProofStatus["CANCELLED"] = "CANCELLED";
})(ProofStatus || (ProofStatus = {}));
/**
 * Priority queue for proof generation requests
 */
export class ProofQueue {
  queue = [];
  processing = new Map();
  completed = [];
  maxQueueSize = 100;
  maxConcurrent = 4;
  maxCompletedHistory = 50;
  queueStore;
  processingStore;
  completedStore;
  constructor() {
    this.queueStore = writable([]);
    this.processingStore = writable([]);
    this.completedStore = writable([]);
  }
  /**
   * Add a proof request to the queue
   */
  enqueue(attestations, proofType, priority = ProofPriority.NORMAL, threshold, circuitType) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Proof queue is full");
    }
    const request = {
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
  dequeue() {
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
  updateProgress(requestId, progress, estimatedDurationMs) {
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
  complete(requestId, result) {
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
  fail(requestId, error) {
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
  cancel(requestId) {
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
  getRequest(requestId) {
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
  getStats() {
    const completedSuccessful = this.completed.filter((r) => r.status === ProofStatus.COMPLETED);
    const failed = this.completed.filter((r) => r.status === ProofStatus.FAILED);
    const waitTimes = this.completed
      .filter((r) => r.startedAt)
      .map((r) => r.startedAt - r.createdAt);
    const avgWaitTime =
      waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
    const processingTimes = completedSuccessful
      .filter((r) => r.completedAt && r.startedAt)
      .map((r) => r.completedAt - r.startedAt);
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
  getQueueLength() {
    return this.queue.length;
  }
  /**
   * Get number of active processing requests
   */
  getActiveCount() {
    return this.processing.size;
  }
  /**
   * Check if queue is at capacity
   */
  isAtCapacity() {
    return this.queue.length >= this.maxQueueSize;
  }
  /**
   * Clear all completed requests
   */
  clearCompleted() {
    this.completed = [];
    this.updateCompletedStore();
  }
  /**
   * Insert request into queue based on priority
   */
  insertByPriority(request) {
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
  addToCompleted(request) {
    this.completed.push(request);
    if (this.completed.length > this.maxCompletedHistory) {
      this.completed = this.completed.slice(-this.maxCompletedHistory);
    }
  }
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `proof-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  /**
   * Update all stores
   */
  updateStores() {
    this.updateQueueStore();
    this.updateProcessingStore();
    this.updateCompletedStore();
  }
  /**
   * Update queue store
   */
  updateQueueStore() {
    this.queueStore.set([...this.queue]);
  }
  /**
   * Update processing store
   */
  updateProcessingStore() {
    this.processingStore.set(Array.from(this.processing.values()));
  }
  /**
   * Update completed store
   */
  updateCompletedStore() {
    this.completedStore.set([...this.completed]);
  }
}
/**
 * Singleton proof queue instance
 */
export const proofQueue = new ProofQueue();
//# sourceMappingURL=queue.js.map
