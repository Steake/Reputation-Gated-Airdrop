/**
 * ZKML Module Exports
 * Client-side EZKL proof generation with circuit caching
 */

export { loadEzkl, isEzklLoaded, unloadEzkl, type EZKLProver } from "./ezkl";

export {
  circuitManager,
  CIRCUIT_HASHES,
  type CircuitArtifacts,
  type CircuitCacheStats,
} from "./circuit-manager";

export {
  HybridProver,
  hybridProver,
  type ProofResult,
  type ProofProgress,
  type ProofOptions,
  type ProgressCallback,
} from "./hybrid-prover";

export {
  deviceCapability,
  getCapabilityMessage,
  type DeviceCapabilities,
  type ProofRoutingPolicy,
} from "./device-capability";

export {
  proofServiceClient,
  type RemoteProofRequest,
  type RemoteProofResponse,
} from "./proof-service-client";

export { circuitDB, type DBEntry } from "./db";

export {
  getFeatureFlags,
  getFeatureFlagDescription,
  setFeatureFlag,
  type FeatureFlags,
} from "./feature-flags";
