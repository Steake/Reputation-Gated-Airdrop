/**
 * Simplified Backend Server for Proof Generation API
 * Mock implementation for development/testing without full pipeline dependencies
 */

import express, { Request, Response } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Store active WebSocket connections per request
const wsConnections = new Map<string, Set<WebSocket>>();

// Mock data stores
const mockProofs = new Map<string, any>();
const mockQueue = new Map<string, any>();

// WebSocket connection handler
wss.on("connection", (ws: WebSocket) => {
  console.log("WebSocket client connected");

  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "subscribe" && data.requestId) {
        // Subscribe to proof updates
        if (!wsConnections.has(data.requestId)) {
          wsConnections.set(data.requestId, new Set());
        }
        wsConnections.get(data.requestId)!.add(ws);

        ws.send(
          JSON.stringify({
            type: "subscribed",
            requestId: data.requestId,
          })
        );
      } else if (data.type === "unsubscribe" && data.requestId) {
        // Unsubscribe from proof updates
        const connections = wsConnections.get(data.requestId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            wsConnections.delete(data.requestId);
          }
        }
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  });

  ws.on("close", () => {
    // Clean up connections
    wsConnections.forEach((connections, requestId) => {
      connections.delete(ws);
      if (connections.size === 0) {
        wsConnections.delete(requestId);
      }
    });
    console.log("WebSocket client disconnected");
  });
});

// Broadcast progress to subscribed clients
function broadcastProgress(requestId: string, progress: any) {
  const connections = wsConnections.get(requestId);
  if (connections) {
    const message = JSON.stringify({
      type: "progress",
      data: progress,
    });
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    mode: "mock",
    version: "1.0.0"
  });
});

// Get queue statistics (mock)
app.get("/api/queue/stats", (_req: Request, res: Response) => {
  res.json({
    queued: mockQueue.size,
    processing: 0,
    completed: mockProofs.size,
    failed: 0,
    averageWaitTime: 0,
    averageProcessingTime: 5000,
  });
});

// Get metrics snapshot (mock)
app.get("/api/metrics/snapshot", (_req: Request, res: Response) => {
  res.json({
    totalProofs: mockProofs.size,
    successRate: 1.0,
    averageDuration: 5000,
    p50: 4500,
    p95: 6000,
    p99: 7000,
  });
});

// Get performance prediction (mock)
app.get("/api/metrics/predict", (req: Request, res: Response) => {
  const circuitType = (req.query.circuitType as string) || "default";
  const networkSize = parseInt(req.query.networkSize as string) || 10;

  res.json({
    estimatedDurationMs: networkSize * 500,
    confidence: 0.85,
    circuitType,
    networkSize,
  });
});

// Get circuit benchmarks (mock)
app.get("/api/metrics/benchmarks/:circuitType", (req: Request, res: Response) => {
  const { circuitType } = req.params;

  res.json({
    circuitType,
    averageDuration: 5000,
    minDuration: 3000,
    maxDuration: 8000,
    sampleSize: 100,
  });
});

// Export metrics (mock)
app.get("/api/metrics/export", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=metrics.json");
  res.json({
    timestamp: Date.now(),
    metrics: {
      totalProofs: mockProofs.size,
      successRate: 1.0,
      averageDuration: 5000,
    },
  });
});

// Request proof generation (mock)
app.post("/api/proof/generate", async (req: Request, res: Response) => {
  try {
    const { attestations, proofType, priority, userId, circuitType } = req.body;

    if (!attestations || !Array.isArray(attestations)) {
      return res.status(400).json({ error: "Invalid attestations" });
    }

    if (!proofType || !["exact", "threshold"].includes(proofType)) {
      return res.status(400).json({ error: "Invalid proof type" });
    }

    // Generate mock request ID
    const requestId = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Mock proof generation with progress updates
    setTimeout(() => {
      broadcastProgress(requestId, {
        requestId,
        stage: "validating",
        progress: 25,
      });
    }, 500);

    setTimeout(() => {
      broadcastProgress(requestId, {
        requestId,
        stage: "generating",
        progress: 50,
      });
    }, 1500);

    setTimeout(() => {
      broadcastProgress(requestId, {
        requestId,
        stage: "verifying",
        progress: 75,
      });
    }, 2500);

    // Simulate proof generation delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const mockResult = {
      requestId,
      proof: Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)),
      publicInputs: Array.from({ length: 4 }, () => Math.floor(Math.random() * 1000000)),
      hash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      duration: 3000,
      method: "mock",
    };

    mockProofs.set(requestId, mockResult);

    res.json({
      success: true,
      result: mockResult,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Proof generation failed",
    });
  }
});

