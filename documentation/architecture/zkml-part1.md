# ZKML Architecture - Part 1: Foundation & Proof Generation

**Document Version:** 1.0  
**Last Updated:** October 2, 2025  
**Status:** Architecture Specification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Proof Generation Pipeline](#proof-generation-pipeline)
4. [EZKL Integration Strategy](#ezkl-integration-strategy)
5. [Client-Side Architecture](#client-side-architecture)

---

## Executive Summary

This document defines the complete architecture for Zero-Knowledge Machine Learning (ZKML) proof generation and verification in the Shadowgraph Reputation-Gated Airdrop system. The architecture enables users to prove their reputation scores computed via Evidence-Based Subjective Logic (EBSL) without revealing the underlying trust network topology or attestation data.

### Key Design Principles

1. **Privacy-First**: All sensitive data remains client-side; only proofs are shared
2. **Client-Side Generation**: Proofs generated in browser using WASM, no backend dependency
3. **Production-Ready**: Real EZKL integration replacing current mock implementation
4. **Scalable**: Support for 16-256 opinions with sub-30 second proof times
5. **Secure**: Cryptographic guarantees with replay attack prevention
6. **User-Friendly**: Progressive enhancement with clear UX for proof generation

### Proof Types Supported

| Proof Type         | Privacy Level | Use Case                  | Public Inputs            |
| ------------------ | ------------- | ------------------------- | ------------------------ |
| **Exact Score**    | Low           | Full transparency         | Reputation score         |
| **Threshold**      | Medium        | Selective disclosure      | Threshold value, boolean |
| **Anonymous**      | High          | Semaphore-based anonymity | Nullifier hash, signal   |
| **Set Membership** | High          | Trusted set verification  | Commitment, member hash  |

---

## System Architecture Overview

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  UI Components │  │  EBSL Engine     │  │  Proof Worker  │  │
│  │  (Svelte)      │──│  (TypeScript)    │──│  (Web Worker)  │  │
│  └────────────────┘  └──────────────────┘  └────────────────┘  │
│           │                   │                      │           │
│           ▼                   ▼                      ▼           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              ZK Proof Generation Module                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ EZKL WASM    │  │ Circuit Mgmt │  │ Witness Builder │  │ │
│  │  │ (Rust→WASM)  │  │ (Precompiled)│  │ (Data Prep)     │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Proof State Management (Svelte Store)            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────────┐
│  Blockchain Network  │          │  ZK Verifier Contract    │
│  (RPC via Viem)      │          │  (Solidity + Halo2)      │
└──────────────────────┘          └──────────────────────────┘
```

### Module Responsibilities

#### 1. **UI Components** (`src/lib/components/ZKMLProver.svelte`)

- User interface for proof generation
- Configuration of proof type and parameters
- Progress tracking and status display
- Error handling and user feedback

#### 2. **EBSL Engine** (`src/lib/ebsl/core.ts`)

- Trust attestation processing
- Multi-opinion fusion using EBSL algorithm
- Reputation score computation
- Input validation and normalization

#### 3. **Proof Worker** (`src/lib/workers/proofWorker.ts`)

- Off-main-thread proof generation
- Heavy computation isolation
- Progress reporting
- Resource management

#### 4. **ZK Proof Generation Module** (To be implemented)

- EZKL WASM bindings
- Circuit compilation and caching
- Witness generation from attestation data
- Proof creation and serialization

#### 5. **Proof State Management** (`src/lib/stores/zkproof.ts`)

- Centralized proof lifecycle state
- Proof data storage (ephemeral)
- Error state management
- Integration with analytics

---

## Proof Generation Pipeline

### Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROOF GENERATION WORKFLOW                         │
└─────────────────────────────────────────────────────────────────────┘

1. USER INPUT
   ├─ Connect wallet
   ├─ Select proof type (exact/threshold/anonymous)
   └─ Configure parameters (e.g., threshold value)
        │
        ▼
2. ATTESTATION RETRIEVAL
   ├─ Fetch user's trust attestations
   ├─ Filter by validity (not expired)
   ├─ Validate attestation signatures
   └─ Prepare attestation set (max 256)
        │
        ▼
3. LOCAL EBSL COMPUTATION
   ├─ Normalize opinion values [0,1]
   ├─ Apply EBSL fusion algorithm
   ├─ Compute fused opinion
   └─ Calculate reputation score
        │
        ▼
4. WITNESS GENERATION
   ├─ Format attestations as fixed-size tensor
   ├─ Create opinion matrix [N×4] (b,d,u,a)
   ├─ Generate validity mask [N]
   ├─ Serialize to JSON witness
   └─ Hash witness for integrity
        │
        ▼
5. CIRCUIT SELECTION
   ├─ Determine circuit size (16/32/64/128/256)
   ├─ Load precompiled circuit from cache
   ├─ Verify circuit hash
   └─ Initialize EZKL prover
        │
        ▼
6. PROOF GENERATION (EZKL)
   ├─ Load witness into circuit
   ├─ Execute EZKL prove() function
   ├─ Generate ZK-SNARK proof (Halo2)
   ├─ Extract public inputs
   └─ Serialize proof for blockchain
        │
        ▼
7. PROOF VALIDATION (Client-side)
   ├─ Verify proof format
   ├─ Check public inputs match expected
   ├─ Validate score in valid range
   └─ Compute proof hash (replay prevention)
        │
        ▼
8. STATE UPDATE
   ├─ Store proof in zkProofStore
   ├─ Update UI with success status
   ├─ Enable claim/submit button
   └─ Log analytics event
        │
        ▼
9. ON-CHAIN SUBMISSION (User-initiated)
   ├─ Prepare transaction data
   ├─ Call verifier contract
   ├─ Wait for confirmation
   └─ Update claim status
```

### Performance Targets

| Circuit Size | Opinion Count | Proof Time | Proof Size | Verification Time |
| ------------ | ------------- | ---------- | ---------- | ----------------- |
| 16           | 1-16          | 5-10s      | ~200KB     | 50-100ms          |
| 32           | 17-32         | 10-15s     | ~250KB     | 60-120ms          |
| 64           | 33-64         | 15-20s     | ~300KB     | 70-140ms          |
| 128          | 65-128        | 20-25s     | ~350KB     | 80-160ms          |
| 256          | 129-256       | 25-30s     | ~400KB     | 90-180ms          |

---

## EZKL Integration Strategy

### Design Philosophy

The architecture follows the **proven EZKL pipeline** demonstrated in `Notebooks/EBSL_EZKL.py`:

```
PyTorch Model → ONNX Export → EZKL Compilation → WASM Bindings → Browser Integration
```

This approach is chosen over Circom because:

1. ✅ Leverages existing EBSL PyTorch implementation
2. ✅ EZKL's automatic circuit generation reduces complexity
3. ✅ Halo2 backend provides better performance than Groth16
4. ✅ No trusted setup required (transparent SNARKs)
5. ✅ WASM bindings enable true client-side generation

### Three-Phase Integration

#### Phase 1: Server-Side Proof Service (MVP)

**Timeline:** Weeks 1-4  
**Goal:** Replace mock proofs with real EZKL proofs via backend service

```typescript
// Architecture: Client → Backend API → EZKL Python → Proof
interface ProofServiceAPI {
  endpoint: "/api/v1/generate-proof";
  method: "POST";
  request: {
    attestations: TrustAttestation[];
    proofType: "exact" | "threshold" | "anonymous";
    parameters: {
      threshold?: number;
      anonymousMode?: boolean;
    };
  };
  response: {
    proof: number[];
    publicInputs: number[];
    proofHash: string;
    generationTime: number;
  };
}
```

**Trade-offs:**

- ✅ Fast to implement (reuses notebook code)
- ✅ No WASM compilation needed
- ❌ Privacy concern: backend sees attestations
- ❌ Scalability bottleneck
- ❌ Backend dependency

**Security Mitigation:**

- Attestations encrypted with user's public key
- Backend never stores attestations
- Proof generation in isolated containers
- Rate limiting per user

#### Phase 2: Hybrid Model (Recommended)

**Timeline:** Weeks 5-8  
**Goal:** Client-side proof generation with backend fallback

```typescript
class HybridProver {
  async generateProof(attestations: TrustAttestation[]): Promise<ZKProof> {
    // Try client-side first (WASM)
    if (this.wasmSupported && attestations.length <= 32) {
      try {
        return await this.generateLocalProof(attestations);
      } catch (error) {
        console.warn("Local proof failed, falling back to service", error);
      }
    }

    // Fallback to proof service
    return await this.generateRemoteProof(attestations);
  }

  private async generateLocalProof(attestations: TrustAttestation[]): Promise<ZKProof> {
    // Load EZKL WASM module
    const ezkl = await this.loadEZKLWasm();

    // Prepare witness
    const witness = this.prepareWitness(attestations);

    // Load precompiled circuit
    const circuit = await this.loadCircuit(attestations.length);

    // Generate proof locally
    return await ezkl.prove(circuit, witness);
  }
}
```

**Trade-offs:**

- ✅ Better privacy for simple proofs
- ✅ Graceful degradation
- ✅ Reduced backend load
- ⚠️ Complexity in maintaining two paths
- ⚠️ WASM bundle size (~2-5MB)

#### Phase 3: Fully Client-Side (Production Target)

**Timeline:** Weeks 9-16  
**Goal:** 100% client-side proof generation, no backend needed

```typescript
class ClientSideProver {
  private ezkl: EZKLWasmModule;
  private circuits: Map<number, CompiledCircuit>;
  private cacheEnabled: boolean = true;

  async initialize(): Promise<void> {
    // Load EZKL WASM module
    this.ezkl = await loadEZKLWasm();

    // Preload common circuit sizes
    await this.preloadCircuits([16, 32, 64]);
  }

  async generateProof(attestations: TrustAttestation[], proofType: ProofType): Promise<ZKProof> {
    // Select appropriate circuit
    const circuitSize = this.selectCircuitSize(attestations.length);
    const circuit = await this.getCircuit(circuitSize);

    // Prepare witness data
    const witness = this.buildWitness(attestations, proofType);

    // Generate proof (runs in Web Worker)
    const proof = await this.ezkl.prove(circuit, witness);

    // Validate proof locally before returning
    const isValid = await this.ezkl.verify(circuit, proof);
    if (!isValid) {
      throw new Error("Generated proof failed local verification");
    }

    return proof;
  }

  private selectCircuitSize(opinionCount: number): number {
    // Round up to nearest power of 2
    if (opinionCount <= 16) return 16;
    if (opinionCount <= 32) return 32;
    if (opinionCount <= 64) return 64;
    if (opinionCount <= 128) return 128;
    return 256;
  }
}
```

**Trade-offs:**

- ✅ Maximum privacy (no data leaves client)
- ✅ No backend infrastructure costs
- ✅ True decentralization
- ✅ Offline capability (once circuits cached)
- ❌ Large initial bundle (~5-10MB)
- ❌ Browser compatibility constraints
- ❌ Mobile performance challenges

### EZKL WASM Integration Details

#### Circuit Compilation (Build-time)

```bash
# Run during CI/CD build process
# Generates precompiled circuits for distribution

# 1. Export PyTorch model to ONNX
python scripts/build-circuits/export-onnx.py \
  --max-opinions 16,32,64,128,256 \
  --output-dir public/circuits/onnx/

# 2. Generate EZKL settings for each circuit
for size in 16 32 64 128 256; do
  ezkl gen-settings \
    --model public/circuits/onnx/ebsl_${size}.onnx \
    --output public/circuits/settings/ebsl_${size}.json \
    --param-visibility private
done

# 3. Compile circuits to WASM
for size in 16 32 64 128 256; do
  ezkl compile-circuit \
    --model public/circuits/onnx/ebsl_${size}.onnx \
    --settings public/circuits/settings/ebsl_${size}.json \
    --output public/circuits/compiled/ebsl_${size}.wasm
done

# 4. Generate proving/verifying keys (SRS)
for size in 16 32 64 128 256; do
  ezkl setup \
    --model public/circuits/compiled/ebsl_${size}.wasm \
    --settings public/circuits/settings/ebsl_${size}.json \
    --vk-path public/circuits/vk/ebsl_${size}.vk \
    --pk-path public/circuits/pk/ebsl_${size}.pk
done

# 5. Generate Solidity verifier contracts
for size in 16 32 64 128 256; do
  ezkl create-evm-verifier \
    --vk public/circuits/vk/ebsl_${size}.vk \
    --settings public/circuits/settings/ebsl_${size}.json \
    --sol-code-path contracts/generated/EBSLVerifier_${size}.sol
done
```

#### Runtime Integration (Browser)

```typescript
// src/lib/zkml/ezkl-loader.ts

interface EZKLWasmModule {
  prove(circuit: Uint8Array, witness: WitnessData): Promise<ProofData>;
  verify(circuit: Uint8Array, proof: ProofData): Promise<boolean>;
  genWitness(circuit: Uint8Array, input: InputData): Promise<WitnessData>;
}

class EZKLLoader {
  private wasmModule: EZKLWasmModule | null = null;
  private circuitCache: Map<number, CircuitData> = new Map();

  async loadWasm(): Promise<EZKLWasmModule> {
    if (this.wasmModule) return this.wasmModule;

    // Dynamically import EZKL WASM (code-splitting)
    const wasmUrl = "/circuits/ezkl-core.wasm";
    const response = await fetch(wasmUrl);
    const wasmBytes = await response.arrayBuffer();

    // Initialize WASM module
    const module = await WebAssembly.instantiate(wasmBytes);
    this.wasmModule = module.instance.exports as EZKLWasmModule;

    return this.wasmModule;
  }

  async loadCircuit(size: number): Promise<CircuitData> {
    if (this.circuitCache.has(size)) {
      return this.circuitCache.get(size)!;
    }

    // Fetch circuit files
    const [compiled, settings, vk] = await Promise.all([
      fetch(`/circuits/compiled/ebsl_${size}.wasm`).then((r) => r.arrayBuffer()),
      fetch(`/circuits/settings/ebsl_${size}.json`).then((r) => r.json()),
      fetch(`/circuits/vk/ebsl_${size}.vk`).then((r) => r.arrayBuffer()),
    ]);

    const circuitData = {
      compiled: new Uint8Array(compiled),
      settings,
      verifyingKey: new Uint8Array(vk),
      size,
    };

    // Cache for reuse
    this.circuitCache.set(size, circuitData);

    return circuitData;
  }
}

export const ezklLoader = new EZKLLoader();
```

---

## Client-Side Architecture

### Component Breakdown

#### 1. ZKMLProver Component (Enhanced)

**File:** `src/lib/components/ZKMLProver.svelte`

```svelte
<script lang="ts">
  import { zkProofStore, zkProofActions } from "$lib/stores/zkproof";
  import { ClientSideProver } from "$lib/zkml/client-prover";
  import { ebslEngine } from "$lib/ebsl/core";
  import ProofProgress from "./ProofProgress.svelte";
  import ProofTypeSelector from "./ProofTypeSelector.svelte";

  let prover: ClientSideProver;
  let proofType: ProofType = "exact";
  let threshold: number = 600000;
  let progress: ProofProgress = { stage: "idle", percent: 0 };

  onMount(async () => {
    // Initialize prover (loads WASM, preloads circuits)
    prover = new ClientSideProver();
    await prover.initialize();
  });

  async function generateProof() {
    zkProofActions.setGenerating();

    try {
      // Stage 1: Fetch attestations (10%)
      progress = { stage: "fetching", percent: 10 };
      const attestations = await fetchUserAttestations($wallet.address);

      // Stage 2: Compute EBSL locally (20%)
      progress = { stage: "computing", percent: 20 };
      const reputation = ebslEngine.computeReputation($wallet.address, attestations);

      // Stage 3: Build witness (30%)
      progress = { stage: "building-witness", percent: 30 };
      const witness = await prover.buildWitness(attestations, proofType);

      // Stage 4: Generate proof (40-90%)
      progress = { stage: "proving", percent: 40 };
      const proof = await prover.generateProof(attestations, proofType, (p) => {
        progress = { stage: "proving", percent: 40 + p * 0.5 }; // 40-90%
      });

      // Stage 5: Validate proof (95%)
      progress = { stage: "validating", percent: 95 };
      const isValid = await prover.verifyLocal(proof);
      if (!isValid) throw new Error("Proof validation failed");

      // Complete (100%)
      progress = { stage: "complete", percent: 100 };
      zkProofActions.setGenerated(proof.proof, proof.publicInputs, proof.hash, proofType);

      toasts.success("Proof generated successfully!");
    } catch (error) {
      zkProofActions.setError(error.message);
      toasts.error("Proof generation failed");
    }
  }
</script>

<div class="zkml-prover">
  <ProofTypeSelector bind:proofType bind:threshold />

  {#if $zkProofStore.generating}
    <ProofProgress {progress} />
  {/if}

  <button on:click={generateProof} disabled={$zkProofStore.generating}> Generate ZK Proof </button>

  {#if $zkProofStore.generated}
    <ProofSummary proof={$zkProofStore.proofData} />
    <button on:click={submitToChain}>Submit to Blockchain</button>
  {/if}
</div>
```

#### 2. Proof Worker (Web Worker)

**File:** `src/lib/workers/zkProofWorker.ts`

```typescript
// Runs proof generation off main thread
import { ClientSideProver } from "$lib/zkml/client-prover";

let prover: ClientSideProver;

// Initialize worker
self.addEventListener("message", async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "initialize":
      prover = new ClientSideProver();
      await prover.initialize();
      self.postMessage({ type: "initialized" });
      break;

    case "generate-proof":
      try {
        const proof = await prover.generateProof(data.attestations, data.proofType, (progress) => {
          self.postMessage({ type: "progress", progress });
        });
        self.postMessage({ type: "proof-complete", proof });
      } catch (error) {
        self.postMessage({ type: "error", error: error.message });
      }
      break;
  }
});
```

**Usage from main thread:**

```typescript
// src/lib/zkml/worker-manager.ts
class ProofWorkerManager {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL("../workers/zkProofWorker.ts", import.meta.url), {
      type: "module",
    });
  }

  async generateProof(
    attestations: TrustAttestation[],
    proofType: ProofType,
    onProgress: (p: number) => void
  ): Promise<ZKProof> {
    return new Promise((resolve, reject) => {
      this.worker.postMessage({
        type: "generate-proof",
        data: { attestations, proofType },
      });

      this.worker.onmessage = (event) => {
        const { type, data } = event.data;

        if (type === "progress") {
          onProgress(data.progress);
        } else if (type === "proof-complete") {
          resolve(data.proof);
        } else if (type === "error") {
          reject(new Error(data.error));
        }
      };
    });
  }
}
```

---

**End of Part 1**

Continue to [Part 2: Security & Key Management](./zkml-part2.md) for security model, key management, and data handling specifications.
