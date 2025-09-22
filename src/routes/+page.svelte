<script lang="ts">
  import { wallet } from "$lib/stores/wallet";
  import { score } from "$lib/stores/score";
  import { airdrop } from "$lib/stores/airdrop";
  import { connectWallet } from "$lib/chain/client";
  import ScoreRing from "$lib/components/ScoreRing.svelte";
  import PayoutCurve from "$lib/components/PayoutCurve.svelte";
  import Stat from "$lib/components/Stat.svelte";
  import AnimatedButton from "$lib/components/AnimatedButton.svelte";
  import ParticleBackground from "$lib/components/ParticleBackground.svelte";
  import FloatingElements from "$lib/components/FloatingElements.svelte";
  import { shortenAddress, formatTokenAmount } from "$lib/utils";
  import { onMount } from "svelte";
  import { getScore } from "$lib/api/client";
  import { toasts } from "$lib/stores/ui";
  import { ArrowRight, TrendingUp, Users, Zap } from "lucide-svelte";
  import type { PayoutQuote } from "$lib/types";
  import { readContract } from "$lib/chain/client";
  import reputationAirdropScaled from "$lib/abi/reputationAirdropScaled.abi.json";
  import reputationAirdropZKScaled from "$lib/abi/reputationAirdropZKScaled.abi.json";
  import { page } from "$app/stores";
  import type { Hex } from "viem";

  // Accept params prop to silence HMR unknown-prop warnings
  export const params = undefined;

  let quote: PayoutQuote | null = null;
  let quoteLoading = false;

  async function fetchScore() {
    if (!$wallet.address) return;
    score.set({ loading: true });
    try {
      const scoreData = await getScore($wallet.address);
      score.set({
        loading: false,
        value: scoreData.score1e6,
        lastUpdated: scoreData.updatedAt,
      });
    } catch (e) {
      score.set({ loading: false, error: "Failed to fetch score" });
      toasts.error("Could not fetch your reputation score.");
      console.error(e);
    }
  }

  async function fetchQuote() {
    if (typeof $score.value !== "number") return;
    quoteLoading = true;
    const { config } = $page.data;
    const contractAddress = config.AIRDROP_ZK_ADDR || config.AIRDROP_ECDSA_ADDR;
    const abi = config.AIRDROP_ZK_ADDR ? reputationAirdropZKScaled : reputationAirdropScaled;

    if (!contractAddress || !$airdrop.decimals) {
      quoteLoading = false;
      return;
    }

    try {
      const payout = await readContract<bigint>(contractAddress as Hex, abi, "quotePayout", [
        BigInt($score.value),
      ]);
      quote = {
        payout,
        min: $airdrop.minPayout!,
        max: $airdrop.maxPayout!,
        decimals: $airdrop.decimals!,
      };
    } catch (e) {
      console.error("Failed to fetch payout quote", e);
      toasts.error("Could not preview payout amount.");
    } finally {
      quoteLoading = false;
    }
  }

  onMount(fetchScore);
  $: if ($wallet.address) {
    fetchScore();
  }

  $: if (typeof $score.value === "number") {
    fetchQuote();
  }
</script>

<!-- Homepage with production-grade dark theme -->
<svelte:head>
  <title>Shadowgraph - Reputation-Based Airdrop</title>
  <meta
    name="description"
    content="Claim your reputation-based airdrop from Shadowgraph. Connect your wallet to check your score."
  />
</svelte:head>

<!-- Background Effects -->
<ParticleBackground intensity={0.8} speed={0.5} particleCount={80} />
<FloatingElements count={15} color="var(--accent-brand)" size="mixed" />

