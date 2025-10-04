# ZKML Client-Side Proof Generation

Client-side ZK proof generation using EZKL WASM with circuit caching and hybrid fallback.

## Overview

This module provides:
- **EZKL WASM Integration** - Client-side proof generation in the browser
- **Circuit Caching** - Persistent IndexedDB storage with integrity verification
- **Hybrid Prover** - Automatic fallback from local to remote proof generation
- **Web Worker** - Offloaded computation to prevent UI blocking
- **Progress Tracking** - Real-time updates during proof generation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Thread                             │
│  ┌─────────────────┐       ┌────────────────────────────┐  │
│  │  Hybrid Prover  │──────▶│  Web Worker (proofWorker)  │  │
│  │  Orchestrator   │       │  - EZKL Engine             │  │
│  └─────────────────┘       │  - EBSL Fusion             │  │
│         │                  │  - Progress Reporting      │  │
│         │                  └────────────────────────────┘  │
│         ▼                             │                     │
│  ┌─────────────────┐                 │                     │
│  │ Circuit Manager │◀────────────────┘                     │
│  │  - IndexedDB    │                                        │
│  │  - SHA-256      │                                        │
│  │  - Download     │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ Fallback on error
                     ▼
         ┌────────────────────────┐
         │   Remote API Server    │
         │  - Backend Prover      │
         │  - WebSocket Updates   │
         └────────────────────────┘
```

## Usage

### Basic Proof Generation

```typescript
import { hybridProver } from "$lib/zkml";

// Generate proof with automatic local/remote fallback
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
  onProgress: (progress) => {
    console.log(`${progress.stage}: ${progress.progress}%`);
  },
});

console.log("Proof:", result.proof);
console.log("Mode:", result.mode); // "local", "remote", or "simulation"
console.log("Duration:", result.duration, "ms");
```

### With Circuit Size Selection

```typescript
// Automatically select circuit based on attestation count
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
});

// Manually specify circuit size
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
  circuitSize: "medium", // "small", "medium", or "large"
});
```

### With Timeout and Cancellation

```typescript
// Set timeout
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
  timeout: 30000, // 30 seconds
});

// Cancel running job
hybridProver.cancelJob();
```

### Force Mode Selection

```typescript
// Force remote (skip local attempt)
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
  forceRemote: true,
});

// Force simulation (for testing)
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
  forceSimulation: true,
});
```

## Circuit Management

### Circuit Sizes

Circuits are automatically selected based on attestation count:
- **Small** (≤16 attestations): Fastest, lower memory
- **Medium** (17-64 attestations): Balanced performance
- **Large** (65+ attestations): Handles complex networks

### Circuit Caching

Circuits are downloaded once and cached in IndexedDB with SHA-256 integrity verification:

```typescript
import { circuitManager } from "$lib/zkml";

// Get circuit (downloads if not cached)
const circuit = await circuitManager.getCircuit("medium");

// Check cache statistics
const stats = await circuitManager.getCacheStats();
console.log("Cached circuits:", stats.cachedCircuits);
console.log("Total size:", stats.totalSize, "bytes");

// Clear cache
await circuitManager.clearCache();
```

### Circuit Directory Structure

Expected server directory layout:
```
/circuits/
├── ebsl_small/
│   ├── circuit.compiled
│   ├── proving.key
│   ├── verifying.key
│   ├── kzg.srs
│   ├── settings.json
│   └── metadata.json
├── ebsl_medium/
│   └── ... (same files)
└── ebsl_large/
    └── ... (same files)
