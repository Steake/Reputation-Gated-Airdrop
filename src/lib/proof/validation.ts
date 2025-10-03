/**
 * Proof integrity validation and security checks
 */

import type { ProofResult } from "./queue";
import {
  ProofGenerationError,
  ProofErrorType,
  ProofErrorSeverity,
  ProofErrorRecoverability,
} from "./errors";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AuditLogEntry {
  timestamp: number;
  action: string;
  requestId: string;
  userId?: string;
  details: Record<string, unknown>;
  success: boolean;
  error?: string;
}

/**
 * Proof validator
 */
export class ProofValidator {
  /**
   * Validate proof integrity
   */
  validateProof(result: ProofResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate proof structure
    if (!result.proof || !Array.isArray(result.proof)) {
      errors.push("Proof data is missing or invalid");
    } else if (result.proof.length === 0) {
      errors.push("Proof array is empty");
    } else {
      // Check for reasonable proof size (typical ZK proofs are 8-12 elements)
      if (result.proof.length > 20) {
        warnings.push("Proof size is unusually large");
      }
      if (result.proof.length < 5) {
        warnings.push("Proof size is unusually small");
      }
    }

    // Validate public inputs
    if (!result.publicInputs || !Array.isArray(result.publicInputs)) {
      errors.push("Public inputs are missing or invalid");
    } else if (result.publicInputs.length === 0) {
      errors.push("Public inputs array is empty");
    }

    // Validate proof hash
    if (!result.hash || typeof result.hash !== "string") {
      errors.push("Proof hash is missing or invalid");
    } else if (!result.hash.startsWith("0x")) {
      errors.push("Proof hash must start with '0x'");
    } else if (result.hash.length !== 66) {
      // 0x + 64 hex characters
      warnings.push("Proof hash length is non-standard");
    }

    // Validate fused opinion
    if (!result.fusedOpinion) {
      errors.push("Fused opinion is missing");
    } else {
      const opinion = result.fusedOpinion;

      // Check bounds
      if (
        opinion.belief < 0 ||
        opinion.belief > 1 ||
        opinion.disbelief < 0 ||
        opinion.disbelief > 1 ||
        opinion.uncertainty < 0 ||
        opinion.uncertainty > 1 ||
        opinion.base_rate < 0 ||
        opinion.base_rate > 1
      ) {
        errors.push("Fused opinion values must be between 0 and 1");
      }

      // Check sum
      const sum = opinion.belief + opinion.disbelief + opinion.uncertainty;
      if (Math.abs(sum - 1.0) > 0.001) {
        // Allow small floating point errors
        errors.push(`Fused opinion components must sum to 1 (got ${sum.toFixed(4)})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate proof before submission to smart contract
   */
  validateForSubmission(
    result: ProofResult,
    expectedCircuitType: string,
    maxAge: number = 3600000 // 1 hour default
  ): ValidationResult {
    const basicValidation = this.validateProof(result);

    if (!basicValidation.valid) {
      return basicValidation;
    }

    const errors: string[] = [...basicValidation.errors];
    const warnings: string[] = [...basicValidation.warnings];

    // Additional validation for contract submission
    // Check that proof elements are within valid range for smart contract
    for (const element of result.proof) {
      if (!Number.isFinite(element)) {
        errors.push("Proof contains non-finite elements");
        break;
      }
      if (element < 0) {
        errors.push("Proof contains negative elements");
        break;
      }
    }

    // Check public inputs
    for (const input of result.publicInputs) {
      if (!Number.isFinite(input)) {
        errors.push("Public inputs contain non-finite values");
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check for proof tampering
   */
  detectTampering(
    originalHash: string,
    proof: number[],
    fusedOpinion: {
      belief: number;
      disbelief: number;
      uncertainty: number;
      base_rate: number;
    }
  ): boolean {
    // Recompute hash and compare
    const recomputedHash = this.computeProofHash(proof, fusedOpinion);
    return recomputedHash !== originalHash;
  }

  /**
   * Compute proof hash (matches worker implementation)
   */
  private computeProofHash(
    proof: number[],
    fusedOpinion: {
      belief: number;
      disbelief: number;
      uncertainty: number;
      base_rate: number;
    }
  ): string {
    const hashInput = proof.concat([
      fusedOpinion.belief * 1000000,
      fusedOpinion.disbelief * 1000000,
      fusedOpinion.uncertainty * 1000000,
      fusedOpinion.base_rate * 1000000,
    ]);

    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput[i];
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
  }
}

/**
 * Access control manager
 */
export class AccessControl {
  private allowedUsers = new Set<string>();
  private rateLimits = new Map<string, { count: number; resetTime: number }>();
  private maxRequestsPerHour = 10;

  /**
   * Add allowed user
   */
  allowUser(userId: string): void {
    this.allowedUsers.add(userId.toLowerCase());
  }

  /**
   * Remove user access
   */
  revokeUser(userId: string): void {
    this.allowedUsers.delete(userId.toLowerCase());
  }

  /**
   * Check if user has access
   */
  hasAccess(userId: string): boolean {
    // For now, allow all users (can be restricted later)
    return true;
  }

  /**
   * Check rate limit for user
   */
  checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId);

    if (!userLimit || now >= userLimit.resetTime) {
      // Reset or create new limit
      this.rateLimits.set(userId, {
        count: 1,
        resetTime: now + 3600000, // 1 hour
      });
      return true;
    }

    if (userLimit.count >= this.maxRequestsPerHour) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Get remaining requests for user
   */
  getRemainingRequests(userId: string): number {
    const userLimit = this.rateLimits.get(userId);
    if (!userLimit || Date.now() >= userLimit.resetTime) {
      return this.maxRequestsPerHour;
    }
    return Math.max(0, this.maxRequestsPerHour - userLimit.count);
  }
}

/**
 * Audit logger
 */
export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 1000;

  /**
   * Log an action
   */
  log(
    action: string,
    requestId: string,
    success: boolean,
    details: Record<string, unknown> = {},
    userId?: string,
    error?: string
  ): void {
    const entry: AuditLogEntry = {
      timestamp: Date.now(),
      action,
      requestId,
      userId,
      details,
      success,
      error,
    };

    this.logs.push(entry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs for a specific request
   */
  getLogsForRequest(requestId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.requestId === requestId);
  }

  /**
   * Get logs for a specific user
   */
  getLogsForUser(userId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.userId === userId);
  }

  /**
   * Export logs
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }
}

/**
 * Singleton instances
 */
export const proofValidator = new ProofValidator();
export const accessControl = new AccessControl();
export const auditLogger = new AuditLogger();
