<script lang="ts">
  import { onMount } from "svelte";

  export let count = 20;
  export let color = "#8b5cf6";
  export let size = "mixed"; // 'small', 'medium', 'large', 'mixed'

  let container: HTMLDivElement;
  let elements: Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    delay: number;
  }> = [];

  onMount(() => {
    generateElements();

    return () => {
      // Cleanup if needed
    };
  });

  function generateElements() {
    elements = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: getSizeValue(),
      speed: Math.random() * 20 + 10, // 10-30s animation duration
      opacity: Math.random() * 0.6 + 0.2, // 0.2-0.8 opacity
      delay: Math.random() * 10, // 0-10s delay
    }));
  }

  function getSizeValue() {
    switch (size) {
      case "small":
        return Math.random() * 20 + 10; // 10-30px
      case "medium":
        return Math.random() * 40 + 30; // 30-70px
      case "large":
        return Math.random() * 60 + 50; // 50-110px
      case "mixed":
      default:
        return Math.random() * 80 + 10; // 10-90px
    }
  }

  function getElementStyle(element: (typeof elements)[0]) {
    return `
      left: ${element.x}%;
      top: ${element.y}%;
      width: ${element.size}px;
      height: ${element.size}px;
      opacity: ${element.opacity};
      animation-duration: ${element.speed}s;
      animation-delay: ${element.delay}s;
    `;
  }
</script>

<div bind:this={container} class="fixed inset-0 pointer-events-none overflow-hidden z-0">
  {#each elements as element (element.id)}
    <!-- Floating geometric shapes with proper containment -->
    <div class="absolute animate-float" style={getElementStyle(element)}>
      {#if element.id % 4 === 0}
        <!-- Circle -->
        <div
          class="w-full h-full rounded-full opacity-30"
          style="background: linear-gradient(135deg, {color}66, {color}33);"
        ></div>
      {:else if element.id % 4 === 1}
        <!-- Triangle -->
        <div
          class="w-full h-full opacity-30"
          style="
            background: linear-gradient(135deg, {color}66, {color}33);
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          "
        ></div>
      {:else if element.id % 4 === 2}
        <!-- Square -->
        <div
          class="w-full h-full opacity-30 transform rotate-45"
          style="background: linear-gradient(135deg, {color}66, {color}33);"
        ></div>
      {:else}
        <!-- Hexagon -->
        <div
          class="w-full h-full opacity-30"
          style="
            background: linear-gradient(135deg, {color}66, {color}33);
            clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          "
        ></div>
      {/if}
    </div>
  {/each}

  <!-- Gradient orbs with mobile-safe positioning -->
  {#each Array(3) as _orb, i}
    <div
      class="absolute animate-pulse-glow"
      style="
        left: {20 + Math.random() * 60}%;
        top: {20 + Math.random() * 60}%;
        width: {Math.random() * 120 + 60}px;
        height: {Math.random() * 120 + 60}px;
        animation-delay: {i * 2}s;
        max-width: min(200px, 50vw);
        max-height: min(200px, 50vh);
      "
    >
      <div
        class="w-full h-full rounded-full blur-xl opacity-20"
        style="background: radial-gradient(circle, {color}88 0%, transparent 70%);"
      ></div>
    </div>
  {/each}
</div>

<style>
  @keyframes float {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    25% {
      transform: translateY(-20px) rotate(90deg);
    }
    50% {
      transform: translateY(-10px) rotate(180deg);
    }
    75% {
      transform: translateY(-30px) rotate(270deg);
    }
  }

  @keyframes pulse-glow {
    0%,
    100% {
      opacity: 0.1;
      transform: scale(1);
    }
    50% {
      opacity: 0.3;
      transform: scale(1.1);
    }
  }

  .animate-float {
    animation: float 15s ease-in-out infinite;
  }

  .animate-pulse-glow {
    animation: pulse-glow 8s ease-in-out infinite;
  }
</style>
