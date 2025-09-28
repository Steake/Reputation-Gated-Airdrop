import { getScore } from "$lib/api/client.js";
// FIX: Import the WalletState type to allow for explicit type annotation.
import { wallet, type WalletState } from "$lib/stores/wallet.js";
import { get } from "svelte/store";
import { trackClaimAttempt, trackClaimSuccess } from "$lib/stores/analytics";

export async function load({ parent }) {
  const { config } = await parent();
  // FIX: Explicitly type `walletState` because the compiler failed to infer its type from the store, resulting in type `unknown`.
  const walletState: WalletState = get(wallet);

  if (!walletState.connected || !walletState.address) {
    return {
      scoreData: null,
    };
  }

  // Track claim attempt when loading claim page with connected wallet
  if (typeof window !== "undefined") {
    trackClaimAttempt(0, undefined);
  }

  try {
    const scoreData = await getScore(walletState.address);
    // Track claim success with score and community if available
    const score = scoreData?.score || 0;
    const community = scoreData?.community;
    if (typeof window !== "undefined") {
      trackClaimSuccess(score, community);
    }
    return { scoreData };
  } catch (error) {
    console.error("Failed to load score for claim page:", error);
    // Track claim attempt failure
    if (typeof window !== "undefined") {
      trackClaimAttempt(0, undefined);
    }
    return { scoreData: null, error: "Failed to load reputation score." };
  }
}
