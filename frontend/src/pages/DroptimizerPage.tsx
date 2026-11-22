import { useMemo, useState } from "react";
import SimcImporter from "../components/SimcImporter";
import ForeverItemLink from "../components/ForeverItemLink";
import { simulationRunner } from "../lib/engineAdapter";
import { buildForeverRequestJson } from "../lib/requestBuilder";
import {
  foreverDungeonSources,
  type ForeverDungeonItem,
} from "../data/foreverDungeonSources";
import {
  simulationSlotsForForeverSlot,
  type SimulationSlot,
} from "../data/foreverSlotMapping";
import { ParsedSimcProfile } from "../types/simulation";

interface Candidate {
  key: string;
  item: ForeverDungeonItem;
  targetSlot: SimulationSlot;
}

interface ResultRow {
  candidate: Candidate;
  dps?: number;
  delta?: number;
  gainPct?: number;
  error?: string;
}

const baseOptions = {
  fightStyle: "Patchwerk" as const,
  durationSeconds: 180,
  durationVariancePct: 20,
  targetCount: 1,
  iterations: 500,
  latencyMs: 100,
  seed: 42,
};

export default function DroptimizerPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [dungeon, setDungeon] = useState("");
  const [selected, setSelected] = useState<Record<string, SimulationSlot>>({});
  const [manualLines, setManualLines] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);

  const dungeons = useMemo(
    () => [...new Set(foreverDungeonSources.map((item) => item.dungeon))],
    [],
  );

  const items = useMemo(
    () =>
      foreverDungeonSources.filter((item) => item.dungeon === dungeon),
    [dungeon],
  );

  const toggleItem = (item: ForeverDungeonItem) => {
    const choices = simulationSlotsForForeverSlot(item.slot);

    setSelected((previous) => {
      const next = { ...previous };
      const key = String(item.id);

      if (next[key]) {
        delete next[key];
      } else if (choices.length === 1) {
        next[key] = choices[0];
      }

      return next;
    });
  };

  const buildCandidates = (): Candidate[] => {
    const candidates: Candidate[] = [];

    for (const item of items) {
      const targetSlot = selected[String(item.id)];

      if (!targetSlot) {
        continue;
      }

      candidates.push({ key: String(item.id), item, targetSlot });
    }

    for (const line of manualLines.split("\n")) {
      const [slot, rawId] = line.trim().split("=");
      const itemId = Number(rawId);

      if (!slot || !Number.isInteger(itemId) || itemId <= 0) {
        continue;
      }

      const item = foreverDungeonSources.find(
        (source) => source.id === itemId,
      );

      candidates.push({
        key: `manual-${itemId}`,
        item:
          item ?? {
            id: itemId,
            name: `Item #${itemId}`,
            dungeon: "Manual",
            boss: null,
            slot,
            sourceUrl: "",
          },
        targetSlot: slot as SimulationSlot,
      });
    }

    return candidates;
  };

  const runDroptimizer = async () => {
    if (!profile || running) {
      return;
    }

    const candidates = buildCandidates();

    if (candidates.length === 0) {
      return;
    }

    setRunning(true);
    setResults([]);

    const baseResult = await simulationRunner.run(
      { jobId: crypto.randomUUID(), profile, options: baseOptions },
      () => {},
    );
    const baseDps = baseResult.ok ? baseResult.dps : undefined;
    const rows: ResultRow[] = [];

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      setProgress(`Evaluating ${index + 1} of ${candidates.length}`);

      const swappedProfile: ParsedSimcProfile = {
        ...profile,
        gear: [
          ...profile.gear.filter(
            (gear) => gear.slot !== candidate.targetSlot,
          ),
          {
            slot: candidate.targetSlot,
            itemId: candidate.item.id,
            raw: `id=${candidate.item.id}`,
            line: 0,
          },
        ],
      };

      buildForeverRequestJson(swappedProfile, baseOptions);

      const result = await simulationRunner.run(
        {
          jobId: crypto.randomUUID(),
          profile: swappedProfile,
          options: baseOptions,
        },
        () => {},
      );

      const dps = result.ok ? result.dps : undefined;
      const delta =
        dps !== undefined && baseDps !== undefined ? dps - baseDps : undefined;

      rows.push({
        candidate,
        dps,
        delta,
        gainPct:
          delta !== undefined && baseDps
            ? (100 * delta) / baseDps
            : undefined,
        error: result.ok ? undefined : result.errors[0]?.message,
      });

      setResults([...rows]);
    }

    setProgress("");
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Droptimizer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Evaluate verified WoW Forever dungeon drops against your equipped profile.
        </p>
      </div>

      <SimcImporter onParsed={setProfile} />

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-4">
        <h2 className="text-base font-semibold">Forever Dungeon Candidates</h2>

        <select
          value={dungeon}
          onChange={(event) => {
            setDungeon(event.target.value);
            setSelected({});
          }}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-3 py-2 text-sm"
        >
          <option value="">Select a verified Forever dungeon</option>
          {dungeons.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {items.map((item) => {
          const choices = simulationSlotsForForeverSlot(item.slot);
          const chosen = selected[String(item.id)];

          return (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 py-2 border-b border-slate-800/50"
            >
              <input
                type="checkbox"
                checked={Boolean(chosen)}
                onChange={() => toggleItem(item)}
              />
              <ForeverItemLink itemId={item.id} name={item.name} />
              <span className="text-xs text-slate-500">{item.slot}</span>

              {choices.length > 1 && (
                <select
                  value={chosen ?? ""}
                  onChange={(event) =>
                    setSelected((previous) => ({
                      ...previous,
                      [String(item.id)]: event.target.value as SimulationSlot,
                    }))
                  }
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2 py-1 text-xs"
                >
                  <option value="">Choose slot</option>
                  {choices.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}

        <details>
          <summary className="cursor-pointer text-xs text-slate-500">
            Advanced: manual slot=itemId
          </summary>
          <textarea
            value={manualLines}
            onChange={(event) => setManualLines(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 p-3 font-mono text-xs"
          />
        </details>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!profile || running}
            onClick={runDroptimizer}
            className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-50"
          >
            {running ? "Evaluating..." : "Run Droptimizer"}
          </button>
          {running && (
            <span className="text-xs text-slate-500">{progress}</span>
          )}
        </div>
      </section>

      {results.length > 0 && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 border-b border-slate-800">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">Dungeon</th>
                <th className="py-2">Target Slot</th>
                <th className="py-2">DPS</th>
                <th className="py-2">Gain</th>
                <th className="py-2">Gain %</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr
                  key={row.candidate.key}
                  className="border-b border-slate-800/50"
                >
                  <td className="py-2">
                    <ForeverItemLink
                      itemId={row.candidate.item.id}
                      name={row.candidate.item.name}
                    />
                  </td>
                  <td className="py-2">{row.candidate.item.dungeon}</td>
                  <td className="py-2">{row.candidate.targetSlot}</td>
                  <td className="py-2 font-mono">
                    {row.dps !== undefined ? row.dps.toFixed(1) : "—"}
                  </td>
                  <td className="py-2 font-mono">
                    {row.delta !== undefined
                      ? `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(1)}`
                      : "—"}
                  </td>
                  <td className="py-2 font-mono">
                    {row.gainPct !== undefined
                      ? `${row.gainPct >= 0 ? "+" : ""}${row.gainPct.toFixed(2)}%`
                      : "—"}
                  </td>
                  <td className="py-2 text-xs text-rose-400">
                    {row.error ?? "OK"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
