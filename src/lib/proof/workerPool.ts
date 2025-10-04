/**
 * Worker pool manager for horizontal scaling of proof generation
 * Supports distributed workers, load balancing, and auto-scaling
 */

import { EventEmitter } from "events";
import type { TrustAttestation } from "./ebsl/core";
import type { ProofResult } from "./proof/queue";

export interface WorkerNode {
  id: string;
  url: string;
  status: "idle" | "busy" | "offline";
  activeJobs: number;
  maxConcurrency: number;
  totalProcessed: number;
  totalFailed: number;
  avgDurationMs: number;
  lastHeartbeat: number;
}

export interface WorkerTask {
  id: string;
  attestations: TrustAttestation[];
  proofType: "exact" | "threshold";
  priority: number;
  assignedTo?: string;
  startTime?: number;
  retries: number;
}

/**
 * Worker pool manager with load balancing and auto-scaling
 */
export class WorkerPoolManager extends EventEmitter {
  private workers = new Map<string, WorkerNode>();
  private tasks = new Map<string, WorkerTask>();
  private pendingTasks: WorkerTask[] = [];
  private minWorkers = 2;
  private maxWorkers = 10;
  private scaleUpThreshold = 0.8; // Scale up when 80% busy
  private scaleDownThreshold = 0.2; // Scale down when 20% busy
  private heartbeatInterval = 10000; // 10 seconds
  private heartbeatTimer: any;

  constructor() {
    super();
    this.startHeartbeatMonitor();
  }

  /**
   * Register a worker node
   */
  registerWorker(id: string, url: string, maxConcurrency: number = 4) {
    const worker: WorkerNode = {
      id,
      url,
      status: "idle",
      activeJobs: 0,
      maxConcurrency,
      totalProcessed: 0,
      totalFailed: 0,
      avgDurationMs: 0,
      lastHeartbeat: Date.now(),
    };

    this.workers.set(id, worker);
    this.emit("worker:registered", worker);
    console.log(`Worker ${id} registered at ${url}`);
  }

  /**
   * Unregister a worker node
   */
  unregisterWorker(id: string) {
    const worker = this.workers.get(id);
    if (worker) {
      this.workers.delete(id);
      this.emit("worker:unregistered", worker);
      console.log(`Worker ${id} unregistered`);

      // Reassign its active tasks
      this.reassignWorkerTasks(id);
    }
  }

  /**
   * Submit a task to the worker pool
   */
  async submitTask(
    attestations: TrustAttestation[],
    proofType: "exact" | "threshold",
    priority: number = 1
  ): Promise<ProofResult> {
    const task: WorkerTask = {
      id: this.generateTaskId(),
      attestations,
      proofType,
      priority,
      retries: 0,
    };

    this.tasks.set(task.id, task);
    this.pendingTasks.push(task);
    this.sortPendingTasks();

    this.emit("task:submitted", task);

    // Try to assign immediately
    await this.assignTasks();

    // Check if we need to scale up
    this.checkScaling();

    // Return a promise that resolves when task completes
    return new Promise((resolve, reject) => {
      const completeHandler = (completedTask: WorkerTask, result: ProofResult) => {
        if (completedTask.id === task.id) {
          this.removeListener("task:completed", completeHandler);
          this.removeListener("task:failed", failHandler);
          resolve(result);
        }
      };

      const failHandler = (failedTask: WorkerTask, error: Error) => {
        if (failedTask.id === task.id) {
          this.removeListener("task:completed", completeHandler);
          this.removeListener("task:failed", failHandler);
          reject(error);
        }
      };

      this.on("task:completed", completeHandler);
      this.on("task:failed", failHandler);
    });
  }

  /**
   * Assign pending tasks to available workers
   */
  private async assignTasks() {
    while (this.pendingTasks.length > 0) {
      const worker = this.selectWorker();
      if (!worker) break;

      const task = this.pendingTasks.shift()!;
      await this.assignTaskToWorker(task, worker);
    }
  }

  /**
   * Select best worker using load balancing
   */
  private selectWorker(): WorkerNode | null {
    let bestWorker: WorkerNode | null = null;
    let lowestLoad = Infinity;

    for (const worker of this.workers.values()) {
      if (worker.status === "offline") continue;
      if (worker.activeJobs >= worker.maxConcurrency) continue;

      // Calculate load score (lower is better)
      const loadScore = worker.activeJobs / worker.maxConcurrency + worker.avgDurationMs / 10000;

      if (loadScore < lowestLoad) {
        lowestLoad = loadScore;
        bestWorker = worker;
      }
    }

    return bestWorker;
  }

