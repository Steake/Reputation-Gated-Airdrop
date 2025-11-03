/**
 * Performance monitoring and metrics collection for proof generation
 */
export interface ProofMetrics {
  proofId: string;
  circuitType: string;
  networkSize: number;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  success: boolean;
  error?: string;
  resourceUsage: {
    peakMemoryMB: number;
    avgCpuPercent: number;
    diskUsageMB?: number;
  };
  stages: {
    witnessPreparation?: number;
    circuitLoading?: number;
    proofGeneration?: number;
    validation?: number;
  };
}
export interface MetricsSnapshot {
  timestamp: number;
  activeProofs: number;
  completedProofs: number;
  failedProofs: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  successRate: number;
  queueLength: number;
  resourceUsage: {
    memoryMB: number;
    cpuPercent: number;
  };
}
export interface PerformancePrediction {
  estimatedDurationMs: number;
  confidence: number;
  basedOnSamples: number;
}
/**
 * Performance metrics collector and analyzer
 */
export declare class MetricsCollector {
  private metrics;
  private maxStoredMetrics;
  private activeProofs;
  /**
   * Start tracking a proof generation
   */
  startProof(proofId: string, circuitType: string, networkSize: number): void;
  /**
   * Record a stage completion
   */
  recordStage(proofId: string, stage: keyof ProofMetrics["stages"], durationMs: number): void;
  /**
   * Update resource usage
   */
  updateResourceUsage(proofId: string, memoryMB: number, cpuPercent: number): void;
  /**
   * Complete a proof tracking
   */
  completeProof(proofId: string, success: boolean, error?: string): void;
  /**
   * Get current metrics snapshot
   */
  getSnapshot(): MetricsSnapshot;
  /**
   * Predict proof generation time based on historical data
   */
  predictDuration(circuitType: string, networkSize: number): PerformancePrediction;
  /**
   * Get performance benchmarks by circuit type
   */
  getBenchmarksByCircuit(circuitType: string): {
    avgDurationMs: number;
    successRate: number;
    sampleCount: number;
  };
  /**
   * Get historical metrics for analysis
   */
  getHistoricalMetrics(limit?: number): ProofMetrics[];
  /**
   * Clear all metrics
   */
  clear(): void;
  /**
   * Export metrics for external analysis
   */
  exportMetrics(): string;
  /**
   * Calculate percentile from sorted array
   */
  private getPercentile;
  /**
   * Calculate variance
   */
  private calculateVariance;
}
/**
 * Singleton instance of metrics collector
 */
export declare const metricsCollector: MetricsCollector;
//# sourceMappingURL=metrics.d.ts.map
