<script lang="ts">
  export let label: string;
  export let value: string | number | undefined = undefined;
  export let isLoading = false;
</script>

<div class="bg-gray-50 dark:bg-card p-3 rounded-lg">
  <dt class="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
    {label}
  </dt>
  <dd class="mt-1 text-lg font-semibold text-[var(--text)] font-mono">
    {#if isLoading}
      <div
        class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"
      ></div>
    {:else if value !== undefined}
      <span class="text-[var(--text)]">{value}</span>
    {:else}
      <slot />
    {/if}
  </dd>
</div>
