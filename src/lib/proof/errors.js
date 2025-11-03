/**
 * Comprehensive error handling and classification for proof generation pipeline
 */
export var ProofErrorType;
(function (ProofErrorType) {
  // Circuit errors
  ProofErrorType["CIRCUIT_COMPILATION_FAILED"] = "CIRCUIT_COMPILATION_FAILED";
  ProofErrorType["CIRCUIT_LOAD_FAILED"] = "CIRCUIT_LOAD_FAILED";
  ProofErrorType["CIRCUIT_NOT_FOUND"] = "CIRCUIT_NOT_FOUND";
  ProofErrorType["INVALID_CIRCUIT_PARAMETERS"] = "INVALID_CIRCUIT_PARAMETERS";
  // Witness errors
  ProofErrorType["WITNESS_PREPARATION_FAILED"] = "WITNESS_PREPARATION_FAILED";
  ProofErrorType["INVALID_WITNESS_DATA"] = "INVALID_WITNESS_DATA";
  // Proof generation errors
  ProofErrorType["PROOF_GENERATION_FAILED"] = "PROOF_GENERATION_FAILED";
  ProofErrorType["PROOF_GENERATION_TIMEOUT"] = "PROOF_GENERATION_TIMEOUT";
  ProofErrorType["PROOF_VALIDATION_FAILED"] = "PROOF_VALIDATION_FAILED";
  // Resource errors
  ProofErrorType["OUT_OF_MEMORY"] = "OUT_OF_MEMORY";
  ProofErrorType["RESOURCE_EXHAUSTED"] = "RESOURCE_EXHAUSTED";
  ProofErrorType["WORKER_UNAVAILABLE"] = "WORKER_UNAVAILABLE";
  // Network errors
  ProofErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
  ProofErrorType["API_ERROR"] = "API_ERROR";
  // System errors
  ProofErrorType["SYSTEM_OVERLOAD"] = "SYSTEM_OVERLOAD";
  ProofErrorType["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ProofErrorType || (ProofErrorType = {}));
export var ProofErrorSeverity;
(function (ProofErrorSeverity) {
  ProofErrorSeverity["LOW"] = "LOW";
  ProofErrorSeverity["MEDIUM"] = "MEDIUM";
  ProofErrorSeverity["HIGH"] = "HIGH";
  ProofErrorSeverity["CRITICAL"] = "CRITICAL";
})(ProofErrorSeverity || (ProofErrorSeverity = {}));
export var ProofErrorRecoverability;
(function (ProofErrorRecoverability) {
  ProofErrorRecoverability["RETRYABLE"] = "RETRYABLE";
  ProofErrorRecoverability["FALLBACK_AVAILABLE"] = "FALLBACK_AVAILABLE";
  ProofErrorRecoverability["FATAL"] = "FATAL";
})(ProofErrorRecoverability || (ProofErrorRecoverability = {}));
export class ProofGenerationError extends Error {
  type;
  severity;
  recoverability;
  metadata;
  originalError;
  constructor(
    message,
    type,
    severity = ProofErrorSeverity.MEDIUM,
    recoverability = ProofErrorRecoverability.RETRYABLE,
    metadata = {},
    originalError
  ) {
    super(message);
    this.name = "ProofGenerationError";
    this.type = type;
    this.severity = severity;
    this.recoverability = recoverability;
    this.metadata = {
      timestamp: Date.now(),
      ...metadata,
    };
    this.originalError = originalError;
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProofGenerationError);
    }
  }
  /**
   * Check if error is retryable
   */
  isRetryable() {
    return this.recoverability === ProofErrorRecoverability.RETRYABLE;
  }
  /**
   * Check if fallback mechanism available
   */
  hasFallback() {
    return this.recoverability === ProofErrorRecoverability.FALLBACK_AVAILABLE;
  }
  /**
   * Check if error is fatal
   */
  isFatal() {
    return this.recoverability === ProofErrorRecoverability.FATAL;
  }
  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      recoverability: this.recoverability,
      metadata: this.metadata,
      stack: this.stack,
      originalError: this.originalError
        ? {
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}
/**
 * Automatic retry strategy with exponential backoff
 */
export class RetryStrategy {
  maxRetries;
  baseDelayMs;
  maxDelayMs;
  constructor(maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000) {
    this.maxRetries = maxRetries;
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }
  canRecover(error) {
    return error.isRetryable() && (error.metadata.attemptNumber || 0) < this.maxRetries;
  }
  async recover(error, _context) {
    const attemptNumber = error.metadata.attemptNumber || 0;
    const delay = Math.min(this.baseDelayMs * Math.pow(2, attemptNumber), this.maxDelayMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  getNextAttemptNumber(error) {
    return (error.metadata.attemptNumber || 0) + 1;
  }
}
/**
 * Fallback to alternative circuit strategy
 */
export class CircuitFallbackStrategy {
  fallbackCircuits;
  constructor(fallbackCircuits) {
    this.fallbackCircuits = fallbackCircuits;
  }
  canRecover(error) {
    return (
      error.hasFallback() &&
      error.metadata.circuitType !== undefined &&
      this.fallbackCircuits.has(error.metadata.circuitType)
    );
  }
  async recover(error, _context) {
    // Fallback circuit will be selected by the caller based on strategy
    return Promise.resolve();
  }
  getFallbackCircuit(circuitType) {
    return this.fallbackCircuits.get(circuitType);
  }
}
/**
 * Resource optimization strategy for memory errors
 */
export class ResourceOptimizationStrategy {
  canRecover(error) {
    return (
      error.type === ProofErrorType.OUT_OF_MEMORY ||
      error.type === ProofErrorType.RESOURCE_EXHAUSTED
    );
  }
  async recover(_error, _context) {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    // Wait for resources to be freed
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
/**
 * Error classifier to automatically categorize errors
 */
export class ErrorClassifier {
  /**
   * Classify error and create appropriate ProofGenerationError
   */
  static classify(error, context) {
    if (error instanceof ProofGenerationError) {
      return error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    const originalError = error instanceof Error ? error : undefined;
    // Circuit-related errors
    if (
      errorMessage.includes("circuit") &&
      (errorMessage.includes("compile") || errorMessage.includes("compilation"))
    ) {
      return new ProofGenerationError(
        errorMessage,
        ProofErrorType.CIRCUIT_COMPILATION_FAILED,
        ProofErrorSeverity.HIGH,
        ProofErrorRecoverability.FALLBACK_AVAILABLE,
        context,
        originalError
      );
    }
    if (errorMessage.includes("circuit") && errorMessage.includes("load")) {
      return new ProofGenerationError(
        errorMessage,
        ProofErrorType.CIRCUIT_LOAD_FAILED,
        ProofErrorSeverity.MEDIUM,
        ProofErrorRecoverability.RETRYABLE,
        context,
        originalError
      );
    }
    // Memory errors
    if (errorMessage.includes("memory") || errorMessage.includes("heap")) {
      return new ProofGenerationError(
        errorMessage,
        ProofErrorType.OUT_OF_MEMORY,
        ProofErrorSeverity.CRITICAL,
        ProofErrorRecoverability.FALLBACK_AVAILABLE,
        context,
        originalError
      );
    }
    // Timeout errors
    if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      return new ProofGenerationError(
        errorMessage,
        ProofErrorType.PROOF_GENERATION_TIMEOUT,
        ProofErrorSeverity.MEDIUM,
        ProofErrorRecoverability.RETRYABLE,
        context,
        originalError
      );
    }
    // Network errors
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return new ProofGenerationError(
        errorMessage,
        ProofErrorType.NETWORK_ERROR,
        ProofErrorSeverity.LOW,
        ProofErrorRecoverability.RETRYABLE,
        context,
        originalError
      );
    }
    // Witness errors
    if (errorMessage.includes("witness")) {
      return new ProofGenerationError(
        errorMessage,
        ProofErrorType.WITNESS_PREPARATION_FAILED,
        ProofErrorSeverity.MEDIUM,
        ProofErrorRecoverability.RETRYABLE,
        context,
        originalError
      );
    }
    // Default to internal error
    return new ProofGenerationError(
      errorMessage,
      ProofErrorType.INTERNAL_ERROR,
      ProofErrorSeverity.HIGH,
      ProofErrorRecoverability.RETRYABLE,
      context,
      originalError
    );
  }
}
//# sourceMappingURL=errors.js.map
