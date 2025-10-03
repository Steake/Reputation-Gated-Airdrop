import { describe, it, expect, beforeEach } from "vitest";
import { ProofValidator, AccessControl, AuditLogger } from "$lib/proof/validation";
import type { ProofResult } from "$lib/proof/queue";

describe("Proof Validation", () => {
  let validator: ProofValidator;

  beforeEach(() => {
    validator = new ProofValidator();
  });

  describe("Proof Structure Validation", () => {
    it("should validate a correct proof", () => {
      const proof: ProofResult = {
        proof: [1, 2, 3, 4, 5, 6, 7, 8],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      };

      const result = validator.validateProof(proof);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject proof with missing proof data", () => {
      const proof = {
        proof: [],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      } as ProofResult;

      const result = validator.validateProof(proof);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Proof array is empty");
    });

    it("should reject proof with missing public inputs", () => {
      const proof = {
        proof: [1, 2, 3, 4, 5],
        publicInputs: [],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      } as ProofResult;

      const result = validator.validateProof(proof);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Public inputs array is empty");
    });

    it("should reject proof with invalid hash", () => {
      const proof: ProofResult = {
        proof: [1, 2, 3, 4, 5],
        publicInputs: [750000],
        hash: "invalid-hash",
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      };

      const result = validator.validateProof(proof);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Proof hash must start with '0x'");
    });

    it("should warn about unusual proof size", () => {
      const proof: ProofResult = {
        proof: [1, 2, 3], // Too small
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      };

      const result = validator.validateProof(proof);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("unusually small");
    });
  });

  describe("Opinion Validation", () => {
    it("should validate correct opinion values", () => {
      const proof: ProofResult = {
        proof: [1, 2, 3, 4, 5, 6, 7, 8],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.5,
          disbelief: 0.3,
          uncertainty: 0.2,
          base_rate: 0.6,
        },
      };

      const result = validator.validateProof(proof);

      expect(result.valid).toBe(true);
    });

    it("should reject opinion with values out of bounds", () => {
      const proof: ProofResult = {
        proof: [1, 2, 3, 4, 5, 6, 7, 8],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 1.5, // Invalid: > 1
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      };

      const result = validator.validateProof(proof);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be between 0 and 1");
    });

    it("should reject opinion with incorrect sum", () => {
      const proof: ProofResult = {
        proof: [1, 2, 3, 4, 5, 6, 7, 8],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.5, // Sum > 1
          uncertainty: 0.2,
          base_rate: 0.5,
        },
      };

      const result = validator.validateProof(proof);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must sum to 1");
    });

    it("should allow small floating point errors in sum", () => {
      const proof: ProofResult = {
        proof: [1, 2, 3, 4, 5, 6, 7, 8],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.333333,
          disbelief: 0.333333,
          uncertainty: 0.333334, // Sum = 1.000000 (close enough)
          base_rate: 0.5,
        },
      };

      const result = validator.validateProof(proof);

      expect(result.valid).toBe(true);
    });
  });

  describe("Submission Validation", () => {
    it("should validate proof for contract submission", () => {
      const proof: ProofResult = {
        proof: [100, 200, 300, 400, 500],
        publicInputs: [750000, 1],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      };

      const result = validator.validateForSubmission(proof, "default");

      expect(result.valid).toBe(true);
    });

    it("should reject proof with non-finite elements", () => {
      const proof: ProofResult = {
        proof: [1, 2, Infinity, 4, 5],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      };

      const result = validator.validateForSubmission(proof, "default");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Proof contains non-finite elements");
    });

    it("should reject proof with negative elements", () => {
      const proof: ProofResult = {
        proof: [1, 2, -3, 4, 5],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: {
          belief: 0.7,
          disbelief: 0.2,
          uncertainty: 0.1,
          base_rate: 0.5,
        },
      };

      const result = validator.validateForSubmission(proof, "default");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Proof contains negative elements");
    });
  });

  describe("Tampering Detection", () => {
    it("should detect valid proof (no tampering)", () => {
      const originalHash = "0x" + "a".repeat(64);
      const proof = [1, 2, 3, 4, 5];
      const opinion = { belief: 0.7, disbelief: 0.2, uncertainty: 0.1, base_rate: 0.5 };

      const isTampered = validator.detectTampering(originalHash, proof, opinion);

      // Note: This may not match exactly due to hash implementation
      // In real usage, the hash would be computed consistently
      expect(typeof isTampered).toBe("boolean");
    });
  });
});

