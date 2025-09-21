
<script lang="ts">
  import { page } from '$app/stores';
  import { wallet } from '$lib/stores/wallet';
  import { score } from '$lib/stores/score';
  import { airdrop } from '$lib/stores/airdrop';
  import Copy from '$lib/components/Copy.svelte';
  import ZKMLProver from '$lib/components/ZKMLProver.svelte';
  import MetricsChart from '$lib/components/MetricsChart.svelte';
  import TrustNetworkVisualization from '$lib/components/TrustNetworkVisualization.svelte';
</script>

<div class="max-w-4xl mx-auto space-y-8">
  <h1 class="text-3xl font-bold">Debug Information</h1>
  
  <div class="bg-white p-6 rounded-lg shadow border">
    <h2 class="text-xl font-semibold mb-4">Application Config</h2>
    <pre class="bg-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{JSON.stringify($page.data.config, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2)}</code></pre>
  </div>

  <div class="bg-white p-6 rounded-lg shadow border">
    <h2 class="text-xl font-semibold mb-4">Wallet Store</h2>
     <pre class="bg-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{JSON.stringify($wallet, null, 2)}</code></pre>
  </div>

   <div class="bg-white p-6 rounded-lg shadow border">
    <h2 class="text-xl font-semibold mb-4">Score Store</h2>
     <pre class="bg-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{JSON.stringify($score, null, 2)}</code></pre>
  </div>

  <div class="bg-white p-6 rounded-lg shadow border">
    <h2 class="text-xl font-semibold mb-4">Airdrop Store</h2>
     <pre class="bg-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{JSON.stringify($airdrop, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2)}</code></pre>
  </div>

  <!-- ZKML Prover Component -->
  <ZKMLProver contractAddress="0x1234567890123456789012345678901234567890" />

  <!-- Visualization Components -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <MetricsChart title="Debug Metrics - Global" type="global" />
    <MetricsChart title="Debug Metrics - User" type="user" />
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <TrustNetworkVisualization scope="global" width={600} height={400} />
    <TrustNetworkVisualization scope="user" width={600} height={400} />
  </div>
  
</div>
