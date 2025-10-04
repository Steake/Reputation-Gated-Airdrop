/**
 * Performance profiler for ZK proof generation
 * Benchmarks different circuit sizes and network topologies
 */

import { metricsCollector } from "./metrics";
import { proofPipeline } from "./pipeline";
import { ProofPriority } from "./queue";
import type { TrustAttestation } from "../ebsl/core";

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
export class PerformanceProfiler {
  private isRunning = false;
  private currentProgress = 0;
  private totalTests = 0;

  /**
   * Run comprehensive performance profiling
   */
  async profile(config: ProfilingConfig): Promise<ProfilingReport> {
    if (this.isRunning) {
      throw new Error("Profiling already in progress");
    }

    this.isRunning = true;
    this.currentProgress = 0;

    const results: ProfilingResult[] = [];
    const startTime = Date.now();

    // Calculate total tests
    this.totalTests =
      config.circuitTypes.length *
      config.networkSizes.length *
      (config.iterations + (config.warmupIterations || 0));

    let completedTests = 0;

    try {
      for (const circuitType of config.circuitTypes) {
        for (const networkSize of config.networkSizes) {
          console.log(
            `Profiling ${circuitType} circuit with ${networkSize} attestations...`
          );

          // Warmup iterations
          if (config.warmupIterations) {
            for (let i = 0; i < config.warmupIterations; i++) {
              await this.runSingleTest(circuitType, networkSize, false);
              completedTests++;
              this.currentProgress = (completedTests / this.totalTests) * 100;
            }
          }

          // Actual profiling iterations
          const iterationResults = [];
          for (let i = 0; i < config.iterations; i++) {
            const result = await this.runSingleTest(
              circuitType,
              networkSize,
              config.includeMemory || config.includeCPU
            );
            iterationResults.push(result);
            completedTests++;
            this.currentProgress = (completedTests / this.totalTests) * 100;
          }

          // Calculate statistics
          const durations = iterationResults
            .filter((r) => r.success)
            .map((r) => r.duration)
            .sort((a, b) => a - b);

          const avgDuration =
            durations.length > 0
              ? durations.reduce((sum, d) => sum + d, 0) / durations.length
              : 0;
          const minDuration = durations.length > 0 ? durations[0] : 0;
          const maxDuration = durations.length > 0 ? durations[durations.length - 1] : 0;

          const variance =
            durations.length > 0
              ? durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) /
                durations.length
              : 0;
          const stdDev = Math.sqrt(variance);

          const successRate = iterationResults.filter((r) => r.success).length / iterationResults.length;

          const p50 = this.getPercentile(durations, 0.5);
          const p95 = this.getPercentile(durations, 0.95);
          const p99 = this.getPercentile(durations, 0.99);

          results.push({
            circuitType,
            networkSize,
            iterations: config.iterations,
            results: iterationResults,
            statistics: {
              avgDuration,
              minDuration,
              maxDuration,
              stdDev,
              successRate,
              p50,
              p95,
              p99,
            },
          });
        }
      }

      const totalDuration = Date.now() - startTime;
      const overallSuccessRate =
        results.reduce(
          (sum, r) => sum + r.statistics.successRate * r.iterations,
          0
        ) / results.reduce((sum, r) => sum + r.iterations, 0);

      const recommendations = this.generateRecommendations(results);

      return {
        timestamp: Date.now(),
        config,
        results,
        summary: {
          totalTests: completedTests,
          totalDuration,
          overallSuccessRate,
          recommendations,
        },
      };
    } finally {
      this.isRunning = false;
      this.currentProgress = 0;
    }
  }

  /**
   * Run a single profiling test
   */
  private async runSingleTest(
    circuitType: string,
    networkSize: number,
    includeResources: boolean
  ): Promise<{
    duration: number;
    success: boolean;
    error?: string;
    memoryMB?: number;
    cpuPercent?: number;
  }> {
    // Create mock attestations
    const attestations: TrustAttestation[] = Array.from(
      { length: networkSize },
      (_, idx) => ({
        source: `0xsource${idx}`,
        target: "0xtarget",
        opinion: {
          belief: Math.random() * 0.5 + 0.3,
          disbelief: Math.random() * 0.2,
          uncertainty: Math.random() * 0.3,
          base_rate: 0.5,
        },
        attestation_type: "trust" as const,
        weight: 1.0,
        created_at: Date.now(),
        expires_at: Date.now() + 86400000,
      })
    );

    const startTime = Date.now();
    let memoryBefore: number | undefined;
    let memoryAfter: number | undefined;

    if (includeResources && typeof performance !== "undefined" && (performance as any).memory) {
      memoryBefore = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }

    try {
      await proofPipeline.generateProof(attestations, "exact", {
        circuitType,
        priority: ProofPriority.LOW,
        maxRetries: 1,
        timeoutMs: 60000,
      });

      const duration = Date.now() - startTime;

      if (includeResources && typeof performance !== "undefined" && (performance as any).memory) {
        memoryAfter = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }

      return {
        duration,
        success: true,
        memoryMB: memoryAfter && memoryBefore ? memoryAfter - memoryBefore : undefined,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        duration,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(results: ProfilingResult[]): string[] {
    const recommendations: string[] = [];

    // Check for high failure rates
    const highFailureRates = results.filter((r) => r.statistics.successRate < 0.9);
    if (highFailureRates.length > 0) {
      recommendations.push(
        `Consider increasing timeout or resources for: ${highFailureRates
          .map((r) => `${r.circuitType}(${r.networkSize})`)
          .join(", ")}`
      );
    }

    // Check for high variability
    const highVariability = results.filter(
      (r) => r.statistics.stdDev > r.statistics.avgDuration * 0.5
    );
    if (highVariability.length > 0) {
      recommendations.push(
        `High performance variability detected in: ${highVariability
          .map((r) => `${r.circuitType}(${r.networkSize})`)
          .join(", ")}. Consider optimizing resource allocation.`
      );
    }

    // Check for slow circuits
    const slowCircuits = results.filter((r) => r.statistics.avgDuration > 30000);
    if (slowCircuits.length > 0) {
      recommendations.push(
        `Slow performance in: ${slowCircuits
          .map((r) => `${r.circuitType}(${r.networkSize})`)
          .join(", ")}. Consider circuit optimization or smaller batch sizes.`
      );
    }

    // Scaling recommendations
    const largeNetworks = results.filter((r) => r.networkSize > 100);
    if (largeNetworks.length > 0 && largeNetworks.some((r) => r.statistics.avgDuration > 15000)) {
      recommendations.push(
        "Consider implementing circuit batching or parallel processing for large networks."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Performance is within acceptable parameters.");
    }

    return recommendations;
  }

  /**
   * Calculate percentile
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get current progress
   */
  getProgress(): number {
    return this.currentProgress;
  }

  /**
   * Check if profiling is running
   */
  isProfilerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Export profiling report
   */
  exportReport(report: ProfilingReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report: ProfilingReport): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Proof Generation Performance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1, h2, h3 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .success { color: #4CAF50; }
    .warning { color: #ff9800; }
    .error { color: #f44336; }
    .recommendation { background: #e3f2fd; padding: 10px; margin: 10px 0; border-left: 4px solid #2196F3; }
  </style>
</head>
<body>
  <h1>Proof Generation Performance Report</h1>
  <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
  
  <h2>Summary</h2>
  <ul>
    <li>Total Tests: ${report.summary.totalTests}</li>
    <li>Total Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s</li>
    <li>Overall Success Rate: ${(report.summary.overallSuccessRate * 100).toFixed(1)}%</li>
  </ul>

  <h2>Recommendations</h2>
  ${report.summary.recommendations.map((r) => `<div class="recommendation">${r}</div>`).join("")}

  <h2>Detailed Results</h2>
  ${report.results
    .map(
      (r) => `
    <h3>${r.circuitType} - ${r.networkSize} attestations</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr><td>Success Rate</td><td class="${r.statistics.successRate > 0.9 ? "success" : "warning"}">${(r.statistics.successRate * 100).toFixed(1)}%</td></tr>
      <tr><td>Avg Duration</td><td>${(r.statistics.avgDuration / 1000).toFixed(2)}s</td></tr>
      <tr><td>Min Duration</td><td>${(r.statistics.minDuration / 1000).toFixed(2)}s</td></tr>
      <tr><td>Max Duration</td><td>${(r.statistics.maxDuration / 1000).toFixed(2)}s</td></tr>
      <tr><td>Std Deviation</td><td>${(r.statistics.stdDev / 1000).toFixed(2)}s</td></tr>
      <tr><td>P50</td><td>${(r.statistics.p50 / 1000).toFixed(2)}s</td></tr>
      <tr><td>P95</td><td>${(r.statistics.p95 / 1000).toFixed(2)}s</td></tr>
      <tr><td>P99</td><td>${(r.statistics.p99 / 1000).toFixed(2)}s</td></tr>
    </table>
  `
    )
    .join("")}
</body>
</html>
    `;
    return html;
  }
}

/**
 * Singleton instance
 */
export const performanceProfiler = new PerformanceProfiler();
