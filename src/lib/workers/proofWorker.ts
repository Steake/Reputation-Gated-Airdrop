/**
 * Web Worker for offloading computationally intensive proof generation
 * Handles EBSL fusion and real EZKL-WASM proof generation
 */

// Import EBSL engine (assuming it's available in worker context)
import type { SubjectiveOpinion, TrustAttestation } from "../ebsl/core";
import { ebslEngine } from "../ebsl/core";
import { loadEzkl } from "../zkml/ezkl";
import { circuitManager } from "../zkml/circuit-manager";

// Worker state
let isInitialized = false;
let ezklProver: any = null;
let currentJobId: string | null = null;
let isCancelled = false;

// Listen for messages from main thread
self.onmessage = function (e) {
  const { type, data, jobId } = e.data;

  switch (type) {
    case "INIT":
      initWorker()
        .then(() => {
          self.postMessage({ type: "INIT_SUCCESS" });
        })
        .catch((error) => {
          self.postMessage({ type: "INIT_ERROR", error: error.message });
        });
      break;

    case "GENERATE_PROOF":
      currentJobId = jobId;
      isCancelled = false;
      generateProof(data, jobId)
        .then((result) => {
          if (!isCancelled) {
            self.postMessage({ type: "PROOF_GENERATED", result, jobId });
          }
        })
        .catch((error) => {
          if (!isCancelled) {
            self.postMessage({ type: "PROOF_ERROR", error: error.message, jobId });
          }
        });
      break;

    case "CANCEL":
      if (currentJobId === data.jobId) {
        isCancelled = true;
        currentJobId = null;
        self.postMessage({ type: "CANCELLED", jobId: data.jobId });
      }
      break;

    case "FUSE_OPINIONS":
      const fusionResult = fuseOpinions(data);
      self.postMessage({ type: "OPINIONS_FUSED", result: fusionResult });
      break;

    default:
      self.postMessage({ type: "UNKNOWN_TYPE", error: "Unknown message type" });
  }
};

/**
 * Initialize worker with EZKL engine
 */
async function initWorker() {
  if (isInitialized) return;

  console.log("[ProofWorker] Initializing EZKL engine...");
  ezklProver = await loadEzkl();
  isInitialized = true;
  console.log("[ProofWorker] EZKL engine initialized");
}

/**
 * Generate ZK proof using EBSL fusion and real EZKL
 */
async function generateProof(
  data: {
    attestations: TrustAttestation[];
    proofType: "exact" | "threshold";
    threshold?: number;
    circuitSize?: string;
    useSimulation?: boolean;
  },
  jobId: string
) {
  try {
    // Check cancellation
    if (isCancelled) return;

    // Progress: Start
    self.postMessage({
      type: "PROGRESS",
      jobId,
      progress: { stage: "Fusing opinions", progress: 0 },
    });

    // Perform EBSL fusion
    const fusedOpinion = ebslEngine.fuseMultipleOpinions(data.attestations);

    // Check cancellation
    if (isCancelled) return;

    // Progress: Fusion complete
    self.postMessage({
      type: "PROGRESS",
      jobId,
      progress: { stage: "Loading circuit", progress: 20 },
    });

    // Determine circuit size based on attestations count
    const circuitSize = data.circuitSize || determineCircuitSize(data.attestations.length);

    // Use simulation mode if requested or EZKL not initialized
    if (data.useSimulation || !isInitialized) {
      console.log("[ProofWorker] Using simulation mode");
      const proof = await simulateZKProof(fusedOpinion, data.proofType, data.threshold);

      return {
        fusedOpinion,
        proof,
        publicInputs: generatePublicInputs(fusedOpinion, data.proofType, data.threshold),
        hash: generateProofHash(proof, fusedOpinion),
        mode: "simulation",
      };
    }

    // Check cancellation
    if (isCancelled) return;

    // Load circuit artifacts
    const circuit = await circuitManager.getCircuit(circuitSize);

    // Check cancellation
    if (isCancelled) return;

    // Progress: Circuit loaded
    self.postMessage({
      type: "PROGRESS",
      jobId,
      progress: { stage: "Generating witness", progress: 40 },
    });

    // Prepare input for witness generation
    const input = prepareWitnessInput(fusedOpinion, data.proofType, data.threshold);

    // Generate witness
    const witness = await ezklProver.genWitness(input, circuit.compiledCircuit);

    // Check cancellation
    if (isCancelled) return;

    // Progress: Witness generated
    self.postMessage({
      type: "PROGRESS",
      jobId,
      progress: { stage: "Generating proof", progress: 60 },
    });

    // Generate proof
    const proof = await ezklProver.prove(
      witness,
      circuit.provingKey,
      circuit.compiledCircuit,
      circuit.srs
    );

    // Check cancellation
    if (isCancelled) return;

    // Progress: Proof generated
    self.postMessage({
      type: "PROGRESS",
      jobId,
      progress: { stage: "Finalizing", progress: 90 },
    });

    // Convert proof to array format
    const proofArray = Array.from(proof);
    const publicInputs = generatePublicInputs(fusedOpinion, data.proofType, data.threshold);
    const hash = generateProofHash(proofArray, fusedOpinion);

    return {
      fusedOpinion,
      proof: proofArray,
      publicInputs,
      hash,
      mode: "ezkl",
      circuitSize,
    };
  } catch (error) {
    console.error("[ProofWorker] Proof generation failed:", error);
    throw new Error(`Proof generation failed: ${error}`);
  }
}

