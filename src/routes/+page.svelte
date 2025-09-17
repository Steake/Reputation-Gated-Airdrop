<script lang="ts">
  import { wallet } from "$lib/stores/wallet";
  import { score } from "$lib/stores/score";
  import { airdrop } from "$lib/stores/airdrop";
  import { connectWallet } from "$lib/chain/client";
  import ScoreRing from "$lib/components/ScoreRing.svelte";
  import PayoutCurve from "$lib/components/PayoutCurve.svelte";
  import Stat from "$lib/components/Stat.svelte";
  import { shortenAddress, formatTokenAmount } from "$lib/utils";
  import { onMount } from "svelte";
  import { getScore } from "$lib/api/client";
  import { toasts } from "$lib/stores/ui";
  import { ArrowRight } from "lucide-svelte";
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
    const abi = config.AIRDROP_ZK_ADDR
      ? reputationAirdropZKScaled
      : reputationAirdropScaled;

    if (!contractAddress || !$airdrop.decimals) {
      quoteLoading = false;
      return;
    }

    try {
      const payout = await readContract<bigint>(
        contractAddress as Hex,
        abi,
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

<div class="max-w-4xl mx-auto text-center">
  <h1 class="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-6xl">
    Claim Your Reputation-Based Airdrop
  </h1>
  <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
    Your contributions have been recognized. Connect your wallet to check your
    score and claim your share of the Shadowgraph airdrop.
  </p>
  <div class="mt-10 flex items-center justify-center gap-x-6">
    {#if !$wallet.connected}
      <button
        on:click={connectWallet}
        class="rounded-md bg-brand px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
      >
        Connect Wallet
      </button>
    {:else}
      <a
        href="/claim"
        class="rounded-md bg-brand px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
      >
        Proceed to Claim <ArrowRight class="inline -mt-1 ml-2 h-5 w-5" />
      </a>
    {/if}
  </div>
</div>

{#if $wallet.connected}
  <div
    class="mt-16 max-w-4xl mx-auto bg-white dark:bg-card p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
  >
    <h2 class="text-2xl font-bold text-center mb-6">Your Airdrop Status</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
      <div class="flex flex-col items-center space-y-4">
        <ScoreRing
          score={$score.value || 0}
          floor={$airdrop.floor || 0}
          cap={$airdrop.cap || 1000000}
        />
        <div class="text-center">
          <p class="font-mono text-xl">{($score.value || 0) / 1e6}</p>
          <p class="text-sm text-gray-500 dark:text-gray-300">
            Reputation Score
          </p>
        </div>
      </div>
      <div class="md:col-span-2 space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <Stat
            label="Connected Wallet"
            value={shortenAddress($wallet.address)}
          />
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

        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 class="font-semibold mb-2">Payout Visualization</h3>
          <PayoutCurve
            curve={$airdrop.curve || "LIN"}
            score={$score.value || 0}
            floor={$airdrop.floor || 0}
            cap={$airdrop.cap || 1000000}
          />
        </div>

        <div class="flex space-x-4">
          <a
            href="/attest"
            class="flex-1 text-center rounded-md bg-white dark:bg-[var(--card)] px-4 py-2 text-sm font-semibold text-brand shadow-sm ring-1 ring-inset ring-[var(--brand)] hover:bg-[var(--brand)]/5"
            >View Attestations</a
          >
          <a
            href="/claim"
            class="flex-1 text-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
            >Claim Airdrop</a
          >
        </div>
      </div>
    </div>
  </div>
{/if}
