import { useEffect, useState } from "react";
import SimcImporter from "../components/SimcImporter";
import ReportView from "../components/ReportView";
import { simulationRunner } from "../lib/engineAdapter";
import { appendHistory, loadHistory } from "../lib/storage";
import {
  ParsedSimcProfile,
  SimulationProgress,
  SimulationResult,
} from "../types/simulation";

const DURATION_PRESETS = [60, 180, 300] as const;
const ITERATION_PRESETS = [500, 1000, 5000] as const;
const OPTS_KEY = "foreverbots:quicksim_opts:v1";

const PHASE_WIDTH: Record<SimulationProgress["phase"], string> = {
  parsing: "15%",
  "loading-assets": "30%",
  preparing: "45%",
  checking: "60%",
  simulating: "80%",
  complete: "100%",
  failed: "100%",
  cancelled: "100%",
};

function loadSavedOpts(): { duration: number; iterations: number } {
  try {
    const raw = localStorage.getItem(OPTS_KEY);
    if (!raw) return { duration: 180, iterations: 1000 };
    const parsed = JSON.parse(raw) as { duration?: number; iterations?: number };
    return {
      duration:
        typeof parsed.duration === "number" && parsed.duration >= 1 && parsed.duration <= 600
          ? parsed.duration
          : 180,
      iterations:
        typeof parsed.iterations === "number" && parsed.iterations >= 1 && parsed.iterations <= 10000
          ? parsed.iterations
          : 1000,
    };
  } catch {
    return { duration: 180, iterations: 1000 };
  }
}

export default function QuickSimPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [duration, setDuration] = useState(() => loadSavedOpts().duration);
  const [iterations, setIterations] = useState(() => loadSavedOpts().iterations);
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>(() => loadHistory());

  useEffect(() => {
    try {
      localStorage.setItem(OPTS_KEY, JSON.stringify({ duration, iterations }));
    } catch {
      /* ignore storage errors */
    }
  }, [duration, iterations]);

  const isRunning = Boolean(
    progress &&
      progress.phase !== "complete" &&
      progress.phase !== "failed" &&
      progress.phase !== "cancelled"
  );

  const handleRun = async () => {
    if (!profile || profile.status === "unparseable" || isRunning) return;
    const jobId = crypto.randomUUID();
    setResult(null);
    const res = await simulationRunner.run(
      {
        jobId,
        profile,
        options: {
          fightStyle: "Patchwerk",
          durationSeconds: duration,
          durationVariancePct: 20,
          targetCount: 1,
          iterations,
          latencyMs: 50,
          seed: 1,
        },
      },
      setProgress
    );
    setResult(res);
    appendHistory(res);
    setHistory(loadHistory());
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const clearHistory = () => {
    localStorage.removeItem("foreverbots:history:v1");
    setHistory([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quick Sim</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Patchwerk single-target simulation executed in a dedicated Web Worker.
        </p>
      </div>

      <SimcImporter onParsed={setProfile} />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 flex flex-wrap items-end gap-5">
        <div className="space-y-1.5">
          <label className="text-xs block text-slate-500 dark:text-slate-400">Fight Length (s)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-24 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/70"
            />
            <div className="flex gap-1">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDuration(preset)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    duration === preset
                      ? "border-gold-500/60 bg-gold-500/15 text-gold-400"
                      : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-gold-500/40"
                  }`}
                >
                  {preset}s
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs block text-slate-500 dark:text-slate-400">Iterations</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={10000}
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-28 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/70"
            />
            <div className="flex gap-1">
              {ITERATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setIterations(preset)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    iterations === preset
                      ? "border-gold-500/60 bg-gold-500/15 text-gold-400"
                      : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-gold-500/40"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!profile || profile.status === "unparseable" || isRunning}
            onClick={handleRun}
            className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors"
          >
            {isRunning ? "Simulating..." : "Run Quick Sim"}
          </button>
          {isRunning ? (
            <button
              type="button"
              onClick={() => simulationRunner.cancel()}
              className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-500 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
              Ctrl+Enter
            </span>
          )}
        </div>
      </div>

      {progress && (
        <div className="rounded-2xl border border-slate-200 dark:border-gold-500/20 bg-white/85 dark:bg-obsidian-900/85 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-mono uppercase tracking-wider text-gold-400">
              {progress.phase}
            </span>
            <span className="text-slate-500 dark:text-slate-400">{progress.message}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-obsidian-950 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.phase === "failed" || progress.phase === "cancelled"
                  ? "bg-rose-500"
                  : "bg-gold-500"
              }`}
              style={{ width: PHASE_WIDTH[progress.phase] }}
            />
          </div>
        </div>
      )}

      {result && <ReportView result={result} />}

      {history.length > 0 && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Recent Simulations</h2>
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear history
            </button>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/70">
            {history.slice(0, 8).map((item) => {
              const isSelected = result?.jobId === item.jobId;
              const delta =
                result?.ok &&
                result.dps !== undefined &&
                item.ok &&
                item.dps !== undefined &&
                !isSelected
                  ? item.dps - result.dps
                  : null;
              return (
                <button
                  key={item.jobId}
                  type="button"
                  onClick={() => setResult(item)}
                  className={`w-full py-2.5 flex flex-wrap items-center justify-between gap-2 text-left text-xs px-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-gold-500/10 text-gold-400"
                      : "hover:bg-slate-100/60 dark:hover:bg-obsidian-950/60"
                  }`}
                >
                  <span className="font-medium flex items-center gap-2">
                    <span>
                      {item.ok && item.dps !== undefined
                        ? `${item.dps.toLocaleString(undefined, { maximumFractionDigits: 1 })} DPS`
                        : "Failed / Refused"}
                    </span>
                    {delta !== null && (
                      <span
                        className={`font-mono text-[11px] ${
                          delta >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {item.durationMs}ms • {item.engineVersion}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