```

## Web Worker Integration

The proof worker runs in a separate thread to avoid blocking the UI:

```typescript
// Worker handles:
// 1. EZKL engine initialization
// 2. Circuit loading from cache
// 3. EBSL opinion fusion
// 4. Witness generation
// 5. Proof generation
// 6. Progress reporting
// 7. Cancellation support
```

### Worker Messages

**Initialize:**
```javascript
worker.postMessage({ type: "INIT" });
```

**Generate Proof:**
```javascript
worker.postMessage({
  type: "GENERATE_PROOF",
  jobId: "job-123",
  data: {
    attestations: [...],
    proofType: "exact",
    circuitSize: "medium"
  }
});
```

**Cancel:**
```javascript
worker.postMessage({
  type: "CANCEL",
  data: { jobId: "job-123" }
});
```

### Worker Events

**Progress:**
```javascript
{ type: "PROGRESS", jobId: "job-123", progress: { stage: "Generating proof", progress: 60 } }
```

**Success:**
```javascript
{ type: "PROOF_GENERATED", jobId: "job-123", result: { proof, publicInputs, ... } }
```

**Error:**
```javascript
{ type: "PROOF_ERROR", jobId: "job-123", error: "message" }
```

## Proof Types

### Exact Score Proof

Proves the exact reputation score:

```typescript
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
});
// Public inputs: [score]
```

### Threshold Proof

Proves score is above/below threshold without revealing exact value:

```typescript
const result = await hybridProver.generateProof(attestations, {
  proofType: "threshold",
  threshold: 600000, // 0.6 in fixed-point (1e6)
});
// Public inputs: [threshold, isAbove]
```

## Performance

### Desktop Chrome (16-op proof)

- **Circuit Download**: 2-5 seconds (first time only)
- **Proof Generation**: 5-15 seconds
- **Memory Usage**: 100-300MB peak
- **Progress Events**: ~10 updates during generation

### Fallback Behavior

1. **Try Local First** - Use EZKL WASM in Web Worker
2. **On Error/Timeout** - Fall back to remote API server
3. **Simulation Mode** - Available for testing without EZKL

## Error Handling

The hybrid prover implements comprehensive error handling:

```typescript
try {
  const result = await hybridProver.generateProof(attestations, {
    proofType: "exact",
    timeout: 30000,
  });
} catch (error) {
  if (error.message.includes("timeout")) {
    // Handle timeout
  } else if (error.message.includes("cancelled")) {
    // Handle cancellation
  } else {
    // Handle other errors
  }
}
```

## Integration with Existing Code

### Update ZKMLProver Component

```svelte
<script>
  import { hybridProver } from "$lib/zkml";
  
  async function generateProof() {
    try {
      const result = await hybridProver.generateProof(attestations, {
        proofType,
        threshold,
        onProgress: (p) => {
          progress = p.progress;
          stage = p.stage;
        }
      });
      
      // Update zkProofStore with result
      zkProofActions.setGenerated(
        result.proof,
        result.publicInputs,
        result.hash,
        proofType
      );
    } catch (error) {
      zkProofActions.setError(error.message);
    }
  }
</script>
```

## Testing

### Local Testing

```typescript
// Check if local proving is available
const available = await hybridProver.checkLocalAvailability();
console.log("Local proving:", available ? "available" : "unavailable");

// Test with simulation mode
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
  forceSimulation: true,
});
console.log("Simulation result:", result);
```

### Remote Testing

```typescript
// Test remote fallback
const result = await hybridProver.generateProof(attestations, {
  proofType: "exact",
  forceRemote: true,
});
console.log("Remote result:", result);
```

## Configuration

### Environment Variables

```bash
# Circuit base URL (default: /circuits)
VITE_CIRCUIT_BASE_URL=https://cdn.example.com/circuits

# Remote prover endpoint (default: http://localhost:3001/api/proof/generate)
VITE_REMOTE_PROVER_URL=https://api.example.com/proof/generate
```

## Troubleshooting

### "Failed to load EZKL engine"
- Check that `@ezkljs/engine` is installed: `npm install @ezkljs/engine`
- Verify WASM support in browser
- Check browser console for detailed error

### "Circuit download failed"
- Verify circuit files are available at `/circuits/ebsl_{size}/`
- Check network connectivity
- Verify file permissions

### "IndexedDB not available"
- Check if browser supports IndexedDB
- Verify browser is not in private/incognito mode
- Check storage quota

### Slow Performance
- Use appropriate circuit size for attestation count
- Enable circuit caching for repeated proofs
- Consider using remote prover for large proofs on mobile

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: WASM support may vary, test thoroughly
- **Mobile**: Remote fallback recommended for large proofs

## Security Considerations

- Circuit integrity verified via SHA-256
- IndexedDB storage is origin-isolated
- Worker runs in sandboxed context
- No private keys stored in browser

## Future Enhancements

- [ ] Multi-threaded proving with multiple workers
- [ ] Progressive proof generation (partial results)
- [ ] Circuit preloading/warm-up
- [ ] Compression for cached circuits
- [ ] Service Worker integration for offline support
- [ ] WebGPU acceleration when available

## License

Part of the Shadowgraph Reputation-Gated Airdrop project.
