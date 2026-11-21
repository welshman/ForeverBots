import {
  SimulationProgress,
  SimulationRequest,
  SimulationResult,
} from "../types/simulation";

type WasmModule = {
  default: () => Promise<unknown>;
  engine_info_json: () => string;
  simulate_prepared_json: (json: string) => string;
};

let wasmMod: WasmModule | null = null;

function postProgress(payload: SimulationProgress) {
  self.postMessage({ type: "progress", payload });
}

function postResult(payload: SimulationResult) {
  self.postMessage({ type: "result", payload });
}

async function loadWasm(): Promise<WasmModule> {
  if (wasmMod) return wasmMod;
  const mod = (await import("../wasm/foreverbots_wasm.js")) as unknown as WasmModule;
  await mod.default();
  wasmMod = mod;
  return mod;
}

self.onmessage = async (event: MessageEvent) => {
  if (event.data?.type !== "run") return;
  const req = event.data.payload as SimulationRequest;
  const started = performance.now();

  try {
    postProgress({
      jobId: req.jobId,
      phase: "loading-assets",
      progress: 0.15,
      message: "Initializing MythicSim Forever WebAssembly module...",
    });

    let mod: WasmModule;
    try {
      mod = await loadWasm();
    } catch (err) {
      postResult({
        jobId: req.jobId,
        ok: false,
        statistics: { mean: 0 },
        warnings: [],
        errors: [
          {
            code: "wasm_init_failed",
            message: `Failed to initialize MythicSim Forever WASM module: ${String(err)}`,
          },
        ],
        rawInput: req.options.preparedJsonOverride ?? req.profile.rawText,
        rawOutput: "",
        engineVersion: "uninitialized",
        durationMs: Math.round(performance.now() - started),
      });
      return;
    }

    const identity = JSON.parse(mod.engine_info_json()) as {
      engine?: string;
      package_version?: string;
    };
    const engineVersion = `${identity.engine ?? "forever-engine"} ${identity.package_version ?? ""}`.trim();

    const preparedJson = req.options.preparedJsonOverride?.trim();
    if (!preparedJson) {
      postProgress({ jobId: req.jobId, phase: "failed", progress: 1 });
      postResult({
        jobId: req.jobId,
        ok: false,
        statistics: { mean: 0 },
        warnings: [],
        errors: [
          {
            code: "prepared_v2_required",
            message:
              "SimC-to-prepared_v2 character preparation is not yet wired in the browser. Use Advanced Sim with a valid MythicSim Forever prepared_v2 JSON payload to run real coverage-gated WASM simulations.",
          },
        ],
        rawInput: req.profile.rawText,
        rawOutput: "",
        engineVersion,
        durationMs: Math.round(performance.now() - started),
      });
      return;
    }

    postProgress({
      jobId: req.jobId,
      phase: "checking",
      progress: 0.45,
      message: "Running MythicSim Forever coverage gate and simulation...",
    });

    const rawOutput = mod.simulate_prepared_json(preparedJson);
    const parsed = JSON.parse(rawOutput);

    if (parsed.status === "refused") {
      const refusalErrors = (parsed.refusals ?? []).map(
        (r: { code?: string; reason?: string }) => ({
          code: r.code ?? "coverage_gate_refusal",
          message: r.reason ?? "Unsupported mechanic refused by coverage gate.",
        })
      );
      postProgress({ jobId: req.jobId, phase: "failed", progress: 1 });
      postResult({
        jobId: req.jobId,
        ok: false,
        statistics: { mean: 0 },
        warnings: [],
        errors: refusalErrors,
        rawInput: preparedJson,
        rawOutput,
        engineVersion,
        durationMs: Math.round(performance.now() - started),
      });
      return;
    }

    postProgress({
      jobId: req.jobId,
      phase: "complete",
      progress: 1,
      message: "Simulation complete.",
    });

    const dps =
      parsed.report?.result?.raidMetrics?.dps?.avg ??
      parsed.report?.result?.dps?.avg;

    postResult({
      jobId: req.jobId,
      ok: true,
      dps: typeof dps === "number" ? dps : undefined,
      statistics: {
        mean: typeof dps === "number" ? dps : 0,
        stdDev: parsed.report?.result?.raidMetrics?.dps?.stdev,
        min: parsed.report?.result?.raidMetrics?.dps?.min,
        max: parsed.report?.result?.raidMetrics?.dps?.max,
      },
      warnings: [],
      errors: [],
      rawInput: preparedJson,
      rawOutput,
      engineVersion,
      durationMs: Math.round(performance.now() - started),
    });
  } catch (err) {
    postProgress({ jobId: req.jobId, phase: "failed", progress: 1 });
    postResult({
      jobId: req.jobId,
      ok: false,
      statistics: { mean: 0 },
      warnings: [],
      errors: [{ code: "engine_error", message: String(err) }],
      rawInput: req.options.preparedJsonOverride ?? req.profile.rawText,
      rawOutput: "",
      engineVersion: "forever-engine",
      durationMs: Math.round(performance.now() - started),
    });
  }
};
