/**
 * ZKML Module Exports
 * Client-side EZKL proof generation with circuit caching
 */

export { loadEzkl, isEzklLoaded, unloadEzkl, type EZKLProver } from "./ezkl";

export {
  circuitManager,
  type CircuitArtifacts,
  type CircuitMetadata,
} from "./circuit-manager";

export {
  HybridProver,
  hybridProver,
  type ProofResult,
  type ProofProgress,
  type ProofOptions,
  type ProgressCallback,
} from "./hybrid-prover";
