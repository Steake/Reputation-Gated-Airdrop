# Proof Pipeline Server

Backend server for ZK proof generation pipeline with REST API and WebSocket support.

## Features

- **REST API** - Comprehensive endpoints for proof generation, queue management, and metrics
- **WebSocket** - Real-time proof progress updates
- **Worker Pool** - Horizontal scaling with distributed workers
- **Performance Profiling** - Benchmark circuits and network sizes
- **Metrics** - Real-time performance monitoring and analytics

## Installation

```bash
cd server
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on port 3001 (configurable via PORT environment variable).

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Queue Management
- `GET /api/queue/stats` - Get queue statistics
- `GET /api/queue/list` - List queued proofs

### Metrics
- `GET /api/metrics/snapshot` - Get current metrics
- `GET /api/metrics/predict?circuitType={type}&networkSize={size}` - Predict proof duration
- `GET /api/metrics/benchmarks/:circuitType` - Get circuit benchmarks
- `GET /api/metrics/export` - Export metrics as JSON

### Proof Generation
- `POST /api/proof/generate` - Generate proof
- `GET /api/proof/status/:requestId` - Get proof status
- `POST /api/proof/cancel/:requestId` - Cancel proof generation

### Performance Profiling
- `POST /api/profiling/start` - Start basic profiling
- `POST /api/profiling/comprehensive` - Run comprehensive profiling
- `GET /api/profiling/progress` - Get profiling progress
- `POST /api/profiling/export/html` - Export profiling report as HTML

### Worker Pool Management
- `GET /api/workers/stats` - Get worker pool statistics
- `POST /api/workers/register` - Register a new worker
- `DELETE /api/workers/:id` - Unregister a worker
- `POST /api/workers/:id/heartbeat` - Update worker heartbeat

## WebSocket

Connect to `ws://localhost:3001` for real-time updates.

### Messages

**Subscribe to proof updates:**
```json
{
  "type": "subscribe",
  "requestId": "proof-123"
}
```

**Unsubscribe:**
```json
{
  "type": "unsubscribe",
  "requestId": "proof-123"
}
```

**Progress updates (received):**
```json
{
  "type": "progress",
  "data": {
    "requestId": "proof-123",
    "status": "PROCESSING",
    "progress": 50,
    "stage": "Generating proof",
    "estimatedRemainingMs": 5000
  }
}
```

## Example Usage

### Generate Proof
```javascript
const response = await fetch('http://localhost:3001/api/proof/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    attestations: [...],
    proofType: 'exact',
    priority: 1,
    userId: '0x123...'
  })
});

const { result } = await response.json();
```

### WebSocket Updates
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    requestId: 'proof-123'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'progress') {
    console.log(`Progress: ${data.data.progress}%`);
  }
};
```

### Performance Profiling
```javascript
const response = await fetch('http://localhost:3001/api/profiling/comprehensive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    circuitTypes: ['default', 'optimized'],
    networkSizes: [10, 50, 100],
    iterations: 5,
    warmupIterations: 2
  })
});

const report = await response.json();
console.log('Profiling complete:', report);
```

## Architecture

The server integrates with the proof generation pipeline modules:
- **pipeline.ts** - Proof orchestration
- **queue.ts** - Request queue management
- **metrics.ts** - Performance monitoring
- **validation.ts** - Security and validation
- **workerPool.ts** - Distributed worker management
- **profiler.ts** - Performance profiling

## Configuration

Environment variables:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## License

Part of the Shadowgraph Reputation-Gated Airdrop project.
