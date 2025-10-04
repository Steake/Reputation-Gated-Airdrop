/**
 * Remote Proof Service Client
 * Fallback client for generating proofs via remote API when local WASM fails
 */

import type { TrustAttestation } from "$lib/ebsl/core";

export interface RemoteProofRequest {
  attestations: TrustAttestation[];
  proofType: "exact" | "threshold";
  threshold?: number;
  userId?: string;
}

export interface RemoteProofResponse {
  proof: number[];
  publicInputs: number[];
  hash: string;
  duration: number;
}

export interface RemoteProofError {
  error: string;
  code: string;
  details?: any;
}

class ProofServiceClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = "/api/v1", timeout: number = 60000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Generate proof via remote API
   */
  async generateProof(
    attestations: TrustAttestation[],
    proofType: "exact" | "threshold",
    threshold?: number,
    userId?: string
  ): Promise<RemoteProofResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/generate-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attestations,
          proofType,
          threshold,
          userId,
        } as RemoteProofRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: RemoteProofError = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: RemoteProofResponse = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error(`Remote proof generation timed out after ${this.timeout / 1000}s`);
      }

      throw new Error(`Remote proof generation failed: ${error.message}`);
    }
  }

  /**
   * Check if remote service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get service status and version
   */
  async getStatus(): Promise<{
    status: string;
    version: string;
    queueSize: number;
  }> {
    const response = await fetch(`${this.baseUrl}/status`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to get service status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Update base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Update timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }
}

// Export singleton instance
export const proofServiceClient = new ProofServiceClient();