<div class="relative z-10">
  <div class="max-w-4xl mx-auto text-center">
    <div
      class="mb-8 inline-flex items-center px-4 py-2 rounded-full
                bg-[var(--accent-brand)]/10 border border-[var(--accent-brand)]/20
                text-[var(--accent-brand)]"
    >
      <Zap class="h-4 w-4 mr-2" />
      <span class="text-sm font-medium">Powered by Zero-Knowledge Proofs</span>
    </div>

    <h1
      class="page-title sm:text-6xl bg-gradient-to-r from-[var(--accent-brand)] to-[var(--accent-info)] bg-clip-text text-transparent"
    >
      Claim Your Reputation-Based Airdrop
    </h1>
    <p class="mt-6 text-lg leading-8 text-[var(--fg-secondary)]">
      Your contributions have been recognized. Connect your wallet to check your score and claim
      your share of the Shadowgraph airdrop.
    </p>
    <div class="mt-10 flex items-center justify-center gap-x-6">
      {#if !$wallet.connected}
        <AnimatedButton variant="glow" size="lg" color="primary" on:click={connectWallet}>
          Connect Wallet
        </AnimatedButton>
      {:else}
        <AnimatedButton
          variant="shimmer"
          size="lg"
          color="primary"
          on:click={() => (window.location.href = "/claim")}
        >
          Proceed to Claim
          <ArrowRight class="ml-2 h-5 w-5" />
        </AnimatedButton>
      {/if}
    </div>
  </div>

  <!-- Quick Stats with semantic tokens -->
  <div class="mt-16 max-w-4xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div
        class="card bg-gradient-to-r from-[var(--accent-info)]/10 to-[var(--accent-brand)]/10
                  border border-[var(--accent-info)]/20"
      >
        <div class="flex items-center">
          <Users class="h-8 w-8 text-[var(--accent-info)] mr-3" />
          <div>
            <div class="text-2xl font-bold text-[var(--accent-info)]">12,547</div>
            <div class="text-sm text-[var(--fg-muted)]">Active Users</div>
          </div>
        </div>
      </div>
      <div
        class="card bg-gradient-to-r from-[var(--accent-success)]/10 to-[var(--accent-info)]/10
                  border border-[var(--accent-success)]/20"
      >
        <div class="flex items-center">
          <TrendingUp class="h-8 w-8 text-[var(--accent-success)] mr-3" />
          <div>
            <div class="text-2xl font-bold text-[var(--accent-success)]">72.3%</div>
            <div class="text-sm text-[var(--fg-muted)]">Avg Score</div>
          </div>
        </div>
      </div>
      <div
        class="card bg-gradient-to-r from-[var(--accent-brand)]/10 to-[var(--accent-warn)]/10
                  border border-[var(--accent-brand)]/20"
      >
        <div class="flex items-center">
          <Zap class="h-8 w-8 text-[var(--accent-brand)] mr-3" />
          <div>
            <div class="text-2xl font-bold text-[var(--accent-brand)]">3,847</div>
            <div class="text-sm text-[var(--fg-muted)]">ZK Proofs Generated</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Explore link -->
    <div class="text-center">
      <a
        href="/explore"
        class="btn-primary inline-flex items-center px-6 py-3 rounded-lg font-medium
               hover:scale-105 transform transition-all duration-200"
      >
        Explore Data & Visualizations
        <ArrowRight class="ml-2 h-5 w-5" />
      </a>
    </div>
  </div>
</div>

{#if $wallet.connected}
  <div
    class="mt-16 max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
  >
    <h2 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
      Your Airdrop Status
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
      <div class="flex flex-col items-center space-y-4">
        <ScoreRing
          score={$score.value || 0}
          floor={$airdrop.floor || 0}
          cap={$airdrop.cap || 1000000}
        />
        <div class="text-center">
          <p class="font-mono text-xl text-gray-900 dark:text-white">{($score.value || 0) / 1e6}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Reputation Score</p>
        </div>
      </div>
      <div class="md:col-span-2 space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <Stat label="Connected Wallet" value={shortenAddress($wallet.address)} />
          <Stat label="Campaign Curve" value={$airdrop.curve || "N/A"} />
          <Stat label="Claimable Payout" isLoading={quoteLoading}>
            {#if quote && $airdrop.decimals}
              {formatTokenAmount(quote.payout, $airdrop.decimals)} Tokens
            {:else if $score.value && $score.value < ($airdrop.floor || 0)}
              Score too low
            {:else}
              -
            {/if}
          </Stat>
          <Stat label="Floor Score" value={($airdrop.floor || 0) / 1e6} />
        </div>

        <div class="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-4 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">Payout Visualization</h3>
          <PayoutCurve
            curve={$airdrop.curve || "LIN"}
            score={$score.value || 0}
            floor={$airdrop.floor || 0}
            cap={$airdrop.cap || 1000000}
          />
        </div>

        <div class="flex space-x-4">
          <AnimatedButton
            variant="gradient"
            color="secondary"
            size="sm"
            on:click={() => (window.location.href = "/attest")}
            class="flex-1"
          >
            View Attestations
          </AnimatedButton>
          <AnimatedButton
            variant="glow"
            color="primary"
            size="sm"
            on:click={() => (window.location.href = "/claim")}
            class="flex-1"
          >
            Claim Airdrop
          </AnimatedButton>
        </div>
      </div>
    </div>
  </div>
{/if}
