import { useState } from "react";
import SimcImporter from "../components/SimcImporter";
import ReportView from "../components/ReportView";
import { simulationRunner } from "../lib/engineAdapter";
import { appendHistory } from "../lib/storage";
import {
  ParsedSimcProfile,
  SimulationProgress,
  SimulationResult,
} from "../types/simulation";

export default function QuickSimPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [duration, setDuration] = useState(180);
  const [iterations, setIterations] = useState(1000);
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleRun = async () => {
    if (!profile) return;
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-end gap-4">
        <label className="text-xs space-y-1">
          <span className="block text-slate-500">Fight Length (s)</span>
          <input
            type="number"
            min={1}
            max={600}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-28 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs space-y-1">
          <span className="block text-slate-500">Iterations</span>
          <input
            type="number"
            min={1}
            max={10000}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="w-32 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={!profile || profile.status === "unparseable"}
          onClick={handleRun}
          className="px-4 py-2 rounded-md bg-arcane-600 text-white text-sm font-medium hover:bg-arcane-500 disabled:opacity-50"
        >
          Run Quick Sim
        </button>
        {progress && progress.phase !== "complete" && progress.phase !== "failed" && (
          <button
            type="button"
            onClick={() => simulationRunner.cancel()}
            className="px-3 py-2 rounded-md bg-rose-600 text-white text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      {progress && (
        <div className="text-xs text-slate-400">
          Phase: <span className="font-mono">{progress.phase}</span> — {progress.message}
        </div>
      )}

      {result && <ReportView result={result} />}
    </div>
  );
}
