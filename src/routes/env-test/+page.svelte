<script lang="ts">
  const env = import.meta.env;
  const viteVars = Object.entries(env)
    .filter(([key]) => key.startsWith("VITE_") || key.startsWith("PUBLIC_"))
    .sort();
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Environment Variables Test</h1>

  <div class="bg-gray-100 p-4 rounded">
    <h2 class="font-semibold mb-2">VITE_ and PUBLIC_ prefixed variables:</h2>
    <pre class="text-xs overflow-auto">{JSON.stringify(Object.fromEntries(viteVars), null, 2)}</pre>
  </div>

  <div class="mt-4 bg-blue-100 p-4 rounded">
    <h2 class="font-semibold mb-2">Specific variables check:</h2>
    <ul class="text-sm space-y-1">
      <li>VITE_CHAIN_ID: {env.VITE_CHAIN_ID || "UNDEFINED"} (type: {typeof env.VITE_CHAIN_ID})</li>
      <li>VITE_RPC_URL: {env.VITE_RPC_URL || "UNDEFINED"}</li>
      <li>VITE_TOKEN_ADDR: {env.VITE_TOKEN_ADDR || "UNDEFINED"}</li>
      <li>VITE_CAMPAIGN: {env.VITE_CAMPAIGN || "UNDEFINED"}</li>
      <li>
        VITE_FLOOR_SCORE: {env.VITE_FLOOR_SCORE || "UNDEFINED"} (type: {typeof env.VITE_FLOOR_SCORE})
      </li>
      <li>
        VITE_CAP_SCORE: {env.VITE_CAP_SCORE || "UNDEFINED"} (type: {typeof env.VITE_CAP_SCORE})
      </li>
      <li>VITE_CURVE: {env.VITE_CURVE || "UNDEFINED"}</li>
      <li>VITE_WALLETCONNECT_PROJECT_ID: {env.VITE_WALLETCONNECT_PROJECT_ID || "UNDEFINED"}</li>
    </ul>
  </div>
</div>
