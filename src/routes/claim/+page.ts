import { getScore } from '$lib/api/client.js';
// FIX: Import the WalletState type to allow for explicit type annotation.
import { wallet, type WalletState } from '$lib/stores/wallet.js';
import { get } from 'svelte/store';

export async function load({ parent }) {
  const { config } = await parent();
  // FIX: Explicitly type `walletState` because the compiler failed to infer its type from the store, resulting in type `unknown`.
  const walletState: WalletState = get(wallet);
  
  if (!walletState.connected || !walletState.address) {
    return {
      scoreData: null
    };
  }

  try {
    const scoreData = await getScore(walletState.address);
    return { scoreData };
  } catch (error) {
    console.error("Failed to load score for claim page:", error);
    return { scoreData: null, error: "Failed to load reputation score." };
  }
}