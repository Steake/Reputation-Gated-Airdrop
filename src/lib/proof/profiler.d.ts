/**
 * Performance profiler for ZK proof generation
 * Benchmarks different circuit sizes and network topologies
 */
export interface ProfilingConfig {
  circuitTypes: string[];
  networkSizes: number[];
  iterations: number;
  warmupIterations?: number;
  includeMemory?: boolean;
  includeCPU?: boolean;
}
export interface ProfilingResult {
  circuitType: string;
  networkSize: number;
  iterations: number;
  results: {
    duration: number;
    success: boolean;
    error?: string;
    memoryMB?: number;
    cpuPercent?: number;
  }[];
  statistics: {
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    stdDev: number;
    successRate: number;
    p50: number;
    p95: number;
    p99: number;
  };
}
export interface ProfilingReport {
  timestamp: number;
  config: ProfilingConfig;
  results: ProfilingResult[];
  summary: {
    totalTests: number;
    totalDuration: number;
    overallSuccessRate: number;
    recommendations: string[];
  };
}
/**
 * Performance profiler for proof generation
 */
export declare class PerformanceProfiler {
  private isRunning;
  private currentProgress;
  private totalTests;
  /**
   * Run comprehensive performance profiling
   */
  profile(config: ProfilingConfig): Promise<ProfilingReport>;
  /**
   * Run a single profiling test
   */
  private runSingleTest;
  /**
   * Generate performance recommendations
   */
  private generateRecommendations;
  /**
   * Calculate percentile
   */
  private getPercentile;
  /**
   * Get current progress
   */
  getProgress(): number;
  /**
   * Check if profiling is running
   */
  isProfilerRunning(): boolean;
  /**
   * Export profiling report
   */
  exportReport(report: ProfilingReport): string;
  /**
   * Generate HTML report
   */
  generateHTMLReport(report: ProfilingReport): string;
}
/**
 * Singleton instance
 */
export declare const performanceProfiler: PerformanceProfiler;
//# sourceMappingURL=profiler.d.ts.map
