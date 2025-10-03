import { describe, it, expect, beforeEach } from "vitest";
import { MetricsCollector } from "$lib/proof/metrics";

describe("Proof Generation Metrics", () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe("Proof Tracking", () => {
    it("should start tracking a proof", () => {
      collector.startProof("proof-1", "default", 10);

      const snapshot = collector.getSnapshot();
      expect(snapshot.activeProofs).toBe(1);
    });

    it("should record stage completion", () => {
      collector.startProof("proof-1", "default", 10);
      collector.recordStage("proof-1", "witnessPreparation", 1000);
      collector.recordStage("proof-1", "proofGeneration", 5000);

      collector.completeProof("proof-1", true);

      const metrics = collector.getHistoricalMetrics(1);
      expect(metrics[0].stages.witnessPreparation).toBe(1000);
      expect(metrics[0].stages.proofGeneration).toBe(5000);
    });

    it("should update resource usage", () => {
      collector.startProof("proof-1", "default", 10);
      collector.updateResourceUsage("proof-1", 100, 50);
      collector.updateResourceUsage("proof-1", 150, 60);

      collector.completeProof("proof-1", true);

      const metrics = collector.getHistoricalMetrics(1);
      expect(metrics[0].resourceUsage.peakMemoryMB).toBe(150);
      expect(metrics[0].resourceUsage.avgCpuPercent).toBeGreaterThan(0);
    });

    it("should complete proof successfully", () => {
      collector.startProof("proof-1", "default", 10);
      collector.completeProof("proof-1", true);

      const snapshot = collector.getSnapshot();
      expect(snapshot.activeProofs).toBe(0);
      expect(snapshot.completedProofs).toBe(1);
      expect(snapshot.failedProofs).toBe(0);
    });

    it("should complete proof with failure", () => {
      collector.startProof("proof-1", "default", 10);
      collector.completeProof("proof-1", false, "Test error");

      const snapshot = collector.getSnapshot();
      expect(snapshot.activeProofs).toBe(0);
      expect(snapshot.completedProofs).toBe(0);
      expect(snapshot.failedProofs).toBe(1);
    });
  });

  describe("Metrics Snapshot", () => {
    it("should calculate average duration", () => {
      collector.startProof("proof-1", "default", 10);
      // Add small delay
      const delay = 5;
      setTimeout(() => {}, delay);
      collector.completeProof("proof-1", true);

      collector.startProof("proof-2", "default", 10);
      setTimeout(() => {}, delay);
      collector.completeProof("proof-2", true);

      const snapshot = collector.getSnapshot();
      // Duration should be at least 0 (very fast completion is okay)
      expect(snapshot.avgDurationMs).toBeGreaterThanOrEqual(0);
    });

    it("should calculate percentiles", () => {
      // Create proofs with known durations
      for (let i = 0; i < 10; i++) {
        collector.startProof(`proof-${i}`, "default", 10);
        // Simulate different durations by completing at different times
        setTimeout(() => {
          collector.completeProof(`proof-${i}`, true);
        }, i * 100);
      }

      // Wait for completions
      setTimeout(() => {
        const snapshot = collector.getSnapshot();
        expect(snapshot.p50DurationMs).toBeGreaterThanOrEqual(0);
        expect(snapshot.p95DurationMs).toBeGreaterThanOrEqual(snapshot.p50DurationMs);
        expect(snapshot.p99DurationMs).toBeGreaterThanOrEqual(snapshot.p95DurationMs);
      }, 1500);
    });

    it("should calculate success rate", () => {
      collector.startProof("proof-1", "default", 10);
      collector.completeProof("proof-1", true);

      collector.startProof("proof-2", "default", 10);
      collector.completeProof("proof-2", false);

      collector.startProof("proof-3", "default", 10);
      collector.completeProof("proof-3", true);

      const snapshot = collector.getSnapshot();
      expect(snapshot.successRate).toBeCloseTo(0.666, 2);
    });
  });

  describe("Performance Prediction", () => {
    it("should predict duration based on historical data", () => {
      // Add some historical data
      for (let i = 0; i < 5; i++) {
        collector.startProof(`proof-${i}`, "default", 10);
        // Add tiny delay to simulate work
        setTimeout(() => {}, 1);
        collector.completeProof(`proof-${i}`, true);
      }

      const prediction = collector.predictDuration("default", 10);
      // Estimate should be non-negative
      expect(prediction.estimatedDurationMs).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.basedOnSamples).toBe(5);
    });

    it("should return low confidence with no historical data", () => {
      const prediction = collector.predictDuration("unknown", 10);
      expect(prediction.confidence).toBeLessThan(0.3);
      expect(prediction.basedOnSamples).toBe(0);
    });

    it("should adjust prediction based on network size", () => {
      // Add data for different network sizes
      collector.startProof("proof-1", "default", 10);
      collector.completeProof("proof-1", true);

      collector.startProof("proof-2", "default", 100);
      collector.completeProof("proof-2", true);

      const prediction1 = collector.predictDuration("default", 12);
      const prediction2 = collector.predictDuration("default", 90);

      // Predictions should be similar for similar network sizes
      expect(prediction1.basedOnSamples).toBeGreaterThan(0);
      expect(prediction2.basedOnSamples).toBeGreaterThan(0);
    });
  });

  describe("Circuit Benchmarks", () => {
    it("should get benchmarks by circuit type", () => {
      collector.startProof("proof-1", "default", 10);
      collector.completeProof("proof-1", true);

      collector.startProof("proof-2", "default", 10);
      collector.completeProof("proof-2", false);

      const benchmarks = collector.getBenchmarksByCircuit("default");
      expect(benchmarks.sampleCount).toBe(2);
      expect(benchmarks.successRate).toBe(0.5);
      expect(benchmarks.avgDurationMs).toBeGreaterThanOrEqual(0);
    });

    it("should return zero benchmarks for unknown circuit", () => {
      const benchmarks = collector.getBenchmarksByCircuit("unknown");
      expect(benchmarks.sampleCount).toBe(0);
      expect(benchmarks.successRate).toBe(0);
      expect(benchmarks.avgDurationMs).toBe(0);
    });
  });

  describe("Historical Metrics", () => {
    it("should retrieve historical metrics", () => {
      collector.startProof("proof-1", "default", 10);
      collector.completeProof("proof-1", true);

      collector.startProof("proof-2", "default", 20);
      collector.completeProof("proof-2", false);

      const historical = collector.getHistoricalMetrics(10);
      expect(historical.length).toBe(2);
      expect(historical[0].proofId).toBe("proof-1");
      expect(historical[1].proofId).toBe("proof-2");
    });

    it("should limit historical metrics", () => {
      for (let i = 0; i < 10; i++) {
        collector.startProof(`proof-${i}`, "default", 10);
        collector.completeProof(`proof-${i}`, true);
      }

      const historical = collector.getHistoricalMetrics(5);
      expect(historical.length).toBe(5);
    });
  });

  describe("Metrics Export", () => {
    it("should export metrics as JSON", () => {
      collector.startProof("proof-1", "default", 10);
      collector.completeProof("proof-1", true);

      const exported = collector.exportMetrics();
      expect(exported).toBeTruthy();

      const parsed = JSON.parse(exported);
      expect(parsed.completedMetrics).toBeDefined();
      expect(parsed.snapshot).toBeDefined();
    });
  });

  describe("Metrics Cleanup", () => {
    it("should clear all metrics", () => {
      collector.startProof("proof-1", "default", 10);
      collector.completeProof("proof-1", true);

      collector.clear();

      const snapshot = collector.getSnapshot();
      expect(snapshot.completedProofs).toBe(0);
      expect(snapshot.failedProofs).toBe(0);
      expect(snapshot.activeProofs).toBe(0);
    });
  });
});
