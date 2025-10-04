<script lang="ts">
  import { get } from "svelte/store";
  import { wallet, selectedChainId } from "$lib/stores/wallet";
  import { zkProofStore, zkProofActions } from "$lib/stores/zkproof";
  import { hybridProver, deviceCapability, getCapabilityMessage } from "$lib/zkml";
  import { attestations } from "$lib/stores/attestations";
  import { trackProof } from "$lib/telemetry";
  import Spinner from "./Spinner.svelte";
  import { CheckCircle, AlertCircle, Zap, Shield, UserCog, X } from "lucide-svelte";
  import { toasts } from "$lib/stores/ui";
  import {
    trackProofGenStart,
    trackProofGenDuration,
    trackProofGenSuccess,
  } from "$lib/stores/analytics";

  export let contractAddress: string | undefined;

  let proofType: "exact" | "threshold" = "exact";
  let threshold: number = 600000; // 0.6 * 1e6
  let progress = 0;
  let progressStage = "";
  let elapsedTimeMs = 0;
  let elapsedInterval: any;
  let startTime = 0;
  let capabilityMessage = "";

  // Get device capability message on mount
  $: {
    const capabilities = deviceCapability.detect();
    capabilityMessage = getCapabilityMessage(capabilities);
  }

  async function generateZKProof() {
    if (!$wallet.address) {
      toasts.error("Please connect your wallet first");
      return;
    }

    const attestationsList = get(attestations);
    if (!attestationsList || attestationsList.length === 0) {
      toasts.error("No attestations available");
      return;
    }

    trackProofGenStart(proofType, false);
    startTime = Date.now();
    elapsedTimeMs = 0;
    zkProofActions.setGenerating();
    progress = 0;
    progressStage = "Initializing...";

    // Update elapsed time every 100ms
    elapsedInterval = setInterval(() => {
      elapsedTimeMs = Date.now() - startTime;
    }, 100);

    try {
      const result = await hybridProver.generateProof(attestationsList, {
        proofType,
        threshold: proofType === "threshold" ? threshold : undefined,
        onProgress: (p) => {
          progress = p.progress;
          progressStage = p.stage;
        },
        userId: $wallet.address,
        timeout: 60000, // 60s timeout
      });

      clearInterval(elapsedInterval);
      const duration = Date.now() - startTime;
      trackProofGenSuccess(proofType, false, duration);

      // Track telemetry event
      trackProof({
        method: result.mode as "local" | "remote" | "simulation",
        ms: duration,
        size: attestationsList.length,
        success: true,
      });

      zkProofActions.setGenerated(
        result.proof,
        result.publicInputs,
        result.hash,
        proofType as any,
        result.mode,
        result.duration
      );

      toasts.success(`ZK ${proofType} proof generated successfully using ${result.mode} mode!`);
    } catch (error: any) {
      clearInterval(elapsedInterval);
      const duration = Date.now() - startTime;
      trackProofGenDuration(proofType, false, duration);

      // Track telemetry event for failure
      trackProof({
        method: "remote", // Assume remote on error
        ms: duration,
        size: attestationsList.length,
        success: false,
        errorType: error.name || "UnknownError",
      });

      zkProofActions.setError(error.message || "Failed to generate proof");
      toasts.error(`Proof generation failed: ${error.message}`);
    }
  }

  function cancelProof() {
    hybridProver.cancelJob();
    clearInterval(elapsedInterval);
    zkProofActions.setError("Proof generation cancelled by user");
    toasts.info("Proof generation cancelled");
  }

  function formatElapsedTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const remainingMs = ms % 1000;
    return `${seconds}.${Math.floor(remainingMs / 100)}s`;
  }

  function getMethodBadgeColor(method?: string): string {
    switch (method) {
      case "local":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "remote":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "simulation":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  }
</script>

<div
  class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-xl font-bold flex items-center gap-2">
      <Zap class="h-5 w-5 text-purple-500" />
      ZKML Reputation Prover
    </h3>
  </div>

  <div class="space-y-4">
    <!-- Device Capability Info -->
    {#if capabilityMessage}
      <div
        class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm"
        data-testid="device-capability"
      >
        <p class="text-blue-800 dark:text-blue-200">{capabilityMessage}</p>
      </div>
    {/if}

    <!-- Proof Type Selection -->
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Proof Type
      </label>
      <select
        bind:value={proofType}
        disabled={$zkProofStore.generating}
        class="w-full p-3 sm:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        aria-label="Select proof type"
        data-testid="proof-type-selector"
      >
        <option value="exact">Exact Score Proof</option>
        <option value="threshold">Threshold Proof (Selective Disclosure)</option>
      </select>
      <p class="text-xs text-gray-500 mt-1">
        {#if proofType === "exact"}
          Reveals exact reputation score for precise verification.
        {:else}
          Proves reputation is above threshold without revealing exact value.
        {/if}
      </p>
    </div>

    <!-- Threshold Input (for threshold proof) -->
    {#if proofType === "threshold"}
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Threshold Value (×10⁶)
        </label>
        <input
          type="number"
          bind:value={threshold}
          min="0"
          max="1000000"
          step="10000"
          disabled={$zkProofStore.generating}
          class="w-full p-3 sm:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          data-testid="threshold-input"
        />
        <p class="text-xs text-gray-500 mt-1">
          Threshold: {(threshold / 1e6).toFixed(2)} (0.00 - 1.00 scale)
        </p>
      </div>
    {/if}

    <!-- Proof Generation -->
    <div class="space-y-3">
      {#if !$zkProofStore.generated}
        <button
          on:click={generateZKProof}
          disabled={$zkProofStore.generating || !$wallet.connected}
          class="w-full flex flex-col items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          aria-label="Generate ZK proof"
          role="button"
          data-testid="generate-proof-button"
        >
          {#if $zkProofStore.generating}
            <div class="flex flex-col items-center gap-2 w-full">
              <div class="flex items-center gap-2">
                <Spinner />
                <span>Generating {proofType} Proof...</span>
              </div>
              <div class="text-sm text-purple-200" data-testid="proof-stage">
                {progressStage} ({progress}%)
              </div>
              <div class="w-full bg-purple-800 rounded-full h-2" data-testid="proof-progress-bar">
                <div
                  class="bg-purple-300 h-2 rounded-full transition-all duration-300"
                  style="width: {progress}%"
                ></div>
              </div>
              <div class="text-xs text-purple-200" data-testid="elapsed-time">
                Elapsed: {formatElapsedTime(elapsedTimeMs)}
              </div>
            </div>
          {:else if proofType === "exact"}
            <Zap class="h-4 w-4" />
            <span>Generate Exact Score Proof</span>
          {:else}
            <Shield class="h-4 w-4" />
            <span>Generate Threshold Proof</span>
          {/if}
        </button>

        <!-- Cancel Button (during generation) -->
        {#if $zkProofStore.generating}
          <button
            on:click={cancelProof}
            class="w-full flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-red-600 text-white rounded-lg hover:bg-red-700 touch-manipulation"
            aria-label="Cancel proof generation"
            role="button"
            data-testid="cancel-proof-button"
          >
            <X class="h-4 w-4" />
            <span>Cancel</span>
          </button>
        {/if}
      {:else}
        <!-- Success Card -->
        <div
          class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg"
          data-testid="proof-success"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle class="h-5 w-5" />
              <span class="font-semibold">ZK {proofType} Proof Generated!</span>
            </div>
            {#if $zkProofStore.proofData.method}
              <span
                class="px-2 py-1 rounded text-xs font-medium {getMethodBadgeColor(
                  $zkProofStore.proofData.method
                )}"
                data-testid="proof-method-badge"
              >
                {$zkProofStore.proofData.method.toUpperCase()}
              </span>
            {/if}
          </div>
          <div class="text-sm text-green-600 dark:text-green-300 space-y-1">
            <p>Your reputation has been successfully proven using zero-knowledge cryptography.</p>
            {#if $zkProofStore.proofData.durationMs}
              <p class="font-mono" data-testid="proof-duration">
                Generation time: {formatElapsedTime($zkProofStore.proofData.durationMs)}
              </p>
            {/if}
          </div>
        </div>

        <!-- Reset Button -->
        <button
          on:click={zkProofActions.reset}
          class="w-full px-4 py-2 min-h-[44px] bg-gray-600 text-white rounded-lg hover:bg-gray-700 touch-manipulation"
          aria-label="Generate another proof"
          role="button"
        >
          Generate Another Proof
        </button>
      {/if}

      <!-- Error State -->
      {#if $zkProofStore.error}
        <div
          class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
          data-testid="proof-error"
        >
          <div class="flex items-center gap-2 text-red-800 dark:text-red-200 mb-1">
            <AlertCircle class="h-5 w-5" />
            <span class="font-semibold">Error</span>
          </div>
          <p class="text-sm text-red-600 dark:text-red-300">
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
          {#if $zkProofStore.proofData.method}
            <div>
              <strong>Generation Method:</strong>
              {$zkProofStore.proofData.method}
            </div>
          {/if}
          {#if $zkProofStore.proofData.durationMs}
            <div>
              <strong>Duration:</strong>
              {formatElapsedTime($zkProofStore.proofData.durationMs)}
            </div>
          {/if}
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