  /**
   * Assign task to specific worker
   */
  private async assignTaskToWorker(task: WorkerTask, worker: WorkerNode) {
    task.assignedTo = worker.id;
    task.startTime = Date.now();

    worker.activeJobs++;
    worker.status = worker.activeJobs >= worker.maxConcurrency ? "busy" : "idle";

    this.emit("task:assigned", task, worker);

    try {
      // Send task to worker (simulated - would be HTTP request in production)
      const result = await this.executeTaskOnWorker(task, worker);

      // Task completed
      const duration = Date.now() - task.startTime!;
      worker.activeJobs--;
      worker.totalProcessed++;
      worker.avgDurationMs =
        (worker.avgDurationMs * (worker.totalProcessed - 1) + duration) / worker.totalProcessed;
      worker.status = worker.activeJobs === 0 ? "idle" : worker.status;

      this.tasks.delete(task.id);
      this.emit("task:completed", task, result);

      // Assign more tasks if available
      await this.assignTasks();
    } catch (error: any) {
      // Task failed
      worker.activeJobs--;
      worker.totalFailed++;
      worker.status = worker.activeJobs === 0 ? "idle" : worker.status;

      task.retries++;

      if (task.retries < 3) {
        // Retry
        this.pendingTasks.unshift(task);
        this.emit("task:retry", task);
        await this.assignTasks();
      } else {
        // Give up
        this.tasks.delete(task.id);
        this.emit("task:failed", task, error);
      }
    }
  }

  /**
   * Execute task on worker (simulated)
   */
  private async executeTaskOnWorker(task: WorkerTask, worker: WorkerNode): Promise<ProofResult> {
    // In production, this would make an HTTP request to the worker
    // For now, simulate with a delay
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error("Simulated worker failure");
    }

    return {
      proof: Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000)),
      publicInputs: [750000],
      hash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      fusedOpinion: {
        belief: 0.7,
        disbelief: 0.2,
        uncertainty: 0.1,
        base_rate: 0.5,
      },
    };
  }

  /**
   * Reassign tasks from a failed worker
   */
  private reassignWorkerTasks(workerId: string) {
    for (const task of this.tasks.values()) {
      if (task.assignedTo === workerId) {
        task.assignedTo = undefined;
        task.startTime = undefined;
        this.pendingTasks.unshift(task);
      }
    }

    this.sortPendingTasks();
    this.assignTasks();
  }

  /**
   * Sort pending tasks by priority
   */
  private sortPendingTasks() {
    this.pendingTasks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if we need to scale up or down
   */
  private checkScaling() {
    const activeWorkers = Array.from(this.workers.values()).filter(
      (w) => w.status !== "offline"
    ).length;

    if (activeWorkers === 0) return;

    const busyWorkers = Array.from(this.workers.values()).filter((w) => w.status === "busy").length;
    const utilization = busyWorkers / activeWorkers;

    if (utilization >= this.scaleUpThreshold && activeWorkers < this.maxWorkers) {
      this.emit("scaling:up", { current: activeWorkers, target: activeWorkers + 1 });
      console.log(`High utilization (${(utilization * 100).toFixed(1)}%). Consider scaling up.`);
    } else if (utilization <= this.scaleDownThreshold && activeWorkers > this.minWorkers) {
      this.emit("scaling:down", { current: activeWorkers, target: activeWorkers - 1 });
      console.log(`Low utilization (${(utilization * 100).toFixed(1)}%). Consider scaling down.`);
    }
  }

  /**
   * Start heartbeat monitor
   */
  private startHeartbeatMonitor() {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();

      for (const worker of this.workers.values()) {
        if (now - worker.lastHeartbeat > this.heartbeatInterval * 2) {
          if (worker.status !== "offline") {
            worker.status = "offline";
            this.emit("worker:offline", worker);
            console.log(`Worker ${worker.id} went offline`);
            this.reassignWorkerTasks(worker.id);
          }
        }
      }
    }, this.heartbeatInterval);
  }

  /**
   * Update worker heartbeat
   */
  updateWorkerHeartbeat(id: string) {
    const worker = this.workers.get(id);
    if (worker) {
      worker.lastHeartbeat = Date.now();
      if (worker.status === "offline") {
        worker.status = "idle";
        this.emit("worker:online", worker);
        console.log(`Worker ${worker.id} came back online`);
      }
    }
  }

  /**
   * Get worker pool statistics
   */
  getStats() {
    const workers = Array.from(this.workers.values());
    const activeWorkers = workers.filter((w) => w.status !== "offline");

    return {
      totalWorkers: workers.length,
      activeWorkers: activeWorkers.length,
      idleWorkers: workers.filter((w) => w.status === "idle").length,
      busyWorkers: workers.filter((w) => w.status === "busy").length,
      offlineWorkers: workers.filter((w) => w.status === "offline").length,
      pendingTasks: this.pendingTasks.length,
      activeTasks: this.tasks.size - this.pendingTasks.length,
      totalProcessed: workers.reduce((sum, w) => sum + w.totalProcessed, 0),
      totalFailed: workers.reduce((sum, w) => sum + w.totalFailed, 0),
      avgDurationMs:
        workers.reduce((sum, w) => sum + w.avgDurationMs, 0) / Math.max(workers.length, 1),
    };
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.workers.clear();
    this.tasks.clear();
    this.pendingTasks = [];
    this.removeAllListeners();
  }
}

/**
 * Singleton instance
 */
export const workerPool = new WorkerPoolManager();
