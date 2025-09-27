<script lang="ts">
  import { wallet } from "$lib/stores/wallet";
  import { zkProofStore, zkProofActions } from "$lib/stores/zkproof";
  import { readContractEthers, writeContractEthers } from "$lib/web3/ethers";
  import zkmlOnChainVerifierAbi from "$lib/abi/zkmlOnChainVerifier.abi.json";
  import Spinner from "./Spinner.svelte";
  import { CheckCircle, AlertCircle, Zap } from "lucide-svelte";
  import { toasts } from "$lib/stores/ui";

  export let contractAddress: string;

  let reputationScore: number | null = null;
  let lastVerified: Date | null = null;

  async function generateZKProof() {
    if (!$wallet.address) {
      toasts.error("Please connect your wallet first");
      return;
    }

    zkProofActions.setGenerating();

    try {
      // This would typically call your backend service to generate the ZK proof
      // For now, we'll simulate the process
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate proof generation time

      // Mock proof data - in production, this would come from your EZKL backend
      const mockProof = Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000));
      const mockPublicInputs = [750000]; // Mock reputation score of 0.75
      const mockHash =
        "0x" +
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      zkProofActions.setGenerated(mockProof, mockPublicInputs, mockHash);
      toasts.success("ZK proof generated successfully!");
    } catch (error: any) {
      zkProofActions.setError(error.message || "Failed to generate proof");
      toasts.error("Proof generation failed");
    }
  }

  async function submitProofOnChain() {
    if (!$zkProofStore.proofData.proof || !$zkProofStore.proofData.publicInputs) {
      toasts.error("No proof data available");
      return;
    }

    zkProofActions.setVerifying();

    try {
      const txHash = await writeContractEthers(
        contractAddress,
        zkmlOnChainVerifierAbi,
        "verifyReputationProof",
        [$zkProofStore.proofData.proof, $zkProofStore.proofData.publicInputs]
      );

      // Wait for transaction confirmation
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Mock transaction time

      zkProofActions.setVerified();
      toasts.success("Reputation verified on-chain!");

      // Refresh reputation data
      await fetchVerifiedReputation();
    } catch (error: any) {
      zkProofActions.setError(error.message || "Failed to verify proof on-chain");
      toasts.error("On-chain verification failed");
    }
  }

  async function fetchVerifiedReputation() {
    if (!$wallet.address) return;

    try {
      const [reputation, timestamp] = await readContractEthers<[bigint, bigint]>(
        contractAddress,
        zkmlOnChainVerifierAbi,
        "getVerifiedReputation",
        [$wallet.address]
      );

      reputationScore = Number(reputation) / 1e6; // Convert from 1e6 scale
      lastVerified = timestamp > 0 ? new Date(Number(timestamp) * 1000) : null;
    } catch (error) {
      console.error("Failed to fetch verified reputation:", error);
    }
  }

  // Fetch reputation when wallet connects
  $: if ($wallet.address) {
    fetchVerifiedReputation();
  }
</script>

<div
  class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-xl font-bold flex items-center gap-2">
      <Zap class="h-5 w-5 text-purple-500" />
      ZKML Reputation Verifier
    </h3>
  </div>

  <div class="space-y-4">
    <!-- Current Status -->
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h4 class="font-semibold mb-2">Verification Status</h4>
      {#if reputationScore !== null}
        <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle class="h-4 w-4" />
          <span>Verified Score: {reputationScore.toFixed(3)}</span>
        </div>
        {#if lastVerified}
          <p class="text-sm text-gray-500 mt-1">
            Last verified: {lastVerified.toLocaleDateString()}
          </p>
        {/if}
      {:else}
        <div class="flex items-center gap-2 text-gray-500">
          <AlertCircle class="h-4 w-4" />
          <span>No verified reputation on-chain</span>
        </div>
      {/if}
    </div>

    <!-- Proof Generation -->
    <div class="space-y-3">
      {#if !$zkProofStore.generated}
        <button
          on:click={generateZKProof}
          disabled={$zkProofStore.generating || !$wallet.connected}
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if $zkProofStore.generating}
            <Spinner />
            <span>Generating ZK Proof...</span>
          {:else}
            <Zap class="h-4 w-4" />
            <span>Generate ZK Proof</span>
          {/if}
        </button>
      {:else}
        <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle class="h-4 w-4" />
          <span>ZK Proof Generated</span>
        </div>
      {/if}

      <!-- Submit to Chain -->
      {#if $zkProofStore.generated && !$zkProofStore.verified}
        <button
          on:click={submitProofOnChain}
          disabled={$zkProofStore.verifying}
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if $zkProofStore.verifying}
            <Spinner />
            <span>Verifying On-Chain...</span>
          {:else}
            <span>Submit Proof to Blockchain</span>
          {/if}
        </button>
      {/if}

      <!-- Success State -->
      {#if $zkProofStore.verified}
        <div
          class="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg"
        >
          <div class="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle class="h-5 w-5" />
            <span class="font-semibold">Reputation Verified On-Chain!</span>
          </div>
          <p class="text-sm text-green-600 dark:text-green-300 mt-1">
            Your reputation has been successfully verified using zero-knowledge proofs.
          </p>
        </div>
      {/if}

      <!-- Error State -->
      {#if $zkProofStore.error}
        <div
          class="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg"
        >
          <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle class="h-5 w-5" />
            <span class="font-semibold">Error</span>
          </div>
          <p class="text-sm text-red-600 dark:text-red-300 mt-1">
            {$zkProofStore.error}
          </p>
          <button
            on:click={zkProofActions.reset}
            class="mt-2 text-sm text-red-600 dark:text-red-300 hover:underline"
          >
            Try Again
          </button>
        </div>
      {/if}
    </div>

    <!-- Technical Details -->
    {#if $zkProofStore.proofData.hash}
      <details class="text-sm">
        <summary class="cursor-pointer font-semibold">Technical Details</summary>
        <div class="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
          <div>
            <strong>Proof Hash:</strong>
            <code class="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
              {$zkProofStore.proofData.hash}
            </code>
          </div>
          <div>
            <strong>Public Inputs:</strong>
            <code class="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              {JSON.stringify($zkProofStore.proofData.publicInputs)}
            </code>
          </div>
        </div>
      </details>
    {/if}
  </div>
</div>