/**
 * Determine circuit size based on attestation count
 */
function determineCircuitSize(attestationCount: number): string {
  if (attestationCount <= 16) return "small";
  if (attestationCount <= 64) return "medium";
  return "large";
}

/**
 * Prepare witness input from fused opinion
 */
function prepareWitnessInput(
  fusedOpinion: SubjectiveOpinion,
  proofType: "exact" | "threshold",
  threshold?: number
): any {
  const score = ebslEngine.opinionToReputation(fusedOpinion);
  const score1e6 = Math.round(score * 1000000);

  // Convert opinion to fixed-point integers for circuit
  const belief = Math.round(fusedOpinion.belief * 1000000);
  const disbelief = Math.round(fusedOpinion.disbelief * 1000000);
  const uncertainty = Math.round(fusedOpinion.uncertainty * 1000000);
  const baseRate = Math.round(fusedOpinion.base_rate * 1000000);

  if (proofType === "exact") {
    return {
      belief,
      disbelief,
      uncertainty,
      base_rate: baseRate,
      score: score1e6,
    };
  } else {
    const thresholdValue = threshold || 600000;
    const isAbove = score1e6 >= thresholdValue ? 1 : 0;

    return {
      belief,
      disbelief,
      uncertainty,
      base_rate: baseRate,
      score: score1e6,
      threshold: thresholdValue,
      is_above: isAbove,
    };
  }
}

/**
 * Fuse opinions in parallel (batched for multiple users if needed)
 */
function fuseOpinions(data: { attestations: TrustAttestation[] }) {
  try {
    const fused = ebslEngine.fuseMultipleOpinions(data.attestations);
    return { fusedOpinion: fused };
  } catch (error) {
    throw new Error(`Opinion fusion failed: ${error}`);
  }
}

/**
 * Simulate ZK proof generation (placeholder for EZKL-WASM)
 */
function simulateZKProof(
  fusedOpinion: SubjectiveOpinion,
  proofType: "exact" | "threshold",
  threshold?: number
): Promise<number[]> {
  return new Promise((resolve) => {
    // Simulate computation time
    setTimeout(() => {
      const proofLength = proofType === "exact" ? 8 : 10;
      const proof = Array.from({ length: proofLength }, () => Math.floor(Math.random() * 1000000));
      resolve(proof);
    }, 2000); // 2s simulation
  });
}

/**
 * Generate public inputs based on proof type
 */
function generatePublicInputs(
  fusedOpinion: SubjectiveOpinion,
  proofType: "exact" | "threshold",
  threshold?: number
): number[] {
  const score = ebslEngine.opinionToReputation(fusedOpinion);
  const score1e6 = Math.round(score * 1000000);

  if (proofType === "exact") {
    return [score1e6];
  } else {
    const isAbove = score1e6 >= (threshold || 600000) ? 1 : 0;
    return [threshold || 600000, isAbove];
  }
}

/**
 * Generate deterministic proof hash
 */
function generateProofHash(proof: number[], fusedOpinion: SubjectiveOpinion): string {
  const hashInput = proof.concat([
    fusedOpinion.belief * 1000000,
    fusedOpinion.disbelief * 1000000,
    fusedOpinion.uncertainty * 1000000,
    fusedOpinion.base_rate * 1000000,
  ]);
  // Simple hash simulation
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput[i];
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}
