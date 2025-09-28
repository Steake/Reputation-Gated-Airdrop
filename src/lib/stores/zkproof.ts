import { writable, get } from "svelte/store";
import { captureException } from "@sentry/sveltekit";
import { wallet } from "./wallet";

export interface ZKProofState {
  generating: boolean;
  generated: boolean;
  verifying: boolean;
  verified: boolean;
  error: string | null;
  proofType: 'exact' | 'threshold' | 'gated';
  proofData: {
    proof: number[] | null;
    publicInputs: number[] | null;
    hash: string | null;
    communityId?: string;
    encryptedMetadata?: string; // Base64 encoded encrypted metadata
  };
}

export const zkProofStore = writable<ZKProofState>({
  generating: false,
  generated: false,
  verifying: false,
  verified: false,
  error: null,
  proofType: 'exact',
  proofData: {
    proof: null,
    publicInputs: null,
    hash: null,
    communityId: undefined,
    encryptedMetadata: undefined,
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
      proofType: 'exact',
      proofData: {
        proof: null,
        publicInputs: null,
        hash: null,
        communityId: undefined,
        encryptedMetadata: undefined,
      },
    }),

  setGenerating: () =>
    zkProofStore.update((state) => ({
      ...state,
      generating: true,
      error: null,
    })),

  setGenerated: (
    proof: number[], 
    publicInputs: number[], 
    hash: string, 
    proofType: 'exact' | 'threshold' | 'gated',
    communityId?: string,
    encryptedMetadata?: string
  ) =>
    zkProofStore.update((state) => ({
      ...state,
      generating: false,
      generated: true,
      proofType,
      proofData: { 
        proof, 
        publicInputs, 
        hash, 
        communityId, 
        encryptedMetadata 
      },
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
    zkProofStore.update((state) => {
      const walletState = get(wallet);
      const chainId = walletState.chainId;
      captureException(new Error(error), {
        contexts: {
          zkproof: {
            proofType: state.proofType,
            chainId,
            generating: state.generating,
            verifying: state.verifying
          }
        }
      });
      return {
        ...state,
        generating: false,
        verifying: false,
        error,
      };
    }),
};
