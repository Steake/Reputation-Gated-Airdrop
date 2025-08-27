<script lang="ts">
  import { page } from "$app/stores";
  import { wallet } from "$lib/stores/wallet";
  import { score } from "$lib/stores/score";
  import { airdrop } from "$lib/stores/airdrop";
  import { toasts } from "$lib/stores/ui";
  import { getClaimArtifact, getProofMeta } from "$lib/api/client";
  import { readContract, writeContract } from "$lib/chain/client";
  import { shortenAddress, formatTokenAmount } from "$lib/utils";
  import Spinner from "./Spinner.svelte";
  import { CheckCircle, AlertCircle } from "lucide-svelte";
  import type { ClaimArtifact, PayoutQuote } from "$lib/types";
  import type { Hex } from "viem";

  import reputationAirdropScaled from "$lib/abi/reputationAirdropScaled.abi.json";
  import reputationAirdropZKScaled from "$lib/abi/reputationAirdropZKScaled.abi.json";

  type State =
    | "idle"
    | "fetching"
    | "awaiting_wallet"
    | "sending"
    | "confirmed"
    | "error";

  let state: State = "idle";
  let errorMessage = "";
  let txHash: string | null = null;
  let quote: PayoutQuote | null = null;

  const config = $page.data.config;
  // Prefer ZK path if available
  const useZkPath = !!config.AIRDROP_ZK_ADDR;
  const claimContractAddress = (
    useZkPath ? config.AIRDROP_ZK_ADDR : config.AIRDROP_ECDSA_ADDR
  ) as Hex;
  const claimAbi = useZkPath
    ? reputationAirdropZKScaled
    : reputationAirdropScaled;

  async function fetchQuote() {
    if (typeof $score.value !== "number" || !$airdrop.decimals) return;
    try {
      const payout = await readContract<bigint>(
        claimContractAddress,
        claimAbi,
        "quotePayout",
        [BigInt($score.value)],
      );
      quote = {
        payout,
        min: $airdrop.minPayout!,
        max: $airdrop.maxPayout!,
        decimals: $airdrop.decimals!,
      };
    } catch (e) {
      console.error("Failed to fetch quote", e);
      toasts.error("Could not preview payout.");
    }
  }

  async function handleClaim() {
    if (!$wallet.address) return;
    state = "fetching";
    errorMessage = "";

    try {
      let hash: Hex;
      if (useZkPath) {
        const proofMeta = await getProofMeta($wallet.address);
        if (proofMeta.score1e6 !== $score.value) {
          throw new Error(
            "Score mismatch between frontend and backend proof generation.",
          );
        }
        state = "awaiting_wallet";
        hash = await writeContract(
          claimContractAddress,
          claimAbi,
          "claim",
          [proofMeta.calldata as `0x${string}`, BigInt(proofMeta.score1e6)],
          $wallet.address,
        );
      } else {
        // ECDSA Path
        const artifact = await getClaimArtifact(
          $wallet.address,
          config.CAMPAIGN as string,
        );

        // Local validation
        if (artifact.addr.toLowerCase() !== $wallet.address.toLowerCase())
          throw new Error("Artifact address mismatch");
        if (artifact.campaign.toLowerCase() !== config.CAMPAIGN.toLowerCase())
          throw new Error("Artifact campaign mismatch");
        if (artifact.deadline < Math.floor(Date.now() / 1000))
          throw new Error("Artifact has expired");

        state = "awaiting_wallet";
        hash = await writeContract(
          claimContractAddress,
          claimAbi,
          "claim",
          [
            artifact.circuitId,
            artifact.modelDigest as Hex,
            artifact.inputDigest as Hex,
            BigInt(artifact.score),
            BigInt(artifact.deadline),
            artifact.sig.v,
            artifact.sig.r as Hex,
            artifact.sig.s as Hex,
          ],
          $wallet.address,
        );
      }

      txHash = hash;
      state = "sending";
      toasts.info(`Transaction sent: ${shortenAddress(hash)}`);

      const publicClient = (
        await import("$lib/chain/client")
      ).getPublicClient();
      await publicClient.waitForTransactionReceipt({ hash });

      state = "confirmed";
      toasts.success("Claim successful!");
    } catch (error: any) {
      console.error("Claim failed:", error);
      errorMessage =
        error.shortMessage || error.message || "An unknown error occurred.";
      toasts.error(errorMessage);
      state = "error";
    }
  }

  fetchQuote();
</script>

<div class="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
  <div class="text-center">
    <h2 class="text-2xl font-bold">You're Eligible to Claim!</h2>
    <p class="text-gray-500 mt-2">
      Your score of {($score.value || 0) / 1e6} meets the minimum requirement.
    </p>
  </div>

  <div
    class="my-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-center"
  >
    <p class="text-sm text-gray-500">Estimated Payout</p>
    {#if quote}
      <p class="text-3xl font-bold text-brand">
        {formatTokenAmount(quote.payout, quote.decimals)} Tokens
      </p>
    {:else}
      <p class="text-3xl font-bold text-gray-400">Loading...</p>
    {/if}
  </div>

  {#if state === "idle"}
    <button
      on:click={handleClaim}
      class="w-full justify-center rounded-md bg-brand px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
    >
      Claim Now
    </button>
  {:else if state === "fetching"}
    <div class="text-center space-y-2 p-4">
      <Spinner />
      <p class="font-semibold">Fetching claim data...</p>
      <p class="text-sm text-gray-500">Preparing your on-chain transaction.</p>
    </div>
  {:else if state === "awaiting_wallet"}
    <div class="text-center space-y-2 p-4">
      <Spinner />
      <p class="font-semibold">Awaiting wallet confirmation</p>
      <p class="text-sm text-gray-500">
        Please approve the transaction in your wallet.
      </p>
    </div>
  {:else if state === "sending"}
    <div class="text-center space-y-2 p-4">
      <Spinner />
      <p class="font-semibold">Transaction in progress...</p>
      <p class="text-sm text-gray-500">Waiting for blockchain confirmation.</p>
      <a
        href={"https://sepolia.etherscan.io/tx/" + txHash}
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-brand hover:underline">View on Etherscan</a
      >
    </div>
  {:else if state === "confirmed"}
    <div
      class="text-center space-y-4 p-4 text-green-700 bg-green-50 rounded-lg border border-green-200"
    >
      <CheckCircle class="h-12 w-12 mx-auto" />
      <p class="text-xl font-bold">Claim Successful!</p>
      {#if quote}
        <p>
          You have successfully claimed {formatTokenAmount(
            quote.payout,
            quote.decimals,
          )} tokens.
        </p>
      {:else}
        <p>You have successfully claimed tokens.</p>
      {/if}
      <a
        href={"https://sepolia.etherscan.io/tx/" + txHash}
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm text-green-800 hover:underline font-semibold"
        >View Transaction</a
      >
    </div>
  {:else if state === "error"}
    <div
      class="text-center space-y-4 p-4 text-red-700 bg-red-50 rounded-lg border border-red-200"
    >
      <AlertCircle class="h-12 w-12 mx-auto" />
      <p class="text-xl font-bold">Claim Failed</p>
      <p class="text-sm">{errorMessage}</p>
      <button
        on:click={handleClaim}
        class="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
      >
        Retry
      </button>
    </div>
  {/if}

  <p class="text-xs text-gray-400 text-center mt-4">
    Using {useZkPath ? "ZK Proof" : "ECDSA Signature"} claim path.
  </p>
</div>
