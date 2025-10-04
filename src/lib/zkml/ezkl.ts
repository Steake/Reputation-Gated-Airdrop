/**
 * EZKL WASM lazy loader
 * Loads @ezkljs/engine dynamically for client-side proof generation
 */

let ezklInstance: any = null;
let loadingPromise: Promise<any> | null = null;

export interface EZKLProver {
  prove: (witness: any, pk: Uint8Array, compiledCircuit: Uint8Array, srs: Uint8Array) => Promise<Uint8Array>;
  verify: (proof: Uint8Array, vk: Uint8Array, settings: any) => Promise<boolean>;
  genWitness: (input: any, compiledCircuit: Uint8Array) => Promise<Uint8Array>;
}

/**
 * Lazy load EZKL engine
 * Returns cached instance if already loaded
 */
export async function loadEzkl(): Promise<EZKLProver> {
  // Return cached instance
  if (ezklInstance) {
    return ezklInstance;
  }

  // Wait for existing load if in progress
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start new load
  loadingPromise = (async () => {
    try {
      console.log("[EZKL] Loading @ezkljs/engine...");
      
      // Dynamic import to avoid bundling WASM in main bundle
      const ezkl = await import("@ezkljs/engine");
      
      // Initialize WASM
      await ezkl.init();
      
      console.log("[EZKL] Engine loaded successfully");

      // Create prover interface
      const prover: EZKLProver = {
        prove: async (witness: any, pk: Uint8Array, compiledCircuit: Uint8Array, srs: Uint8Array) => {
          try {
            const proof = await ezkl.prove(witness, pk, compiledCircuit, srs);
            return proof;
          } catch (error) {
            console.error("[EZKL] Prove error:", error);
            throw new Error(`EZKL prove failed: ${error}`);
          }
        },

        verify: async (proof: Uint8Array, vk: Uint8Array, settings: any) => {
          try {
            const result = await ezkl.verify(proof, vk, settings);
            return result;
          } catch (error) {
            console.error("[EZKL] Verify error:", error);
            throw new Error(`EZKL verify failed: ${error}`);
          }
        },

        genWitness: async (input: any, compiledCircuit: Uint8Array) => {
          try {
            const witness = await ezkl.genWitness(input, compiledCircuit);
            return witness;
          } catch (error) {
            console.error("[EZKL] GenWitness error:", error);
            throw new Error(`EZKL genWitness failed: ${error}`);
          }
        },
      };

      ezklInstance = prover;
      return prover;
    } catch (error) {
      console.error("[EZKL] Failed to load engine:", error);
      loadingPromise = null;
      throw new Error(`Failed to load EZKL engine: ${error}`);
    }
  })();

  return loadingPromise;
}

/**
 * Check if EZKL is loaded
 */
export function isEzklLoaded(): boolean {
  return ezklInstance !== null;
}

/**
 * Unload EZKL (for testing/cleanup)
 */
export function unloadEzkl(): void {
  ezklInstance = null;
  loadingPromise = null;
}
