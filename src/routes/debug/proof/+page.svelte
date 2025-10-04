<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { telemetry, type TelemetryEvent } from "$lib/telemetry";

  let events: TelemetryEvent[] = [];
  let stats = {
    total: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
    avgDuration: 0,
    methodBreakdown: { local: 0, remote: 0, simulation: 0 },
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
  };

  let sortColumn: keyof TelemetryEvent = "timestamp";
  let sortDirection: "asc" | "desc" = "desc";
  let filterText = "";
  let refreshInterval: number | undefined;

  // Load data on mount
  onMount(() => {
    updateData();
    // Auto-refresh every 5 seconds
    refreshInterval = window.setInterval(updateData, 5000);
  });

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  function updateData() {
    events = telemetry.getEvents();
    stats = telemetry.getStats();
  }

  function exportData() {
    const dataStr = JSON.stringify({ events, stats }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `proof-telemetry-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearData() {
    if (confirm("Clear all telemetry data?")) {
      telemetry.clear();
      updateData();
    }
  }

  function sortBy(column: keyof TelemetryEvent) {
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "desc";
    }
  }

  $: filteredEvents = events.filter((e) => {
    if (!filterText) return true;
    const search = filterText.toLowerCase();
    return (
      e.method.toLowerCase().includes(search) ||
      e.device.type.toLowerCase().includes(search) ||
      e.device.browser.toLowerCase().includes(search)
    );
  });

  $: sortedEvents = [...filteredEvents].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const multiplier = sortDirection === "asc" ? 1 : -1;
    if (aVal < bVal) return -1 * multiplier;
    if (aVal > bVal) return 1 * multiplier;
    return 0;
  });

  // Calculate histogram data
  $: histogram = (() => {
    const buckets = [0, 2000, 4000, 6000, 8000, 10000, 15000, 20000, 30000];
    const counts = new Array(buckets.length).fill(0);

    filteredEvents.forEach((e) => {
      if (e.success) {
        const idx = buckets.findIndex((b) => e.durationMs < b);
        if (idx === -1) {
          counts[counts.length - 1]++;
        } else {
          counts[Math.max(0, idx - 1)]++;
        }
      }
    });

    return buckets.slice(0, -1).map((bucket, i) => ({
      label: `${bucket / 1000}-${buckets[i + 1] / 1000}s`,
      count: counts[i],
    }));
  })();

  $: maxHistogramCount = Math.max(...histogram.map((h) => h.count), 1);

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString();
  }
</script>

<svelte:head>
  <title>Proof Performance Dashboard</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-7xl">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Proof Performance Dashboard</h1>
    <div class="flex gap-2">
      <button
        on:click={updateData}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh
      </button>
      <button
        on:click={exportData}
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Export
      </button>
      <button on:click={clearData} class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Clear
      </button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="text-sm text-gray-600">Total Proofs</div>
      <div class="text-2xl font-bold">{stats.total}</div>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="text-sm text-gray-600">Success Rate</div>
      <div class="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="text-sm text-gray-600">Avg Duration</div>
      <div class="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="text-sm text-gray-600">Last Updated</div>
      <div class="text-2xl font-bold">{new Date().toLocaleTimeString()}</div>
    </div>
  </div>

  <!-- Histogram -->
  <div class="bg-white p-6 rounded-lg shadow mb-6">
    <h2 class="text-xl font-bold mb-4">Duration Distribution</h2>
    <div class="flex items-end gap-2 h-48">
      {#each histogram as bucket}
        <div class="flex-1 flex flex-col items-center gap-2">
          <div
            class="w-full bg-blue-600 rounded-t transition-all"
            style="height: {(bucket.count / maxHistogramCount) * 100}%"
            title="{bucket.label}: {bucket.count} proofs"
          ></div>
          <div class="text-xs text-gray-600 text-center">{bucket.label}</div>
          <div class="text-sm font-bold">{bucket.count}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Method & Device Breakdown -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <!-- Method Breakdown -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-bold mb-4">Method Breakdown</h2>
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-green-600 font-medium">Local:</span>
          <span class="font-bold">{stats.methodBreakdown.local}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-blue-600 font-medium">Remote:</span>
          <span class="font-bold">{stats.methodBreakdown.remote}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-yellow-600 font-medium">Simulation:</span>
          <span class="font-bold">{stats.methodBreakdown.simulation}</span>
        </div>
      </div>
    </div>

    <!-- Device Breakdown -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-bold mb-4">Device Breakdown</h2>
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-gray-700 font-medium">Desktop:</span>
          <span class="font-bold">{stats.deviceBreakdown.desktop}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-700 font-medium">Mobile:</span>
          <span class="font-bold">{stats.deviceBreakdown.mobile}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-700 font-medium">Tablet:</span>
          <span class="font-bold">{stats.deviceBreakdown.tablet}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Events Table -->
  <div class="bg-white p-6 rounded-lg shadow">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Recent Events ({filteredEvents.length})</h2>
      <input
        type="text"
        bind:value={filterText}
        placeholder="Filter by method, device, browser..."
        class="px-4 py-2 border rounded w-64"
      />
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100">
            <th
              class="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
              on:click={() => sortBy("timestamp")}
            >
              Timestamp {sortColumn === "timestamp" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
            </th>
            <th
              class="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
              on:click={() => sortBy("method")}
            >
              Method {sortColumn === "method" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
            </th>
            <th
              class="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
              on:click={() => sortBy("durationMs")}
            >
              Duration {sortColumn === "durationMs" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
            </th>
            <th class="px-4 py-2 text-left">Size</th>
            <th class="px-4 py-2 text-left">Device</th>
            <th class="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each sortedEvents as event}
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-sm">{formatTimestamp(event.timestamp)}</td>
              <td class="px-4 py-2">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  class:bg-green-100={event.method === "local"}
                  class:text-green-800={event.method === "local"}
                  class:bg-blue-100={event.method === "remote"}
                  class:text-blue-800={event.method === "remote"}
                  class:bg-yellow-100={event.method === "simulation"}
                  class:text-yellow-800={event.method === "simulation"}
                >
                  {event.method.toUpperCase()}
                </span>
              </td>
              <td class="px-4 py-2 font-mono">{formatDuration(event.durationMs)}</td>
              <td class="px-4 py-2">{event.circuitSize}</td>
              <td class="px-4 py-2 text-sm">
                {event.device.type}
                {#if event.device.ramCategory !== "unknown"}
                  <span class="text-gray-500">({event.device.ramCategory} RAM)</span>
                {/if}
              </td>
              <td class="px-4 py-2">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  class:bg-green-100={event.success}
                  class:text-green-800={event.success}
                  class:bg-red-100={!event.success}
                  class:text-red-800={!event.success}
                >
                  {event.success ? "Success" : "Failed"}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if sortedEvents.length === 0}
        <div class="text-center py-8 text-gray-500">No events to display</div>
      {/if}
    </div>
  </div>
</div>

<style>
  :global(body) {
    @apply bg-gray-50;
  }
</style>
