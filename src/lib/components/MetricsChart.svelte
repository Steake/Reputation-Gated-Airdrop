<script lang="ts">
  import { onMount } from "svelte";
  import { Chart, registerables } from "chart.js";
  import { score } from "$lib/stores/score";

  Chart.register(...registerables);

  export let title = "Reputation Metrics";
  export let type: "global" | "user" = "global";

  let chartCanvas: HTMLCanvasElement;
  let chart: Chart;

  // Mock data - in production this would come from your API
  const globalMetrics = {
    totalUsers: 12547,
    averageScore: 0.723,
    totalReputation: 9085234,
    activeUsers: 3847,
  };

  const userMetrics = {
    currentScore: ($score.value || 0) / 1e6,
    scoreHistory: [0.1, 0.2, 0.35, 0.45, 0.58, 0.67, 0.72, 0.75],
    attestationCount: 12,
    trustConnections: 8,
  };

  const reputationDistribution = [
    { range: "0.0-0.2", count: 2847, color: "#ef4444" },
    { range: "0.2-0.4", count: 3452, color: "#f97316" },
    { range: "0.4-0.6", count: 2891, color: "#eab308" },
    { range: "0.6-0.8", count: 2234, color: "#22c55e" },
    { range: "0.8-1.0", count: 1123, color: "#3b82f6" },
  ];

  onMount(() => {
    if (type === "global") {
      createGlobalChart();
    } else {
      createUserChart();
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  });

  function createGlobalChart() {
    const ctx = chartCanvas.getContext("2d");
    if (!ctx) return;

    // Get current theme
    const isDark = document.documentElement.classList.contains("dark");

    chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: reputationDistribution.map((d) => d.range),
        datasets: [
          {
            data: reputationDistribution.map((d) => d.count),
            backgroundColor: reputationDistribution.map((d) => d.color),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
              color: isDark ? "#e2e8f0" : "#374151",
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            titleColor: isDark ? "#f1f5f9" : "#111827",
            bodyColor: isDark ? "#e2e8f0" : "#374151",
            borderColor: isDark ? "#475569" : "#d1d5db",
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.parsed;
                const percentage = ((value / globalMetrics.totalUsers) * 100).toFixed(1);
                return `${label}: ${value} users (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  function createUserChart() {
    const ctx = chartCanvas.getContext("2d");
    if (!ctx) return;

    // Get current theme
    const isDark = document.documentElement.classList.contains("dark");

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"],
        datasets: [
          {
            label: "Reputation Score",
            data: userMetrics.scoreHistory,
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#8b5cf6",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            titleColor: isDark ? "#f1f5f9" : "#111827",
            bodyColor: isDark ? "#e2e8f0" : "#374151",
            borderColor: isDark ? "#475569" : "#d1d5db",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: {
              color: isDark ? "#374151" : "#f3f4f6",
              drawBorder: false,
            },
            ticks: {
              color: isDark ? "#94a3b8" : "#6b7280",
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            max: 1,
            grid: {
              color: isDark ? "#374151" : "#f3f4f6",
              drawBorder: false,
            },
            ticks: {
              color: isDark ? "#94a3b8" : "#6b7280",
              font: {
                size: 11,
              },
              callback: (value) => `${((value as number) * 100).toFixed(0)}%`,
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      },
    });
  }
</script>

<div
  class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
>
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
    <div class="flex items-center space-x-4">
      {#if type === "global"}
        <div class="flex items-center space-x-6 text-sm">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {globalMetrics.totalUsers.toLocaleString()}
            </div>
            <div class="text-gray-500 dark:text-gray-400">Total Users</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {(globalMetrics.averageScore * 100).toFixed(1)}%
            </div>
            <div class="text-gray-500 dark:text-gray-400">Avg Score</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {globalMetrics.activeUsers.toLocaleString()}
            </div>
            <div class="text-gray-500 dark:text-gray-400">Active</div>
          </div>
        </div>
      {:else}
        <div class="flex items-center space-x-6 text-sm">
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {(userMetrics.currentScore * 100).toFixed(1)}%
            </div>
            <div class="text-gray-500 dark:text-gray-400">Current Score</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{userMetrics.attestationCount}</div>
            <div class="text-gray-500 dark:text-gray-400">Attestations</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{userMetrics.trustConnections}</div>
            <div class="text-gray-500 dark:text-gray-400">Connections</div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div
    class="h-64 relative"
    role="img"
    aria-label={type === "global"
      ? "Global reputation metrics distribution chart"
      : "User reputation score history chart"}
  >
    <canvas bind:this={chartCanvas} class="w-full h-full" aria-hidden="true"></canvas>
  </div>
</div>
