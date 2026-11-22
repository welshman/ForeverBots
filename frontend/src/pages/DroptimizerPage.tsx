import { useState } from "react";
import SimcImporter from "../components/SimcImporter";
import { simulationRunner } from "../lib/engineAdapter";
import { ParsedSimcProfile } from "../types/simulation";

interface DropResult {
  slot: string;
  itemId: number;
  dps?: number;
  delta?: number;
  error?: string;
}

export default function DroptimizerPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [candidateLines, setCandidateLines] = useState("main_hand=19356\nneck=18814");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DropResult[]>([]);

  const runDroptimizer = async () => {
    if (!profile) return;
    setRunning(true);
    setResults([]);
    const opts = {
      fightStyle: "Patchwerk" as const,
      durationSeconds: 180,
      durationVariancePct: 20,
      targetCount: 1,
      iterations: 500,
      latencyMs: 100,
      seed: 42,
    };

    const baseRes = await simulationRunner.run(
      { jobId: crypto.randomUUID(), profile, options: opts },
      () => {}
    );
    const baseDps = baseRes.ok ? baseRes.dps : undefined;
    const rows: DropResult[] = [];

    for (const line of candidateLines.split("\n")) {
      const [slot, idStr] = line.trim().split("=");
      const itemId = Number(idStr);
      if (!slot || !Number.isInteger(itemId) || itemId <= 0) continue;

      const swapped: ParsedSimcProfile = {
        ...profile,
        gear: [
          ...profile.gear.filter((g) => g.slot !== slot),
          { slot, itemId, raw: `id=${itemId}`, line: 0 },
        ],
      };
      const res = await simulationRunner.run(
        { jobId: crypto.randomUUID(), profile: swapped, options: opts },
        () => {}
      );
      rows.push({
        slot,
        itemId,
        dps: res.ok ? res.dps : undefined,
        delta:
          res.ok && res.dps !== undefined && baseDps !== undefined
            ? res.dps - baseDps
            : undefined,
        error: res.ok ? undefined : res.errors[0]?.message,
      });
    }

    rows.sort((a, b) => (b.delta ?? -99999) - (a.delta ?? -99999));
    setResults(rows);
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Droptimizer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Evaluate candidate WoW Forever drops (slot=itemId, one per line) against your imported character.
        </p>
      </div>

      <SimcImporter onParsed={setProfile} />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <label className="block text-xs font-medium text-slate-400">
          Candidate Drops (slot=itemId, one per line)
        </label>
        <textarea
          value={candidateLines}
          onChange={(e) => setCandidateLines(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs"
        />
        <button
          type="button"
          disabled={!profile || profile.status === "unparseable" || running}
          onClick={runDroptimizer}
          className="px-4 py-2 rounded-md bg-arcane-600 text-white text-sm font-medium hover:bg-arcane-500 disabled:opacity-50"
        >
          {running ? "Evaluating Drops..." : "Run Droptimizer"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 border-b border-slate-800">
              <tr>
                <th className="py-2">Slot</th>
                <th className="py-2">Item ID</th>
                <th className="py-2">DPS</th>
                <th className="py-2">Gain</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="py-2">{r.slot}</td>
                  <td className="py-2 font-mono">{r.itemId}</td>
                  <td className="py-2 font-mono">{r.dps !== undefined ? r.dps.toFixed(1) : "—"}</td>
                  <td className="py-2 font-mono">
                    {r.delta !== undefined ? `${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(1)}` : "—"}
                  </td>
                  <td className="py-2 text-xs text-rose-400">{r.error ?? "OK"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
