import { useState } from "react";
import SimcImporter from "../components/SimcImporter";
import { simulationRunner } from "../lib/engineAdapter";
import { ParsedSimcProfile, SimulationResult } from "../types/simulation";

export default function GearComparePage() {
  const [profileA, setProfileA] = useState<ParsedSimcProfile | null>(null);
  const [profileB, setProfileB] = useState<ParsedSimcProfile | null>(null);
  const [resA, setResA] = useState<SimulationResult | null>(null);
  const [resB, setResB] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  const runCompare = async () => {
    if (!profileA || !profileB) return;
    setRunning(true);
    const opts = {
      fightStyle: "Patchwerk" as const,
      durationSeconds: 180,
      durationVariancePct: 20,
      targetCount: 1,
      iterations: 1000,
      latencyMs: 100,
      seed: 42,
    };
    const a = await simulationRunner.run(
      { jobId: crypto.randomUUID(), profile: profileA, options: opts },
      () => {}
    );
    const b = await simulationRunner.run(
      { jobId: crypto.randomUUID(), profile: profileB, options: opts },
      () => {}
    );
    setResA(a);
    setResB(b);
    setRunning(false);
  };

  let verdict = "";
  let delta: number | undefined;
  if (resA?.ok && resB?.ok && resA.dps !== undefined && resB.dps !== undefined) {
    delta = resB.dps - resA.dps;
    const se = Math.sqrt(
      ((resA.statistics.stdDev ?? 0) ** 2 + (resB.statistics.stdDev ?? 0) ** 2) / 1000
    );
    if (Math.abs(delta) <= 1.96 * se) {
      verdict = "Statistical tie";
    } else if (delta > 0) {
      verdict = "Likely upgrade";
    } else {
      verdict = "Likely downgrade";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gear Compare</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Compare two WoW Forever /simc profiles side-by-side in WebAssembly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gold-400">Profile A (Baseline)</h2>
          <SimcImporter onParsed={setProfileA} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gold-400">Profile B (Candidate)</h2>
          <SimcImporter onParsed={setProfileB} />
        </div>
      </div>

      <button
        type="button"
        disabled={!profileA || !profileB || running}
        onClick={runCompare}
        className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors"
      >
        {running ? "Comparing Profiles..." : "Compare Profiles"}
      </button>

      {(resA || resB) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-3">
          {verdict && delta !== undefined ? (
            <div className="space-y-1">
              <div className="text-lg font-bold text-gold-400">{verdict}</div>
              <div className="text-sm">
                Profile A: <span className="font-mono">{resA?.dps?.toFixed(1)}</span> DPS • Profile B:{" "}
                <span className="font-mono">{resB?.dps?.toFixed(1)}</span> DPS • Delta:{" "}
                <span className="font-mono">{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</span> DPS
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-400 space-y-1">
              {resA && !resA.ok && <div>Profile A refused/failed: {resA.errors[0]?.message}</div>}
              {resB && !resB.ok && <div>Profile B refused/failed: {resB.errors[0]?.message}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
