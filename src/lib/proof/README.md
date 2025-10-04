# Proof Generation Pipeline

Comprehensive proof generation pipeline with reliability, error recovery, and performance monitoring.

## Features

### 🔄 End-to-End Orchestration

- Complete workflow from attestations to verified proofs
- Automatic proof validation and integrity checks
- Progressive status reporting for real-time user feedback
- Resource cleanup and management

### ⚡ Reliability & Error Recovery

- **Automatic Retry**: Exponential backoff strategy with configurable retry limits
- **Circuit Fallback**: Automatic fallback to smaller circuits on resource errors
- **Resource Optimization**: Memory and CPU management with garbage collection
- **Error Classification**: 26+ error types with automatic categorization
- **Recovery Strategies**: Pluggable recovery mechanisms

### 📊 Performance Monitoring

- Real-time metrics collection during proof generation
- Performance prediction based on historical data
- Resource usage tracking (CPU, memory, disk)
- Percentile calculations (P50, P95, P99)
- Circuit-specific benchmarks

### 🚦 Queue Management

- Priority queue with 4 levels (LOW, NORMAL, HIGH, CRITICAL)
- Concurrent processing control (configurable max workers)
- Queue statistics and analytics
- Request progress tracking
- Automatic queue size limits

### 🔒 Security & Validation

- Proof integrity validation before submission
- Tampering detection via hash verification
- Access control and user management
- Rate limiting (configurable per user)
- Comprehensive audit logging

### 💾 Caching & Integration

- LRU cache for completed proofs
- WebSocket support for real-time updates
- RESTful API compatible
- Deterministic cache key generation

## Quick Start

```typescript
import { proofAPI } from "$lib/proof";

// Simple proof generation with caching
const result = await proofAPI.requestProof(attestations, "exact", {
  priority: ProofPriority.HIGH,
  userId: "0x123...",
  onProgress: (progress) => {
    console.log(`${progress.stage}: ${progress.progress}%`);
  },
});

// Access proof data
console.log("Proof:", result.proof);
console.log("Public inputs:", result.publicInputs);
console.log("Hash:", result.hash);
```

## Architecture

### Core Modules

1. **pipeline.ts** - Main orchestration logic
   - End-to-end proof generation flow
   - Retry and fallback mechanisms
   - Worker management

2. **errors.ts** - Error handling framework
   - Error classification and types
   - Recovery strategies
   - Error classifier

3. **metrics.ts** - Performance monitoring
   - Metrics collection
   - Historical analysis
   - Performance prediction

4. **queue.ts** - Request queue management
   - Priority queue implementation
   - State management with Svelte stores
   - Statistics tracking

5. **validation.ts** - Security and validation
   - Proof validation
   - Access control
   - Audit logging

6. **api.ts** - High-level API
   - Proof cache
   - WebSocket integration
   - Request orchestration

## Usage Examples

### Basic Proof Generation

```typescript
import { proofPipeline, ProofPriority } from "$lib/proof";

const result = await proofPipeline.generateProof(attestations, "threshold", {
  priority: ProofPriority.NORMAL,
  maxRetries: 3,
  timeoutMs: 120000,
});
```

### With Progress Tracking

```typescript
await proofPipeline.generateProof(
  attestations,
  "exact",
  { priority: ProofPriority.HIGH },
  (progress) => {
    console.log(`Stage: ${progress.stage}`);
    console.log(`Progress: ${progress.progress}%`);
    if (progress.estimatedRemainingMs) {
      console.log(`ETA: ${progress.estimatedRemainingMs}ms`);
    }
  }
);
```

### Using the Queue Directly

```typescript
import { proofQueue, ProofPriority } from "$lib/proof";

// Enqueue request
const requestId = proofQueue.enqueue(attestations, "exact", ProofPriority.CRITICAL);

// Monitor progress
const request = proofQueue.getRequest(requestId);
console.log(`Status: ${request?.status}`);
console.log(`Progress: ${request?.progress}%`);

// Get queue stats
const stats = proofQueue.getStats();
console.log(`Queued: ${stats.totalQueued}`);
console.log(`Processing: ${stats.totalProcessing}`);
console.log(`Completed: ${stats.totalCompleted}`);
```

### Performance Monitoring

```typescript
import { metricsCollector } from "$lib/proof";

// Get current snapshot
const snapshot = metricsCollector.getSnapshot();
console.log(`Active proofs: ${snapshot.activeProofs}`);
console.log(`Success rate: ${snapshot.successRate * 100}%`);
console.log(`P95 duration: ${snapshot.p95DurationMs}ms`);

// Predict proof time
const prediction = metricsCollector.predictDuration("default", 50);
console.log(`Estimated time: ${prediction.estimatedDurationMs}ms`);
console.log(`Confidence: ${prediction.confidence * 100}%`);
```

### Error Handling

```typescript
import { ProofGenerationError, ProofErrorType } from "$lib/proof";

try {
  const result = await proofPipeline.generateProof(attestations, "exact");
} catch (error) {
  if (error instanceof ProofGenerationError) {
    console.log(`Error type: ${error.type}`);
    console.log(`Severity: ${error.severity}`);
    console.log(`Retryable: ${error.isRetryable()}`);
    console.log(`Fallback available: ${error.hasFallback()}`);
  }
}
```

