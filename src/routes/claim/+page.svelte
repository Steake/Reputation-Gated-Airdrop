
<script lang="ts">
  import { wallet } from '$lib/stores/wallet';
  import { score } from '$lib/stores/score';
  import { airdrop } from '$lib/stores/airdrop';
  import ClaimCard from '$lib/components/ClaimCard.svelte';
  import ChecklistItem from '$lib/components/ChecklistItem.svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  onMount(() => {
    if (data.scoreData) {
      score.set({
        loading: false,
        value: data.scoreData.score1e6,
        lastUpdated: data.scoreData.updatedAt
      });
    } else if(data.error) {
        score.set({ loading: false, error: data.error });
    }
  });

  $: isEligible = ($score.value || 0) >= ($airdrop.floor || 0);

</script>

<div class="max-w-2xl mx-auto">
  <div class="text-center mb-10">
    <h1 class="text-4xl font-bold tracking-tight text-gray-900">Claim Your Airdrop</h1>
    <p class="mt-3 text-lg text-gray-600">
      Follow the steps below to securely claim your tokens.
    </p>
  </div>

  {#if !$wallet.connected}
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center">
      Please connect your wallet to continue.
    </div>
  {:else if $score.loading}
     <div class="text-center p-8">
        <p>Loading your score...</p>
     </div>
  {:else}
    {#if !isEligible}
      <div class="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 class="text-2xl font-bold text-center mb-2">You are not yet eligible</h2>
        <p class="text-center text-gray-500 mb-6">
          Your current score of {($score.value || 0) / 1e6} is below the required floor of {($airdrop.floor || 0) / 1e6}.
        </p>
        <div class="space-y-4">
          <h3 class="font-semibold text-lg">How to increase your score:</h3>
          <ChecklistItem text="Verify your personhood with a recognized provider." />
          <ChecklistItem text="Receive a vouch from a trusted attestor in the network." />
          <ChecklistItem text="Contribute to recognized public goods or open source projects." />
          <ChecklistItem text="Link your social and developer accounts for more attestations." />
        </div>
         <div class="mt-6 text-center">
            <a href="/attest" class="text-brand-primary hover:underline font-semibold">
                Learn more about earning reputation &rarr;
            </a>
         </div>
      </div>
    {:else}
      <ClaimCard />
    {/if}
  {/if}

</div>
