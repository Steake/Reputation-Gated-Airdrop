/**
 * Performance monitoring and metrics collection for proof generation
 */
/**
 * Performance metrics collector and analyzer
 */
export class MetricsCollector {
    metrics = [];
    maxStoredMetrics = 1000;
    activeProofs = new Map();
    /**
     * Start tracking a proof generation
     */
    startProof(proofId, circuitType, networkSize) {
        const metric = {
            proofId,
            circuitType,
            networkSize,
            startTime: Date.now(),
            success: false,
            resourceUsage: {
                peakMemoryMB: 0,
                avgCpuPercent: 0,
            },
            stages: {},
        };
        this.activeProofs.set(proofId, metric);
    }
    /**
     * Record a stage completion
     */
    recordStage(proofId, stage, durationMs) {
        const metric = this.activeProofs.get(proofId);
        if (metric) {
            metric.stages[stage] = durationMs;
        }
    }
    /**
     * Update resource usage
     */
    updateResourceUsage(proofId, memoryMB, cpuPercent) {
        const metric = this.activeProofs.get(proofId);
        if (metric) {
            metric.resourceUsage.peakMemoryMB = Math.max(metric.resourceUsage.peakMemoryMB, memoryMB);
            // Simple moving average for CPU
            const currentAvg = metric.resourceUsage.avgCpuPercent;
            metric.resourceUsage.avgCpuPercent =
                currentAvg === 0 ? cpuPercent : (currentAvg + cpuPercent) / 2;
        }
    }
    /**
     * Complete a proof tracking
     */
    completeProof(proofId, success, error) {
        const metric = this.activeProofs.get(proofId);
        if (metric) {
            metric.endTime = Date.now();
            metric.durationMs = metric.endTime - metric.startTime;
            metric.success = success;
            metric.error = error;
            this.metrics.push(metric);
            this.activeProofs.delete(proofId);
            // Limit stored metrics
            if (this.metrics.length > this.maxStoredMetrics) {
                this.metrics = this.metrics.slice(-this.maxStoredMetrics);
            }
        }
    }
    /**
     * Get current metrics snapshot
     */
    getSnapshot() {
        const completed = this.metrics.filter((m) => m.endTime);
        const successful = completed.filter((m) => m.success);
        const failed = completed.filter((m) => !m.success);
        const durations = completed
            .filter((m) => m.durationMs !== undefined)
            .map((m) => m.durationMs)
            .sort((a, b) => a - b);
        const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        const p50 = this.getPercentile(durations, 0.5);
        const p95 = this.getPercentile(durations, 0.95);
        const p99 = this.getPercentile(durations, 0.99);
        const successRate = completed.length > 0 ? successful.length / completed.length : 0;
        // Current resource usage (from active proofs)
        let totalMemory = 0;
        let totalCpu = 0;
        let activeCount = 0;
        this.activeProofs.forEach((metric) => {
            totalMemory += metric.resourceUsage.peakMemoryMB;
            totalCpu += metric.resourceUsage.avgCpuPercent;
            activeCount++;
        });
        return {
            timestamp: Date.now(),
            activeProofs: this.activeProofs.size,
            completedProofs: successful.length,
            failedProofs: failed.length,
            avgDurationMs: avgDuration,
            p50DurationMs: p50,
            p95DurationMs: p95,
            p99DurationMs: p99,
            successRate,
            queueLength: 0, // Will be set by queue manager
            resourceUsage: {
                memoryMB: activeCount > 0 ? totalMemory / activeCount : 0,
                cpuPercent: activeCount > 0 ? totalCpu / activeCount : 0,
            },
        };
    }
    /**
     * Predict proof generation time based on historical data
     */
    predictDuration(circuitType, networkSize) {
        const relevantMetrics = this.metrics.filter((m) => m.circuitType === circuitType &&
            m.success &&
            m.durationMs !== undefined &&
            Math.abs(m.networkSize - networkSize) / networkSize < 0.3 // Within 30% of size
        );
        if (relevantMetrics.length === 0) {
            // No data, use default estimate
            return {
                estimatedDurationMs: 5000 + networkSize * 10, // Simple linear estimate
                confidence: 0.1,
                basedOnSamples: 0,
            };
        }
        const durations = relevantMetrics.map((m) => m.durationMs).sort((a, b) => a - b);
        const median = this.getPercentile(durations, 0.5);
        const p75 = this.getPercentile(durations, 0.75);
        // Use P75 as estimate (more conservative than median)
        const estimate = p75;
        // Confidence based on sample size and variance
        const sampleSize = relevantMetrics.length;
        const variance = this.calculateVariance(durations);
        const varianceComponent = median > 0 && variance > 0 ? (1 / (1 + variance / median)) * 0.2 : 0.1;
        const confidence = Math.min(0.9, 0.3 + (sampleSize / 100) * 0.5 + varianceComponent);
        return {
            estimatedDurationMs: estimate,
            confidence,
            basedOnSamples: sampleSize,
        };
    }
    /**
     * Get performance benchmarks by circuit type
     */
    getBenchmarksByCircuit(circuitType) {
        const relevant = this.metrics.filter((m) => m.circuitType === circuitType && m.endTime);
        if (relevant.length === 0) {
            return {
                avgDurationMs: 0,
                successRate: 0,
                sampleCount: 0,
            };
        }
        const successful = relevant.filter((m) => m.success);
        const durations = relevant.filter((m) => m.durationMs !== undefined).map((m) => m.durationMs);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        return {
            avgDurationMs: avgDuration,
            successRate: successful.length / relevant.length,
            sampleCount: relevant.length,
        };
    }
    /**
     * Get historical metrics for analysis
     */
    getHistoricalMetrics(limit = 100) {
        return this.metrics.slice(-limit);
    }
    /**
     * Clear all metrics
     */
    clear() {
        this.metrics = [];
        this.activeProofs.clear();
    }
    /**
     * Export metrics for external analysis
     */
    exportMetrics() {
        return JSON.stringify({
            activeProofs: Array.from(this.activeProofs.values()),
            completedMetrics: this.metrics,
            snapshot: this.getSnapshot(),
        });
    }
    /**
     * Calculate percentile from sorted array
     */
    getPercentile(sortedArray, percentile) {
        if (sortedArray.length === 0)
            return 0;
        const index = Math.ceil(sortedArray.length * percentile) - 1;
        return sortedArray[Math.max(0, index)];
    }
    /**
     * Calculate variance
     */
    calculateVariance(values) {
        if (values.length === 0)
            return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }
}
/**
 * Singleton instance of metrics collector
 */
export const metricsCollector = new MetricsCollector();
//# sourceMappingURL=metrics.js.map