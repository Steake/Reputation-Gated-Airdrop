/**
 * End-to-end proof generation pipeline with reliability and error recovery
 */
import { ProofGenerationError, ProofErrorType, ProofErrorSeverity, ProofErrorRecoverability, RetryStrategy, CircuitFallbackStrategy, ResourceOptimizationStrategy, ErrorClassifier, } from "./errors";
import { metricsCollector } from "./metrics";
import { proofQueue, ProofPriority, ProofStatus } from "./queue";
import { proofValidator, accessControl, auditLogger } from "./validation";
import { captureException } from "@sentry/sveltekit";
/**
 * Main proof generation pipeline
 */
export class ProofPipeline {
    retryStrategy;
    fallbackStrategy;
    resourceStrategy;
    activeWorkers = new Map();
    maxWorkers = 4;
    constructor() {
        this.retryStrategy = new RetryStrategy(3, 1000, 30000);
        // Configure fallback circuits (can be customized)
        const fallbackCircuits = new Map([
            ["large", "medium"],
            ["medium", "small"],
        ]);
        this.fallbackStrategy = new CircuitFallbackStrategy(fallbackCircuits);
        this.resourceStrategy = new ResourceOptimizationStrategy();
    }
    /**
     * Generate proof with full pipeline features
     */
    async generateProof(attestations, proofType, options = {}, onProgress) {
        const { priority = ProofPriority.NORMAL, circuitType = "default", maxRetries = 3, timeoutMs = 120000, // 2 minutes default
        enableFallback = true, userId, } = options;
        // Access control check
        if (userId && !accessControl.hasAccess(userId)) {
            throw new ProofGenerationError("Access denied", ProofErrorType.API_ERROR, ProofErrorSeverity.HIGH, ProofErrorRecoverability.FATAL);
        }
        // Rate limit check
        if (userId && !accessControl.checkRateLimit(userId)) {
            throw new ProofGenerationError("Rate limit exceeded", ProofErrorType.API_ERROR, ProofErrorSeverity.MEDIUM, ProofErrorRecoverability.FATAL);
        }
        // Enqueue request
        const requestId = proofQueue.enqueue(attestations, proofType, priority, options.circuitType);
        // Log the request
        auditLogger.log("PROOF_REQUESTED", requestId, true, { proofType, priority }, userId);
        // Start metrics tracking
        metricsCollector.startProof(requestId, circuitType, attestations.length);
        try {
            // Notify progress
            if (onProgress) {
                onProgress({
                    requestId,
                    status: ProofStatus.QUEUED,
                    progress: 0,
                    stage: "Queued",
                });
            }
            // Wait for queue processing (with timeout)
            const result = await this.processWithRetry(requestId, attestations, proofType, circuitType, maxRetries, timeoutMs, enableFallback, onProgress);
            // Validate proof
            const validation = proofValidator.validateProof(result);
            if (!validation.valid) {
                throw new ProofGenerationError(`Proof validation failed: ${validation.errors.join(", ")}`, ProofErrorType.PROOF_VALIDATION_FAILED, ProofErrorSeverity.HIGH, ProofErrorRecoverability.RETRYABLE);
            }
            // Check for tampering
            if (proofValidator.detectTampering(result.hash, result.proof, result.fusedOpinion)) {
                throw new ProofGenerationError("Proof tampering detected", ProofErrorType.PROOF_VALIDATION_FAILED, ProofErrorSeverity.CRITICAL, ProofErrorRecoverability.FATAL);
            }
            // Complete successfully
            proofQueue.complete(requestId, result);
            metricsCollector.completeProof(requestId, true);
            auditLogger.log("PROOF_COMPLETED", requestId, true, { proofType }, userId);
            if (onProgress) {
                onProgress({
                    requestId,
                    status: ProofStatus.COMPLETED,
                    progress: 100,
                    stage: "Completed",
                });
            }
            return result;
        }
        catch (error) {
            const proofError = ErrorClassifier.classify(error, {
                circuitType,
                attemptNumber: 0,
            });
            proofQueue.fail(requestId, proofError.message);
            metricsCollector.completeProof(requestId, false, proofError.message);
            auditLogger.log("PROOF_FAILED", requestId, false, { proofType, error: proofError.message }, userId, proofError.message);
            // Capture to Sentry
            captureException(proofError);
            if (onProgress) {
                onProgress({
                    requestId,
                    status: ProofStatus.FAILED,
                    progress: 0,
                    stage: "Failed",
                    error: proofError.message,
                });
            }
            throw proofError;
        }
    }
    /**
     * Process proof generation with retry logic
     */
    async processWithRetry(requestId, attestations, proofType, circuitType, maxRetries, timeoutMs, enableFallback, onProgress) {
        let attemptNumber = 0;
        let currentCircuitType = circuitType;
        let lastError = null;
        while (attemptNumber < maxRetries) {
            try {
                // Update progress
                if (onProgress) {
                    const prediction = metricsCollector.predictDuration(currentCircuitType, attestations.length);
                    onProgress({
                        requestId,
                        status: ProofStatus.PROCESSING,
                        progress: 10 + (attemptNumber / maxRetries) * 20,
                        stage: `Generating proof (attempt ${attemptNumber + 1}/${maxRetries})`,
                        estimatedRemainingMs: prediction.estimatedDurationMs,
                    });
                }
                // Record stage start
                const stageStart = Date.now();
                // Generate proof
                const result = await this.executeProofGeneration(requestId, attestations, proofType, currentCircuitType, timeoutMs, onProgress);
                // Record stage completion
                metricsCollector.recordStage(requestId, "proofGeneration", Date.now() - stageStart);
                return result;
            }
            catch (error) {
                const proofError = ErrorClassifier.classify(error, {
                    circuitType: currentCircuitType,
                    attemptNumber,
                });
                lastError = proofError;
                attemptNumber++;
                // Try recovery strategies
                let recovered = false;
                // Try retry strategy
                if (this.retryStrategy.canRecover(proofError) && attemptNumber < maxRetries) {
                    await this.retryStrategy.recover(proofError, { requestId });
                    recovered = true;
                }
                // Try fallback to different circuit
                if (!recovered && enableFallback && this.fallbackStrategy.canRecover(proofError)) {
                    const fallbackCircuit = this.fallbackStrategy.getFallbackCircuit(currentCircuitType);
                    if (fallbackCircuit) {
                        currentCircuitType = fallbackCircuit;
                        recovered = true;
                        auditLogger.log("FALLBACK_CIRCUIT", requestId, true, {
                            from: circuitType,
                            to: fallbackCircuit,
                        });
                    }
                }
                // Try resource optimization
                if (!recovered && this.resourceStrategy.canRecover(proofError)) {
                    await this.resourceStrategy.recover(proofError, { requestId });
                    recovered = true;
                }
                if (!recovered || attemptNumber >= maxRetries) {
                    throw proofError;
                }
            }
        }
        throw (lastError ||
            new ProofGenerationError("Max retries exceeded", ProofErrorType.PROOF_GENERATION_FAILED, ProofErrorSeverity.HIGH, ProofErrorRecoverability.FATAL));
    }
    /**
     * Execute actual proof generation using worker
     */
    async executeProofGeneration(requestId, attestations, proofType, circuitType, timeoutMs, onProgress) {
        return new Promise((resolve, reject) => {
            // Create worker
            const worker = new Worker(new URL("$lib/workers/proofWorker.ts", import.meta.url), {
                type: "module",
            });
            this.activeWorkers.set(requestId, worker);
            // Set up timeout
            const timeout = setTimeout(() => {
                worker.terminate();
                this.activeWorkers.delete(requestId);
                reject(new ProofGenerationError(`Proof generation timed out after ${timeoutMs}ms`, ProofErrorType.PROOF_GENERATION_TIMEOUT, ProofErrorSeverity.MEDIUM, ProofErrorRecoverability.RETRYABLE));
            }, timeoutMs);
            // Handle messages from worker
            worker.onmessage = (e) => {
                const { type, result, error } = e.data;
                if (type === "PROOF_GENERATED") {
                    clearTimeout(timeout);
                    worker.terminate();
                    this.activeWorkers.delete(requestId);
                    // Update progress
                    if (onProgress) {
                        onProgress({
                            requestId,
                            status: ProofStatus.PROCESSING,
                            progress: 90,
                            stage: "Validating proof",
                        });
                    }
                    resolve(result);
                }
                else if (type === "PROOF_ERROR") {
                    clearTimeout(timeout);
                    worker.terminate();
                    this.activeWorkers.delete(requestId);
                    reject(new ProofGenerationError(error, ProofErrorType.PROOF_GENERATION_FAILED, ProofErrorSeverity.HIGH, ProofErrorRecoverability.RETRYABLE, { circuitType }));
                }
            };
            // Handle worker errors
            worker.onerror = (error) => {
                clearTimeout(timeout);
                worker.terminate();
                this.activeWorkers.delete(requestId);
                reject(new ProofGenerationError(`Worker error: ${error.message}`, ProofErrorType.INTERNAL_ERROR, ProofErrorSeverity.HIGH, ProofErrorRecoverability.RETRYABLE));
            };
            // Send generation request
            worker.postMessage({
                type: "GENERATE_PROOF",
                data: {
                    attestations,
                    proofType,
                    threshold: undefined,
                },
            });
            // Update progress
            if (onProgress) {
                onProgress({
                    requestId,
                    status: ProofStatus.PROCESSING,
                    progress: 30,
                    stage: "Generating proof",
                });
            }
        });
    }
    /**
     * Cancel proof generation
     */
    cancelProof(requestId) {
        // Try to cancel queued request
        if (proofQueue.cancel(requestId)) {
            auditLogger.log("PROOF_CANCELLED", requestId, true, {});
            return true;
        }
        // Terminate active worker
        const worker = this.activeWorkers.get(requestId);
        if (worker) {
            worker.terminate();
            this.activeWorkers.delete(requestId);
            proofQueue.fail(requestId, "Cancelled by user");
            auditLogger.log("PROOF_CANCELLED", requestId, true, {});
            return true;
        }
        return false;
    }
    /**
     * Get queue statistics
     */
    getQueueStats() {
        return proofQueue.getStats();
    }
    /**
     * Get metrics snapshot
     */
    getMetricsSnapshot() {
        return metricsCollector.getSnapshot();
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        // Terminate all active workers
        this.activeWorkers.forEach((worker) => worker.terminate());
        this.activeWorkers.clear();
    }
}
/**
 * Singleton pipeline instance
 */
export const proofPipeline = new ProofPipeline();
//# sourceMappingURL=pipeline.js.map