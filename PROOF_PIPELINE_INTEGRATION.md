# Proof Pipeline Integration Guide

Complete integration of the proof generation pipeline with UI, backend API, WebSocket, profiling, and horizontal scaling.

## Overview

This update extends the proof generation pipeline with:

1. **UI Integration** - New `ProofPipelineUI.svelte` component with real-time updates
2. **Backend API Server** - Node.js/Express server with REST endpoints
3. **WebSocket Support** - Real-time proof progress updates
4. **Performance Profiling** - Comprehensive benchmarking system
5. **Horizontal Scaling** - Worker pool manager with load balancing

## Components

### 1. Backend Server (`server/index.ts`)

**Features:**

- REST API endpoints for proof generation, queue management, and metrics
- WebSocket server for real-time updates
- Worker pool management endpoints
- Performance profiling API

**Start Server:**

```bash
cd server
npm install
npm run dev
```

**API Endpoints:**

- `POST /api/proof/generate` - Generate proof
- `GET /api/queue/stats` - Queue statistics
- `GET /api/metrics/snapshot` - Performance metrics
- `POST /api/profiling/comprehensive` - Run profiling
- `GET /api/workers/stats` - Worker pool status

### 2. UI Component (`src/lib/components/ProofPipelineUI.svelte`)

**Features:**

- Real-time queue statistics display
- Performance metrics visualization
- Duration prediction
- WebSocket connection status
- Progress tracking with ETA

**Usage:**

```svelte
<script>
  import ProofPipelineUI from "$lib/components/ProofPipelineUI.svelte";
  import { ProofPriority } from "$lib/proof";

  let attestations = [...]; // Your attestations
</script>

<ProofPipelineUI {attestations} proofType="exact" priority={ProofPriority.HIGH} />
```

### 3. Worker Pool Manager (`src/lib/proof/workerPool.ts`)

**Features:**

- Distributed worker registration
- Load balancing algorithms
- Automatic task reassignment
- Auto-scaling recommendations
- Heartbeat monitoring

**Usage:**

```typescript
import { workerPool } from "$lib/proof";

// Register workers
workerPool.registerWorker("worker-1", "http://worker1:3001", 4);
workerPool.registerWorker("worker-2", "http://worker2:3001", 4);

// Submit task
const result = await workerPool.submitTask(attestations, "exact", ProofPriority.HIGH);

// Monitor stats
const stats = workerPool.getStats();
console.log(`Active workers: ${stats.activeWorkers}`);
```

### 4. Performance Profiler (`src/lib/proof/profiler.ts`)

**Features:**

- Multi-circuit benchmarking
- Network size analysis
- Statistical analysis (avg, min, max, P50, P95, P99)
- Performance recommendations
- HTML report generation

**Usage:**

```typescript
import { performanceProfiler } from "$lib/proof";

const report = await performanceProfiler.profile({
  circuitTypes: ["default", "optimized"],
  networkSizes: [10, 50, 100, 200],
  iterations: 10,
  warmupIterations: 2,
  includeMemory: true,
  includeCPU: true,
});

// Generate HTML report
const html = performanceProfiler.generateHTMLReport(report);
```

## Integration Steps

### Step 1: Start the Backend Server

```bash
# From repository root
cd server
npm install
npm run dev
```

Server will start on http://localhost:3001

### Step 2: Update Your UI Component

Replace or update the existing `ZKMLProver.svelte` to use the new `ProofPipelineUI.svelte`:

```svelte
<!-- src/routes/claim/+page.svelte -->
<script>
  import ProofPipelineUI from "$lib/components/ProofPipelineUI.svelte";
  import { attestations } from "$lib/stores/attestations";
  import { ProofPriority } from "$lib/proof";
</script>

<ProofPipelineUI attestations={$attestations} proofType="exact" priority={ProofPriority.NORMAL} />
```

### Step 3: Configure WebSocket Connection

The UI component automatically connects to `ws://localhost:3001`. For production, update the URL:

```svelte
<!-- In ProofPipelineUI.svelte -->
<script>
  const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3001";
  wsConnection = new WebSocket(wsUrl);
</script>
```

### Step 4: Set Up Worker Pool (Optional)

For horizontal scaling, deploy worker nodes and register them:

```bash
# On each worker machine
cd server
PORT=3002 npm start

# Register with main server
curl -X POST http://localhost:3001/api/workers/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "worker-1",
    "url": "http://worker-machine:3002",
    "maxConcurrency": 4
  }'
```

### Step 5: Run Performance Profiling