// Get proof status (mock)
app.get("/api/proof/status/:requestId", (req: Request, res: Response) => {
  const { requestId } = req.params;
  const proof = mockProofs.get(requestId);

  if (!proof) {
    return res.status(404).json({ error: "Request not found" });
  }

  res.json({
    requestId,
    status: "completed",
    progress: 100,
    result: proof,
  });
});

// Cancel proof request (mock)
app.post("/api/proof/cancel/:requestId", (req: Request, res: Response) => {
  const { requestId } = req.params;
  const cancelled = mockQueue.delete(requestId);

  res.json({ success: cancelled });
});

// List queued proofs (mock)
app.get("/api/queue/list", (_req: Request, res: Response) => {
  res.json({
    queued: Array.from(mockQueue.values()),
    total: mockQueue.size,
  });
});

// Performance profiling endpoint (mock)
app.post("/api/profiling/start", async (req: Request, res: Response) => {
  const { circuitType, networkSizes, iterations } = req.body;

  if (!circuitType || !Array.isArray(networkSizes)) {
    return res.status(400).json({ error: "Invalid profiling parameters" });
  }

  // Mock profiling results
  const results = networkSizes.map((size: number) => ({
    networkSize: size,
    averageDuration: size * 500,
    minDuration: size * 400,
    maxDuration: size * 600,
    iterations: iterations || 10,
  }));

  res.json({
    circuitType,
    results,
    totalTime: results.reduce((sum: number, r: any) => sum + r.averageDuration, 0),
  });
});

// Get profiling results (mock)
app.get("/api/profiling/results", (_req: Request, res: Response) => {
  res.json({
    available: false,
    message: "No profiling results available",
  });
});

// Worker pool stats (mock)
app.get("/api/worker-pool/stats", (_req: Request, res: Response) => {
  res.json({
    totalWorkers: 1,
    activeWorkers: 0,
    idleWorkers: 1,
    queuedJobs: 0,
    completedJobs: mockProofs.size,
  });
});

// Scale worker pool (mock)
app.post("/api/worker-pool/scale", (req: Request, res: Response) => {
  const { targetWorkers } = req.body;

  if (!targetWorkers || typeof targetWorkers !== "number") {
    return res.status(400).json({ error: "Invalid target workers" });
  }

  res.json({
    success: true,
    currentWorkers: 1,
    targetWorkers,
    message: "Mock server - scaling not implemented",
  });
});

// Get scaling recommendations (mock)
app.get("/api/worker-pool/recommendations", (_req: Request, res: Response) => {
  res.json({
    currentWorkers: 1,
    recommendedWorkers: 1,
    reason: "Current load is low",
    metrics: {
      queueLength: 0,
      averageWaitTime: 0,
    },
  });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  Proof Generation API Server (Mock Mode)                  ║
╠═══════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                            ║
║  WebSocket: ws://localhost:${PORT}                           ║
║  Health: http://localhost:${PORT}/health                     ║
║  Status: Ready                                             ║
║  Mode: Development (Mock Implementation)                   ║
╚═══════════════════════════════════════════════════════════╝

Available Endpoints:
  GET  /health
  GET  /api/queue/stats
  GET  /api/metrics/snapshot
  GET  /api/metrics/predict
  GET  /api/metrics/benchmarks/:circuitType
  GET  /api/metrics/export
  POST /api/proof/generate
  GET  /api/proof/status/:requestId
  POST /api/proof/cancel/:requestId
  GET  /api/queue/list
  POST /api/profiling/start
  GET  /api/profiling/results
  GET  /api/worker-pool/stats
  POST /api/worker-pool/scale
  GET  /api/worker-pool/recommendations

WebSocket Events:
  - subscribe: Subscribe to proof updates
  - unsubscribe: Unsubscribe from updates
  - progress: Real-time proof generation progress
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
