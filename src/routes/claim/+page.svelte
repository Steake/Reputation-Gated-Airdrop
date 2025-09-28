<script lang="ts">
  import { wallet } from "$lib/stores/wallet";
  import { walletMock } from "$lib/stores/walletMock";
  import { score } from "$lib/stores/score";
  import { airdrop } from "$lib/stores/airdrop";
  import ClaimCard from "$lib/components/ClaimCard.svelte";
  import ChecklistItem from "$lib/components/ChecklistItem.svelte";
  import { onMount } from "svelte";
  import type { PageData } from "./$types";

  export let data: PageData;

  onMount(() => {
    if (data.scoreData) {
      score.set({
        loading: false,
        value: data.scoreData.score1e6,
        lastUpdated: data.scoreData.updatedAt,
      });
    } else if (data.error) {
      score.set({ loading: false, error: data.error });
    }
  });

  // Determine connection status considering both real and mock states
  $: isConnected =
    $wallet.connected || ($walletMock.enabled && $walletMock.connectionState === "connected");
  $: isConnecting = $walletMock.enabled && $walletMock.connectionState === "connecting";
  $: hasConnectionError = $walletMock.enabled && $walletMock.connectionState === "error";

  // Check eligibility based on score and airdrop floor
  $: isEligible = ($score.value || 0) >= ($airdrop.floor || 0);

  // Get reputation tier for display
  $: reputationTier = $walletMock.enabled ? $walletMock.userReputationTier : "unknown";

  // Calculate expected payout based on score
  $: expectedPayout = calculatePayout($score.value || 0, $airdrop);

  function calculatePayout(scoreValue: number, airdropConfig: typeof $airdrop): number {
    if (!scoreValue || !airdropConfig.floor || !airdropConfig.cap) return 0;

    if (scoreValue < airdropConfig.floor) return 0;

    const clampedScore = Math.min(scoreValue, airdropConfig.cap);
    const normalizedScore =
      (clampedScore - airdropConfig.floor) / (airdropConfig.cap - airdropConfig.floor);

    const payoutRange = (airdropConfig.maxPayout || 1000) - (airdropConfig.minPayout || 100);
    return (airdropConfig.minPayout || 100) + normalizedScore * payoutRange;
  }
</script>

<svelte:head>
  <title>Claim Your Airdrop - Shadowgraph</title>
  <meta name="description" content="Claim your reputation-based airdrop tokens securely." />
</svelte:head>

