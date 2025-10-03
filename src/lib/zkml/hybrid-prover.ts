/**
 * Hybrid Prover Orchestrator
 * Tries local EZKL WASM prover first, falls back to remote server if needed
 * Integrates device capability detection and remote proof service client
 */

import type { TrustAttestation, SubjectiveOpinion } from "../ebsl/core";
import { deviceCapability } from "./device-capability";
import { proofServiceClient } from "./proof-service-client";
import { getFeatureFlags } from "./feature-flags";

export interface ProofResult {
  fusedOpinion: SubjectiveOpinion;
  proof: number[];
  publicInputs: number[];
  hash: string;
  mode: "local" | "remote" | "simulation";
  circuitSize?: string;
  duration: number;
}

export interface ProofProgress {
  stage: string;
  progress: number; // 0-100
  estimatedRemainingMs?: number;
}

export type ProgressCallback = (progress: ProofProgress) => void;

export interface ProofOptions {
  proofType: "exact" | "threshold";
  threshold?: number;
  circuitSize?: string;
  forceRemote?: boolean;
  forceSimulation?: boolean;
  timeout?: number; // milliseconds, default 30s
  onProgress?: ProgressCallback;
  userId?: string;
}

/**
 * Hybrid proof generation orchestrator
 */
export class HybridProver {
  private worker: Worker | null = null;
  private currentJobId: string | null = null;
  private remoteEndpoint: string;
  private localEnabled: boolean = true;

  constructor(remoteEndpoint: string = "/api/v1") {
    this.remoteEndpoint = remoteEndpoint;
    proofServiceClient.setBaseUrl(remoteEndpoint);
  }

  /**
   * Generate proof using hybrid strategy
   * 1. Check device capability
   * 2. Try local if capable, else skip to remote
   * 3. On timeout/error, fallback to remote
   */
  async generateProof(
    attestations: TrustAttestation[],
    options: ProofOptions
  ): Promise<ProofResult> {
    const startTime = Date.now();
    const timeout = options.timeout || 30000; // 30s default

    // Check feature flags first (for quick testing/debugging)
    const flags = getFeatureFlags();
    
    if (flags.forceSimulation || options.forceSimulation) {
      console.log("[HybridProver] Feature flag: force simulation");
      return this.generateLocalProof(attestations, { ...options, useSimulation: true });
    }

    if (flags.forceRemote || options.forceRemote) {
      console.log("[HybridProver] Feature flag: force remote");
      return this.generateRemoteProof(attestations, options);
    }

    if (flags.forceLocal) {
      console.log("[HybridProver] Feature flag: force local (skip device check)");
      // Skip device capability check, go straight to local
      try {
        const result = await Promise.race([
          this.generateLocalProof(attestations, options),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Local proof timeout")), timeout)
          )
        ]);
        result.duration = Date.now() - startTime;
        return result;
      } catch (error) {
        console.warn("[HybridProver] Forced local failed, falling back to remote:", error);
        const result = await this.generateRemoteProof(attestations, options);
        result.duration = Date.now() - startTime;
        return result;
      }
    }

    // Normal flow: check device capability
    const routing = deviceCapability.shouldUseLocal(attestations.length);
    if (!routing.useLocal) {
      console.log(`[HybridProver] ${routing.reason}, using remote`);
      options.onProgress?.({ stage: "Using remote prover (device limits)", progress: 0 });
      return this.generateRemoteProof(attestations, options);
    }

    try {
      // Try local first with timeout
      console.log("[HybridProver] Attempting local proof generation...");
      const result = await Promise.race([
        this.generateLocalProof(attestations, options),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Local proof timeout")), timeout)
        )
      ]);
      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      console.warn("[HybridProver] Local proof failed, falling back to remote:", error);
      options.onProgress?.({ stage: "Falling back to remote", progress: 0 });

