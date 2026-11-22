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

export default function TopGearPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [dungeon, setDungeon] = useState("");
  const [slotFilter, setSlotFilter] = useState("");
  const [selected, setSelected] = useState<Record<string, SimulationSlot>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);

  const dungeons = useMemo(
    () => [...new Set(foreverDungeonSources.map((item) => item.dungeon))],
    [],
  );

  const slots = useMemo(
    () => [...new Set(foreverDungeonSources.map((item) => item.slot))],
    [],
  );

  const items = useMemo(
    () =>
      foreverDungeonSources.filter(
        (item) =>
          (!dungeon || item.dungeon === dungeon) &&
          (!slotFilter || item.slot === slotFilter),
      ),
    [dungeon, slotFilter],
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

  const runTopGear = async () => {
    if (!profile || running) {
      return;
    }

    const candidates: Candidate[] = items
      .filter((item) => selected[String(item.id)])
      .map((item) => ({
        key: String(item.id),
        item,
        targetSlot: selected[String(item.id)],
      }));

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

  const exportCsv = () => {
    const lines = [
      "Item ID,Item,Dungeon,Target Slot,DPS,Gain,Gain %,Status",
      ...results.map((row) =>
        [
          row.candidate.item.id,
          `"${row.candidate.item.name}"`,
          row.candidate.item.dungeon,
          row.candidate.targetSlot,
          row.dps !== undefined ? row.dps.toFixed(1) : "",
          row.delta !== undefined ? row.delta.toFixed(1) : "",
          row.gainPct !== undefined ? row.gainPct.toFixed(2) : "",
          row.error ?? "OK",
        ].join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "foreverbots-top-gear.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Top Gear</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Compare verified WoW Forever dungeon upgrades against your equipped profile.
        </p>
      </div>

      <SimcImporter onParsed={setProfile} />

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <select
            value={dungeon}
            onChange={(event) => {
              setDungeon(event.target.value);
              setSelected({});
            }}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-3 py-2 text-sm"
          >
            <option value="">All verified dungeons</option>
            {dungeons.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={slotFilter}
            onChange={(event) => setSlotFilter(event.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-3 py-2 text-sm"
          >
            <option value="">All slots</option>
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

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
              <span className="text-xs text-slate-500">
                {item.dungeon} • {item.slot}
              </span>

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

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!profile || running}
            onClick={runTopGear}
            className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-50"
          >
            {running ? "Comparing..." : "Run Top Gear"}
          </button>
          {running && (
            <span className="text-xs text-slate-500">{progress}</span>
          )}
          {results.length > 0 && (
            <button
              type="button"
              onClick={exportCsv}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
            >
              Export CSV
            </button>
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
