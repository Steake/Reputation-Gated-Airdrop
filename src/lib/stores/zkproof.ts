import { writable } from "svelte/store";

export interface ZKProofState {
  generating: boolean;
  generated: boolean;
  verifying: boolean;
  verified: boolean;
  error: string | null;
  proofData: {
    proof: number[] | null;
    publicInputs: number[] | null;
    hash: string | null;
  };
}

export const zkProofStore = writable<ZKProofState>({
  generating: false,
  generated: false,
  verifying: false,
  verified: false,
  error: null,
  proofData: {
    proof: null,
    publicInputs: null,
    hash: null,
  },
});

export const zkProofActions = {
  reset: () =>
    zkProofStore.set({
      generating: false,
      generated: false,
      verifying: false,
      verified: false,
      error: null,
      proofData: {
        proof: null,
        publicInputs: null,
        hash: null,
      },
    }),

  setGenerating: () =>
    zkProofStore.update((state) => ({
      ...state,
      generating: true,
      error: null,
    })),

  setGenerated: (proof: number[], publicInputs: number[], hash: string) =>
    zkProofStore.update((state) => ({
      ...state,
      generating: false,
      generated: true,
      proofData: { proof, publicInputs, hash },
    })),

  setVerifying: () =>
    zkProofStore.update((state) => ({
      ...state,
      verifying: true,
      error: null,
    })),

  setVerified: () =>
    zkProofStore.update((state) => ({
      ...state,
      verifying: false,
      verified: true,
    })),

  setError: (error: string) =>
    zkProofStore.update((state) => ({
      ...state,
      generating: false,
      verifying: false,
      error,
    })),
};
