/**
 * Proof generation pipeline exports
 */

// Error handling
export {
  ProofErrorType,
  ProofErrorSeverity,
  ProofErrorRecoverability,
  ProofGenerationError,
  RetryStrategy,
  CircuitFallbackStrategy,
  ResourceOptimizationStrategy,
  ErrorClassifier,
  type ProofErrorMetadata,
  type RecoveryStrategy,
} from "./errors";

// Metrics
export {
  MetricsCollector,
  metricsCollector,
  type ProofMetrics,
  type MetricsSnapshot,
  type PerformancePrediction,
} from "./metrics";

// Queue
export {
  ProofQueue,
  ProofPriority,
  ProofStatus,
  proofQueue,
  type ProofRequest,
  type ProofResult,
  type QueueStats,
} from "./queue";

// Validation
export {
  ProofValidator,
  AccessControl,
  AuditLogger,
  proofValidator,
  accessControl,
  auditLogger,
  type ValidationResult,
  type AuditLogEntry,
} from "./validation";

// Pipeline
export {
  ProofPipeline,
  proofPipeline,
  type ProofGenerationOptions,
  type ProofGenerationProgress,
  type ProgressCallback,
} from "./pipeline";

// API
export {
  ProofAPI,
  ProofCache,
  ProofWebSocket,
  proofAPI,
  type CachedProof,
  type WebSocketMessage,
} from "./api";
