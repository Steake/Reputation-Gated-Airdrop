<script lang="ts">
  import type { Curve } from "$lib/types";

  export let curve: Curve;
  export let score: number;
  export let floor: number;
  export let cap: number;

  // Logical drawing area (kept fixed for simplicity, SVG is responsive)
  const width = 200;
  const height = 100;
  const padding = 12;

  function scale(
    val: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ) {
    return ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  function getPath(c: Curve) {
    let d = `M ${padding},${height - padding}`;
    // fewer steps but smooth enough
    for (let i = 0; i <= 100; i++) {
      const xNorm = i / 100;
      let yNorm = 0;
      switch (c) {
        case "LIN":
          yNorm = xNorm;
          break;
        case "SQRT":
          yNorm = Math.sqrt(xNorm);
          break;
        case "QUAD":
          yNorm = xNorm * xNorm;
          break;
      }
      const x = scale(xNorm, 0, 1, padding, width - padding);
      const y = scale(yNorm, 0, 1, height - padding, padding);
      d += ` L ${x},${y}`;
    }
    return d;
  }

  $: scoreNorm = Math.max(0, Math.min(1, (score - floor) / (cap - floor)));
  $: scoreX = scale(scoreNorm, 0, 1, padding, width - padding);
  $: curvePath = getPath(curve);
  $: percent = Math.round(scoreNorm * 100);
</script>

<div class="card">
  <!-- Responsive SVG: preserves aspect ratio and fills container -->
  <svg
    viewBox="0 0 {width} {height}"
    preserveAspectRatio="none"
    class="w-full h-32 sm:h-40"
    role="img"
    aria-label="Payout curve visualization"
  >
    <defs>
      <!-- gradient used for the curve stroke -->
      <linearGradient id="g-curve" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="#0f62fe" />
        <stop offset="100%" stop-color="#7c3aed" />
      </linearGradient>

      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="4"
          stdDeviation="6"
          flood-color="#0f172a"
          flood-opacity="0.06"
        />
      </filter>
    </defs>

    <!-- Axes -->
    <line
      x1={padding}
      y1={height - padding}
      x2={width - padding}
      y2={height - padding}
      stroke="#e6e9ef"
      stroke-width="1"
    />
    <line
      x1={padding}
      y1={height - padding}
      x2={padding}
      y2={padding}
      stroke="#e6e9ef"
      stroke-width="1"
    />

    <!-- Curve (with gradient stroke) -->
    <path
      d={curvePath}
      stroke="url(#g-curve)"
      stroke-width="3"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="filter: url(#shadow)"
    />

    <!-- Score indicator: dashed line + marker -->
    {#if score >= floor}
      <line
        x1={scoreX}
        y1={height - padding}
        x2={scoreX}
        y2={padding}
        stroke="#94a3b8"
        stroke-width="1"
        stroke-dasharray="4 3"
        opacity="0.9"
        aria-hidden="true"
      />
      <!-- marker -->
      <circle
        cx={scoreX}
        cy={padding}
        r="4"
        fill="#fff"
        stroke="url(#g-curve)"
        stroke-width="2"
      />
      <text
        x={scoreX}
        y={padding - 6}
        font-size="10"
        text-anchor="middle"
        fill="#0f172a"
        class="mono"
      >
        {percent}%
      </text>
    {/if}

    <!-- floor/cap labels -->
    <text x={padding} y={height - 2} font-size="9" fill="#6b7280"> Floor </text>
    <text
      x={width - padding}
      y={height - 2}
      font-size="9"
      fill="#6b7280"
      text-anchor="end"
    >
      Cap
    </text>
  </svg>

  <div class="flex items-center justify-between text-xs muted mt-3 px-2">
    <div class="flex items-center gap-2">
      <span class="badge">Min</span>
      <span class="small">Min Payout</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="badge">Max</span>
      <span class="small">Max Payout</span>
    </div>
  </div>
</div>
