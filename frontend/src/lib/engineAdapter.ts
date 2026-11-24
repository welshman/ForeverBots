import {
  SimulationProgress,
  SimulationRequest,
  SimulationResult,
} from "../types/simulation";

export class SimulationRunner {
  private worker: Worker | null = null;
  private timeoutHandle: number | null = null;
  private activeJobId: string | null = null;
  private pendingCancel: (() => void) | null = null;
  private retryCount = 0;
  private maxRetries = 2;

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL("../workers/simulation.worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    return this.worker;
  }

  public get isRunning(): boolean {
    return this.activeJobId !== null;
  }

  private cancelledResult(request: SimulationRequest, durationMs = 0): SimulationResult {
    return {
      jobId: request.jobId,
      ok: false,
      statistics: { mean: 0 },
      warnings: [],
      errors: [{ code: "cancelled", message: "Simulation was cancelled or replaced by a newer run." }],
      rawInput: request.options.preparedJsonOverride ?? request.profile.rawText,
      rawOutput: "",
      engineVersion: "unknown",
      durationMs,
    };
  }

  public cancel(): void {
    if (this.timeoutHandle) {
      window.clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    this.activeJobId = null;
    this.retryCount = 0;
    const resolveCancelled = this.pendingCancel;
    this.pendingCancel = null;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    resolveCancelled?.();
  }

  public run(
    request: SimulationRequest,
    onProgress: (p: SimulationProgress) => void,
    timeoutMs = 60_000
  ): Promise<SimulationResult> {
    const mode = import.meta.env.VITE_SIMULATION_MODE ?? "wasm";
    if (mode === "remote" && import.meta.env.VITE_REMOTE_ENGINE_URL) {
      return this.runRemote(request, onProgress);
    }

    this.cancel();
    this.activeJobId = request.jobId;
    const worker = this.ensureWorker();

    return new Promise((resolve) => {
      this.pendingCancel = () => resolve(this.cancelledResult(request));

      this.timeoutHandle = window.setTimeout(() => {
        const wasActive = this.activeJobId === request.jobId;
        this.pendingCancel = null;
        this.cancel();
        resolve({
          jobId: request.jobId,
          ok: false,
          statistics: { mean: 0 },
          warnings: [],
          errors: [{
            code: wasActive ? "timeout" : "cancelled",
            message: wasActive ? `Simulation timed out after ${Math.round(timeoutMs / 1000)}s.` : "Simulation was cancelled or replaced by a newer run.",
          }],
          rawInput: request.options.preparedJsonOverride ?? request.profile.rawText,
          rawOutput: "",
          engineVersion: "unknown",
          durationMs: timeoutMs,
        });
      }, timeoutMs);

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (this.activeJobId !== request.jobId) return;
        if (msg.type === "progress") {
          onProgress(msg.payload as SimulationProgress);
        } else if (msg.type === "result") {
          if (this.timeoutHandle) window.clearTimeout(this.timeoutHandle);
          this.timeoutHandle = null;
          this.activeJobId = null;
          this.retryCount = 0;
          this.pendingCancel = null;
          resolve(msg.payload as SimulationResult);
        }
      };

      worker.onerror = (err) => {
        if (this.activeJobId !== request.jobId) return;
        if (this.timeoutHandle) window.clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;
        this.activeJobId = null;
        this.pendingCancel = null;
        this.cancel();
        if (this.retryCount < this.maxRetries) {
          this.retryCount += 1;
          const delay = 500 * this.retryCount;
          window.setTimeout(() => {
            resolve(this.run(request, onProgress, timeoutMs));
          }, delay);
          return;
        }
        resolve({
          jobId: request.jobId,
          ok: false,
          statistics: { mean: 0 },
          warnings: [],
          errors: [{ code: "worker_crash", message: `Web Worker crashed after ${this.maxRetries} retries: ${err.message || "Unknown error"}.` }],
          rawInput: request.options.preparedJsonOverride ?? request.profile.rawText,
          rawOutput: "",
          engineVersion: "unknown",
          durationMs: 0,
        });
      };

      worker.postMessage({ type: "run", payload: request });
    });
  }

  private async runRemote(
    request: SimulationRequest,
    onProgress: (p: SimulationProgress) => void
  ): Promise<SimulationResult> {
    const baseUrl = import.meta.env.VITE_REMOTE_ENGINE_URL as string;
    onProgress({ jobId: request.jobId, phase: "simulating", progress: 0.3, message: "Submitting job to remote MythicSim-compatible API..." });
    const started = performance.now();
    try {
      const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const text = await resp.text();
      if (!resp.ok) {
        return {
          jobId: request.jobId, ok: false, statistics: { mean: 0 }, warnings: [],
          errors: [{ code: `http_${resp.status}`, message: `Remote engine returned HTTP ${resp.status}.` }],
          rawInput: JSON.stringify(request), rawOutput: text, engineVersion: "remote", durationMs: Math.round(performance.now() - started),
        };
      }
      let data: SimulationResult;
      try {
        data = JSON.parse(text) as SimulationResult;
      } catch {
        return {
          jobId: request.jobId, ok: false, statistics: { mean: 0 }, warnings: [],
          errors: [{ code: "invalid_remote_response", message: "Remote engine returned a response that could not be parsed as JSON." }],
          rawInput: JSON.stringify(request), rawOutput: text, engineVersion: "remote", durationMs: Math.round(performance.now() - started),
        };
      }
      onProgress({ jobId: request.jobId, phase: "complete", progress: 1 });
      return data;
    } catch (e) {
      return {
        jobId: request.jobId, ok: false, statistics: { mean: 0 }, warnings: [],
        errors: [{ code: "network_error", message: `Remote engine request failed: ${String(e)}` }],
        rawInput: JSON.stringify(request), rawOutput: "", engineVersion: "remote", durationMs: Math.round(performance.now() - started),
      };
    }
  }
}

export const simulationRunner = new SimulationRunner();
