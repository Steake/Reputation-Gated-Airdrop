<script lang="ts">
  import { parseConfig } from "$lib/config";

  const configResult = parseConfig();
  const env = import.meta.env;

  let rawValues: Record<string, any> = {};
  let parsedConfig: any = null;
  let configError: any = null;

  if ("error" in configResult) {
    configError = configResult.error;
  } else {
    parsedConfig = configResult;
  }

  // Capture raw env values
  rawValues = {
    CHAIN_ID: env.VITE_CHAIN_ID || env.PUBLIC_CHAIN_ID,
    RPC_URL: env.VITE_RPC_URL || env.PUBLIC_RPC_URL,
    TOKEN_ADDR: env.VITE_TOKEN_ADDR || env.PUBLIC_TOKEN_ADDR,
    CAMPAIGN: env.VITE_CAMPAIGN || env.PUBLIC_CAMPAIGN,
    FLOOR_SCORE: env.VITE_FLOOR_SCORE,
    CAP_SCORE: env.VITE_CAP_SCORE,
    MIN_PAYOUT: env.VITE_MIN_PAYOUT,
    MAX_PAYOUT: env.VITE_MAX_PAYOUT,
    CURVE: env.VITE_CURVE,
    WALLETCONNECT_PROJECT_ID:
      env.VITE_WALLETCONNECT_PROJECT_ID || env.PUBLIC_WALLETCONNECT_PROJECT_ID,
  };
</script>

<div class="p-8 max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold mb-4">Config Parsing Debug</h1>

  <div class="space-y-6">
    <!-- Raw Values -->
    <div class="bg-gray-100 p-4 rounded">
      <h2 class="font-semibold mb-2">Raw Values (before Zod parsing):</h2>
      <pre class="text-xs overflow-auto">{JSON.stringify(rawValues, null, 2)}</pre>
      <div class="mt-2 text-sm">
        {#each Object.entries(rawValues) as [key, value]}
          <div>
            <strong>{key}:</strong>
            value="{value}" type={typeof value}
            isUndefined={value === undefined ? "YES" : "NO"}
            isEmpty={value === "" ? "YES" : "NO"}
          </div>
        {/each}
      </div>
    </div>

    <!-- Config Result -->
    {#if configError}
      <div class="bg-red-100 p-4 rounded border-2 border-red-500">
        <h2 class="font-semibold mb-2 text-red-800">Config Error (Zod validation failed):</h2>
        <pre class="text-xs overflow-auto">{JSON.stringify(configError.errors, null, 2)}</pre>
      </div>
    {:else if parsedConfig}
      <div class="bg-green-100 p-4 rounded border-2 border-green-500">
        <h2 class="font-semibold mb-2 text-green-800">Config Parsed Successfully:</h2>
        <pre class="text-xs overflow-auto">{JSON.stringify(parsedConfig, null, 2)}</pre>
      </div>
    {/if}
  </div>
</div>
