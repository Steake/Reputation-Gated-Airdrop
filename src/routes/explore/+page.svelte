<script lang="ts">
  import { page } from '$app/stores';
  import { wallet } from '$lib/stores/wallet';
  import MetricsChart from '$lib/components/MetricsChart.svelte';
  import TrustNetworkVisualization from '$lib/components/TrustNetworkVisualization.svelte';
  import { TrendingUp, Users, Network, BarChart3 } from 'lucide-svelte';

  // Accept params prop to silence HMR unknown-prop warnings
  export const params = undefined;
</script>

<svelte:head>
  <title>Explore Data - Shadowgraph</title>
  <meta name="description" content="Explore reputation metrics and trust network visualizations" />
</svelte:head>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="text-center mb-12">
    <div class="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 mb-6">
      <BarChart3 class="h-4 w-4 mr-2" />
      <span class="text-sm font-medium">Data Exploration</span>
    </div>
    
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
      Reputation Analytics
    </h1>
    <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
      Explore global reputation trends, user metrics, and trust network relationships through interactive visualizations.
    </p>
  </div>

  <!-- Metrics Section -->
  <section class="mb-16">
    <div class="flex items-center mb-8">
      <TrendingUp class="h-6 w-6 text-blue-600 mr-3" />
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Reputation Metrics</h2>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Global Metrics with improved styling -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-1 rounded-xl">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
          <MetricsChart title="Global Distribution" type="global" />
        </div>
      </div>
      
      <!-- User Metrics with improved styling -->
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-1 rounded-xl">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
          <MetricsChart title="Personal Progress" type="user" />
        </div>
      </div>
    </div>
  </section>

  <!-- Trust Network Section -->
  <section class="mb-16">
    <div class="flex items-center mb-8">
      <Network class="h-6 w-6 text-purple-600 mr-3" />
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Trust Networks</h2>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Global Network with improved styling -->
      <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-1 rounded-xl">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
          <TrustNetworkVisualization scope="global" width={600} height={500} />
        </div>
      </div>
      
      <!-- Personal Network with improved styling -->
      {#if $wallet.connected}
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-1 rounded-xl">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
            <TrustNetworkVisualization scope="user" width={600} height={500} />
          </div>
        </div>
      {:else}
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-1 rounded-xl">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 h-full flex items-center justify-center">
            <div class="text-center">
              <Users class="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                View your personal trust network by connecting your wallet.
              </p>
              <a 
                href="/" 
                class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Connect Wallet
              </a>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </section>

  <!-- Stats Overview -->
  <section class="mb-16">
    <div class="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-8">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Network Statistics
      </h3>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">12,547</div>
          <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">Total Users</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">72.3%</div>
          <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">Avg Score</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">3,847</div>
          <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">Active</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-600 dark:text-orange-400">156</div>
          <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">ZK Proofs</div>
        </div>
      </div>
    </div>
  </section>
</div>