import {
  SimulationProgress,
  SimulationRequest,
  SimulationResult,
} from "../types/simulation";
import { buildForeverRequestJson } from "../lib/requestBuilder";

type WasmModule = {
  default: () => Promise<unknown>;
  engine_info_json: () => string;
  simulate_prepared_json: (json: string) => string;
  prepare_and_simulate_request_json: (rawRequest: string, scenario: string) => string;
};

interface WorkerGlobal {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent) => void) | null;
}

const workerSelf = self as unknown as WorkerGlobal;
let wasmMod: WasmModule | null = null;

function postProgress(payload: SimulationProgress) {
  workerSelf.postMessage({ type: "progress", payload });
}

function postResult(payload: SimulationResult) {
  workerSelf.postMessage({ type: "result", payload });
}

async function loadWasm(): Promise<WasmModule> {
  if (wasmMod) return wasmMod;
  const mod = (await import("../wasm/foreverbots_wasm.js")) as unknown as WasmModule;
  await mod.default();
  wasmMod = mod;
  return mod;
}

workerSelf.onmessage = async (event: MessageEvent) => {
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

    const preparedOverride = req.options.preparedJsonOverride?.trim();
    let rawInput: string;
    let rawOutput: string;

    if (preparedOverride) {
      rawInput = preparedOverride;
      postProgress({
        jobId: req.jobId,
        phase: "checking",
        progress: 0.45,
        message: "Running MythicSim Forever coverage gate and simulation...",
      });
      rawOutput = mod.simulate_prepared_json(preparedOverride);
    } else {
      postProgress({
        jobId: req.jobId,
        phase: "preparing",
        progress: 0.35,
        message: "Preparing WoW Forever character via forever-engine::prepare()...",
      });
      rawInput = buildForeverRequestJson(req.profile, req.options);
      postProgress({
        jobId: req.jobId,
        phase: "simulating",
        progress: 0.6,
        message: "Running coverage gate and fight iterations in WASM...",
      });
      rawOutput = mod.prepare_and_simulate_request_json(
        rawInput,
        `foreverbots-${req.profile.className || "char"}`
      );
    }

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
        rawInput,
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

    const dpsObj =
      parsed.report?.result?.raidMetrics?.dps ??
      parsed.report?.result?.dps;
    const dps = typeof dpsObj?.avg === "number" ? dpsObj.avg : undefined;

    postResult({
      jobId: req.jobId,
      ok: true,
      dps,
      statistics: {
        mean: dps ?? 0,
        stdDev: dpsObj?.stdev,
        min: dpsObj?.min,
        max: dpsObj?.max,
      },
      warnings: [],
      errors: [],
      rawInput,
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
