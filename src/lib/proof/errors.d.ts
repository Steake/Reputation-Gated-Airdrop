/**
 * Comprehensive error handling and classification for proof generation pipeline
 */
export declare enum ProofErrorType {
  CIRCUIT_COMPILATION_FAILED = "CIRCUIT_COMPILATION_FAILED",
  CIRCUIT_LOAD_FAILED = "CIRCUIT_LOAD_FAILED",
  CIRCUIT_NOT_FOUND = "CIRCUIT_NOT_FOUND",
  INVALID_CIRCUIT_PARAMETERS = "INVALID_CIRCUIT_PARAMETERS",
  WITNESS_PREPARATION_FAILED = "WITNESS_PREPARATION_FAILED",
  INVALID_WITNESS_DATA = "INVALID_WITNESS_DATA",
  PROOF_GENERATION_FAILED = "PROOF_GENERATION_FAILED",
  PROOF_GENERATION_TIMEOUT = "PROOF_GENERATION_TIMEOUT",
  PROOF_VALIDATION_FAILED = "PROOF_VALIDATION_FAILED",
  OUT_OF_MEMORY = "OUT_OF_MEMORY",
  RESOURCE_EXHAUSTED = "RESOURCE_EXHAUSTED",
  WORKER_UNAVAILABLE = "WORKER_UNAVAILABLE",
  NETWORK_ERROR = "NETWORK_ERROR",
  API_ERROR = "API_ERROR",
  SYSTEM_OVERLOAD = "SYSTEM_OVERLOAD",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
export declare enum ProofErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
export declare enum ProofErrorRecoverability {
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
export declare class ProofGenerationError extends Error {
  readonly type: ProofErrorType;
  readonly severity: ProofErrorSeverity;
  readonly recoverability: ProofErrorRecoverability;
  readonly metadata: ProofErrorMetadata;
  readonly originalError?: Error;
  constructor(
    message: string,
    type: ProofErrorType,
    severity?: ProofErrorSeverity,
    recoverability?: ProofErrorRecoverability,
    metadata?: Partial<ProofErrorMetadata>,
    originalError?: Error
  );
  /**
   * Check if error is retryable
   */
  isRetryable(): boolean;
  /**
   * Check if fallback mechanism available
   */
  hasFallback(): boolean;
  /**
   * Check if error is fatal
   */
  isFatal(): boolean;
  /**
   * Convert error to JSON for logging
   */
  toJSON(): {
    name: string;
    message: string;
    type: ProofErrorType;
    severity: ProofErrorSeverity;
    recoverability: ProofErrorRecoverability;
    metadata: ProofErrorMetadata;
    stack: string | undefined;
    originalError:
      | {
          message: string;
          stack: string | undefined;
        }
      | undefined;
  };
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
export declare class RetryStrategy implements RecoveryStrategy {
  private maxRetries;
  private baseDelayMs;
  private maxDelayMs;
  constructor(maxRetries?: number, baseDelayMs?: number, maxDelayMs?: number);
  canRecover(error: ProofGenerationError): boolean;
  recover(error: ProofGenerationError, _context: unknown): Promise<void>;
  getNextAttemptNumber(error: ProofGenerationError): number;
}
/**
 * Fallback to alternative circuit strategy
 */
export declare class CircuitFallbackStrategy implements RecoveryStrategy {
  private fallbackCircuits;
  constructor(fallbackCircuits: Map<string, string>);
  canRecover(error: ProofGenerationError): boolean;
  recover(error: ProofGenerationError, _context: unknown): Promise<void>;
  getFallbackCircuit(circuitType: string): string | undefined;
}
/**
 * Resource optimization strategy for memory errors
 */
export declare class ResourceOptimizationStrategy implements RecoveryStrategy {
  canRecover(error: ProofGenerationError): boolean;
  recover(_error: ProofGenerationError, _context: unknown): Promise<void>;
}
/**
 * Error classifier to automatically categorize errors
 */
export declare class ErrorClassifier {
  /**
   * Classify error and create appropriate ProofGenerationError
   */
  static classify(error: unknown, context?: Partial<ProofErrorMetadata>): ProofGenerationError;
}
//# sourceMappingURL=errors.d.ts.map