<div class="max-w-2xl mx-auto">
  <div class="text-center mb-10">
    <h1 class="page-title text-[var(--fg-primary)]">Claim Your Airdrop</h1>
    <p class="mt-3 text-lg text-[var(--fg-secondary)]">
      Follow the steps below to securely claim your tokens.
    </p>
  </div>

  {#if hasConnectionError}
    <!-- Connection Error State -->
    <div class="card bg-[var(--accent-error)]/10 border border-[var(--accent-error)]/30">
      <div class="text-center">
        <div class="text-[var(--accent-error)] font-medium mb-2">Connection Failed</div>
        <p class="text-[var(--fg-secondary)] mb-4">
          {$walletMock.error}
        </p>
        <button
          on:click={() => window.location.reload()}
          class="px-4 py-2 bg-[var(--accent-error)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </div>
  {:else if isConnecting}
    <!-- Connecting State -->
    <div class="card text-center">
      <div class="flex items-center justify-center mb-4">
        <svg class="animate-spin h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
      </div>
      <h2 class="text-xl text-[var(--fg-primary)] mb-2">Connecting to Wallet</h2>
      <p class="text-[var(--fg-secondary)]">
        {#if $walletMock.enabled && $walletMock.simulateSlowConnection}
          This is taking a while... (simulated slow connection)
        {:else}
          Please approve the connection in your wallet
        {/if}
      </p>
    </div>
  {:else if !isConnected}
    <!-- Not Connected State -->
    <div class="card bg-[var(--accent-warn)]/10 border border-[var(--accent-warn)]/30 text-center">
      <div class="text-[var(--accent-warn)] font-medium mb-2">Connect Your Wallet to Continue</div>
      <p class="text-[var(--fg-secondary)] mb-4">
        You need to connect your wallet to check your reputation score and claim your airdrop.
      </p>
      <div class="text-sm text-[var(--fg-muted)]">
        Click the "Connect" button in the top right corner to get started.
      </div>
    </div>
  {:else if $score.loading}
    <!-- Loading Score State with Skeleton -->
    <div class="card animate-pulse">
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <h2 class="text-2xl mb-2 bg-gray-200 dark:bg-gray-700 h-8 rounded w-48 mx-auto"></h2>
        <p
          class="text-[var(--fg-secondary)] bg-gray-200 dark:bg-gray-700 h-4 rounded w-64 mx-auto"
        ></p>
      </div>

      <!-- Skeleton for attestations/score breakdown -->
      <div class="space-y-4">
        <div class="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div class="bg-gray-200 dark:bg-gray-700 h-4 rounded w-20"></div>
          <div class="bg-gray-200 dark:bg-gray-700 h-4 rounded w-12"></div>
        </div>
        <div class="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div class="bg-gray-200 dark:bg-gray-700 h-4 rounded w-24"></div>
          <div class="bg-gray-200 dark:bg-gray-700 h-4 rounded w-16"></div>
        </div>
        <div class="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div class="bg-gray-200 dark:bg-gray-700 h-4 rounded w-28"></div>
          <div class="bg-gray-200 dark:bg-gray-700 h-4 rounded w-20"></div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <div class="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg w-48 mx-auto"></div>
      </div>
    </div>
  {:else if !isEligible}
    <!-- Ineligible State -->
    <div class="card">
      <div class="text-center mb-6">
        <div
          class="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-8 h-8 text-yellow-600 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            ></path>
          </svg>
        </div>
        <h2 class="text-2xl text-[var(--fg-primary)] mb-2">Not Eligible Yet</h2>
        <p class="text-[var(--fg-secondary)] mb-4">
          Your current reputation score is <strong>{(($score.value || 0) / 1e6).toFixed(3)}</strong
          >, but you need at least <strong>{(($airdrop.floor || 0) / 1e6).toFixed(3)}</strong> to be
          eligible.
        </p>

        {#if $walletMock.enabled}
          <div
            class="text-sm text-[var(--fg-muted)] bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-6"
          >
            <strong>Demo Mode:</strong> This user has a "{reputationTier}" reputation tier. Use the
            mock controller (gear icon) to switch to a different user type.
          </div>
        {/if}
      </div>

      <div class="space-y-4">
        <h3 class="text-lg text-[var(--fg-primary)] font-semibold">
          How to increase your reputation:
        </h3>
        <div class="space-y-3">
          <ChecklistItem text="Verify your personhood with Worldcoin or similar providers" />
          <ChecklistItem
            text="Connect your developer accounts (GitHub, GitLab) to showcase contributions"
          />
          <ChecklistItem text="Receive vouches from trusted members of the network" />
          <ChecklistItem text="Participate in governance and community activities" />
          <ChecklistItem text="Earn credentials through recognized platforms" />
        </div>
      </div>

      <div class="mt-8 text-center">
        <a
          href="/attest"
          class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          role="button"
          aria-label="Navigate to attestation page to start building reputation"
        >
          Start Building Reputation
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </a>
      </div>
    </div>
  {:else}
    <!-- Eligible State - Show Claim Interface -->
    <div class="space-y-6">
      <!-- Eligibility Confirmation -->
      <div
        class="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <svg
              class="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-green-800 dark:text-green-200">
              You're Eligible!
            </h3>
            <p class="text-green-700 dark:text-green-300">
              Your reputation score of <strong>{(($score.value || 0) / 1e6).toFixed(3)}</strong>
              qualifies you for approximately <strong>{expectedPayout.toFixed(0)} tokens</strong>.
            </p>
            {#if $walletMock.enabled}
              <p class="text-sm text-green-600 dark:text-green-400 mt-1">
                Demo: {reputationTier} reputation tier
              </p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Claim Card -->
      <ClaimCard role="main" aria-labelledby="claim-title" aria-describedby="claim-description" />
    </div>
  {/if}
</div>
