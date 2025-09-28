<script lang="ts">
  import { get, getContext } from "svelte/store";
  import { wallet, selectedChainId } from "$lib/stores/wallet";
  import { zkProofStore, zkProofActions } from "$lib/stores/zkproof";
  import { readContractEthers, writeContractEthers } from "$lib/web3/ethers";
  import zkmlOnChainVerifierAbi from "$lib/abi/zkmlOnChainVerifier.abi.json";
  import { getChainInfo } from "$lib/chain/constants";
  import { ebslEngine } from "$lib/ebsl/core";
  import Spinner from "./Spinner.svelte";
  import { CheckCircle, AlertCircle, Zap, Shield, UserCog } from "lucide-svelte";
  import { toasts } from "$lib/stores/ui";
  import {
    trackProofGenStart,
    trackProofGenDuration,
    trackProofGenSuccess,
  } from "$lib/stores/analytics";
  import type { FullProof, Group } from "@semaphore-protocol/interfaces";
  import { Identity } from "@semaphore-protocol/identity";

  export let contractAddress: string | undefined;

  let reputationScore: number | null = null;
  let lastVerified: Date | null = null;
  let proofType: "exact" | "threshold" | "anonymous" = "exact";
  let anonymousMode = false;
  let identity: Identity | null = null;
  let identityCommitment: string | null = null;
  let progress = 0;
  let mockGroupId = BigInt(1); // Mock Semaphore group ID
  let mockMerkleProof = Array.from({ length: 32 }, () => BigInt(0)); // Mock Merkle proof
  let mockAttestations: any[] = []; // Mock attestations for set membership

  // Get current verifier address based on chain
  function getCurrentVerifierAddress(): string {
    const currentChainId = get(selectedChainId) ?? 11155111;
    const chainInfo = getChainInfo(currentChainId);
    return contractAddress ?? chainInfo.verifierAddress ?? "";
  }

  // Generate or load Semaphore identity for anonymous mode
  async function generateIdentityCommitmentIfNeeded() {
    if (anonymousMode && !identity) {
      try {
        // Generate new identity if not exists
        identity = new Identity();
        identityCommitment = identity.genIdentityCommitment(mockGroupId);

        // Update wallet store with commitment
        wallet.update((w) => ({ ...w, identityCommitment }));

        toasts.success("Anonymous identity generated and commitment stored");
      } catch (error) {
        console.error("Failed to generate identity:", error);
        toasts.error("Failed to generate anonymous identity");
      }
    }
  }

  // Toggle anonymous mode
  function toggleAnonymousMode() {
    anonymousMode = !anonymousMode;
    if (anonymousMode) {
      generateIdentityCommitmentIfNeeded();
      proofType = "anonymous";
    } else {
      identity = null;
      identityCommitment = null;
      wallet.update((w) => ({ ...w, identityCommitment: undefined }));
      proofType = "exact";
    }
  }

  async function generateZKProof() {
    if (!$wallet.address) {
      toasts.error("Please connect your wallet first");
      return;
    }

    if (anonymousMode && !identityCommitment) {
      toasts.error("Please generate anonymous identity first");
      return;
    }

    trackProofGenStart(proofType, anonymousMode);
    const startTime = Date.now();
    zkProofActions.setGenerating();
    progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
      }
    }, 300);

    try {
      // Simulate proof generation based on type
      await new Promise((resolve) => setTimeout(resolve, 3000));
      clearInterval(progressInterval);

      const duration = Date.now() - startTime;
      trackProofGenSuccess(proofType, anonymousMode, duration);

      let mockProof: any;
      let mockPublicInputs: number[];
      let mockHash =
        "0x" +
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      if (proofType === "exact") {
        // Exact score proof
        mockProof = Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000));
        mockPublicInputs = [750000]; // Mock reputation score
      } else if (proofType === "threshold") {
        // Threshold proof: [threshold, isAboveThreshold (1=true)]
        mockProof = Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000));
        const threshold = 600000;
        const isAbove = true; // Mock above threshold
        mockPublicInputs = [threshold, isAbove ? 1 : 0];
      } else if (proofType === "anonymous") {
        // Anonymous mode: either Semaphore proof or set membership
        if (anonymousMode) {
          // Mock Semaphore proof for anonymous credential
          mockProof = {
            proof: Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000)), // a, b, c
            nullifierHash: Math.floor(Math.random() * 1000000),
            externalNullifier: Math.floor(Math.random() * 1000000),
            signal: 1, // Mock signal
            merkleProof: mockMerkleProof,
          };

          // For set membership, use ebslEngine to compute inputs
          const mockTargetAtt = {
            source: "mock",
            target: $wallet.address,
            opinion: { belief: 0.8, disbelief: 0.1, uncertainty: 0.1, base_rate: 0.5 },
            attestation_type: "trust" as const,
            weight: 1,
            created_at: Date.now(),
            expires_at: Date.now() + 86400000,
          };
          const { commitment, memberHash } = ebslEngine.computeSetMembershipInputs(
            mockAttestations || [mockTargetAtt],
            mockTargetAtt
          );
          mockPublicInputs = [Number(commitment), Number(memberHash || 0)]; // For set membership
        } else {
          mockProof = Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000));
          mockPublicInputs = [750000];
        }
      }

      zkProofActions.setGenerated(mockProof, mockPublicInputs, mockHash, proofType);
      toasts.success(`ZK ${proofType} proof generated successfully!`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      trackProofGenDuration(proofType, anonymousMode, duration);
      zkProofActions.setError(error.message || "Failed to generate proof");
      toasts.error("Proof generation failed");
    }
  }

  async function submitProofOnChain() {
    const verifierAddress = getCurrentVerifierAddress();
    if (!verifierAddress) {
      toasts.error("No verifier contract address available for current chain");
      return;
    }

    if (!$zkProofStore.proofData.proof || !$zkProofStore.proofData.publicInputs) {
      toasts.error("No proof data available");
      return;
    }

    zkProofActions.setVerifying();

    try {
      let txHash: string;
      if ($zkProofStore.proofType === "exact") {
        txHash = await writeContractEthers(
          verifierAddress,
          zkmlOnChainVerifierAbi,
          "verifyReputationProof",
          [$zkProofStore.proofData.proof, $zkProofStore.proofData.publicInputs]
        );
      } else if ($zkProofStore.proofType === "threshold") {
        // Threshold proof
        txHash = await writeContractEthers(
          verifierAddress,
          zkmlOnChainVerifierAbi,
          "verifyReputationThreshold",
          [$zkProofStore.proofData.proof, $zkProofStore.proofData.publicInputs]
        );
      } else if ($zkProofStore.proofType === "anonymous") {
        if (anonymousMode) {
          // Anonymous credential with Semaphore
          const proofData = $zkProofStore.proofData.proof as any;
          txHash = await writeContractEthers(
            verifierAddress,
            zkmlOnChainVerifierAbi,
            "verifyAnonymousCredential",
            [
              proofData.proof,
              proofData.nullifierHash,
              proofData.externalNullifier,
              proofData.signal,
              proofData.merkleProof,
            ]
          );
        } else {
          // Set membership proof
          txHash = await writeContractEthers(
            verifierAddress,
            zkmlOnChainVerifierAbi,
            "verifySetMembership",
            [$zkProofStore.proofData.proof, $zkProofStore.proofData.publicInputs]
          );
        }
      }

      // Wait for transaction confirmation
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Mock transaction time

      zkProofActions.setVerified();
      toasts.success(
        `Reputation ${proofType} verified on-chain on ${getChainInfo(get(selectedChainId)).name}!`
      );

      // Refresh reputation data
      await fetchVerifiedReputation();
    } catch (error: any) {
      zkProofActions.setError(error.message || "Failed to verify proof on-chain");
      toasts.error("On-chain verification failed");
    }
  }

  async function fetchVerifiedReputation() {
    const verifierAddress = getCurrentVerifierAddress();
    if (!$wallet.address || !verifierAddress) return;

    try {
      const [reputation, timestamp] = await readContractEthers<[bigint, bigint]>(
        verifierAddress,
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

  // Fetch reputation when wallet connects or chain changes
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

    <!-- Anonymous Mode Toggle -->
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <label
        class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        <input
          type="checkbox"
          bind:checked={anonymousMode}
          on:change={toggleAnonymousMode}
          class="rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500"
        />
        <UserCog class="h-4 w-4" />
        Enable Anonymous Mode
      </label>
      {#if anonymousMode}
        <p class="text-xs text-gray-500">
          Anonymous mode uses Semaphore for identity commitments and ZK set membership proofs for
          privacy-preserving claims.
          {#if identityCommitment}
            <details class="mt-1">
              <summary class="cursor-pointer underline">View Identity Commitment</summary>
              <code class="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
                {identityCommitment}
              </code>
            </details>
          {/if}
        </p>
      {/if}
    </div>

    <!-- Proof Type Selection -->
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Proof Type
      </label>
      <select
        bind:value={proofType}
        disabled={anonymousMode}
        class="w-full p-3 sm:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        aria-label="Select proof type"
      >
        <option value="exact">Exact Score Proof</option>
        <option value="threshold">Threshold Proof (Selective Disclosure)</option>
        {#if anonymousMode}
          <option value="anonymous" selected>Anonymous Membership Proof</option>
        {/if}
      </select>
      <p class="text-xs text-gray-500 mt-1">
        {#if proofType === "exact"}
          Reveals exact reputation score for precise verification.
        {:else if proofType === "threshold"}
          Proves reputation is above threshold without revealing exact value.
        {:else if proofType === "anonymous"}
          Proves membership in trusted set anonymously using Semaphore identity.
        {/if}
      </p>
    </div>

    <!-- Proof Generation -->
    <div class="space-y-3">
      {#if !$zkProofStore.generated}
        <button
          on:click={generateZKProof}
          disabled={$zkProofStore.generating || !$wallet.connected}
          class="w-full flex flex-col items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          aria-label="Generate ZK proof"
          role="button"
        >
          {#if $zkProofStore.generating}
            <div class="flex flex-col items-center gap-2 w-full">
              <Spinner />
              <span>Generating ZK {proofType} Proof... {progress}%</span>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style="width: {progress}%"
                ></div>
              </div>
            </div>
          {:else if proofType === "exact"}
            <Zap class="h-4 w-4" />
            <span>Generate Exact Score Proof</span>
          {:else if proofType === "threshold"}
            <Shield class="h-4 w-4" />
            <span>Generate Threshold Proof</span>
          {:else if proofType === "anonymous"}
            <UserCog class="h-4 w-4" />
            <span>Generate Anonymous Membership Proof</span>
          {/if}
        </button>
      {:else}
        <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle class="h-4 w-4" />
          <span>ZK {proofType} Proof Generated</span>
        </div>
      {/if}

      <!-- Submit to Chain -->
      {#if $zkProofStore.generated && !$zkProofStore.verified}
        <button
          on:click={submitProofOnChain}
          disabled={$zkProofStore.verifying}
          class="w-full flex flex-col items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          aria-label="Submit proof to blockchain"
          role="button"
        >
          {#if $zkProofStore.verifying}
            <Spinner />
            <span>Verifying {proofType} On-Chain...</span>
          {:else if proofType === "exact"}
            <span>Submit Exact Proof to Blockchain</span>
          {:else if proofType === "threshold"}
            <span>Submit Threshold Proof to Blockchain</span>
          {:else if proofType === "anonymous"}
            <span>Submit Anonymous Proof to Blockchain</span>
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
            <span class="font-semibold">Reputation {proofType} Verified On-Chain!</span>
          </div>
          <p class="text-sm text-green-600 dark:text-green-300 mt-1">
            Your reputation has been successfully verified using zero-knowledge {proofType} proof.
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
            class="mt-2 text-sm text-red-600 dark:text-red-300 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Try again"
            role="button"
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
            <strong>Proof Type:</strong>
            {$zkProofStore.proofType}
          </div>
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
