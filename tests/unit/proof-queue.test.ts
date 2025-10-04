import { describe, it, expect, beforeEach } from "vitest";
import { ProofQueue, ProofPriority, ProofStatus } from "$lib/proof/queue";
import type { TrustAttestation } from "$lib/ebsl/core";

describe("Proof Queue Management", () => {
  let queue: ProofQueue;
  let mockAttestations: TrustAttestation[];

  beforeEach(() => {
    queue = new ProofQueue();
    mockAttestations = [
      {
        source: "0xsource1",
        target: "0xtarget",
        opinion: { belief: 0.7, disbelief: 0.1, uncertainty: 0.2, base_rate: 0.5 },
        attestation_type: "trust",
        weight: 1.0,
        created_at: Date.now(),
        expires_at: Date.now() + 86400000,
      },
    ];
  });

  describe("Queue Operations", () => {
    it("should enqueue a proof request", () => {
      const requestId = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);

      expect(requestId).toBeTruthy();
      expect(queue.getQueueLength()).toBe(1);
    });

    it("should enqueue requests with priority order", () => {
      const id1 = queue.enqueue(mockAttestations, "exact", ProofPriority.LOW);
      const id2 = queue.enqueue(mockAttestations, "exact", ProofPriority.HIGH);
      const id3 = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);

      // Dequeue should return highest priority first
      const first = queue.dequeue();
      expect(first?.id).toBe(id2); // HIGH priority

      const second = queue.dequeue();
      expect(second?.id).toBe(id3); // NORMAL priority

      const third = queue.dequeue();
      expect(third?.id).toBe(id1); // LOW priority
    });

    it("should dequeue requests", () => {
      const requestId = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);

      const request = queue.dequeue();

      expect(request?.id).toBe(requestId);
      expect(request?.status).toBe(ProofStatus.PROCESSING);
      expect(queue.getQueueLength()).toBe(0);
      expect(queue.getActiveCount()).toBe(1);
    });

    it("should respect max concurrent processing", () => {
      // Enqueue 10 requests
      for (let i = 0; i < 10; i++) {
        queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      }

      // Dequeue up to max concurrent (4)
      const requests = [];
      for (let i = 0; i < 6; i++) {
        const req = queue.dequeue();
        if (req) requests.push(req);
      }

      // Should only dequeue 4 due to max concurrent limit
      expect(requests.length).toBe(4);
      expect(queue.getActiveCount()).toBe(4);
      expect(queue.getQueueLength()).toBe(6);
    });

    it("should not exceed max queue size", () => {
      // Try to enqueue more than max size (100)
      for (let i = 0; i < 100; i++) {
        queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      }

      expect(() => {
        queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      }).toThrow("Proof queue is full");
    });
  });

  describe("Request Management", () => {
    it("should update request progress", () => {
      const requestId = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      queue.dequeue();

      queue.updateProgress(requestId, 50, 5000);

      const request = queue.getRequest(requestId);
      expect(request?.progress).toBe(50);
      expect(request?.estimatedDurationMs).toBe(5000);
    });

    it("should complete a request successfully", () => {
      const requestId = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      queue.dequeue();

      const result = {
        proof: [1, 2, 3, 4, 5],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: { belief: 0.7, disbelief: 0.1, uncertainty: 0.2, base_rate: 0.5 },
      };

      queue.complete(requestId, result);

      const request = queue.getRequest(requestId);
      expect(request?.status).toBe(ProofStatus.COMPLETED);
      expect(request?.progress).toBe(100);
      expect(request?.result).toEqual(result);
      expect(queue.getActiveCount()).toBe(0);
    });

    it("should fail a request", () => {
      const requestId = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      queue.dequeue();

      queue.fail(requestId, "Test error");

      const request = queue.getRequest(requestId);
      expect(request?.status).toBe(ProofStatus.FAILED);
      expect(request?.error).toBe("Test error");
      expect(queue.getActiveCount()).toBe(0);
    });

    it("should cancel a queued request", () => {
      const requestId = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);

      const cancelled = queue.cancel(requestId);

      expect(cancelled).toBe(true);
      expect(queue.getQueueLength()).toBe(0);

      const request = queue.getRequest(requestId);
      expect(request?.status).toBe(ProofStatus.CANCELLED);
    });

    it("should not cancel a processing request", () => {
      const requestId = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      queue.dequeue();

      const cancelled = queue.cancel(requestId);

      expect(cancelled).toBe(false);
    });

    it("should get request by ID", () => {
      const requestId = queue.enqueue(
        mockAttestations,
        "exact",
        ProofPriority.NORMAL,
        undefined,
        "test-circuit"
      );

      const request = queue.getRequest(requestId);

      expect(request).toBeDefined();
      expect(request?.id).toBe(requestId);
      expect(request?.circuitType).toBe("test-circuit");
    });
  });

  describe("Queue Statistics", () => {
    it("should calculate queue statistics", () => {
      // Enqueue some requests
      const id1 = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      const id2 = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);

      // Process one
      queue.dequeue();
      queue.complete(id1, {
        proof: [1, 2, 3],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: { belief: 0.7, disbelief: 0.1, uncertainty: 0.2, base_rate: 0.5 },
      });

      // Fail another
      queue.dequeue();
      queue.fail(id2, "Test error");

      const stats = queue.getStats();

      expect(stats.totalQueued).toBe(0);
      expect(stats.totalProcessing).toBe(0);
      expect(stats.totalCompleted).toBe(1);
      expect(stats.totalFailed).toBe(1);
    });

    it("should calculate average wait and processing times", () => {
      const id1 = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);

      // Wait a bit before processing
      setTimeout(() => {
        queue.dequeue();

        // Process for a bit
        setTimeout(() => {
          queue.complete(id1, {
            proof: [1, 2, 3],
            publicInputs: [750000],
            hash: "0x" + "a".repeat(64),
            fusedOpinion: {
              belief: 0.7,
              disbelief: 0.1,
              uncertainty: 0.2,
              base_rate: 0.5,
            },
          });

          const stats = queue.getStats();
          expect(stats.averageWaitTimeMs).toBeGreaterThan(0);
          expect(stats.averageProcessingTimeMs).toBeGreaterThan(0);
        }, 100);
      }, 100);
    });
  });

  describe("Queue State", () => {
    it("should check if queue is at capacity", () => {
      expect(queue.isAtCapacity()).toBe(false);

      // Fill queue to capacity
      for (let i = 0; i < 100; i++) {
        queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      }

      expect(queue.isAtCapacity()).toBe(true);
    });

    it("should clear completed requests", () => {
      const id1 = queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      queue.dequeue();
      queue.complete(id1, {
        proof: [1, 2, 3],
        publicInputs: [750000],
        hash: "0x" + "a".repeat(64),
        fusedOpinion: { belief: 0.7, disbelief: 0.1, uncertainty: 0.2, base_rate: 0.5 },
      });

      queue.clearCompleted();

      const stats = queue.getStats();
      expect(stats.totalCompleted).toBe(0);
    });
  });

  describe("Priority Handling", () => {
    it("should handle critical priority", () => {
      queue.enqueue(mockAttestations, "exact", ProofPriority.NORMAL);
      const criticalId = queue.enqueue(mockAttestations, "exact", ProofPriority.CRITICAL);
      queue.enqueue(mockAttestations, "exact", ProofPriority.HIGH);

      const first = queue.dequeue();
      expect(first?.id).toBe(criticalId);
    });

    it("should maintain priority order with multiple requests", () => {
      const priorities = [
        ProofPriority.LOW,
        ProofPriority.CRITICAL,
        ProofPriority.NORMAL,
        ProofPriority.HIGH,
        ProofPriority.LOW,
        ProofPriority.CRITICAL,
      ];

      priorities.forEach((priority) => queue.enqueue(mockAttestations, "exact", priority));

      // Should dequeue in order: CRITICAL, CRITICAL, HIGH, NORMAL, LOW, LOW
      const req1 = queue.dequeue();
      expect(req1?.priority).toBe(ProofPriority.CRITICAL);

      const req2 = queue.dequeue();
      expect(req2?.priority).toBe(ProofPriority.CRITICAL);

      const req3 = queue.dequeue();
      expect(req3?.priority).toBe(ProofPriority.HIGH);

      const req4 = queue.dequeue();
      expect(req4?.priority).toBe(ProofPriority.NORMAL);
    });
  });
});
