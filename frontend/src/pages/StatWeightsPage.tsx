import { useState } from "react";
import SimcImporter from "../components/SimcImporter";
import ReportView from "../components/ReportView";
import { simulationRunner } from "../lib/engineAdapter";
import { ParsedSimcProfile, SimulationResult } from "../types/simulation";

export default function StatWeightsPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [running, setRunning] = useState(false);
  const [baseline, setBaseline] = useState<SimulationResult | null>(null);

  const runBaseline = async () => {
    if (!profile) return;
    setRunning(true);
    const res = await simulationRunner.run(
      {
        jobId: crypto.randomUUID(),
        profile,
        options: {
          fightStyle: "Patchwerk",
          durationSeconds: 180,
          durationVariancePct: 20,
          targetCount: 1,
          iterations: 1000,
          latencyMs: 100,
          seed: 42,
        },
      },
      () => {}
    );
    setBaseline(res);
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stat Weights</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Direct gear simulations (Top Gear / Gear Compare) are more reliable than linear stat weights.
        </p>
      </div>

      <SimcImporter onParsed={setProfile} />

      <button
        type="button"
        disabled={!profile || profile.status === "unparseable" || running}
        onClick={runBaseline}
        className="px-4 py-2 rounded-md bg-arcane-600 text-white text-sm font-medium hover:bg-arcane-500 disabled:opacity-50"
      >
        {running ? "Running Baseline..." : "Run Baseline Check"}
      </button>

      {baseline && <ReportView result={baseline} />}
    </div>
  );
}
