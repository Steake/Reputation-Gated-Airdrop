/**
 * Circuit Manager with persistent IndexedDB cache and integrity verification
 * Handles circuit downloads, caching, and hash verification
 */

const DB_NAME = "ezkl-circuits";
const DB_VERSION = 1;
const CIRCUITS_STORE = "circuits";
const CIRCUIT_BASE_URL = "/circuits"; // Can be configured via env

export interface CircuitArtifacts {
  compiledCircuit: Uint8Array;
  provingKey: Uint8Array;
  verifyingKey: Uint8Array;
  srs: Uint8Array;
  settings: any;
  hash: string; // SHA-256 hash for integrity
}

export interface CircuitMetadata {
  size: string; // "small", "medium", "large"
  maxAttestations: number;
  hash: string;
  timestamp: number;
  version: string;
}

class CircuitManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[CircuitManager] IndexedDB initialized");
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create circuits store if it doesn't exist
        if (!db.objectStoreNames.contains(CIRCUITS_STORE)) {
          const store = db.createObjectStore(CIRCUITS_STORE, { keyPath: "size" });
          store.createIndex("hash", "hash", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
          console.log("[CircuitManager] Created circuits store");
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get circuit from cache or download
   */
  async getCircuit(size: string): Promise<CircuitArtifacts> {
    await this.initDB();

    // Try to get from cache first
    const cached = await this.getCachedCircuit(size);
    if (cached) {
      console.log(`[CircuitManager] Cache hit for ${size} circuit`);
      
      // Verify integrity
      if (await this.verifyIntegrity(cached)) {
        return cached;
      } else {
        console.warn(`[CircuitManager] Cached ${size} circuit failed integrity check, re-downloading`);
        await this.deleteCachedCircuit(size);
      }
    }

    // Download circuit
    console.log(`[CircuitManager] Downloading ${size} circuit...`);
    const circuit = await this.downloadCircuit(size);

    // Cache for future use
    await this.cacheCircuit(size, circuit);

    return circuit;
  }

  /**
   * Get circuit from IndexedDB cache
   */
  private async getCachedCircuit(size: string): Promise<CircuitArtifacts | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CIRCUITS_STORE], "readonly");
      const store = transaction.objectStore(CIRCUITS_STORE);
      const request = store.get(size);

      request.onsuccess = () => {
        if (request.result) {
          const data = request.result;
          resolve({
            compiledCircuit: data.compiledCircuit,
            provingKey: data.provingKey,
            verifyingKey: data.verifyingKey,
            srs: data.srs,
            settings: data.settings,
            hash: data.hash,
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to get cached circuit"));
      };
    });
  }

  /**
   * Download circuit from server
   */
  private async downloadCircuit(size: string): Promise<CircuitArtifacts> {
    try {
      const baseUrl = `${CIRCUIT_BASE_URL}/ebsl_${size}`;

      // Download all artifacts in parallel
      const [compiledCircuit, provingKey, verifyingKey, srs, settings, metadata] =
        await Promise.all([
          this.fetchBinary(`${baseUrl}/circuit.compiled`),
          this.fetchBinary(`${baseUrl}/proving.key`),
          this.fetchBinary(`${baseUrl}/verifying.key`),
          this.fetchBinary(`${baseUrl}/kzg.srs`),
          this.fetchJSON(`${baseUrl}/settings.json`),
          this.fetchJSON(`${baseUrl}/metadata.json`),
        ]);

      // Calculate combined hash
      const hash = await this.calculateHash(compiledCircuit, provingKey, verifyingKey, srs);

      // Verify against expected hash
      if (metadata.hash && hash !== metadata.hash) {
        throw new Error(`Circuit integrity check failed: expected ${metadata.hash}, got ${hash}`);
      }

      console.log(`[CircuitManager] Downloaded ${size} circuit (hash: ${hash.substring(0, 16)}...)`);

      return {
        compiledCircuit,
        provingKey,
        verifyingKey,
        srs,
        settings,
        hash,
      };
    } catch (error) {
      throw new Error(`Failed to download ${size} circuit: ${error}`);
    }
  }

  /**
   * Cache circuit in IndexedDB
   */
  private async cacheCircuit(size: string, circuit: CircuitArtifacts): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CIRCUITS_STORE], "readwrite");
      const store = transaction.objectStore(CIRCUITS_STORE);

      const data = {
        size,
        compiledCircuit: circuit.compiledCircuit,
        provingKey: circuit.provingKey,
        verifyingKey: circuit.verifyingKey,
        srs: circuit.srs,
        settings: circuit.settings,
        hash: circuit.hash,
        timestamp: Date.now(),
      };

      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`[CircuitManager] Cached ${size} circuit`);
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to cache circuit"));
      };
    });
  }

  /**
   * Delete cached circuit
   */
  private async deleteCachedCircuit(size: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CIRCUITS_STORE], "readwrite");
      const store = transaction.objectStore(CIRCUITS_STORE);
      const request = store.delete(size);

      request.onsuccess = () => {
        console.log(`[CircuitManager] Deleted cached ${size} circuit`);
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete cached circuit"));
      };
    });
  }

  /**
   * Verify circuit integrity
   */
  private async verifyIntegrity(circuit: CircuitArtifacts): Promise<boolean> {
    try {
      const hash = await this.calculateHash(
        circuit.compiledCircuit,
        circuit.provingKey,
        circuit.verifyingKey,
        circuit.srs
      );
      return hash === circuit.hash;
    } catch (error) {
      console.error("[CircuitManager] Integrity verification failed:", error);
      return false;
    }
  }

  /**
   * Calculate SHA-256 hash of circuit artifacts
   */
  private async calculateHash(...buffers: Uint8Array[]): Promise<string> {
    // Concatenate all buffers
    const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    // Calculate SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  }

  /**
   * Fetch binary data
   */
  private async fetchBinary(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Fetch JSON data
   */
  private async fetchJSON(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    cachedCircuits: string[];
    totalSize: number;
    lastUpdated: number;
  }> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CIRCUITS_STORE], "readonly");
      const store = transaction.objectStore(CIRCUITS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const circuits = request.result;
        const cachedCircuits = circuits.map((c: any) => c.size);
        const totalSize = circuits.reduce((sum: number, c: any) => {
          return (
            sum +
            c.compiledCircuit.length +
            c.provingKey.length +
            c.verifyingKey.length +
            c.srs.length
          );
        }, 0);
        const lastUpdated = Math.max(...circuits.map((c: any) => c.timestamp), 0);

        resolve({
          cachedCircuits,
          totalSize,
          lastUpdated,
        });
      };

      request.onerror = () => {
        reject(new Error("Failed to get cache stats"));
      };
    });
  }

  /**
   * Clear all cached circuits
   */
  async clearCache(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CIRCUITS_STORE], "readwrite");
      const store = transaction.objectStore(CIRCUITS_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("[CircuitManager] Cache cleared");
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to clear cache"));
      };
    });
  }
}

// Singleton instance
export const circuitManager = new CircuitManager();
