<script lang="ts">
  export let variant: 'glow' | 'gradient' | 'shimmer' | 'pulse' = 'glow';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let color: 'primary' | 'secondary' | 'accent' = 'primary';
  export let disabled = false;
  export let loading = false;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const colorClasses = {
    primary: 'from-purple-600 to-blue-600',
    secondary: 'from-green-500 to-teal-600',
    accent: 'from-pink-500 to-orange-500'
  };
</script>

<button
  class="
    relative overflow-hidden font-semibold text-white rounded-lg
    transition-all duration-300 transform hover:scale-105
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    {sizeClasses[size]}
    {variant === 'glow' ? 'shadow-lg hover:shadow-2xl' : ''}
    {variant === 'gradient' ? 'bg-gradient-to-r' : ''}
    {variant === 'shimmer' ? 'bg-gradient-to-r shimmer' : ''}
    {variant === 'pulse' ? 'animate-pulse-slow' : ''}
    {colorClasses[color]}
  "
  {disabled}
  on:click
  {...$$restProps}
>
  <!-- Background effects -->
  {#if variant === 'glow'}
    <div class="absolute inset-0 bg-gradient-to-r {colorClasses[color]} opacity-75 blur-xl"></div>
  {/if}
  
  {#if variant === 'shimmer'}
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
  {/if}

  <!-- Content -->
  <div class="relative z-10 flex items-center justify-center space-x-2">
    {#if loading}
      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
      </svg>
    {/if}
    <slot />
  </div>

  <!-- Ripple effect -->
  <div class="absolute inset-0 ripple-container"></div>
</button>

<style>
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }

  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }

  .animate-pulse-slow {
    animation: pulse-slow 2s infinite;
  }

  .shimmer {
    background-size: 200% 100%;
    animation: shimmer-bg 3s infinite;
  }

  @keyframes shimmer-bg {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .ripple-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    border-radius: inherit;
    overflow: hidden;
  }

  :global(.ripple) {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }

  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
</style>