<script lang="ts">
  import { wallet } from "$lib/stores/wallet";
  import { connectWallet, disconnectWallet } from "$lib/chain/client";
  import { shortenAddress } from "$lib/utils";
  import { LogIn, LogOut } from "lucide-svelte";

  let connecting = false;

  async function handleConnect() {
    connecting = true;
    try {
      await connectWallet();
    } catch (e) {
      console.error(e);
    } finally {
      connecting = false;
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectWallet();
    } catch (e) {
      console.error(e);
    }
  }
</script>

{#if $wallet.connected}
  <div class="flex items-center space-x-2 sm:space-x-3">
    <!-- Compact wallet preview -->
    <div
      class="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 sm:p-2 max-w-[120px] sm:max-w-none"
    >
      <div
        class="h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold text-xs flex-shrink-0"
        aria-hidden="true"
      >
        {#if $wallet.address}
          {@const short = shortenAddress($wallet.address)}
          {short.slice(2, 4).toUpperCase()}
        {/if}
      </div>

      <div class="hidden sm:block min-w-0 flex-1">
        <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {#if $wallet.address}{shortenAddress($wallet.address)}{:else}—{/if}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Connected</div>
      </div>
    </div>

    <button
      on:click={handleDisconnect}
      class="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
      aria-label="Disconnect wallet"
      style="min-width: 44px; min-height: 44px;"
    >
      <LogOut class="h-3 w-3 sm:h-4 sm:w-4" />
      <span class="hidden sm:inline">Disconnect</span>
    </button>
  </div>
{:else}
  <button
    on:click={handleConnect}
    disabled={connecting}
    class="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
    aria-label="Connect wallet"
    style="min-width: 44px; min-height: 44px;"
  >
    {#if connecting}
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
      <span class="text-xs sm:text-sm">Connecting...</span>
    {:else}
      <LogIn class="h-3 w-3 sm:h-4 sm:w-4" />
      <span class="text-xs sm:text-sm">Connect</span>
    {/if}
  </button>
{/if}
