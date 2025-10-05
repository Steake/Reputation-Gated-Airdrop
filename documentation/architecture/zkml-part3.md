# ZKML Architecture - Part 3: Implementation & Deployment

**Document Version:** 1.0  
**Last Updated:** October 2, 2025  
**Status:** Architecture Specification

---

## Table of Contents

1. [Implementation Roadmap](#implementation-roadmap)
2. [Testing Strategy](#testing-strategy)
3. [Deployment Strategy](#deployment-strategy)
4. [Monitoring & Observability](#monitoring--observability)
5. [Operational Procedures](#operational-procedures)

---

## Implementation Roadmap

### 16-Week Phased Rollout

```
Phase 1: MVP (Server-Side Proofs)     │ Weeks 1-4
Phase 2: Hybrid Model                 │ Weeks 5-8
Phase 3: Full Client-Side             │ Weeks 9-12
Phase 4: Production Hardening         │ Weeks 13-16
```

---

### Phase 1: MVP with Server-Side Proofs (Weeks 1-4)

**Goal:** Replace mock proofs with real EZKL proofs via backend service

#### Week 1: Foundation Setup

**Tasks:**

- [ ] Set up EZKL Python environment (`Notebooks/EBSL_EZKL.py` as reference)
- [ ] Export PyTorch EBSL model to ONNX (circuit size: 16)
- [ ] Generate EZKL settings, compile circuit
- [ ] Create proving/verifying keys (SRS)
- [ ] Deploy Solidity verifier contract to testnet

**Deliverables:**

```bash
/circuits/
  /phase1/
    ebsl_16.onnx          # Exported PyTorch model
    ebsl_16_settings.json # EZKL configuration
    ebsl_16_compiled.pkl  # Compiled circuit
    ebsl_16_pk.key        # Proving key
    ebsl_16_vk.key        # Verifying key
/contracts/
  EBSLVerifier16.sol      # Generated Solidity verifier
```

**Success Criteria:**

- ✅ Can generate proof for 16 opinions in Python
- ✅ Can verify proof in Python
- ✅ Can verify proof on-chain (Sepolia)

#### Week 2: Backend Proof Service

**Tasks:**

- [ ] Create FastAPI backend service
- [ ] Implement `/api/v1/generate-proof` endpoint
- [ ] Add request validation (max 16 opinions)
- [ ] Implement rate limiting (10 req/min per IP)
- [ ] Add proof caching (Redis, 1 hour TTL)
- [ ] Deploy to cloud (AWS Lambda / GCP Cloud Run)

**API Specification:**

```python
# backend/api/proof_service.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import ezkl
import json

app = FastAPI()

class ProofRequest(BaseModel):
    attestations: list[dict]
    proof_type: str  # "exact" | "threshold"
    parameters: dict

class ProofResponse(BaseModel):
    proof: list[int]
    public_inputs: list[int]
    proof_hash: str
    generation_time: float

@app.post("/api/v1/generate-proof")
async def generate_proof(request: ProofRequest) -> ProofResponse:
    # 1. Validate request
    if len(request.attestations) > 16:
        raise HTTPException(400, "Max 16 attestations")

    # 2. Prepare witness
    witness = prepare_witness(request.attestations)

    # 3. Generate proof using EZKL
    start_time = time.time()
    proof_data = await ezkl.prove(
        witness_path="witness.json",
        compiled_circuit_path="circuits/ebsl_16_compiled.pkl",
        pk_path="circuits/ebsl_16_pk.key",
        proof_path="proof.json"
    )
    generation_time = time.time() - start_time

    # 4. Parse proof
    with open("proof.json") as f:
        proof = json.load(f)

    return ProofResponse(
        proof=proof["proof"],
        public_inputs=proof["instances"],
        proof_hash=compute_hash(proof),
        generation_time=generation_time
    )
```

**Deployment:**

```yaml
# docker-compose.yml
version: "3.8"
services:
  proof-service:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - MAX_WORKERS=4
      - RATE_LIMIT=10/minute
    volumes:
      - ./circuits:/app/circuits:ro
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

**Success Criteria:**

- ✅ API responds in <15 seconds for 16 opinions
- ✅ Rate limiting prevents abuse
- ✅ Proofs verify on-chain successfully

#### Week 3: Client Integration

**Tasks:**

- [ ] Update `ZKMLProver.svelte` to call backend API
- [ ] Implement loading states and progress UI
- [ ] Add error handling for API failures
- [ ] Update `zkproof.ts` store for real proof data
- [ ] Add proof verification in client before submission
- [ ] Update environment config with API endpoint

**Client Code:**

```typescript
// src/lib/zkml/proof-service-client.ts

export class ProofServiceClient {
  private apiBase: string;

  constructor() {
    const config = parseConfig();
    this.apiBase = config.API_BASE || "http://localhost:8000";
  }

  async generateProof(attestations: TrustAttestation[], proofType: ProofType): Promise<ZKProof> {
    const response = await fetch(`${this.apiBase}/api/v1/generate-proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attestations: attestations.map((a) => ({
          source: a.source,
          target: a.target,
          opinion: a.opinion,
          signature: a.signature,
        })),
        proof_type: proofType,
        parameters: {},
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Proof generation failed");
    }

    const data = await response.json();
    return {
      proof: data.proof,
      publicInputs: data.public_inputs,
      hash: data.proof_hash,
      proofType,
      generatedAt: Date.now(),
      generationTime: data.generation_time,
    };
  }
}
```

**Success Criteria:**

- ✅ User can generate real proof from UI
- ✅ Loading spinner shows during generation
- ✅ Error messages display on failure
- ✅ Generated proof submits to contract successfully

#### Week 4: Testing & Documentation

**Tasks:**

- [ ] Write integration tests (client → backend → chain)
- [ ] Load testing (100 concurrent requests)
- [ ] Security audit of API (OWASP Top 10)
- [ ] Document API usage and limits
- [ ] Create user guide for Phase 1

**Testing:**

```typescript
// tests/e2e/proof-generation.test.ts

describe("Phase 1: Server-Side Proof Generation", () => {
  it("generates valid proof for 16 attestations", async () => {
    const attestations = generateMockAttestations(16);
    const proof = await proofService.generateProof(attestations, "exact");

    expect(proof.proof).toHaveLength(8); // Halo2 proof components
    expect(proof.publicInputs[0]).toBeGreaterThan(0);

    // Verify on-chain
    const isValid = await verifierContract.verifyReputationProof(proof.proof, proof.publicInputs);
    expect(isValid).toBe(true);
  });

  it("enforces rate limits", async () => {
    const requests = Array(20)
      .fill(null)
      .map(() => proofService.generateProof(mockAttestations, "exact"));

    const results = await Promise.allSettled(requests);
    const rejected = results.filter((r) => r.status === "rejected");

    expect(rejected.length).toBeGreaterThan(0);
  });
});
```

**Phase 1 Complete:** ✅ Users can generate real ZK proofs (via backend)

---

### Phase 2: Hybrid Model (Weeks 5-8)

**Goal:** Enable client-side proof generation for small circuits (≤32 opinions) with backend fallback

#### Week 5: EZKL WASM Compilation

**Tasks:**

- [ ] Compile EZKL to WebAssembly (Rust → WASM)
- [ ] Create JavaScript bindings
- [ ] Test WASM module in browser
- [ ] Measure bundle size and load time
- [ ] Implement lazy loading strategy

**WASM Build:**

```bash
# Build EZKL with WASM target
cd ezkl
cargo build --target wasm32-unknown-unknown --release

# Generate JS bindings with wasm-bindgen
wasm-bindgen target/wasm32-unknown-unknown/release/ezkl.wasm \
  --out-dir pkg \
  --target web \
  --no-typescript

# Optimize WASM binary
wasm-opt pkg/ezkl_bg.wasm -O3 -o pkg/ezkl_optimized.wasm

# Result: ~3-5MB WASM module
```

**JavaScript Wrapper:**

```typescript
// src/lib/zkml/ezkl-wasm.ts

let wasmModule: any = null;

export async function loadEZKLWasm(): Promise<EZKLWasmAPI> {
  if (wasmModule) return wasmModule;

  // Lazy load WASM (code-splitting)
  const { default: init, prove, verify } = await import("$lib/wasm/ezkl_wasm.js");

  // Initialize WASM module
  await init();

  wasmModule = { prove, verify };
  return wasmModule;
}

export interface EZKLWasmAPI {
  prove(witness: Uint8Array, circuit: Uint8Array): Promise<Uint8Array>;
  verify(proof: Uint8Array, circuit: Uint8Array): Promise<boolean>;
}
```

**Success Criteria:**

- ✅ WASM module loads in <2 seconds
- ✅ Bundle size <5MB
- ✅ Proof generation works in Chrome/Firefox/Safari

#### Week 6: Hybrid Prover Implementation

**Tasks:**

- [ ] Implement `HybridProver` class
- [ ] Add circuit size detection logic
- [ ] Implement fallback mechanism
- [ ] Add telemetry for success/failure tracking
- [ ] Update UI to show proof method (local/remote)

**Implementation:**

```typescript
// src/lib/zkml/hybrid-prover.ts

export class HybridProver {
  private localProver: ClientSideProver | null = null;
  private remoteProver: ProofServiceClient;

  async initialize() {
    try {
      this.localProver = new ClientSideProver();
      await this.localProver.initialize();
      console.log("✅ Local prover ready");
    } catch (error) {
      console.warn("⚠️ Local prover unavailable, using remote only");
    }

    this.remoteProver = new ProofServiceClient();
  }

  async generateProof(attestations: TrustAttestation[], proofType: ProofType): Promise<ZKProof> {
    // Try local first for small circuits
    if (this.localProver && attestations.length <= 32) {
      try {
        console.log("🔄 Attempting local proof generation...");
        const proof = await this.localProver.generateProof(attestations, proofType);

        // Track success
        trackProofMethod("local", "success");
        return proof;
      } catch (error) {
        console.warn("❌ Local proof failed:", error);
        trackProofMethod("local", "failure");
        // Continue to fallback
      }
    }

    // Fallback to remote
    console.log("🌐 Using remote proof service...");
    const proof = await this.remoteProver.generateProof(attestations, proofType);
    trackProofMethod("remote", "success");

    return proof;
  }
}
```

**Success Criteria:**

- ✅ <32 opinions: tries local first
- ✅ >32 opinions: uses remote
- ✅ Local failure: gracefully falls back
- ✅ Telemetry tracks method used

#### Week 7: Circuit Optimization

**Tasks:**

- [ ] Generate circuits for sizes: 16, 32, 64
- [ ] Implement circuit caching (IndexedDB)
- [ ] Preload circuits on app init
- [ ] Compress circuits (gzip/brotli)
- [ ] Add circuit integrity verification (hash check)

**Circuit Management:**

```typescript
// src/lib/zkml/circuit-manager.ts

export class CircuitManager {
  private cache = new Map<number, CircuitData>();
  private db: IDBDatabase;

  async initialize() {
    this.db = await openCircuitDB();
    await this.preloadCommonCircuits();
  }

  async getCircuit(size: number): Promise<CircuitData> {
    // Check memory cache
    if (this.cache.has(size)) {
      return this.cache.get(size)!;
    }

    // Check IndexedDB
    const cached = await this.loadFromDB(size);
    if (cached && (await this.verifyIntegrity(cached))) {
      this.cache.set(size, cached);
      return cached;
    }

    // Download from CDN
    const circuit = await this.downloadCircuit(size);
    await this.saveToDB(size, circuit);
    this.cache.set(size, circuit);

    return circuit;
  }

  private async downloadCircuit(size: number): Promise<CircuitData> {
    const [compiled, settings, vk] = await Promise.all([
      fetch(`/circuits/ebsl_${size}_compiled.wasm`).then((r) => r.arrayBuffer()),
      fetch(`/circuits/ebsl_${size}_settings.json`).then((r) => r.json()),
      fetch(`/circuits/ebsl_${size}_vk.key`).then((r) => r.arrayBuffer()),
    ]);

    return {
      compiled: new Uint8Array(compiled),
      settings,
      verifyingKey: new Uint8Array(vk),
      size,
      hash: await this.computeHash(compiled),
    };
  }

  private async verifyIntegrity(circuit: CircuitData): Promise<boolean> {
    const computedHash = await this.computeHash(circuit.compiled);
    const expectedHash = CIRCUIT_HASHES[circuit.size];
    return computedHash === expectedHash;
  }
}

// Known circuit hashes (from build)
const CIRCUIT_HASHES: Record<number, string> = {
  16: "0x1234...", // SHA256 of ebsl_16_compiled.wasm
  32: "0x5678...",
  64: "0x9abc...",
};
```

**Success Criteria:**

- ✅ Circuits cached persistently
- ✅ Preloading completes in <5 seconds
- ✅ Integrity checks prevent tampering

#### Week 8: Testing & Optimization

**Tasks:**

- [ ] Benchmark local vs remote performance
- [ ] Test on mobile browsers (iOS/Android)
- [ ] Optimize memory usage during proving
- [ ] Add progressive enhancement (disable if slow)
- [ ] Document hybrid mode tradeoffs

**Performance Benchmarks:**

```typescript
// tests/benchmark/proof-performance.test.ts

describe("Hybrid Prover Performance", () => {
  it("local prover is faster for <32 opinions", async () => {
    const attestations = generateMockAttestations(16);

    const localStart = performance.now();
    await hybridProver.localProver.generateProof(attestations, "exact");
    const localTime = performance.now() - localStart;

    const remoteStart = performance.now();
    await hybridProver.remoteProver.generateProof(attestations, "exact");
    const remoteTime = performance.now() - remoteStart;

    expect(localTime).toBeLessThan(remoteTime);
    expect(localTime).toBeLessThan(10000); // <10s
  });
});
```

**Phase 2 Complete:** ✅ Client-side proofs working with backend fallback

---

### Phase 3: Full Client-Side (Weeks 9-12)

**Goal:** 100% client-side proof generation, no backend dependency

#### Week 9: Large Circuit Support

**Tasks:**

- [ ] Generate circuits for sizes: 128, 256
- [ ] Implement Web Worker proof generation
- [ ] Add progress reporting during proof
- [ ] Handle out-of-memory errors gracefully
- [ ] Test on low-end devices

**Web Worker:**

```typescript
// src/lib/workers/proof-worker.ts

import { ClientSideProver } from "$lib/zkml/client-prover";

let prover: ClientSideProver;

self.addEventListener("message", async (event) => {
  const { type, data, id } = event.data;

  try {
    switch (type) {
      case "init":
        prover = new ClientSideProver();
        await prover.initialize();
        self.postMessage({ type: "init-complete", id });
        break;

      case "prove":
        const proof = await prover.generateProof(data.attestations, data.proofType, (progress) => {
          self.postMessage({ type: "progress", progress, id });
        });
        self.postMessage({ type: "proof-complete", proof, id });
        break;
    }
  } catch (error) {
    self.postMessage({ type: "error", error: error.message, id });
  }
});
```

**Worker Manager:**

```typescript
// src/lib/zkml/worker-manager.ts

export class ProofWorkerManager {
  private worker: Worker;
  private callbacks = new Map<string, (data: any) => void>();

  constructor() {
    this.worker = new Worker(new URL("../workers/proof-worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.addEventListener("message", (event) => {
      const { type, id, ...data } = event.data;
      const callback = this.callbacks.get(id);
      if (callback) callback({ type, ...data });
    });
  }

  async generateProof(
    attestations: TrustAttestation[],
    proofType: ProofType,
    onProgress: (p: number) => void
  ): Promise<ZKProof> {
    const id = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.callbacks.set(id, ({ type, proof, error, progress }) => {
        if (type === "progress") {
          onProgress(progress);
        } else if (type === "proof-complete") {
          this.callbacks.delete(id);
          resolve(proof);
        } else if (type === "error") {
          this.callbacks.delete(id);
          reject(new Error(error));
        }
      });

      this.worker.postMessage({
        type: "prove",
        data: { attestations, proofType },
        id,
      });
    });
  }
}
```

**Success Criteria:**

- ✅ Can generate proofs for up to 256 opinions
- ✅ UI remains responsive during generation
- ✅ Progress bar updates smoothly

#### Week 10: Advanced Proof Types

**Tasks:**

- [ ] Implement threshold proofs
- [ ] Implement anonymous proofs (Semaphore)
- [ ] Implement set membership proofs
- [ ] Add proof type selector UI
- [ ] Test all proof types on-chain

**Threshold Proof:**

```typescript
async function generateThresholdProof(
  attestations: TrustAttestation[],
  threshold: number
): Promise<ZKProof> {
  // Compute actual score
  const reputation = ebslEngine.computeReputation(userAddress, attestations);
  const score = reputation.score;
  const isAbove = score >= threshold;

  // Prepare witness (includes threshold as private input)
  const witness = {
    opinions: attestations.map((a) => [
      a.opinion.belief,
      a.opinion.disbelief,
      a.opinion.uncertainty,
      a.opinion.base_rate,
    ]),
    mask: attestations.map(() => true),
    threshold: threshold,
    expected_result: isAbove ? 1 : 0,
  };

  // Generate proof
  const circuit = await circuitManager.getCircuit(attestations.length);
  const proof = await ezkl.prove(witness, circuit);

  return {
    proof: proof.proof,
    publicInputs: [threshold, isAbove ? 1 : 0], // Only reveal threshold & boolean
    proofType: "threshold",
    hash: computeProofHash(proof),
  };
}
```

**Success Criteria:**

- ✅ All 4 proof types work end-to-end
- ✅ Correct public inputs for each type
- ✅ On-chain verification succeeds

#### Week 11: Offline Mode & Caching

**Tasks:**

- [ ] Implement service worker for offline support
- [ ] Cache circuits persistently
- [ ] Enable proof generation without network
- [ ] Add "offline ready" indicator
- [ ] Test airplane mode scenario

**Service Worker:**

```typescript
// src/service-worker.ts

import { build, files, version } from "$service-worker";

const CACHE_NAME = `shadowgraph-zkml-${version}`;

const STATIC_ASSETS = [
  ...build, // App code
  ...files, // Static files
  "/circuits/ebsl_16_compiled.wasm",
  "/circuits/ebsl_32_compiled.wasm",
  "/circuits/ebsl_64_compiled.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Circuit files: cache-first
  if (request.url.includes("/circuits/")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
```

**Success Criteria:**

- ✅ App works offline after first load
- ✅ Circuits cached for 30 days
- ✅ Can generate proofs without internet

#### Week 12: Production Polish

**Tasks:**

- [ ] Add error recovery (retry logic)
- [ ] Implement proof history (user's past proofs)
- [ ] Add analytics (proof generation metrics)
- [ ] Performance monitoring (Sentry)
- [ ] User documentation and help tooltips

**Phase 3 Complete:** ✅ Fully client-side ZK proof generation

---

### Phase 4: Production Hardening (Weeks 13-16)

**Goal:** Security, scalability, and operational excellence

#### Week 13: Security Audit

**Tasks:**

- [ ] Third-party security audit of circuits
- [ ] Penetration testing of contracts
- [ ] Code review of proof generation logic
- [ ] Fuzzing tests for edge cases
- [ ] Dependency vulnerability scan

**Audit Checklist:**

```markdown
## Security Audit Checklist

### Smart Contracts

- [ ] Reentrancy protection
- [ ] Integer overflow/underflow
- [ ] Access control (onlyOwner)
- [ ] Replay attack prevention
- [ ] Front-running mitigation
- [ ] Gas optimization
- [ ] Emergency pause mechanism

### ZK Circuits

- [ ] Circuit soundness (no false accepts)
- [ ] Circuit completeness (no false rejects)
- [ ] Constraint system correctness
- [ ] Input validation
- [ ] Fixed-point arithmetic safety
- [ ] Edge case handling (0, max values)

### Client-Side Code

- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure local storage
- [ ] Dependency vulnerabilities
- [ ] WASM integrity checks
- [ ] Content Security Policy
```

**Success Criteria:**

- ✅ No critical vulnerabilities found
- ✅ All medium/high issues resolved
- ✅ Audit report published

#### Week 14: Performance Optimization

**Tasks:**

- [ ] Optimize circuit sizes (reduce constraints)
- [ ] Parallel proof generation (multiple workers)
- [ ] Circuit preloading on app start
- [ ] Memory pooling for large proofs
- [ ] Lazy loading for large circuits

**Optimization:**

```typescript
// Parallel proof generation for multiple users
class ParallelProver {
  private workers: ProofWorkerManager[] = [];
  private maxWorkers = navigator.hardwareConcurrency || 4;

  constructor() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.workers.push(new ProofWorkerManager());
    }
  }

  async generateProofs(requests: ProofRequest[]): Promise<ZKProof[]> {
    // Distribute work across workers
    const chunks = this.chunkArray(requests, this.maxWorkers);

    const results = await Promise.all(
      chunks.map((chunk, i) => this.workers[i].generateProof(chunk.attestations, chunk.proofType))
    );

    return results;
  }
}
```

**Success Criteria:**

- ✅ Proof time <25s for 256 opinions
- ✅ Memory usage <500MB during proof
- ✅ No memory leaks

#### Week 15: Scalability Testing

**Tasks:**

- [ ] Load test (1000 concurrent users)
- [ ] Stress test (10,000 proofs/day)
- [ ] Test on low-end devices (2GB RAM phones)
- [ ] Test on slow networks (3G)
- [ ] Browser compatibility matrix

**Load Test:**

```typescript
// tests/load/proof-generation.test.ts

import { chromium } from "playwright";

describe("Load Testing", () => {
  it("handles 1000 concurrent proof generations", async () => {
    const browsers = await Promise.all(
      Array(1000)
        .fill(null)
        .map(() => chromium.launch())
    );

    const startTime = Date.now();

    const results = await Promise.allSettled(
      browsers.map(async (browser) => {
        const page = await browser.newPage();
        await page.goto("http://localhost:5173/claim");

        // Trigger proof generation
        await page.click("#generate-proof-btn");

        // Wait for completion (max 60s)
        await page.waitForSelector("#proof-complete", { timeout: 60000 });

        await browser.close();
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const avgTime = (Date.now() - startTime) / successful;

    expect(successful / 1000).toBeGreaterThan(0.95); // 95% success rate
    expect(avgTime).toBeLessThan(30000); // <30s average
  });
});
```

**Success Criteria:**

- ✅ 95%+ success rate under load
- ✅ <30s average proof time under load
- ✅ Works on devices with 2GB RAM

#### Week 16: Launch Preparation

**Tasks:**

- [ ] Deploy contracts to mainnet
- [ ] Set up monitoring dashboards
- [ ] Create runbooks for incidents
- [ ] Train support team
- [ ] Prepare launch announcement
- [ ] Bug bounty program launch

**Phase 4 Complete:** ✅ Production-ready ZKML system

---

## Testing Strategy

### Test Pyramid

```
                 ┌──────────────┐
                 │  E2E Tests   │  10%
                 │  (Playwright)│
             ┌───┴──────────────┴───┐
             │  Integration Tests   │  20%
             │     (Vitest)         │
         ┌───┴──────────────────────┴───┐
         │      Unit Tests              │  70%
         │       (Vitest)               │
         └──────────────────────────────┘
```

### Unit Tests (70%)

**Coverage:**

- EBSL fusion logic
- Witness preparation
- Proof validation
- Circuit selection
- Error handling

**Example:**

```typescript
// tests/unit/ebsl-engine.test.ts

describe("EBSLEngine", () => {
  describe("fuseOpinions", () => {
    it("correctly fuses two opinions", () => {
      const op1 = { belief: 0.8, disbelief: 0.1, uncertainty: 0.1, base_rate: 0.5 };
      const op2 = { belief: 0.6, disbelief: 0.2, uncertainty: 0.2, base_rate: 0.5 };

      const fused = ebslEngine.fuseOpinions(op1, op2);

      expect(fused.belief + fused.disbelief + fused.uncertainty).toBeCloseTo(1.0);
      expect(fused.belief).toBeGreaterThan(op1.belief);
    });

    it("handles degenerate case (both certain)", () => {
      const op1 = { belief: 1.0, disbelief: 0, uncertainty: 0, base_rate: 0.5 };
      const op2 = { belief: 1.0, disbelief: 0, uncertainty: 0, base_rate: 0.5 };

      expect(() => ebslEngine.fuseOpinions(op1, op2)).not.toThrow();
    });
  });
});
```

### Integration Tests (20%)

**Coverage:**

- Client → WASM proof generation
- Proof → Smart contract verification
- Worker communication
- Circuit caching

**Example:**

```typescript
// tests/integration/proof-pipeline.test.ts

describe("Proof Generation Pipeline", () => {
  it("generates and verifies proof end-to-end", async () => {
    // 1. Prepare attestations
    const attestations = await fetchMockAttestations(16);

    // 2. Generate proof (client-side)
    const proof = await clientSideProver.generateProof(attestations, "exact");

    // 3. Verify locally
    const localValid = await clientSideProver.verifyLocal(proof);
    expect(localValid).toBe(true);

    // 4. Verify on-chain
    const tx = await verifierContract.verifyReputationProof(proof.proof, proof.publicInputs);
    await tx.wait();

    const onChainValid = await verifierContract.verifiedReputations(userAddress);
    expect(onChainValid).toBeGreaterThan(0);
  });
});
```

### E2E Tests (10%)

**Coverage:**

- Full user flows
- Cross-browser compatibility
- Mobile responsiveness
- Error scenarios

**Example:**

```typescript
// tests/e2e/claim-flow.spec.ts

import { test, expect } from "@playwright/test";

test("user can generate proof and claim tokens", async ({ page }) => {
  // 1. Navigate to app
  await page.goto("http://localhost:5173");

  // 2. Connect wallet (MetaMask)
  await page.click("#connect-wallet-btn");
  // ... MetaMask interaction

  // 3. Navigate to claim page
  await page.click('a[href="/claim"]');

  // 4. Generate proof
  await page.click("#generate-proof-btn");
  await page.waitForSelector("#proof-complete", { timeout: 30000 });

  // 5. Submit claim
  await page.click("#submit-claim-btn");
  await page.waitForSelector("#claim-success");

  // 6. Verify success message
  await expect(page.locator("#claim-success")).toContainText("Tokens claimed!");
});
```

### Circuit Tests

**Property-Based Testing:**

```python
# tests/circuit/ebsl_properties.py

import hypothesis
from hypothesis import given, strategies as st

@given(
    st.lists(
        st.tuples(
            st.floats(0, 1), st.floats(0, 1), st.floats(0, 1), st.floats(0, 1)
        ),
        min_size=1,
        max_size=256
    ).filter(lambda ops: all(abs(sum(op[:3]) - 1.0) < 1e-6 for op in ops))
)
def test_ebsl_fusion_always_produces_valid_opinion(opinions):
    """Test that EBSL fusion always produces valid opinions (b+d+u=1)"""
    result = ebsl_fusion_circuit(opinions)
    assert abs(sum(result[:3]) - 1.0) < 1e-6
    assert all(0 <= x <= 1 for x in result)
```

---

## Deployment Strategy

### Infrastructure Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         PRODUCTION SETUP                          │
└──────────────────────────────────────────────────────────────────┘

Frontend (SvelteKit)
  ├─ Vercel / Netlify (Static hosting)
  ├─ CDN: CloudFlare (Circuit files)
  └─ Domain: app.shadowgraph.io

Smart Contracts
  ├─ Ethereum Mainnet (primary)
  ├─ Polygon (L2, lower cost)
  ├─ Arbitrum (L2, lower cost)
  └─ Multi-chain deployment

Monitoring & Analytics
  ├─ Sentry (Error tracking)
  ├─ Grafana (Metrics)
  ├─ Mixpanel (User analytics)
  └─ Alchemy (Blockchain monitoring)

Backend (Phase 1/2 only)
  ├─ AWS Lambda (Proof service)
  ├─ Redis (Proof caching)
  └─ CloudWatch (Logs)
```

### Deployment Pipeline (CI/CD)

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run lint

  build-circuits:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: pip install ezkl torch
      - run: python scripts/build-circuits.py
      - uses: actions/upload-artifact@v3
        with:
          name: circuits
          path: public/circuits/

  deploy-contracts:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx hardhat deploy --network mainnet
        env:
          PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}

  deploy-frontend:
    needs: [build-circuits, deploy-contracts]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: circuits
          path: public/circuits/
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Environment Configuration

```bash
# Production .env
VITE_CHAIN_ID=1
VITE_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}
VITE_AIRDROP_ECDSA_ADDR=0x...
VITE_AIRDROP_ZK_ADDR=0x...
VITE_VERIFIER_ADDR=0x...
VITE_TOKEN_ADDR=0x...
VITE_CAMPAIGN=0x...
VITE_FLOOR_SCORE=600000
VITE_CAP_SCORE=1000000
VITE_MIN_PAYOUT=100000000000000000  # 0.1 ETH
VITE_MAX_PAYOUT=1000000000000000000 # 1 ETH
VITE_CURVE=SQRT
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_DEBUG=false

# Phase 1/2 only
VITE_API_BASE=https://api.shadowgraph.io
```

---

## Monitoring & Observability

### Key Metrics

#### Application Metrics

- **Proof Generation Success Rate**: Target >95%
- **Average Proof Time**: Target <25s for 256 opinions
- **Error Rate**: Target <1%
- **WASM Load Time**: Target <2s
- **Circuit Cache Hit Rate**: Target >80%

#### Blockchain Metrics

- **Gas Cost per Claim**: Monitor and optimize
- **Transaction Success Rate**: Target >98%
- **Average Confirmation Time**: Track across chains
- **Contract Call Failures**: Alert on spikes

#### User Metrics

- **Daily Active Users**: Growth tracking
- **Proof Type Distribution**: Understand usage patterns
- **Attestation Count Distribution**: Circuit sizing
- **Mobile vs Desktop**: Platform optimization

### Dashboards

**Grafana Dashboard:**

```json
{
  "dashboard": {
    "title": "ZKML Proof Generation",
    "panels": [
      {
        "title": "Proof Generation Rate",
        "targets": [
          {
            "expr": "rate(proof_generation_total[5m])"
          }
        ]
      },
      {
        "title": "Proof Generation Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, proof_generation_duration_seconds)"
          }
        ]
      },
      {
        "title": "Error Rate by Type",
        "targets": [
          {
            "expr": "rate(proof_generation_errors_total[5m]) by (error_type)"
          }
        ]
      }
    ]
  }
}
```

### Alerting

```yaml
# alerts.yml

groups:
  - name: zkml_alerts
    rules:
      - alert: HighProofFailureRate
        expr: rate(proof_generation_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High proof generation failure rate"
          description: "More than 5% of proofs failing in last 5 minutes"

      - alert: SlowProofGeneration
        expr: histogram_quantile(0.95, proof_generation_duration_seconds) > 30
        for: 10m
        annotations:
          summary: "Proof generation is slow"
          description: "P95 proof time exceeds 30 seconds"

      - alert: ContractVerificationFailure
        expr: rate(contract_verification_failures_total[5m]) > 0.01
        for: 5m
        annotations:
          summary: "Contract verification failures detected"
          description: "Proofs failing on-chain verification"
```

---

## Operational Procedures

### Incident Response

**Runbook: Proof Generation Failures**

1. **Identify Scope**
   - Check error rate in Grafana
   - Identify affected proof types
   - Check if specific to circuit size

2. **Immediate Mitigation**
   - If Phase 2: Force fallback to remote proofs
   - If Phase 3: Display user-friendly error + retry button
   - Post status update to users

3. **Root Cause Analysis**
   - Check Sentry for error details
   - Review recent deployments
   - Check circuit file integrity
   - Verify WASM module loading

4. **Resolution**
   - Apply hotfix if identified
   - Redeploy if necessary
   - Verify fix in staging
   - Monitor recovery

5. **Post-Mortem**
   - Document incident timeline
   - Identify prevention measures
   - Update monitoring/alerting

**Runbook: Contract Exploit**

1. **Emergency Response**
   - Pause contract immediately (if owner)
   - Assess damage (funds at risk)
   - Notify users via all channels

2. **Investigation**
   - Identify exploit vector
   - Review transaction history
   - Determine affected users

3. **Remediation**
   - Deploy patched contract
   - Migrate state if possible
   - Compensate affected users

4. **Prevention**
   - Audit fix thoroughly
   - Add additional safeguards
   - Update bug bounty program

### Circuit Update Procedure

**When to Update:**

- Bug fix in EBSL logic
- Performance optimization
- Security patch
- New proof type addition

**Process:**

1. **Development**
   - Modify PyTorch model
   - Test thoroughly in isolation
   - Generate new circuits
   - Test against existing proofs (backwards compatibility)

2. **Deployment**
   - Upload new circuits to CDN
   - Update circuit hashes in code
   - Deploy new verifier contract (if needed)
   - Update frontend with new circuit URLs

3. **Migration**
   - Keep old circuits available (transition period)
   - Add deprecation warnings for old circuits
   - Monitor adoption of new circuits
   - Remove old circuits after 30 days

### Contract Upgrade Procedure

**Approach:** Use proxy pattern for upgradability

```solidity
// contracts/VerifierProxy.sol

contract VerifierProxy {
    address public implementation;
    address public admin;

    function upgradeTo(address newImplementation) external {
        require(msg.sender == admin, "Not authorized");
        implementation = newImplementation;
    }

    fallback() external {
        address impl = implementation;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
```

**Upgrade Process:**

1. Deploy new implementation contract
2. Test thoroughly on testnet
3. Audit new implementation
4. Call `upgradeTo()` from multisig
5. Verify upgrade successful
6. Monitor for issues

---

**End of Part 3**

**Next Steps:**

1. Review and approve this architecture specification
2. Assign development resources to Phase 1
3. Begin Week 1 tasks (EZKL setup)
4. Schedule weekly progress reviews
5. Set up monitoring infrastructure

**Questions or Concerns:**

- Contact: architecture-review@shadowgraph.io
- Slack: #zkml-implementation
- Meeting: Thursdays 2pm PT

---

**Related Documents:**

- [Part 1: Foundation & Proof Generation](./zkml-part1.md)
- [Part 2: Security & Key Management](./zkml-part2.md)
- [EBSL Algorithm Integration Strategy](../ebsl-algorithm-integration-strategy.md)
- [Technical Implementation Roadmap](../technical-implementation-roadmap.md)
