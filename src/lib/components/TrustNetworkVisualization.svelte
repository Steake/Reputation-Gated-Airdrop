<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { wallet } from '$lib/stores/wallet';

  export let scope: 'user' | 'global' = 'global';
  export let width = 800;
  export let height = 600;

  let svgElement: SVGElement;
  let tooltip: HTMLDivElement;

  interface Node {
    id: string;
    name: string;
    score: number;
    group: number;
    radius: number;
    x?: number;
    y?: number;
    fx?: number;
    fy?: number;
  }

  interface Link {
    source: string | Node;
    target: string | Node;
    value: number;
    type: 'trust' | 'attestation' | 'vouch';
  }

  // Mock data - in production this would come from your API
  const globalNetworkData = {
    nodes: [
      { id: 'central', name: 'Shadowgraph DAO', score: 0.95, group: 0, radius: 25 },
      { id: 'user1', name: 'Alice.eth', score: 0.87, group: 1, radius: 20 },
      { id: 'user2', name: 'Bob.eth', score: 0.82, group: 1, radius: 18 },
      { id: 'user3', name: 'Carol.eth', score: 0.76, group: 2, radius: 16 },
      { id: 'user4', name: 'Dave.eth', score: 0.71, group: 2, radius: 15 },
      { id: 'user5', name: 'Eve.eth', score: 0.68, group: 3, radius: 14 },
      { id: 'user6', name: 'Frank.eth', score: 0.63, group: 3, radius: 13 },
      { id: 'user7', name: 'Grace.eth', score: 0.59, group: 4, radius: 12 },
      { id: 'user8', name: 'Henry.eth', score: 0.54, group: 4, radius: 11 },
      { id: 'user9', name: 'Ivy.eth', score: 0.48, group: 5, radius: 10 },
      { id: 'user10', name: 'Jack.eth', score: 0.42, group: 5, radius: 9 }
    ] as Node[],
    links: [
      { source: 'central', target: 'user1', value: 0.9, type: 'trust' },
      { source: 'central', target: 'user2', value: 0.85, type: 'trust' },
      { source: 'user1', target: 'user3', value: 0.8, type: 'attestation' },
      { source: 'user2', target: 'user4', value: 0.75, type: 'attestation' },
      { source: 'user3', target: 'user5', value: 0.7, type: 'vouch' },
      { source: 'user4', target: 'user6', value: 0.65, type: 'vouch' },
      { source: 'user5', target: 'user7', value: 0.6, type: 'trust' },
      { source: 'user6', target: 'user8', value: 0.55, type: 'trust' },
      { source: 'user7', target: 'user9', value: 0.5, type: 'attestation' },
      { source: 'user8', target: 'user10', value: 0.45, type: 'attestation' },
      { source: 'user1', target: 'user2', value: 0.7, type: 'vouch' },
      { source: 'user3', target: 'user4', value: 0.6, type: 'trust' }
    ] as Link[]
  };

  const userNetworkData = {
    nodes: [
      { id: 'user', name: 'You', score: 0.75, group: 0, radius: 25 },
      { id: 'attester1', name: 'WorldCoin', score: 0.95, group: 1, radius: 20 },
      { id: 'attester2', name: 'GitPOAP', score: 0.88, group: 1, radius: 18 },
      { id: 'voucher1', name: 'Alice.eth', score: 0.82, group: 2, radius: 16 },
      { id: 'voucher2', name: 'Bob.eth', score: 0.79, group: 2, radius: 15 },
      { id: 'connection1', name: 'Carol.eth', score: 0.71, group: 3, radius: 12 },
      { id: 'connection2', name: 'Dave.eth', score: 0.68, group: 3, radius: 11 }
    ] as Node[],
    links: [
      { source: 'attester1', target: 'user', value: 0.9, type: 'attestation' },
      { source: 'attester2', target: 'user', value: 0.85, type: 'attestation' },
      { source: 'voucher1', target: 'user', value: 0.8, type: 'vouch' },
      { source: 'voucher2', target: 'user', value: 0.75, type: 'vouch' },
      { source: 'user', target: 'connection1', value: 0.7, type: 'trust' },
      { source: 'user', target: 'connection2', value: 0.65, type: 'trust' }
    ] as Link[]
  };

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  const linkColors = {
    trust: '#3b82f6',
    attestation: '#10b981', 
    vouch: '#f59e0b'
  };

  onMount(() => {
    createVisualization();
  });

  function createVisualization() {
    const data = scope === 'global' ? globalNetworkData : userNetworkData;
    
    // Clear any existing content
    d3.select(svgElement).selectAll('*').remove();

    const svg = d3.select(svgElement)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');

    // Create definitions for gradients and filters
    const defs = svg.append('defs');
    
    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(100).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 5));

    // Create links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value) * 3)
      .attr('stroke', (d: any) => linkColors[d.type])
      .attr('stroke-opacity', 0.8)
      .style('filter', 'url(#glow)');

    // Create nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add node circles
    node.append('circle')
      .attr('r', (d: Node) => d.radius)
      .attr('fill', (d: Node) => {
        if (scope === 'user' && d.id === 'user') return '#8b5cf6';
        if (scope === 'global' && d.id === 'central') return '#ef4444';
        return colorScale(d.group.toString());
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .style('filter', 'url(#glow)')
      .on('mouseover', showTooltip)
      .on('mouseout', hideTooltip);

    // Add node labels
    node.append('text')
      .text((d: Node) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .attr('stroke', '#000000')
      .attr('stroke-width', '0.5px')
      .style('pointer-events', 'none');

    // Add score indicators
    node.append('text')
      .text((d: Node) => `${(d.score * 100).toFixed(0)}%`)
      .attr('text-anchor', 'middle')
      .attr('dy', '25px')
      .attr('font-size', '8px')
      .attr('fill', '#ffffff')
      .attr('stroke', '#000000')
      .attr('stroke-width', '0.3px')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function showTooltip(event: MouseEvent, d: Node) {
      tooltip.style.opacity = '1';
      tooltip.style.left = (event.pageX + 10) + 'px';
      tooltip.style.top = (event.pageY - 10) + 'px';
      tooltip.innerHTML = `
        <div class="font-bold">${d.name}</div>
        <div>Score: ${(d.score * 100).toFixed(1)}%</div>
        <div>Group: ${d.group}</div>
      `;
    }

    function hideTooltip() {
      tooltip.style.opacity = '0';
    }
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
      {scope === 'global' ? 'Global Trust Network' : 'Your Trust Network'}
    </h3>
    <div class="flex items-center space-x-4 text-sm">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
        <span class="text-gray-600 dark:text-gray-300">Trust</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
        <span class="text-gray-600 dark:text-gray-300">Attestation</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <span class="text-gray-600 dark:text-gray-300">Vouch</span>
      </div>
    </div>
  </div>
  
  <div class="relative overflow-hidden rounded-lg">
    <svg bind:this={svgElement} class="w-full h-auto" style="min-height: 400px;"></svg>
  </div>
  
  <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
    {#if scope === 'global'}
      Interactive visualization of the global trust network. Drag nodes to explore connections.
    {:else}
      Your personal trust network showing attestations, vouches, and trust relationships.
    {/if}
  </div>
</div>

<!-- Tooltip -->
<div
  bind:this={tooltip}
  class="absolute bg-gray-900 text-white p-2 rounded shadow-lg pointer-events-none opacity-0 transition-opacity z-10"
  style="font-size: 12px;"
></div>