<script lang="ts">
  export let score: number;
  export let floor: number;
  export let cap: number;

  const radius = 45;
  const circumference = 2 * Math.PI * radius; // 2 * pi * r

  $: progress = Math.max(0, Math.min(1, (score - floor) / (cap - floor)));
  $: strokeDashoffset = circumference - progress * circumference;

  $: isEligible = score >= floor;
  // choose ring color using CSS custom properties with sensible fallbacks
  // these vars can be themed in global CSS (e.g. --ring-green, --ring-amber, --ring-red)
  $: ringColor = isEligible
    ? "var(--ring-green, #10b981)"
    : progress > 0.5
      ? "var(--ring-amber, #f59e0b)"
      : "var(--ring-red, #ef4444)";
  $: trackColor = "var(--ring-track, #eef2ff)";
  $: percent = Math.round(progress * 100);
  $: scoreShort = typeof score === "number" ? (score / 1e6).toFixed(2) : "0.00";
</script>

<div class="score-ring relative" role="img" aria-label="Score progress">
  <svg
    class="h-full w-full"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid meet"
  >
    <!-- Background track -->
    <circle
      cx={50}
      cy={50}
      r={radius}
      fill="transparent"
      stroke={trackColor}
      stroke-width="8"
    />
    <!-- Progress stroke -->
    <circle
      cx={50}
      cy={50}
      r={radius}
      fill="transparent"
      stroke={ringColor}
      stroke-width="8"
      stroke-linecap="round"
      stroke-dasharray={circumference}
      stroke-dashoffset={strokeDashoffset}
      transform="rotate(-90 50 50)"
    />
  </svg>

  <div class="absolute inset-0 flex items-center justify-center flex-col">
    <span class="text-xl font-semibold mono" style="color: var(--text)"
      >{percent}%</span
    >
    <span class="text-xs muted mt-1">Score: {scoreShort}</span>
  </div>
</div>
