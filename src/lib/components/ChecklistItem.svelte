<script lang="ts">
  import { Check } from "lucide-svelte";
  export let text: string;
</script>

<div class="flex items-start">
  <div
    class="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-[var(--brand)] text-white dark:bg-[var(--card-contrast)] dark:text-[var(--text)]"
  >
    <Check class="h-4 w-4" />
  </div>
  <p class="ml-3 text-[var(--muted-text)]">{text}</p>
</div>
