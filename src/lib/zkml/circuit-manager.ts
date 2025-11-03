/**
 * Circuit Manager with persistent IndexedDB cache and manifest-based integrity verification
 * Downloads circuits from /circuits/ebsl_{size}/ with files: _compiled.wasm, settings.json, vk.key
 * Stores in IndexedDB and verifies SHA-256 against build-time manifest CIRCUIT_HASHES
 */

import { circuitDB } from "./db";

const CIRCUIT_BASE_URL = "/circuits"; // Can be configured via env

// Build-time circuit hashes generated from mock circuit artifacts
// NOTE: These are hashes of MOCK circuits for development/testing
// For production, replace with actual EZKL-compiled circuit hashes
export const CIRCUIT_HASHES: Record<string, string> = {
  "16": "c878a1af656b151e1b186fbd575a3b3a46568aad369770a03ab204759901ceeb", // 16 opinions
  "32": "9a10eeced02c1c3a430c6c7b0a2ac0d4b566e07e74c819236d9f2418ee693be1", // 32 opinions
  "64": "17ffe9c264dd8003eea6abee8fd9162066c5c6a97220d2322ad144172d21aa43", // 64 opinions
};

export interface CircuitArtifacts {
  compiledCircuit: Uint8Array; // _compiled.wasm
  settings: any; // settings.json
  verifyingKey: Uint8Array; // vk.key
  hash: string; // SHA-256 hash for integrity
}

export interface CircuitCacheStats {
  cachedCircuits: string[];
  totalSize: number;
}

class CircuitManager {
  /**
   * Get circuit from cache or download (with integrity verification)
   * Downloads from /circuits/ebsl_{size}/_compiled.wasm, settings.json, vk.key
   */
  async getCircuit(size: string): Promise<CircuitArtifacts> {
    const cacheKey = `circuit_${size}`;

    // Try to get from cache first
    const cached = await circuitDB.getByKey<CircuitArtifacts>(cacheKey);
    if (cached) {
      console.log(`[CircuitManager] Cache hit for ${size} circuit`);

      // Verify integrity against manifest
      if (await this.verifyIntegrity(cached, size)) {
        return cached;
      } else {
        console.warn(
          `[CircuitManager] Cached ${size} circuit failed integrity check, re-downloading`
        );
        await circuitDB.delete(cacheKey);
      }
    }

    // Download circuit
    console.log(`[CircuitManager] Downloading ${size} circuit...`);
    const circuit = await this.downloadCircuit(size);

    // Verify against manifest before caching
    if (!(await this.verifyIntegrity(circuit, size))) {
      throw new Error(
        `Circuit integrity error: downloaded ${size} circuit hash mismatch with manifest`
      );
    }

    // Cache for future use
    await circuitDB.put(cacheKey, circuit);
    console.log(`[CircuitManager] Cached ${size} circuit`);

    return circuit;
  }

  /**
   * Download circuit artifacts from server
   * Files: /circuits/ebsl_{size}/_compiled.wasm, settings.json, vk.key
   */
  private async downloadCircuit(size: string): Promise<CircuitArtifacts> {
    try {
      const baseUrl = `${CIRCUIT_BASE_URL}/ebsl_${size}`;

      // Download all artifacts in parallel
      const [compiledCircuit, settings, verifyingKey] = await Promise.all([
        this.fetchBinary(`${baseUrl}/_compiled.wasm`),
        this.fetchJSON(`${baseUrl}/settings.json`),
        this.fetchBinary(`${baseUrl}/vk.key`),
      ]);

      // Calculate combined SHA-256 hash
      const hash = await this.calculateHash(compiledCircuit, verifyingKey);

      console.log(
        `[CircuitManager] Downloaded ${size} circuit (hash: ${hash.substring(0, 16)}...)`
      );

      return {
        compiledCircuit,
        settings,
        verifyingKey,
        hash,
      };
    } catch (error: any) {
      throw new Error(`Failed to download ${size} circuit: ${error.message}`);
    }
  }

  /**
   * Fetch binary file
   */
  private async fetchBinary(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${url}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Fetch JSON file
   */
  private async fetchJSON(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${url}`);
    }
    return response.json();
  }

  /**
   * Calculate SHA-256 hash of circuit artifacts
   */
  private async calculateHash(
    compiledCircuit: Uint8Array,
    verifyingKey: Uint8Array
  ): Promise<string> {
    // Concatenate all binary data
    const combined = new Uint8Array(compiledCircuit.length + verifyingKey.length);
    combined.set(compiledCircuit, 0);
    combined.set(verifyingKey, compiledCircuit.length);

    // Calculate SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return hashHex;
  }

  /**
   * Verify circuit integrity against manifest
   */
  private async verifyIntegrity(circuit: CircuitArtifacts, size: string): Promise<boolean> {
    const expectedHash = CIRCUIT_HASHES[size];

    // If no expected hash in manifest, skip verification (development mode)
    if (!expectedHash || expectedHash.startsWith("0000")) {
      console.warn(
        `[CircuitManager] No manifest hash for ${size}, skipping verification (dev mode)`
      );
      return true;
    }

    // Verify hash matches manifest
    return circuit.hash === expectedHash;
  }

  /**
   * Check if circuit is cached
   */
  async isCached(size: string): Promise<boolean> {
    return circuitDB.has(`circuit_${size}`);
  }

  /**
   * Clear circuit from cache
   */
  async clearCircuit(size: string): Promise<void> {
    await circuitDB.delete(`circuit_${size}`);
    console.log(`[CircuitManager] Cleared ${size} circuit from cache`);
  }

  /**
   * Clear all circuits from cache
   */
  async clearCache(): Promise<void> {
    const keys = await circuitDB.getAllKeys();
    const circuitKeys = keys.filter((k) => k.startsWith("circuit_"));

    for (const key of circuitKeys) {
      await circuitDB.delete(key);
    }

    console.log(`[CircuitManager] Cleared all circuits from cache`);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CircuitCacheStats> {
    const keys = await circuitDB.getAllKeys();
    const circuitKeys = keys.filter((k) => k.startsWith("circuit_"));

    // Extract circuit sizes
    const cachedCircuits = circuitKeys.map((k) => k.replace("circuit_", ""));

    // Calculate total size
    let totalSize = 0;
    for (const key of circuitKeys) {
      const circuit = await circuitDB.getByKey<CircuitArtifacts>(key);
      if (circuit) {
        totalSize +=
          circuit.compiledCircuit.byteLength +
          circuit.verifyingKey.byteLength +
          JSON.stringify(circuit.settings).length;
      }
    }

    return {
      cachedCircuits,
      totalSize,
    };
  }

  /**
   * Determine optimal circuit size based on attestation count
   */
  selectCircuitSize(attestationCount: number): string {
    if (attestationCount <= 16) {
      return "16";
    } else if (attestationCount <= 32) {
      return "32";
    } else {
      return "64";
    }
  }

  /**
   * Pre-download circuits for faster first-time use
   */
  async preloadCircuits(sizes: string[] = ["16", "32"]): Promise<void> {
    console.log(`[CircuitManager] Preloading circuits: ${sizes.join(", ")}`);

    const promises = sizes.map((size) => this.getCircuit(size));
    await Promise.all(promises);

    console.log("[CircuitManager] Preload complete");
  }
}

// Export singleton instance
export const circuitManager = new CircuitManager();
