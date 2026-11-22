import { useState } from "react";
import ReportView from "../components/ReportView";
import { simulationRunner } from "../lib/engineAdapter";
import { loadAdvancedDraft, saveAdvancedDraft } from "../lib/storage";
import { SimulationProgress, SimulationResult } from "../types/simulation";

export default function AdvancedSimPage() {
  const [rawJson, setRawJson] = useState(() => loadAdvancedDraft());
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleChange = (val: string) => {
    setRawJson(val);
    saveAdvancedDraft(val);
  };

  const handleRun = async () => {
    const jobId = crypto.randomUUID();
    setResult(null);
    const res = await simulationRunner.run(
      {
        jobId,
        profile: {
          characterName: "Advanced",
          className: "mage",
          spec: "frost",
          level: 60,
          race: "gnome",
          gear: [],
          rawText: rawJson,
          status: "supported",
          issues: [],
        },
        options: {
          fightStyle: "Patchwerk",
          durationSeconds: 180,
          durationVariancePct: 20,
          targetCount: 1,
          iterations: 1000,
          latencyMs: 50,
          seed: 1,
          preparedJsonOverride: rawJson,
        },
      },
      setProgress
    );
    setResult(res);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Advanced Sim</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paste a MythicSim Forever <code>prepared_v2</code> JSON payload to run directly against the
          compiled Rust/WASM coverage gate and simulator.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-4">
        <textarea
          value={rawJson}
          onChange={(e) => handleChange(e.target.value)}
          rows={14}
          placeholder="Paste prepared_v2 JSON here (e.g., from mythicsim-forever-engine/fixtures/...)"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/70"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!rawJson.trim()}
            onClick={handleRun}
            className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors"
          >
            Run Prepared JSON in WASM
          </button>
          {progress && (
            <span className="text-xs text-slate-400">
              {progress.phase}: {progress.message}
            </span>
          )}
        </div>
      </div>

      {result && <ReportView result={result} />}
    </div>
  );
}
