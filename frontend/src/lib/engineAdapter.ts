import {
  SimulationProgress,
  SimulationRequest,
  SimulationResult,
} from "../types/simulation";

export class SimulationRunner {
  private worker: Worker | null = null;
  private timeoutHandle: number | null = null;

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL("../workers/simulation.worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    return this.worker;
  }

  public cancel(): void {
    if (this.timeoutHandle) {
      window.clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
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
    const worker = this.ensureWorker();

    return new Promise((resolve) => {
      this.timeoutHandle = window.setTimeout(() => {
        this.cancel();
        resolve({
          jobId: request.jobId,
          ok: false,
          statistics: { mean: 0 },
          warnings: [],
          errors: [
            {
              code: "timeout",
              message: `Simulation timed out after ${Math.round(timeoutMs / 1000)}s.`,
            },
          ],
          rawInput: request.options.preparedJsonOverride ?? request.profile.rawText,
          rawOutput: "",
          engineVersion: "unknown",
          durationMs: timeoutMs,
        });
      }, timeoutMs);

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg.type === "progress") {
          onProgress(msg.payload as SimulationProgress);
        } else if (msg.type === "result") {
          if (this.timeoutHandle) window.clearTimeout(this.timeoutHandle);
          resolve(msg.payload as SimulationResult);
        }
      };

      worker.onerror = (err) => {
        if (this.timeoutHandle) window.clearTimeout(this.timeoutHandle);
        this.cancel();
        resolve({
          jobId: request.jobId,
          ok: false,
          statistics: { mean: 0 },
          warnings: [],
          errors: [
            {
              code: "worker_crash",
              message: `Web Worker crashed: ${err.message || "Unknown error"}. Worker has been reset.`,
            },
          ],
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
    onProgress({
      jobId: request.jobId,
      phase: "simulating",
      progress: 0.3,
      message: "Submitting job to remote MythicSim-compatible API...",
    });
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
          jobId: request.jobId,
          ok: false,
          statistics: { mean: 0 },
          warnings: [],
          errors: [
            {
              code: `http_${resp.status}`,
              message: `Remote engine returned HTTP ${resp.status}.`,
            },
          ],
          rawInput: JSON.stringify(request),
          rawOutput: text,
          engineVersion: "remote",
          durationMs: Math.round(performance.now() - started),
        };
      }
      const data = JSON.parse(text) as SimulationResult;
      onProgress({ jobId: request.jobId, phase: "complete", progress: 1 });
      return data;
    } catch (e) {
      return {
        jobId: request.jobId,
        ok: false,
        statistics: { mean: 0 },
        warnings: [],
        errors: [
          {
            code: "network_error",
            message: `Remote engine request failed: ${String(e)}`,
          },
        ],
        rawInput: JSON.stringify(request),
        rawOutput: "",
        engineVersion: "remote",
        durationMs: Math.round(performance.now() - started),
      };
    }
  }
}

export const simulationRunner = new SimulationRunner();
