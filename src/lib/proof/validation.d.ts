/**
 * Proof integrity validation and security checks
 */
import type { ProofResult } from "./queue";
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
export declare class ProofValidator {
    /**
     * Validate proof integrity
     */
    validateProof(result: ProofResult): ValidationResult;
    /**
     * Validate proof before submission to smart contract
     */
    validateForSubmission(result: ProofResult, expectedCircuitType: string, maxAge?: number): ValidationResult;
    /**
     * Check for proof tampering
     */
    detectTampering(originalHash: string, proof: number[], fusedOpinion: {
        belief: number;
        disbelief: number;
        uncertainty: number;
        base_rate: number;
    }): boolean;
    /**
     * Compute proof hash (matches worker implementation)
     */
    private computeProofHash;
}
/**
 * Access control manager
 */
export declare class AccessControl {
    private allowedUsers;
    private rateLimits;
    private maxRequestsPerHour;
    /**
     * Add allowed user
     */
    allowUser(userId: string): void;
    /**
     * Remove user access
     */
    revokeUser(userId: string): void;
    /**
     * Check if user has access
     */
    hasAccess(userId: string): boolean;
    /**
     * Check rate limit for user
     */
    checkRateLimit(userId: string): boolean;
    /**
     * Get remaining requests for user
     */
    getRemainingRequests(userId: string): number;
}
/**
 * Audit logger
 */
export declare class AuditLogger {
    private logs;
    private maxLogs;
    /**
     * Log an action
     */
    log(action: string, requestId: string, success: boolean, details?: Record<string, unknown>, userId?: string, error?: string): void;
    /**
     * Get recent logs
     */
    getRecentLogs(limit?: number): AuditLogEntry[];
    /**
     * Get logs for a specific request
     */
    getLogsForRequest(requestId: string): AuditLogEntry[];
    /**
     * Get logs for a specific user
     */
    getLogsForUser(userId: string): AuditLogEntry[];
    /**
     * Export logs
     */
    exportLogs(): string;
    /**
     * Clear all logs
     */
    clear(): void;
}
/**
 * Singleton instances
 */
export declare const proofValidator: ProofValidator;
export declare const accessControl: AccessControl;
export declare const auditLogger: AuditLogger;
//# sourceMappingURL=validation.d.ts.map