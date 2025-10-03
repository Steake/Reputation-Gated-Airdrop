/**
 * Hybrid Prover Orchestrator
 * Tries local EZKL WASM prover first, falls back to remote server if needed
 */

import type { TrustAttestation, SubjectiveOpinion } from "../ebsl/core";

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
  timeout?: number; // milliseconds
  onProgress?: ProgressCallback;
}

/**
 * Hybrid proof generation orchestrator
 */
export class HybridProver {
  private worker: Worker | null = null;
  private currentJobId: string | null = null;
  private remoteEndpoint: string;
  private localEnabled: boolean = true;

  constructor(remoteEndpoint: string = "http://localhost:3001/api/proof/generate") {
    this.remoteEndpoint = remoteEndpoint;
  }

  /**
   * Generate proof using hybrid strategy
   */
  async generateProof(
    attestations: TrustAttestation[],
    options: ProofOptions
  ): Promise<ProofResult> {
    const startTime = Date.now();

    // Force simulation mode if requested
    if (options.forceSimulation) {
      return this.generateLocalProof(attestations, { ...options, useSimulation: true });
    }

    // Force remote if requested
    if (options.forceRemote) {
      return this.generateRemoteProof(attestations, options);
    }

    try {
      // Try local first
      console.log("[HybridProver] Attempting local proof generation...");
      const result = await this.generateLocalProof(attestations, options);
      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      console.warn("[HybridProver] Local proof failed, falling back to remote:", error);

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
   * Generate proof remotely via API
   */
  private async generateRemoteProof(
    attestations: TrustAttestation[],
    options: ProofOptions
  ): Promise<ProofResult> {
    console.log("[HybridProver] Using remote proof generation");

    // Set up WebSocket for progress updates if callback provided
    let ws: WebSocket | null = null;
    let requestId: string | null = null;

    if (options.onProgress) {
      const wsUrl = this.remoteEndpoint.replace(/^http/, "ws").replace(/\/api.*$/, "");
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "progress" && data.data && options.onProgress) {
          options.onProgress({
            stage: data.data.stage,
            progress: data.data.progress,
            estimatedRemainingMs: data.data.estimatedRemainingMs,
          });
        } else if (data.type === "subscribed") {
          requestId = data.requestId;
        }
      };
    }

    try {
      const response = await fetch(this.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attestations,
          proofType: options.proofType,
          threshold: options.threshold,
          circuitSize: options.circuitSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Remote proof generation failed");
      }

      return {
        ...data.result,
        mode: "remote",
        duration: 0, // Will be set by caller
      };
    } finally {
      if (ws) {
        ws.close();
      }
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
