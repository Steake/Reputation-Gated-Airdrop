<script lang="ts">
  import { walletMock, walletMockActions, walletConfigs } from "$lib/stores/walletMock";
  import { wallet } from "$lib/stores/wallet";
  import { Settings, Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, ArrowRightLeft } from "lucide-svelte";

  let isOpen = false;
  let selectedWallet: "metamask" | "walletconnect" | "coinbase" | "trust" = "metamask";

  function toggleController() {
    isOpen = !isOpen;
  }

  async function handleConnect() {
    await walletMockActions.simulateConnection(selectedWallet);
  }

  async function handleDisconnect() {
    await walletMockActions.simulateDisconnection();
  }

  async function handleNetworkSwitch(chainId: number) {
    await walletMockActions.simulateNetworkSwitch(chainId);
  }

  // Determine status color based on connection state
  $: statusColor = {
    disconnected: "text-gray-500",
    connecting: "text-yellow-500",
    connected: "text-green-500",
    error: "text-red-500",
    switching: "text-blue-500"
  }[$walletMock.connectionState];

  $: statusIcon = {
    disconnected: WifiOff,
    connecting: Clock,
    connected: CheckCircle,
    error: AlertTriangle,
    switching: ArrowRightLeft
  }[$walletMock.connectionState];
</script>

<!-- Mock Controller Toggle Button -->
<div class="fixed bottom-4 right-4 z-50">
  {#if $walletMock.enabled}
    <!-- Status Indicator -->
    <div class="mb-2 flex justify-end">
      <div 
        class="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 shadow-lg text-sm"
      >
        <svelte:component this={statusIcon} class="h-4 w-4 {statusColor}" />
        <span class="font-medium text-gray-900 dark:text-gray-100">
          Mock: {$walletMock.connectionState}
        </span>
        {#if $walletMock.walletType}
          <span class="text-gray-500 dark:text-gray-400">
            ({walletConfigs[$walletMock.walletType].name})
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Toggle Button -->
  <button
    on:click={toggleController}
    class="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
    aria-label="Toggle wallet mock controller"
  >
    <Settings class="h-5 w-5" />
  </button>
</div>

<!-- Mock Controller Panel -->
{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Wallet Mock Controller
        </h2>
        <button
          on:click={toggleController}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Mock Enable/Disable -->
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              bind:checked={$walletMock.enabled}
              on:change={(e) => walletMockActions.setEnabled(e.currentTarget.checked)}
              class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Enable Mock Mode
            </span>
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            When enabled, wallet connections are simulated for testing
          </p>
        </div>

        {#if $walletMock.enabled}
          <!-- Current Status -->
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Current Status</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Connection:</span>
                <span class="font-medium {statusColor}">
                  {$walletMock.connectionState}
                </span>
              </div>
              {#if $walletMock.walletType}
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Wallet:</span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">
                    {walletConfigs[$walletMock.walletType].name}
                  </span>
                </div>
              {/if}
              {#if $walletMock.address}
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Address:</span>
                  <span class="font-mono text-xs text-gray-900 dark:text-gray-100">
                    {$walletMock.address.slice(0, 8)}...{$walletMock.address.slice(-6)}
                  </span>
                </div>
              {/if}
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Reputation:</span>
                <span class="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {$walletMock.userReputationTier}
                </span>
              </div>
              {#if $walletMock.error}
                <div class="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {$walletMock.error}
                </div>
              {/if}
            </div>
          </div>

          <!-- Quick Presets -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">Quick Presets</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                on:click={() => walletMockActions.presets.disconnected()}
                class="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100">Disconnected</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">No wallet connected</div>
              </button>
              
              <button
                on:click={() => walletMockActions.presets.highReputationUser()}
                class="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100">High Rep User</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">950K score, MetaMask</div>
              </button>
              
              <button
                on:click={() => walletMockActions.presets.mediumReputationUser()}
                class="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100">Medium Rep User</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">750K score, WalletConnect</div>
              </button>
              
              <button
                on:click={() => walletMockActions.presets.thresholdUser()}
                class="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100">Threshold User</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">620K score, Coinbase</div>
              </button>
              
              <button
                on:click={() => walletMockActions.presets.ineligibleUser()}
                class="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100">Ineligible User</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">450K score, Trust Wallet</div>
              </button>
              
              <button
                on:click={() => walletMockActions.presets.connectionError()}
                class="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100">Connection Error</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Failed connection</div>
              </button>
            </div>
          </div>

          <!-- Manual Controls -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">Manual Controls</h3>
            
            <!-- Wallet Selection -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet Type
              </label>
              <select
                bind:value={selectedWallet}
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="metamask">MetaMask</option>
                <option value="walletconnect">WalletConnect</option>
                <option value="coinbase">Coinbase Wallet</option>
                <option value="trust">Trust Wallet</option>
              </select>
            </div>

            <!-- Reputation Tier -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reputation Tier
              </label>
              <select
                bind:value={$walletMock.userReputationTier}
                on:change={(e) => walletMockActions.setReputationTier(e.currentTarget.value)}
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="high">High (950K score)</option>
                <option value="medium">Medium (750K score)</option>
                <option value="threshold">Threshold (620K score)</option>
                <option value="ineligible">Ineligible (450K score)</option>
              </select>
            </div>

            <!-- Connection Options -->
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={$walletMock.simulateSlowConnection}
                  on:change={(e) => walletMockActions.setConnectionBehavior(e.currentTarget.checked, $walletMock.autoFailConnection)}
                  class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Simulate slow connection
                </span>
              </label>
              
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={$walletMock.autoFailConnection}
                  on:change={(e) => walletMockActions.setConnectionBehavior($walletMock.simulateSlowConnection, e.currentTarget.checked)}
                  class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auto-fail connections
                </span>
              </label>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              {#if $walletMock.connectionState === "disconnected" || $walletMock.connectionState === "error"}
                <button
                  on:click={handleConnect}
                  disabled={$walletMock.connectionState === "connecting"}
                  class="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {#if $walletMock.connectionState === "connecting"}
                    Connecting...
                  {:else}
                    Connect {walletConfigs[selectedWallet].name}
                  {/if}
                </button>
              {:else if $walletMock.connectionState === "connected"}
                <button
                  on:click={handleDisconnect}
                  class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Disconnect
                </button>
                
                <button
                  on:click={() => handleNetworkSwitch(1)}
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Switch to Mainnet
                </button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}