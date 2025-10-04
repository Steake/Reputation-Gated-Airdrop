<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { wallet } from "$lib/stores/wallet";
  import { zkProofStore, zkProofActions } from "$lib/stores/zkproof";
  import { proofAPI, ProofPriority } from "$lib/proof";
  import type { ProofGenerationProgress } from "$lib/proof/pipeline";
  import type { TrustAttestation } from "$lib/ebsl/core";
  import {
    Zap,
    Shield,
    Clock,
    Activity,
    CheckCircle,
    AlertCircle,
    Loader,
    BarChart3,
  } from "lucide-svelte";
  import Spinner from "./Spinner.svelte";

  export let attestations: TrustAttestation[] = [];
  export let proofType: "exact" | "threshold" = "exact";
  export let priority: ProofPriority = ProofPriority.NORMAL;

  let progress: ProofGenerationProgress | null = null;
  let queueStats: any = null;
  let metricsSnapshot: any = null;
  let prediction: any = null;
  let wsConnection: WebSocket | null = null;
  let statsInterval: any = null;

  // Connect to WebSocket for real-time updates
  function connectWebSocket(requestId: string) {
    const wsUrl = `ws://localhost:3001`;
    wsConnection = new WebSocket(wsUrl);

    wsConnection.onopen = () => {
      console.log("WebSocket connected");
      wsConnection?.send(
        JSON.stringify({
          type: "subscribe",
          requestId,
        })
      );
    };

    wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "progress") {
        progress = data.data;
      }
    };

    wsConnection.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsConnection.onclose = () => {
      console.log("WebSocket disconnected");
    };
  }

  // Fetch queue stats and metrics periodically
  async function fetchStats() {
    try {
      const [queueRes, metricsRes] = await Promise.all([
        fetch("http://localhost:3001/api/queue/stats"),
        fetch("http://localhost:3001/api/metrics/snapshot"),
      ]);

      if (queueRes.ok) {
        queueStats = await queueRes.json();
      }

      if (metricsRes.ok) {
        metricsSnapshot = await metricsRes.json();
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }

  // Get performance prediction
  async function fetchPrediction() {
    try {
      const response = await fetch(
        `http://localhost:3001/api/metrics/predict?circuitType=default&networkSize=${attestations.length}`
      );
      if (response.ok) {
        prediction = await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch prediction:", error);
    }
  }

  // Generate proof using the pipeline
  async function generateProof() {
    if (!$wallet.address || attestations.length === 0) {
      zkProofActions.setError("No wallet connected or no attestations provided");
      return;
    }

    zkProofActions.setGenerating();
    progress = null;

    try {
      const result = await proofAPI.requestProof(attestations, proofType, {
        priority,
        userId: $wallet.address,
        onProgress: (p) => {
          progress = p;
          // Also connect WebSocket if we have a request ID
          if (p.requestId && !wsConnection) {
            connectWebSocket(p.requestId);
          }
        },
      });

      zkProofActions.setGenerated(result.proof, result.publicInputs, result.hash, proofType as any);
    } catch (error: any) {
      zkProofActions.setError(error.message || "Proof generation failed");
    }
  }

  onMount(() => {
    fetchStats();
    fetchPrediction();

    // Update stats every 5 seconds
    statsInterval = setInterval(fetchStats, 5000);
  });

  onDestroy(() => {
    if (wsConnection) {
      wsConnection.close();
    }
    if (statsInterval) {
      clearInterval(statsInterval);
    }
  });

  $: if (attestations.length > 0) {
    fetchPrediction();
  }
</script>

<div
  class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-xl font-bold flex items-center gap-2">
      <Activity class="h-5 w-5 text-purple-500" />
      Enhanced Proof Pipeline
    </h3>
  </div>

  <!-- Queue Stats -->
  {#if queueStats}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <div class="text-sm text-gray-600 dark:text-gray-400">Queued</div>
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {queueStats.totalQueued}
        </div>
      </div>
      <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
        <div class="text-sm text-gray-600 dark:text-gray-400">Processing</div>
        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {queueStats.totalProcessing}
        </div>
      </div>
      <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
        <div class="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          {queueStats.totalCompleted}
        </div>
      </div>
      <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
        <div class="text-sm text-gray-600 dark:text-gray-400">Failed</div>
        <div class="text-2xl font-bold text-red-600 dark:text-red-400">
          {queueStats.totalFailed}
        </div>
      </div>
    </div>
  {/if}

  <!-- Performance Metrics -->
  {#if metricsSnapshot}
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
      <div class="flex items-center gap-2 mb-2">
        <BarChart3 class="h-4 w-4" />
        <h4 class="font-semibold">Performance Metrics</h4>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <span class="text-gray-600 dark:text-gray-400">Success Rate:</span>
          <span class="font-semibold ml-1">
            {(metricsSnapshot.successRate * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span class="text-gray-600 dark:text-gray-400">Avg Duration:</span>
          <span class="font-semibold ml-1">
            {(metricsSnapshot.avgDurationMs / 1000).toFixed(2)}s
          </span>
        </div>
        <div>
          <span class="text-gray-600 dark:text-gray-400">P95:</span>
          <span class="font-semibold ml-1">
            {(metricsSnapshot.p95DurationMs / 1000).toFixed(2)}s
          </span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Performance Prediction -->
  {#if prediction && attestations.length > 0}
    <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-4">
      <div class="flex items-center gap-2 mb-2">
        <Clock class="h-4 w-4" />
        <h4 class="font-semibold">Estimated Duration</h4>
      </div>
      <div class="text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Time:</span>
          <span class="font-semibold">
            {(prediction.estimatedDurationMs / 1000).toFixed(1)}s
          </span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-gray-600 dark:text-gray-400">Confidence:</span>
          <span class="font-semibold">{(prediction.confidence * 100).toFixed(0)}%</span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-gray-600 dark:text-gray-400">Based on:</span>
          <span class="font-semibold">{prediction.basedOnSamples} samples</span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Proof Generation Progress -->
  <div class="space-y-3">
    {#if !$zkProofStore.generated}
      <button
        on:click={generateProof}
        disabled={$zkProofStore.generating || !$wallet.connected || attestations.length === 0}
        class="w-full flex flex-col items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if $zkProofStore.generating && progress}
          <div class="flex flex-col items-center gap-2 w-full">
            <Spinner />
            <span>{progress.stage}</span>
            <div class="w-full bg-purple-800 rounded-full h-2">
              <div
                class="bg-white h-2 rounded-full transition-all duration-300"
                style="width: {progress.progress}%"
              ></div>
            </div>
            <span class="text-sm">{progress.progress}%</span>
            {#if progress.estimatedRemainingMs}
              <span class="text-xs opacity-75">
                ETA: {(progress.estimatedRemainingMs / 1000).toFixed(1)}s
              </span>
            {/if}
          </div>
        {:else if proofType === "exact"}
          <Zap class="h-4 w-4" />
          <span>Generate Exact Score Proof</span>
        {:else}
          <Shield class="h-4 w-4" />
          <span>Generate Threshold Proof</span>
        {/if}
      </button>
    {:else}
      <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle class="h-4 w-4" />
        <span>Proof Generated Successfully</span>
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

  <!-- Connection Status -->
  <div class="mt-4 text-xs text-gray-500 flex items-center gap-2">
    {#if wsConnection?.readyState === WebSocket.OPEN}
      <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span>WebSocket Connected</span>
    {:else}
      <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span>WebSocket Disconnected</span>
    {/if}
  </div>
</div>
