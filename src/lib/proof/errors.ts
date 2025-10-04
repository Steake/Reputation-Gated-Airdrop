/**
 * Comprehensive error handling and classification for proof generation pipeline
 */

export enum ProofErrorType {
  // Circuit errors
  CIRCUIT_COMPILATION_FAILED = "CIRCUIT_COMPILATION_FAILED",
  CIRCUIT_LOAD_FAILED = "CIRCUIT_LOAD_FAILED",
  CIRCUIT_NOT_FOUND = "CIRCUIT_NOT_FOUND",
  INVALID_CIRCUIT_PARAMETERS = "INVALID_CIRCUIT_PARAMETERS",

  // Witness errors
  WITNESS_PREPARATION_FAILED = "WITNESS_PREPARATION_FAILED",
  INVALID_WITNESS_DATA = "INVALID_WITNESS_DATA",

  // Proof generation errors
  PROOF_GENERATION_FAILED = "PROOF_GENERATION_FAILED",
  PROOF_GENERATION_TIMEOUT = "PROOF_GENERATION_TIMEOUT",
  PROOF_VALIDATION_FAILED = "PROOF_VALIDATION_FAILED",

  // Resource errors
  OUT_OF_MEMORY = "OUT_OF_MEMORY",
  RESOURCE_EXHAUSTED = "RESOURCE_EXHAUSTED",
  WORKER_UNAVAILABLE = "WORKER_UNAVAILABLE",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  API_ERROR = "API_ERROR",

  // System errors
  SYSTEM_OVERLOAD = "SYSTEM_OVERLOAD",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export enum ProofErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum ProofErrorRecoverability {
  RETRYABLE = "RETRYABLE",
  FALLBACK_AVAILABLE = "FALLBACK_AVAILABLE",
  FATAL = "FATAL",
}

export interface ProofErrorMetadata {
  timestamp: number;
  attemptNumber?: number;
  circuitType?: string;
  resourceUsage?: {
    memoryMB?: number;
    cpuPercent?: number;
    durationMs?: number;
  };
  context?: Record<string, unknown>;
}

export class ProofGenerationError extends Error {
  public readonly type: ProofErrorType;
  public readonly severity: ProofErrorSeverity;
  public readonly recoverability: ProofErrorRecoverability;
  public readonly metadata: ProofErrorMetadata;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ProofErrorType,
    severity: ProofErrorSeverity = ProofErrorSeverity.MEDIUM,
    recoverability: ProofErrorRecoverability = ProofErrorRecoverability.RETRYABLE,
    metadata: Partial<ProofErrorMetadata> = {},
    originalError?: Error
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
  isRetryable(): boolean {
    return this.recoverability === ProofErrorRecoverability.RETRYABLE;
  }

  /**
   * Check if fallback mechanism available
   */
  hasFallback(): boolean {
    return this.recoverability === ProofErrorRecoverability.FALLBACK_AVAILABLE;
  }

  /**
   * Check if error is fatal
   */
  isFatal(): boolean {
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
 * Error recovery strategies
 */
export interface RecoveryStrategy {
  canRecover(error: ProofGenerationError): boolean;
  recover(error: ProofGenerationError, context: unknown): Promise<void>;
}

/**
 * Automatic retry strategy with exponential backoff
 */
export class RetryStrategy implements RecoveryStrategy {
  constructor(
    private maxRetries: number = 3,
    private baseDelayMs: number = 1000,
    private maxDelayMs: number = 30000
  ) {}

  canRecover(error: ProofGenerationError): boolean {
    return error.isRetryable() && (error.metadata.attemptNumber || 0) < this.maxRetries;
  }

  async recover(error: ProofGenerationError, _context: unknown): Promise<void> {
    const attemptNumber = error.metadata.attemptNumber || 0;
    const delay = Math.min(this.baseDelayMs * Math.pow(2, attemptNumber), this.maxDelayMs);

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  getNextAttemptNumber(error: ProofGenerationError): number {
    return (error.metadata.attemptNumber || 0) + 1;
  }
}

/**
 * Fallback to alternative circuit strategy
 */
export class CircuitFallbackStrategy implements RecoveryStrategy {
  constructor(private fallbackCircuits: Map<string, string>) {}

  canRecover(error: ProofGenerationError): boolean {
    return (
      error.hasFallback() &&
      error.metadata.circuitType !== undefined &&
      this.fallbackCircuits.has(error.metadata.circuitType)
    );
  }

  async recover(error: ProofGenerationError, _context: unknown): Promise<void> {
    // Fallback circuit will be selected by the caller based on strategy
    return Promise.resolve();
  }

  getFallbackCircuit(circuitType: string): string | undefined {
    return this.fallbackCircuits.get(circuitType);
  }
}

/**
 * Resource optimization strategy for memory errors
 */
export class ResourceOptimizationStrategy implements RecoveryStrategy {
  canRecover(error: ProofGenerationError): boolean {
    return (
      error.type === ProofErrorType.OUT_OF_MEMORY ||
      error.type === ProofErrorType.RESOURCE_EXHAUSTED
    );
  }

  async recover(_error: ProofGenerationError, _context: unknown): Promise<void> {
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
  static classify(error: unknown, context?: Partial<ProofErrorMetadata>): ProofGenerationError {
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