      // Fallback to remote
      try {
        const result = await this.generateRemoteProof(attestations, options);
        result.duration = Date.now() - startTime;
        return result;
      } catch (remoteError) {
        console.error("[HybridProver] Remote proof also failed:", remoteError);
        throw new Error(`Proof generation failed: ${remoteError}`);
      }
    }
  }

  /**
   * Generate proof locally using Web Worker
   */
  private async generateLocalProof(
    attestations: TrustAttestation[],
    options: ProofOptions & { useSimulation?: boolean }
  ): Promise<ProofResult> {
    return new Promise((resolve, reject) => {
      // Create worker if needed
      if (!this.worker) {
        this.worker = new Worker(new URL("../workers/proofWorker.ts", import.meta.url), {
          type: "module",
        });

        // Initialize worker
        this.worker.postMessage({ type: "INIT" });
      }

      const jobId = this.generateJobId();
      this.currentJobId = jobId;

      let timeoutId: any = null;
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          this.cancelJob(jobId);
          reject(new Error("Proof generation timeout"));
        }, options.timeout);
      }

      // Set up message handler
      const messageHandler = (event: MessageEvent) => {
        const { type, result, error, progress, jobId: responseJobId } = event.data;

        // Ignore messages for other jobs
        if (responseJobId && responseJobId !== jobId) return;

        switch (type) {
          case "PROGRESS":
            if (options.onProgress && progress) {
              options.onProgress(progress);
            }
            break;

          case "PROOF_GENERATED":
            if (timeoutId) clearTimeout(timeoutId);
            this.worker?.removeEventListener("message", messageHandler);
            this.currentJobId = null;
            resolve({
              ...result,
              mode: result.mode === "ezkl" ? "local" : "simulation",
              duration: 0, // Will be set by caller
            });
            break;

          case "PROOF_ERROR":
            if (timeoutId) clearTimeout(timeoutId);
            this.worker?.removeEventListener("message", messageHandler);
            this.currentJobId = null;
            reject(new Error(error));
            break;

          case "CANCELLED":
            if (timeoutId) clearTimeout(timeoutId);
            this.worker?.removeEventListener("message", messageHandler);
            this.currentJobId = null;
            reject(new Error("Proof generation cancelled"));
            break;
        }
      };

      this.worker.addEventListener("message", messageHandler);

      // Send proof generation request
      this.worker.postMessage({
        type: "GENERATE_PROOF",
        jobId,
        data: {
          attestations,
          proofType: options.proofType,
          threshold: options.threshold,
          circuitSize: options.circuitSize,
          useSimulation: options.useSimulation || false,
        },
      });
    });
  }

  /**
   * Generate proof remotely via API using proof-service-client
   */
  private async generateRemoteProof(
    attestations: TrustAttestation[],
    options: ProofOptions
  ): Promise<ProofResult> {
    console.log("[HybridProver] Using remote proof generation");

    try {
      // Use proof service client
      const response = await proofServiceClient.generateProof(
        attestations,
        options.proofType,
        options.threshold,
        options.userId
      );

      // Mock fused opinion for now (would come from EBSL fusion)
      const mockFusedOpinion = {
        belief: 0.8,
        disbelief: 0.1,
        uncertainty: 0.1,
        base_rate: 0.5
      };

      return {
        fusedOpinion: mockFusedOpinion,
        proof: response.proof,
        publicInputs: response.publicInputs,
        hash: response.hash,
        mode: "remote",
        duration: response.duration || 0,
      };
    } catch (error: any) {
      throw new Error(`Remote proof generation failed: ${error.message}`);
    }
  }

  /**
   * Cancel current proof job
   */
  cancelJob(jobId?: string): void {
    const targetJobId = jobId || this.currentJobId;
    if (targetJobId && this.worker) {
      this.worker.postMessage({
        type: "CANCEL",
        data: { jobId: targetJobId },
      });
    }
  }

  /**
   * Check if local proving is available
   */
  async checkLocalAvailability(): Promise<boolean> {
    try {
      // Try to load EZKL
      const { loadEzkl } = await import("../zkml/ezkl");
      await loadEzkl();
      return true;
    } catch (error) {
      console.warn("[HybridProver] Local proving not available:", error);
      return false;
    }
  }

  /**
   * Disable local proving (use remote only)
   */
  disableLocal(): void {
    this.localEnabled = false;
  }

  /**
   * Enable local proving
   */
  enableLocal(): void {
    this.localEnabled = true;
  }

  /**
   * Terminate worker and cleanup
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.currentJobId = null;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Default singleton instance
 */
export const hybridProver = new HybridProver();
