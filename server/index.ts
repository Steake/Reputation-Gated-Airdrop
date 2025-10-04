/**
 * Backend server for proof generation pipeline
 * Provides REST API and WebSocket support for real-time updates
 */

import express, { Request, Response } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import { proofPipeline, proofQueue, metricsCollector, ProofPriority, workerPool, performanceProfiler } from "../src/lib/proof/index.js";
import type { ProofGenerationProgress } from "../src/lib/proof/pipeline.js";
import type { TrustAttestation } from "../src/lib/ebsl/core.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Store active WebSocket connections per request
const wsConnections = new Map<string, Set<WebSocket>>();

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
function broadcastProgress(progress: ProofGenerationProgress) {
  const connections = wsConnections.get(progress.requestId);
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
  res.json({ status: "ok", timestamp: Date.now() });
});

// Get queue statistics
app.get("/api/queue/stats", (_req: Request, res: Response) => {
  try {
    const stats = proofQueue.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get queue stats" });
  }
});

// Get metrics snapshot
app.get("/api/metrics/snapshot", (_req: Request, res: Response) => {
  try {
    const snapshot = metricsCollector.getSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: "Failed to get metrics" });
  }
});

// Get performance prediction
app.get("/api/metrics/predict", (req: Request, res: Response) => {
  try {
    const circuitType = (req.query.circuitType as string) || "default";
    const networkSize = parseInt(req.query.networkSize as string) || 10;

    const prediction = metricsCollector.predictDuration(circuitType, networkSize);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: "Failed to predict duration" });
  }
});

// Get circuit benchmarks
app.get("/api/metrics/benchmarks/:circuitType", (req: Request, res: Response) => {
  try {
    const { circuitType } = req.params;
    const benchmarks = metricsCollector.getBenchmarksByCircuit(circuitType);
    res.json(benchmarks);
  } catch (error) {
    res.status(500).json({ error: "Failed to get benchmarks" });
  }
});

// Export metrics
app.get("/api/metrics/export", (_req: Request, res: Response) => {
  try {
    const metrics = metricsCollector.exportMetrics();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=metrics.json");
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to export metrics" });
  }
});

// Request proof generation
app.post("/api/proof/generate", async (req: Request, res: Response) => {
  try {
    const { attestations, proofType, priority, userId, circuitType, maxRetries, timeoutMs } =
      req.body;

    if (!attestations || !Array.isArray(attestations)) {
      return res.status(400).json({ error: "Invalid attestations" });
    }

    if (!proofType || !["exact", "threshold"].includes(proofType)) {
      return res.status(400).json({ error: "Invalid proof type" });
    }

    // Generate proof with progress updates
    const result = await proofPipeline.generateProof(
      attestations as TrustAttestation[],
      proofType,
      {
        priority: priority || ProofPriority.NORMAL,
        userId,
        circuitType,
        maxRetries,
        timeoutMs,
      },
      (progress) => {
        broadcastProgress(progress);
      }
    );

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Proof generation failed",
    });
  }
});

// Get proof status
app.get("/api/proof/status/:requestId", (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = proofQueue.getRequest(requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to get proof status" });
  }
});

// Cancel proof request
app.post("/api/proof/cancel/:requestId", (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const cancelled = proofPipeline.cancelProof(requestId);

    res.json({ success: cancelled });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel proof" });
  }
});

// List queued proofs
app.get("/api/queue/list", (_req: Request, res: Response) => {
  try {
    // Access queue stores (this is a simplified version)
    const stats = proofQueue.getStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: "Failed to list queue" });
  }
});

// Performance profiling endpoint
app.post("/api/profiling/start", async (req: Request, res: Response) => {
  try {
    const { circuitType, networkSizes, iterations } = req.body;

    if (!circuitType || !Array.isArray(networkSizes)) {
      return res.status(400).json({ error: "Invalid profiling parameters" });
    }

    const results = [];

    for (const size of networkSizes) {
      const iterationResults = [];

      for (let i = 0; i < (iterations || 3); i++) {
        // Create mock attestations for profiling
        const mockAttestations: TrustAttestation[] = Array.from(
          { length: size },
          (_, idx) => ({
            source: `0xsource${idx}`,
            target: "0xtarget",
            opinion: {
              belief: Math.random() * 0.5 + 0.3,
              disbelief: Math.random() * 0.2,
              uncertainty: Math.random() * 0.3,
              base_rate: 0.5,
            },
            attestation_type: "trust" as const,
            weight: 1.0,
            created_at: Date.now(),
            expires_at: Date.now() + 86400000,
          })
        );

        const startTime = Date.now();
        try {
          await proofPipeline.generateProof(mockAttestations, "exact", {
            circuitType,
            priority: ProofPriority.LOW,
          });
          const duration = Date.now() - startTime;
          iterationResults.push({ success: true, duration });
        } catch (error: any) {
          iterationResults.push({ success: false, error: error.message });
        }
      }

      results.push({
        networkSize: size,
        iterations: iterationResults,
        avgDuration:
          iterationResults.reduce((sum, r) => sum + (r.duration || 0), 0) /
          iterationResults.length,
      });
    }

    res.json({ circuitType, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced profiling with full profiler
app.post("/api/profiling/comprehensive", async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const report = await performanceProfiler.profile(config);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get profiling progress
app.get("/api/profiling/progress", (_req: Request, res: Response) => {
  try {
    const progress = performanceProfiler.getProgress();
    const isRunning = performanceProfiler.isProfilerRunning();
    res.json({ progress, isRunning });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export profiling report as HTML
app.post("/api/profiling/export/html", (req: Request, res: Response) => {
  try {
    const report = req.body;
    const html = performanceProfiler.generateHTMLReport(report);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", "attachment; filename=profiling-report.html");
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Worker pool management
app.get("/api/workers/stats", (_req: Request, res: Response) => {
  try {
    const stats = workerPool.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get worker stats" });
  }
});

app.post("/api/workers/register", (req: Request, res: Response) => {
  try {
    const { id, url, maxConcurrency } = req.body;
    if (!id || !url) {
      return res.status(400).json({ error: "Worker ID and URL required" });
    }
    workerPool.registerWorker(id, url, maxConcurrency || 4);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/workers/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    workerPool.unregisterWorker(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/workers/:id/heartbeat", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    workerPool.updateWorkerHeartbeat(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Proof pipeline server running on port ${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export { app, server, wss };
