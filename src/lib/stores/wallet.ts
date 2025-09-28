import { writable, get } from "svelte/store";
import { captureException } from "@sentry/sveltekit";

export type WalletState = {
  address?: `0x${string}`;
  chainId?: number;
  selectedChainId?: number;
  connected: boolean;
  identityCommitment?: string; // Semaphore identity commitment for anonymous mode
  error?: string | null;
};

export const wallet = writable<WalletState>({
  connected: false,
  selectedChainId: 11155111, // Default to Sepolia
  error: null,
});

export const selectedChainId = writable<number>(11155111);

export const walletActions = {
  setError: (error: string) => {
    const currentState = get(wallet);
    wallet.update((state) => ({
      ...state,
      error,
    }));
    captureException(new Error(error), {
      contexts: {
        wallet: {
          address: currentState.address,
          chainId: currentState.chainId,
          connected: currentState.connected,
        },
      },
    });
  },
  clearError: () => {
    wallet.update((state) => ({
      ...state,
      error: null,
    }));
  },
};
