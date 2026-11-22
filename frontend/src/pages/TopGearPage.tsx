import { useState } from "react";
import SimcImporter from "../components/SimcImporter";
import { simulationRunner } from "../lib/engineAdapter";
import { buildForeverRequestJson } from "../lib/requestBuilder";
import { ParsedSimcProfile } from "../types/simulation";

interface CandidateRow {
  id: string;
  slot: string;
  itemId: number;
  label: string;
}

interface RankedResult {
  label: string;
  dps?: number;
  delta?: number;
  error?: string;
}

export default function TopGearPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([
    { id: "1", slot: "main_hand", itemId: 19356, label: "Staff of the Shadow Flame (19356)" },
  ]);
  const [newSlot, setNewSlot] = useState("head");
  const [newItemId, setNewItemId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RankedResult[]>([]);

  const addCandidate = () => {
    const parsedId = Number(newItemId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) return;
    setCandidates((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        slot: newSlot,
        itemId: parsedId,
        label: newLabel.trim() || `${newSlot} #${parsedId}`,
      },
    ]);
    setNewItemId("");
    setNewLabel("");
  };

  const runTopGear = async () => {
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
    const rows: RankedResult[] = [
      {
        label: "Equipped Baseline",
        dps: baseDps,
        delta: 0,
        error: baseRes.ok ? undefined : baseRes.errors[0]?.message,
      },
    ];

    for (const cand of candidates) {
      const customProfile: ParsedSimcProfile = {
        ...profile,
        gear: [
          ...profile.gear.filter((g) => g.slot !== cand.slot),
          { slot: cand.slot, itemId: cand.itemId, raw: `id=${cand.itemId}`, line: 0 },
        ],
      };
      // Validate request builds cleanly before running
      buildForeverRequestJson(customProfile, opts);
      const res = await simulationRunner.run(
        { jobId: crypto.randomUUID(), profile: customProfile, options: opts },
        () => {}
      );
      rows.push({
        label: cand.label,
        dps: res.ok ? res.dps : undefined,
        delta:
          res.ok && res.dps !== undefined && baseDps !== undefined
            ? res.dps - baseDps
            : undefined,
        error: res.ok ? undefined : res.errors[0]?.message,
      });
    }

    rows.sort((a, b) => (b.dps ?? -1) - (a.dps ?? -1));
    setResults(rows);
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Top Gear</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Test candidate gear swaps against your equipped profile using the MythicSim Forever WASM engine.
        </p>
      </div>

      <SimcImporter onParsed={setProfile} />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h2 className="text-base font-semibold">Candidate Items</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs space-y-1">
            <span className="block text-slate-500">Slot</span>
            <select
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-sm"
            >
              {["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet", "finger1", "finger2", "trinket1", "trinket2", "main_hand", "off_hand", "ranged"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="block text-slate-500">Item ID</span>
            <input
              type="number"
              value={newItemId}
              onChange={(e) => setNewItemId(e.target.value)}
              placeholder="e.g. 19356"
              className="w-32 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="block text-slate-500">Label (optional)</span>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Item name"
              className="w-48 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={addCandidate}
            className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-sm font-medium"
          >
            Add Item
          </button>
        </div>

        <ul className="text-xs space-y-1 text-slate-400">
          {candidates.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-1 border-b border-slate-800/50">
              <span>{c.label} — slot: {c.slot}, id: {c.itemId}</span>
              <button
                type="button"
                onClick={() => setCandidates((prev) => prev.filter((x) => x.id !== c.id))}
                className="text-rose-400 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          disabled={!profile || profile.status === "unparseable" || running}
          onClick={runTopGear}
          className="px-4 py-2 rounded-md bg-arcane-600 text-white text-sm font-medium hover:bg-arcane-500 disabled:opacity-50"
        >
          {running ? "Simulating Combinations..." : "Run Top Gear"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 border-b border-slate-800">
              <tr>
                <th className="py-2">Loadout</th>
                <th className="py-2">Average DPS</th>
                <th className="py-2">Delta vs Baseline</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="py-2 font-medium">{r.label}</td>
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