### Access Control

```typescript
import { accessControl } from "$lib/proof";

// Check rate limit
if (!accessControl.checkRateLimit(userId)) {
  const remaining = accessControl.getRemainingRequests(userId);
  throw new Error(`Rate limit exceeded. ${remaining} requests remaining.`);
}
```

### Audit Logging

```typescript
import { auditLogger } from "$lib/proof";

// Get recent activity
const logs = auditLogger.getRecentLogs(50);

// Get logs for specific user
const userLogs = auditLogger.getLogsForUser("0x123...");

// Export logs
const json = auditLogger.exportLogs();
```

## Configuration

### Pipeline Options

```typescript
interface ProofGenerationOptions {
  priority?: ProofPriority; // Queue priority
  circuitType?: string; // Circuit to use
  maxRetries?: number; // Max retry attempts (default: 3)
  timeoutMs?: number; // Timeout per attempt (default: 120000)
  enableFallback?: boolean; // Enable circuit fallback (default: true)
  userId?: string; // User ID for access control
}
```

### Error Types

- Circuit Errors: `CIRCUIT_COMPILATION_FAILED`, `CIRCUIT_LOAD_FAILED`, `CIRCUIT_NOT_FOUND`
- Witness Errors: `WITNESS_PREPARATION_FAILED`, `INVALID_WITNESS_DATA`
- Proof Errors: `PROOF_GENERATION_FAILED`, `PROOF_GENERATION_TIMEOUT`, `PROOF_VALIDATION_FAILED`
- Resource Errors: `OUT_OF_MEMORY`, `RESOURCE_EXHAUSTED`, `WORKER_UNAVAILABLE`
- Network Errors: `NETWORK_ERROR`, `API_ERROR`
- System Errors: `SYSTEM_OVERLOAD`, `INTERNAL_ERROR`

### Priority Levels

```typescript
enum ProofPriority {
  LOW = 0, // Background processing
  NORMAL = 1, // Default priority
  HIGH = 2, // User-initiated requests
  CRITICAL = 3, // Time-sensitive operations
}
```

## Testing

```bash
# Run all proof pipeline tests
npm run test:unit -- tests/unit/proof-*.test.ts

# Run specific test suite
npm run test:unit -- tests/unit/proof-errors.test.ts
npm run test:unit -- tests/unit/proof-metrics.test.ts
npm run test:unit -- tests/unit/proof-queue.test.ts
npm run test:unit -- tests/unit/proof-validation.test.ts
```

### Test Coverage

- **Error Handling**: 18 test cases covering error classification, retry strategies, and fallback mechanisms
- **Metrics**: 16 test cases for performance tracking and prediction
- **Queue**: 14 test cases for priority queue and concurrency management
- **Validation**: 22 test cases for proof validation, access control, and audit logging

## Performance

### Benchmarks

Based on typical usage patterns:

- **Small circuits** (10-50 attestations): ~2-5 seconds
- **Medium circuits** (50-200 attestations): ~5-15 seconds
- **Large circuits** (200+ attestations): ~15-60 seconds

### Resource Usage

- **Memory**: Peak ~50-200MB per proof (varies by circuit size)
- **CPU**: ~30-70% during active proof generation
- **Disk**: Minimal (cache only)

### Concurrency

- Default max concurrent: 4 workers
- Queue capacity: 100 requests
- Cache capacity: 50 proofs (LRU eviction)

## Integration

### With Existing ZK Proof Store

```typescript
import { zkProofActions } from "$lib/stores/zkproof";
import { proofAPI } from "$lib/proof";

// Generate and update store
zkProofActions.setGenerating();
try {
  const result = await proofAPI.requestProof(attestations, "exact", {
    onProgress: (progress) => {
      // Update UI with progress
    },
  });

  zkProofActions.setGenerated(result.proof, result.publicInputs, result.hash, "exact");
} catch (error) {
  zkProofActions.setError(error.message);
}
```

### With WebSocket Updates

```typescript
import { proofAPI } from "$lib/proof";

const result = await proofAPI.requestProofWithWebSocket(
  attestations,
  "exact",
  "ws://localhost:3000/proofs",
  {
    onProgress: (progress) => {
      // Real-time updates via WebSocket
    },
  }
);
```

## Future Enhancements

- [ ] Distributed worker pool for horizontal scaling
- [ ] Advanced circuit optimization based on network topology
- [ ] Machine learning-based performance prediction
- [ ] Proof batching for multiple users
- [ ] Cross-device proof generation coordination
- [ ] Advanced caching strategies (distributed cache)

## Contributing

When adding new features:

1. Add appropriate error types to `errors.ts`
2. Instrument with metrics in `metrics.ts`
3. Add validation rules in `validation.ts`
4. Write comprehensive tests
5. Update this documentation

## License

Part of the Shadowgraph Reputation-Gated Airdrop project.
