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
  <!-- Header with semantic tokens -->
  <div class="text-center mb-12">
    <div class="inline-flex items-center px-4 py-2 rounded-full 
                bg-[var(--accent-info)]/10 border border-[var(--accent-info)]/20 
                text-[var(--accent-info)] mb-6">
      <BarChart3 class="h-4 w-4 mr-2" />
      <span class="text-sm font-medium">Data Exploration</span>
    </div>
    
    <h1 class="page-title text-[var(--fg-primary)] mb-4">
      Reputation Analytics
    </h1>
    <p class="text-lg text-[var(--fg-secondary)] max-w-2xl mx-auto">
      Explore global reputation trends, user metrics, and trust network relationships through interactive visualizations.
    </p>
  </div>

  <!-- Metrics Section with semantic tokens -->
  <section class="mb-16">
    <div class="flex items-center mb-8">
      <TrendingUp class="h-6 w-6 text-[var(--accent-success)] mr-3" />
      <h2 class="text-24 text-[var(--fg-primary)]">Reputation Metrics</h2>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Global Metrics with improved styling -->
      <div class="card-elevated bg-gradient-to-br from-[var(--accent-info)]/5 to-[var(--accent-brand)]/5 
                  border border-[var(--accent-info)]/20">
        <MetricsChart title="Global Distribution" type="global" />
      </div>
      
      <!-- User Metrics with improved styling -->
      <div class="card-elevated bg-gradient-to-br from-[var(--accent-success)]/5 to-[var(--accent-info)]/5 
                  border border-[var(--accent-success)]/20">
        <MetricsChart title="Personal Progress" type="user" />
      </div>
    </div>
  </section>

  <!-- Trust Network Section with semantic tokens -->
  <section class="mb-16">
    <div class="flex items-center mb-8">
      <Network class="h-6 w-6 text-[var(--accent-brand)] mr-3" />
      <h2 class="text-24 text-[var(--fg-primary)]">Trust Networks</h2>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Global Network with improved styling -->
      <div class="card-elevated bg-gradient-to-br from-[var(--accent-brand)]/5 to-[var(--accent-warn)]/5 
                  border border-[var(--accent-brand)]/20">
        <TrustNetworkVisualization scope="global" width={600} height={500} />
      </div>
      
      <!-- Personal Network with improved styling -->
      {#if $wallet.connected}
        <div class="card-elevated bg-gradient-to-br from-[var(--accent-warn)]/5 to-[var(--accent-brand)]/5 
                    border border-[var(--accent-warn)]/20">
          <TrustNetworkVisualization scope="user" width={600} height={500} />
        </div>
      {:else}
        <div class="card-elevated bg-gradient-to-br from-[var(--accent-warn)]/5 to-[var(--accent-brand)]/5 
                    border border-[var(--accent-warn)]/20 flex items-center justify-center">
          <div class="text-center">
            <Users class="h-12 w-12 text-[var(--fg-muted)] mx-auto mb-4" />
            <h3 class="text-18 text-[var(--fg-primary)] mb-2">Connect Your Wallet</h3>
            <p class="text-[var(--fg-secondary)] mb-4">
              View your personal trust network by connecting your wallet.
            </p>
            <a 
              href="/" 
              class="btn-primary inline-flex items-center"
            >
              Connect Wallet
            </a>
          </div>
        </div>
      {/if}
    </div>
  </section>

  <!-- Stats Overview with semantic tokens -->
  <section class="mb-16">
    <div class="card bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-surfaceElev)]">
      <h3 class="text-18 text-[var(--fg-primary)] mb-6 text-center">
        Network Statistics
      </h3>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-32 text-[var(--accent-info)]">12,547</div>
          <div class="text-14 text-[var(--fg-muted)] mt-1">Total Users</div>
        </div>
        <div class="text-center">
          <div class="text-32 text-[var(--accent-success)]">72.3%</div>
          <div class="text-14 text-[var(--fg-muted)] mt-1">Avg Score</div>
        </div>
        <div class="text-center">
          <div class="text-32 text-[var(--accent-brand)]">3,847</div>
          <div class="text-14 text-[var(--fg-muted)] mt-1">Active</div>
        </div>
        <div class="text-center">
          <div class="text-32 text-[var(--accent-warn)]">156</div>
          <div class="text-14 text-[var(--fg-muted)] mt-1">ZK Proofs</div>
        </div>
      </div>
    </div>
  </section>
</div>