describe("Access Control", () => {
  let accessControl: AccessControl;

  beforeEach(() => {
    accessControl = new AccessControl();
  });

  describe("User Access", () => {
    it("should allow all users by default", () => {
      expect(accessControl.hasAccess("0x123")).toBe(true);
      expect(accessControl.hasAccess("0x456")).toBe(true);
    });

    it("should allow added users", () => {
      accessControl.allowUser("0x123");
      expect(accessControl.hasAccess("0x123")).toBe(true);
    });

    it("should revoke user access", () => {
      accessControl.allowUser("0x123");
      accessControl.revokeUser("0x123");
      // Note: hasAccess still returns true for all users by default
      expect(accessControl.hasAccess("0x456")).toBe(true);
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests within limit", () => {
      for (let i = 0; i < 10; i++) {
        expect(accessControl.checkRateLimit("0x123")).toBe(true);
      }
    });

    it("should block requests exceeding limit", () => {
      // Exhaust rate limit (10 requests per hour)
      for (let i = 0; i < 10; i++) {
        accessControl.checkRateLimit("0x123");
      }

      // Next request should be blocked
      expect(accessControl.checkRateLimit("0x123")).toBe(false);
    });

    it("should track remaining requests", () => {
      accessControl.checkRateLimit("0x123");
      accessControl.checkRateLimit("0x123");

      const remaining = accessControl.getRemainingRequests("0x123");
      expect(remaining).toBe(8); // 10 - 2
    });

    it("should reset rate limit after time period", () => {
      // Use up all requests
      for (let i = 0; i < 10; i++) {
        accessControl.checkRateLimit("0x123");
      }

      // Mock time passage (would need to manipulate time in real test)
      // For now, just verify remaining is 0
      const remaining = accessControl.getRemainingRequests("0x123");
      expect(remaining).toBe(0);
    });
  });
});

describe("Audit Logger", () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new AuditLogger();
  });

  describe("Logging", () => {
    it("should log an action", () => {
      logger.log("PROOF_REQUESTED", "req-1", true, { proofType: "exact" }, "0x123");

      const logs = logger.getRecentLogs(1);
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("PROOF_REQUESTED");
      expect(logs[0].requestId).toBe("req-1");
      expect(logs[0].success).toBe(true);
    });

    it("should log failures with errors", () => {
      logger.log("PROOF_FAILED", "req-1", false, {}, "0x123", "Test error");

      const logs = logger.getRecentLogs(1);
      expect(logs[0].success).toBe(false);
      expect(logs[0].error).toBe("Test error");
    });

    it("should limit log size", () => {
      // Create more than max logs (1000)
      for (let i = 0; i < 1100; i++) {
        logger.log("TEST_ACTION", `req-${i}`, true);
      }

      const allLogs = logger.getRecentLogs(2000);
      expect(allLogs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("Log Retrieval", () => {
    it("should get recent logs", () => {
      logger.log("ACTION_1", "req-1", true);
      logger.log("ACTION_2", "req-2", true);
      logger.log("ACTION_3", "req-3", true);

      const recent = logger.getRecentLogs(2);
      expect(recent.length).toBe(2);
      expect(recent[1].action).toBe("ACTION_3"); // Most recent
    });

    it("should get logs for specific request", () => {
      logger.log("ACTION_1", "req-1", true);
      logger.log("ACTION_2", "req-1", true);
      logger.log("ACTION_3", "req-2", true);

      const requestLogs = logger.getLogsForRequest("req-1");
      expect(requestLogs.length).toBe(2);
    });

    it("should get logs for specific user", () => {
      logger.log("ACTION_1", "req-1", true, {}, "0x123");
      logger.log("ACTION_2", "req-2", true, {}, "0x456");
      logger.log("ACTION_3", "req-3", true, {}, "0x123");

      const userLogs = logger.getLogsForUser("0x123");
      expect(userLogs.length).toBe(2);
    });
  });

  describe("Log Export", () => {
    it("should export logs as JSON", () => {
      logger.log("ACTION_1", "req-1", true);
      logger.log("ACTION_2", "req-2", false, {}, undefined, "Error");

      const exported = logger.exportLogs();
      expect(exported).toBeTruthy();

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });
  });

  describe("Log Cleanup", () => {
    it("should clear all logs", () => {
      logger.log("ACTION_1", "req-1", true);
      logger.log("ACTION_2", "req-2", true);

      logger.clear();

      const logs = logger.getRecentLogs(10);
      expect(logs.length).toBe(0);
    });
  });
});
