<script lang="ts">
  import type { ToastMessage } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";
  import { CheckCircle, AlertCircle, Info, X } from "lucide-svelte";

  export let toast: ToastMessage;

  const dispatch = createEventDispatcher();

  // Map toast types to explicit colors (RGB fallbacks). These will be applied
  // inline to the icon so the color is always consistent across light/dark.
  const colorMap: Record<string, string> = {
    info: "rgb(59 130 246)", // blue-500
    success: "rgb(16 185 129)", // green-500
    warning: "rgb(234 179 8)", // yellow-500
    error: "rgb(239 68 68)", // red-500
  };

  // reactive toast color used in the template
  $: toastColor = colorMap[toast.type] || "currentColor";

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle,
  };
</script>

<div
  transition:fly={{ x: 300, duration: 300 }}
  class="max-w-sm w-full bg-white dark:bg-[var(--card)] shadow-lg rounded-lg pointer-events-auto ring-1 ring-black/5 dark:ring-white/5 overflow-hidden"
>
  <div class="p-4">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svelte:component this={icons[toast.type]} class="h-6 w-6" style="color: {toastColor}" />
      </div>
      <div class="ml-3 w-0 flex-1 pt-0.5">
        <p class="text-sm font-medium text-[var(--text)]">{toast.message}</p>
      </div>
      <div class="ml-4 flex-shrink-0 flex">
        <button
          on:click={() => dispatch("dismiss")}
          class="bg-white dark:bg-[var(--card)] rounded-md inline-flex text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand)]"
        >
          <span class="sr-only">Close</span>
          <X class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</div>
