<script>
  import { page } from "$app/stores";
  import { AlertTriangle } from "lucide-svelte";
</script>

<div class="text-center py-20">
  <div
    class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
  >
    <AlertTriangle class="h-8 w-8" />
  </div>
  <h1 class="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
    Error: {$page.status}
  </h1>
  <p class="mt-6 text-base leading-7 text-gray-600 dark:text-gray-400">
    An error occurred while loading the application.
  </p>
  {#if $page.error?.message}
    <div
      class="mt-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md text-left"
    >
      <pre class="text-red-800 dark:text-red-200 text-sm whitespace-pre-wrap">{$page.error
          .message}</pre>
    </div>
  {/if}
  <div class="mt-10 flex items-center justify-center gap-x-6">
    <a
      href="/"
      class="rounded-md bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
    >
      Go back home
    </a>
  </div>
</div>
