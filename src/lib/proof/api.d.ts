/**
 * API integration layer for proof generation with caching and WebSocket support
 */
import { type Writable } from "svelte/store";
import type { ProofResult } from "./queue";
import { type ProofGenerationProgress } from "./pipeline";
import type { TrustAttestation } from "$lib/ebsl/core";
import { ProofPriority } from "./queue";
export interface CachedProof {
  key: string;
  proof: ProofResult;
  timestamp: number;
  expiresAt: number;
}
export interface WebSocketMessage {
  type: "progress" | "completed" | "failed" | "cancelled";
  requestId: string;
  data: unknown;
}
/**
 * Proof cache manager
 */
export declare class ProofCache {
  private cache;
  private defaultTTL;
  private maxCacheSize;
  /**
   * Generate cache key from attestations and proof type
   */
  generateKey(attestations: TrustAttestation[], proofType: "exact" | "threshold"): string;
  /**
   * Get cached proof if available and not expired
   */
  get(key: string): ProofResult | null;
  /**
   * Store proof in cache
   */
  set(key: string, proof: ProofResult, ttl?: number): void;
  /**
   * Clear expired entries
   */
  cleanup(): void;
  /**
   * Clear all cache
   */
  clear(): void;
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  };
  /**
   * Evict oldest entry
   */
  private evictOldest;
}
/**
 * WebSocket manager for real-time proof updates
 */
export declare class ProofWebSocket {
  private socket;
  private reconnectAttempts;
  private maxReconnectAttempts;
  private reconnectDelay;
  private listeners;
  connected: Writable<boolean>;
  /**
   * Connect to WebSocket server
   */
  connect(url: string): void;
  /**
   * Disconnect from WebSocket
   */
  disconnect(): void;
  /**
   * Subscribe to proof updates
   */
  subscribe(requestId: string, callback: (message: WebSocketMessage) => void): () => void;
  /**
   * Send message to server
   */
  send(message: unknown): void;
  /**
   * Attempt reconnection
   */
  private attemptReconnect;
  /**
   * Notify listeners of message
   */
  private notifyListeners;
}
/**
 * High-level API for proof generation with caching and real-time updates
 */
export declare class ProofAPI {
  private cache;
  private websocket;
  private activeRequests;
  constructor();
  /**
   * Request proof generation with caching
   */
  requestProof(
    attestations: TrustAttestation[],
    proofType: "exact" | "threshold",
    options?: {
      priority?: ProofPriority;
      useCache?: boolean;
      userId?: string;
      onProgress?: (progress: ProofGenerationProgress) => void;
    }
  ): Promise<ProofResult>;
  /**
   * Request proof with WebSocket updates
   */
  requestProofWithWebSocket(
    attestations: TrustAttestation[],
    proofType: "exact" | "threshold",
    websocketUrl: string,
    options?: {
      priority?: ProofPriority;
      userId?: string;
      onProgress?: (progress: ProofGenerationProgress) => void;
    }
  ): Promise<ProofResult>;
  /**
   * Cancel proof request
   */
  cancelProof(requestId: string): boolean;
  /**
   * Get active request status
   */
  getRequestStatus(requestId: string): ProofGenerationProgress | undefined;
  /**
   * Get queue statistics
   */
  getQueueStats(): import("./queue").QueueStats;
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  };
  /**
   * Clear cache
   */
  clearCache(): void;
  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void;
}
/**
 * Singleton API instance
 */
export declare const proofAPI: ProofAPI;
//# sourceMappingURL=api.d.ts.map
