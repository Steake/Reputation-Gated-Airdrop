<script lang="ts">
  import { Copy, Check } from "lucide-svelte";
  import { toasts } from "$lib/stores/ui";

  export let text: string;
  let copied = false;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      toasts.success("Copied to clipboard!");
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      toasts.error("Failed to copy.");
      console.error("Failed to copy text: ", err);
    }
  }
</script>

<button
  on:click={handleCopy}
  class="inline-flex items-center text-gray-500 hover:text-gray-800"
>
  <slot />
  {#if copied}
    <Check class="ml-2 h-4 w-4 text-green-500" />
  {:else}
    <Copy class="ml-2 h-4 w-4" />
  {/if}
</button>
