<script lang="ts">
  import { wallet } from "$lib/stores/wallet";
  import { walletMock, walletMockActions, walletConfigs } from "$lib/stores/walletMock";
  import { connectWallet, disconnectWallet } from "$lib/chain/client";
  import { shortenAddress } from "$lib/utils";
  import { LogIn, LogOut, AlertTriangle, Clock } from "lucide-svelte";

  let connecting = false;

  async function handleConnect() {
    if ($walletMock.enabled) {
      // Use mock connection flow
      await walletMockActions.simulateConnection("metamask");
    } else {
      // Use real connection flow
      connecting = true;
      try {
        await connectWallet();
      } catch (e) {
        console.error(e);
      } finally {
        connecting = false;
      }
    }
  }

  async function handleDisconnect() {
    if ($walletMock.enabled) {
      // Use mock disconnection flow
      await walletMockActions.simulateDisconnection();
    } else {
      // Use real disconnection flow
      try {
        await disconnectWallet();
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Determine if we're in a connecting state (either real or mock)
  $: isConnecting = connecting || ($walletMock.enabled && $walletMock.connectionState === "connecting");
  
  // Determine if we're connected (either real or mock)
  $: isConnected = $wallet.connected || ($walletMock.enabled && $walletMock.connectionState === "connected");
  
  // Check for error states
  $: hasError = $walletMock.enabled && $walletMock.connectionState === "error";
  
  // Check for network switching
  $: isSwitching = $walletMock.enabled && $walletMock.connectionState === "switching";

  // Get display address (prioritize mock if enabled)
  $: displayAddress = $walletMock.enabled && $walletMock.address ? $walletMock.address : $wallet.address;
  
  // Get wallet type for display
  $: walletType = $walletMock.enabled && $walletMock.walletType ? walletConfigs[$walletMock.walletType].name : "Wallet";
</script>

{#if hasError}
  <!-- Error State -->
  <div class="flex items-center space-x-2 sm:space-x-3">
    <div
      class="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-1.5 sm:p-2"
    >
      <AlertTriangle class="h-4 w-4 text-red-500" />
      <div class="hidden sm:block">
        <div class="text-sm font-medium text-red-700 dark:text-red-300">Connection Failed</div>
        <div class="text-xs text-red-600 dark:text-red-400">{$walletMock.error}</div>
      </div>
    </div>
    
    <button
      on:click={handleConnect}
      class="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
      aria-label="Retry connection"
      style="min-width: 44px; min-height: 44px;"
    >
      <span class="text-xs sm:text-sm">Retry</span>
    </button>
  </div>
{:else if isConnected}
  <!-- Connected State -->
  <div class="flex items-center space-x-2 sm:space-x-3">
    <!-- Compact wallet preview -->
    <div
      class="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 sm:p-2 max-w-[120px] sm:max-w-none"
    >
      {#if isSwitching}
        <Clock class="h-6 w-6 text-blue-500 animate-pulse" />
      {:else}
        <div
          class="h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold text-xs flex-shrink-0"
          aria-hidden="true"
        >
          {#if displayAddress}
            {@const short = shortenAddress(displayAddress)}
            {short.slice(2, 4).toUpperCase()}
          {/if}
        </div>
      {/if}

      <div class="hidden sm:block min-w-0 flex-1">
        <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {#if displayAddress}{shortenAddress(displayAddress)}{:else}—{/if}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {isSwitching ? "Switching..." : `Connected${$walletMock.enabled ? ` (${walletType})` : ""}`}
        </div>
      </div>
    </div>

    <!-- Network warning for unsupported networks -->
    {#if $walletMock.enabled && !$walletMock.networkSupported}
      <div class="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs text-yellow-700 dark:text-yellow-300">
        <AlertTriangle class="h-3 w-3" />
        <span class="hidden sm:inline">Wrong Network</span>
      </div>
    {/if}

    <button
      on:click={handleDisconnect}
      disabled={isSwitching}
      class="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors flex-shrink-0"
      aria-label="Disconnect wallet"
      style="min-width: 44px; min-height: 44px;"
    >
      <LogOut class="h-3 w-3 sm:h-4 sm:w-4" />
      <span class="hidden sm:inline">Disconnect</span>
    </button>
  </div>
{:else}
  <!-- Disconnected State -->
  <button
    on:click={handleConnect}
    disabled={isConnecting}
    class="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
    aria-label="Connect wallet"
    style="min-width: 44px; min-height: 44px;"
  >
    {#if isConnecting}
      <svg
        class="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"
        ></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        ></path>
      </svg>
      <span class="text-xs sm:text-sm">
        {$walletMock.enabled && $walletMock.simulateSlowConnection ? "Connecting (slow)..." : "Connecting..."}
      </span>
    {:else}
      <LogIn class="h-3 w-3 sm:h-4 sm:w-4" />
      <span class="text-xs sm:text-sm">Connect</span>
    {/if}
  </button>
{/if}