```bash
# Using the API
curl -X POST http://localhost:3001/api/profiling/comprehensive \
  -H "Content-Type: application/json" \
  -d '{
    "circuitTypes": ["default"],
    "networkSizes": [10, 50, 100],
    "iterations": 5,
    "warmupIterations": 1
  }' \
  > profiling-report.json
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────────────┐      ┌─────────────────────────┐ │
│  │ ProofPipelineUI      │◄─────┤  WebSocket Client       │ │
│  │  - Queue Stats       │      │  - Real-time Updates    │ │
│  │  - Metrics Display   │      └─────────────────────────┘ │
│  │  - Progress Bar      │                                   │
│  └──────────────────────┘                                   │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTP/WS
┌───────────────▼─────────────────────────────────────────────┐
│                     Backend Server                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  REST API    │  │  WebSocket   │  │  Worker Pool    │  │
│  │  Endpoints   │  │  Server      │  │  Manager        │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│                   Proof Pipeline Core                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Pipeline │◄─┤  Queue   │◄─┤ Metrics  │◄─┤ Validator │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Errors   │  │ Profiler │  │ WorkerP  │                  │
│  │ Handler  │  │          │  │ ool      │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│                   Distributed Workers                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Worker 1  │  │  Worker 2  │  │  Worker N  │           │
│  │  (4 conc)  │  │  (4 conc)  │  │  (4 conc)  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

### With Backend Server

- **Throughput**: Up to 4 concurrent proofs per worker
- **Latency**: Real-time progress updates (<100ms)
- **Scalability**: Horizontal scaling with worker pools
- **Reliability**: Automatic retry and circuit fallback

### With Worker Pool (4 workers)

- **Throughput**: Up to 16 concurrent proofs
- **Load Balancing**: Automatic task distribution
- **Fault Tolerance**: Task reassignment on worker failure
- **Auto-scaling**: Recommendations based on utilization

### Performance Profiling

- **Small circuits** (10-50): 2-5s
- **Medium circuits** (50-200): 5-15s
- **Large circuits** (200+): 15-60s

## API Examples

### Generate Proof with Progress

```javascript
// Connect WebSocket first
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'subscribe', requestId: 'proof-123' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'progress') {
    console.log(`${data.data.stage}: ${data.data.progress}%`);
  }
};

// Generate proof
const response = await fetch('http://localhost:3001/api/proof/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    attestations: [...],
    proofType: 'exact',
    priority: 1
  })
});
```

### Monitor Queue

```javascript
const stats = await fetch("http://localhost:3001/api/queue/stats").then((r) => r.json());

console.log(`Queued: ${stats.totalQueued}`);
console.log(`Processing: ${stats.totalProcessing}`);
console.log(`Completed: ${stats.totalCompleted}`);
```

### Export Metrics

```javascript
const metrics = await fetch("http://localhost:3001/api/metrics/export").then((r) => r.json());

// Save to file or analyze
console.log("Performance metrics:", metrics);
```

## Testing

### Test Backend Server

```bash
# Health check
curl http://localhost:3001/health

# Generate proof
curl -X POST http://localhost:3001/api/proof/generate \
  -H "Content-Type: application/json" \
  -d '{"attestations": [...], "proofType": "exact", "priority": 1}'
```

### Test WebSocket

```javascript
const ws = new WebSocket("ws://localhost:3001");
ws.onopen = () => console.log("Connected");
ws.onmessage = (event) => console.log("Received:", event.data);
ws.send(JSON.stringify({ type: "subscribe", requestId: "test-123" }));
```

### Test Worker Pool

```bash
# Register worker
curl -X POST http://localhost:3001/api/workers/register \
  -H "Content-Type: application/json" \
  -d '{"id": "test-worker", "url": "http://localhost:3002", "maxConcurrency": 4}'

# Get stats
curl http://localhost:3001/api/workers/stats
```

## Deployment

### Production Setup

1. **Environment Variables**

```bash
PORT=3001
NODE_ENV=production
WS_URL=wss://your-domain.com
```

2. **Start Server**

```bash
cd server
npm run build
npm start
```

3. **Reverse Proxy** (nginx)

```nginx
upstream proof_server {
    server localhost:3001;
}

server {
    listen 443 ssl;
    server_name api.your-domain.com;

    location /api {
        proxy_pass http://proof_server;
    }

    location /ws {
        proxy_pass http://proof_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

4. **Deploy Workers** (Optional)

```bash
# Deploy to multiple machines
for i in {1..4}; do
  ssh worker-$i "cd /opt/proof-server && PORT=300$i npm start"
done

# Register workers
for i in {1..4}; do
  curl -X POST https://api.your-domain.com/api/workers/register \
    -d "{\"id\": \"worker-$i\", \"url\": \"http://worker-$i:300$i\", \"maxConcurrency\": 4}"
done
```

## Monitoring

### Health Checks

```bash
# Server health
curl http://localhost:3001/health

# Queue status
watch -n 5 'curl -s http://localhost:3001/api/queue/stats | jq'

# Worker status
watch -n 5 'curl -s http://localhost:3001/api/workers/stats | jq'
```

### Metrics Dashboard

Access real-time metrics via the API:

- Success rate
- Average duration
- P50, P95, P99 latencies
- Resource usage
- Queue statistics

## Troubleshooting

### WebSocket Not Connecting

- Check server is running: `curl http://localhost:3001/health`
- Verify WebSocket port: Default is 3001
- Check firewall rules

### High Queue Size

- Add more workers to increase throughput
- Increase `maxConcurrency` per worker
- Check for failing proofs and adjust retry strategy

### Slow Performance

- Run profiling: `POST /api/profiling/comprehensive`
- Check circuit optimization recommendations
- Monitor resource usage (CPU, memory)
- Consider circuit fallback to smaller sizes

## Next Steps

- [ ] Deploy to production environment
- [ ] Set up monitoring and alerting
- [ ] Configure auto-scaling for workers
- [ ] Integrate with existing authentication
- [ ] Add rate limiting per user
- [ ] Set up logging aggregation
- [ ] Configure backup and recovery

## Support

For issues or questions:

- Check the API documentation
- Review the profiling reports
- Monitor the queue and metrics
- Check server logs for errors

## License

Part of the Shadowgraph Reputation-Gated Airdrop project.
