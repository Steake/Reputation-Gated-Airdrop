import { describe, it, expect } from "vitest";
import {
  ProofErrorType,
  ProofErrorSeverity,
  ProofErrorRecoverability,
  ProofGenerationError,
  RetryStrategy,
  CircuitFallbackStrategy,
  ResourceOptimizationStrategy,
  ErrorClassifier,
} from "$lib/proof/errors";

describe("Proof Generation Errors", () => {
  describe("ProofGenerationError", () => {
    it("should create error with all properties", () => {
      const error = new ProofGenerationError(
        "Test error",
        ProofErrorType.CIRCUIT_COMPILATION_FAILED,
        ProofErrorSeverity.HIGH,
        ProofErrorRecoverability.RETRYABLE,
        { circuitType: "test-circuit" }
      );

      expect(error.message).toBe("Test error");
      expect(error.type).toBe(ProofErrorType.CIRCUIT_COMPILATION_FAILED);
      expect(error.severity).toBe(ProofErrorSeverity.HIGH);
      expect(error.recoverability).toBe(ProofErrorRecoverability.RETRYABLE);
      expect(error.metadata.circuitType).toBe("test-circuit");
      expect(error.metadata.timestamp).toBeDefined();
    });

    it("should check if error is retryable", () => {
      const retryableError = new ProofGenerationError(
        "Retryable",
        ProofErrorType.NETWORK_ERROR,
        ProofErrorSeverity.LOW,
        ProofErrorRecoverability.RETRYABLE
      );

      const fatalError = new ProofGenerationError(
        "Fatal",
        ProofErrorType.INVALID_CIRCUIT_PARAMETERS,
        ProofErrorSeverity.CRITICAL,
        ProofErrorRecoverability.FATAL
      );

      expect(retryableError.isRetryable()).toBe(true);
      expect(fatalError.isRetryable()).toBe(false);
    });

    it("should check if fallback is available", () => {
      const fallbackError = new ProofGenerationError(
        "Fallback available",
        ProofErrorType.OUT_OF_MEMORY,
        ProofErrorSeverity.CRITICAL,
        ProofErrorRecoverability.FALLBACK_AVAILABLE
      );

      expect(fallbackError.hasFallback()).toBe(true);
      expect(fallbackError.isFatal()).toBe(false);
    });

    it("should convert to JSON", () => {
      const error = new ProofGenerationError(
        "Test",
        ProofErrorType.PROOF_GENERATION_FAILED,
        ProofErrorSeverity.MEDIUM,
        ProofErrorRecoverability.RETRYABLE,
        { attemptNumber: 2 }
      );

      const json = error.toJSON();

      expect(json.name).toBe("ProofGenerationError");
      expect(json.message).toBe("Test");
      expect(json.type).toBe(ProofErrorType.PROOF_GENERATION_FAILED);
      expect(json.metadata.attemptNumber).toBe(2);
    });
  });

  describe("RetryStrategy", () => {
    it("should allow retry within max attempts", () => {
      const strategy = new RetryStrategy(3);
      const error = new ProofGenerationError(
        "Retry",
        ProofErrorType.NETWORK_ERROR,
        ProofErrorSeverity.LOW,
        ProofErrorRecoverability.RETRYABLE,
        { attemptNumber: 1 }
      );

      expect(strategy.canRecover(error)).toBe(true);
    });

    it("should not allow retry beyond max attempts", () => {
      const strategy = new RetryStrategy(3);
      const error = new ProofGenerationError(
        "Retry",
        ProofErrorType.NETWORK_ERROR,
        ProofErrorSeverity.LOW,
        ProofErrorRecoverability.RETRYABLE,
        { attemptNumber: 3 }
      );

      expect(strategy.canRecover(error)).toBe(false);
    });

    it("should calculate next attempt number", () => {
      const strategy = new RetryStrategy(3);
      const error = new ProofGenerationError(
        "Retry",
        ProofErrorType.NETWORK_ERROR,
        ProofErrorSeverity.LOW,
        ProofErrorRecoverability.RETRYABLE,
        { attemptNumber: 1 }
      );

      expect(strategy.getNextAttemptNumber(error)).toBe(2);
    });

    it("should recover with exponential backoff", async () => {
      const strategy = new RetryStrategy(3, 100, 1000);
      const error = new ProofGenerationError(
        "Retry",
        ProofErrorType.NETWORK_ERROR,
        ProofErrorSeverity.LOW,
        ProofErrorRecoverability.RETRYABLE,
        { attemptNumber: 1 }
      );

      const startTime = Date.now();
      await strategy.recover(error, {});
      const elapsed = Date.now() - startTime;

      // Should wait at least 200ms (100 * 2^1)
      expect(elapsed).toBeGreaterThanOrEqual(190); // Allow small margin
    });
  });

  describe("CircuitFallbackStrategy", () => {
    it("should provide fallback circuit", () => {
      const fallbacks = new Map([
        ["large", "medium"],
        ["medium", "small"],
      ]);
      const strategy = new CircuitFallbackStrategy(fallbacks);

      expect(strategy.getFallbackCircuit("large")).toBe("medium");
      expect(strategy.getFallbackCircuit("medium")).toBe("small");
      expect(strategy.getFallbackCircuit("small")).toBeUndefined();
    });

    it("should check if can recover with fallback", () => {
      const fallbacks = new Map([["large", "medium"]]);
      const strategy = new CircuitFallbackStrategy(fallbacks);

      const error = new ProofGenerationError(
        "Test",
        ProofErrorType.OUT_OF_MEMORY,
        ProofErrorSeverity.CRITICAL,
        ProofErrorRecoverability.FALLBACK_AVAILABLE,
        { circuitType: "large" }
      );

      expect(strategy.canRecover(error)).toBe(true);
    });
  });

  describe("ErrorClassifier", () => {
    it("should classify circuit compilation errors", () => {
      const error = new Error("circuit compilation failed");
      const classified = ErrorClassifier.classify(error);

      expect(classified.type).toBe(ProofErrorType.CIRCUIT_COMPILATION_FAILED);
      expect(classified.severity).toBe(ProofErrorSeverity.HIGH);
      expect(classified.hasFallback()).toBe(true);
    });

    it("should classify memory errors", () => {
      const error = new Error("out of memory");
      const classified = ErrorClassifier.classify(error);

      expect(classified.type).toBe(ProofErrorType.OUT_OF_MEMORY);
      expect(classified.severity).toBe(ProofErrorSeverity.CRITICAL);
    });

    it("should classify timeout errors", () => {
      const error = new Error("operation timed out");
      const classified = ErrorClassifier.classify(error);

      expect(classified.type).toBe(ProofErrorType.PROOF_GENERATION_TIMEOUT);
      expect(classified.isRetryable()).toBe(true);
    });

    it("should classify network errors", () => {
      const error = new Error("network fetch failed");
      const classified = ErrorClassifier.classify(error);

      expect(classified.type).toBe(ProofErrorType.NETWORK_ERROR);
      expect(classified.severity).toBe(ProofErrorSeverity.LOW);
    });

    it("should pass through ProofGenerationError", () => {
      const original = new ProofGenerationError(
        "Test",
        ProofErrorType.CIRCUIT_LOAD_FAILED,
        ProofErrorSeverity.MEDIUM,
        ProofErrorRecoverability.RETRYABLE
      );

      const classified = ErrorClassifier.classify(original);
      expect(classified).toBe(original);
    });

    it("should default to internal error for unknown errors", () => {
      const error = new Error("unknown error");
      const classified = ErrorClassifier.classify(error);

      expect(classified.type).toBe(ProofErrorType.INTERNAL_ERROR);
      expect(classified.severity).toBe(ProofErrorSeverity.HIGH);
    });

    it("should include context in classified error", () => {
      const error = new Error("test error");
      const context = { circuitType: "test", attemptNumber: 1 };
      const classified = ErrorClassifier.classify(error, context);

      expect(classified.metadata.circuitType).toBe("test");
      expect(classified.metadata.attemptNumber).toBe(1);
    });
  });

  describe("ResourceOptimizationStrategy", () => {
    it("should recover from memory errors", () => {
      const strategy = new ResourceOptimizationStrategy();
      const error = new ProofGenerationError(
        "OOM",
        ProofErrorType.OUT_OF_MEMORY,
        ProofErrorSeverity.CRITICAL,
        ProofErrorRecoverability.FALLBACK_AVAILABLE
      );

      expect(strategy.canRecover(error)).toBe(true);
    });

    it("should recover from resource exhausted errors", () => {
      const strategy = new ResourceOptimizationStrategy();
      const error = new ProofGenerationError(
        "Resources exhausted",
        ProofErrorType.RESOURCE_EXHAUSTED,
        ProofErrorSeverity.HIGH,
        ProofErrorRecoverability.RETRYABLE
      );

      expect(strategy.canRecover(error)).toBe(true);
    });
  });
});
