import { useState } from "react";
import SimcImporter from "../components/SimcImporter";
import ForeverItemLink from "../components/ForeverItemLink";
import GearItemCard, { gearSlotLabel } from "../components/GearItemCard";
import { simulationRunner } from "../lib/engineAdapter";
import { buildForeverRequestJson } from "../lib/requestBuilder";
import { foreverDungeonSources, type ForeverDungeonItem } from "../data/foreverDungeonSources";
import { foreverRaidSources, type ForeverRaidSource } from "../data/foreverRaidSources";
import { simulationSlotsForForeverSlot, type SimulationSlot } from "../data/foreverSlotMapping";
import type { ParsedSimcProfile } from "../types/simulation";

interface Candidate { key: string; item: ForeverDungeonItem; targetSlot: SimulationSlot }
interface ResultRow { candidate: Candidate; dps?: number; delta?: number; gainPct?: number; error?: string }
const baseOptions = { fightStyle: "Patchwerk" as const, durationSeconds: 180, durationVariancePct: 20, targetCount: 1, iterations: 500, latencyMs: 100, seed: 42 };
const panel = "rounded-2xl border border-slate-200 bg-white/85 p-5 dark:border-slate-800 dark:bg-obsidian-900/85";
const control = "rounded-xl border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500 disabled:opacity-50 dark:border-slate-700";
const dungeons = [...new Set(foreverDungeonSources.map((item) => item.dungeon))];
const raids = foreverRaidSources;

export default function DroptimizerPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [sourceType, setSourceType] = useState<"dungeon" | "raid">("dungeon");
  const [dungeon, setDungeon] = useState("");
  const [raid, setRaid] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, SimulationSlot>>({});
  const [manualLines, setManualLines] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [failure, setFailure] = useState("");
  const [baseline, setBaseline] = useState<number | undefined>();
  const activeRaid = raids.find((entry) => entry.name === raid);
  const items = sourceType === "dungeon" ? foreverDungeonSources.filter((item) => item.dungeon === dungeon) : [];
  const visible = items.filter((item) => `${item.name} ${item.boss ?? ""} ${item.slot} ${item.id}`.toLowerCase().includes(query.toLowerCase().trim()));
  const bosses = [...new Set(visible.map((item) => item.boss ?? "Dungeon drops"))];
  const picked = items.filter((item) => selected[String(item.id)]);
  const remove = (id: number) => setSelected((previous) => { const next = { ...previous }; delete next[String(id)]; return next; });

  const buildCandidates = (): Candidate[] => {
    const candidates: Candidate[] = picked.map((item) => ({ key: String(item.id), item, targetSlot: selected[String(item.id)] }));
    for (const [index, line] of manualLines.split("\n").entries()) {
      const [slot, rawId] = line.trim().split("=");
      const itemId = Number(rawId);
      if (!slot || !Number.isInteger(itemId) || itemId <= 0) continue;
      const item = foreverDungeonSources.find((source) => source.id === itemId);
      candidates.push({ key: `manual-${index}-${itemId}`, item: item ?? { id: itemId, name: `Item #${itemId}`, dungeon: "Manual", boss: null, slot, sourceUrl: "" }, targetSlot: slot as SimulationSlot });
    }
    return candidates;
  };
  const count = buildCandidates().length;

  const runDroptimizer = async () => {
    if (!profile || running) return;
    const candidates = buildCandidates();
    if (!candidates.length) return;
    setRunning(true); setResults([]); setFailure(""); setBaseline(undefined); setProgress("Evaluating equipped baseline…");
    try {
      const baseResult = await simulationRunner.run({ jobId: crypto.randomUUID(), profile, options: baseOptions }, () => {});
      const baseDps = baseResult.ok ? baseResult.dps : undefined;
      setBaseline(baseDps);
      if (!baseResult.ok) setFailure("The equipped baseline failed. Candidate DPS may be available, but gains cannot be calculated.");
      const rows: ResultRow[] = [];
      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        setProgress(`Evaluating ${index + 1} of ${candidates.length}`);
        const swappedProfile: ParsedSimcProfile = { ...profile, gear: [...profile.gear.filter((gear) => gear.slot !== candidate.targetSlot), { slot: candidate.targetSlot, itemId: candidate.item.id, raw: `id=${candidate.item.id}`, line: 0 }] };
        buildForeverRequestJson(swappedProfile, baseOptions);
        const result = await simulationRunner.run({ jobId: crypto.randomUUID(), profile: swappedProfile, options: baseOptions }, () => {});
        const dps = result.ok ? result.dps : undefined;
        const delta = dps !== undefined && baseDps !== undefined ? dps - baseDps : undefined;
        rows.push({ candidate, dps, delta, gainPct: delta !== undefined && baseDps ? 100 * delta / baseDps : undefined, error: result.ok ? undefined : result.errors[0]?.message ?? "Simulation failed" });
        setResults([...rows]);
      }
    } catch (error) { setFailure(error instanceof Error ? error.message : "Simulation failed. Please try again."); }
    finally { setProgress(""); setRunning(false); }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2"><h1 className="text-3xl font-bold">Droptimizer</h1><p className="text-sm text-slate-500 dark:text-slate-400">Import your character, choose a dungeon or raid, and compare individual drops against your equipped gear.</p></header>
      <SimcImporter onParsed={setProfile} />
      <section className={`${panel} space-y-4`} aria-labelledby="source-heading">
        <h2 id="source-heading" className="text-lg font-semibold">Choose a source</h2>
        <div className="flex gap-2">
          <button type="button" disabled={running} aria-pressed={sourceType === "dungeon"} onClick={() => { setSourceType("dungeon"); setRaid(""); }} className={`${control} px-4 py-2 ${sourceType === "dungeon" ? "border-gold-500 bg-gold-500/10 ring-1 ring-gold-500" : ""}`}>Dungeons</button>
          <button type="button" disabled={running} aria-pressed={sourceType === "raid"} onClick={() => { setSourceType("raid"); setDungeon(""); setSelected({}); setQuery(""); }} className={`${control} px-4 py-2 ${sourceType === "raid" ? "border-gold-500 bg-gold-500/10 ring-1 ring-gold-500" : ""}`}>Raids</button>
        </div>
        {sourceType === "dungeon" ? (
          <div className="grid gap-3 sm:grid-cols-3">{dungeons.map((name, index) => (
            <button key={name} type="button" disabled={running} aria-pressed={dungeon === name} onClick={() => { setDungeon(name); setSelected({}); setQuery(""); }} className={`${control} space-y-3 p-5 text-left transition-colors ${dungeon === name ? "border-gold-500 bg-gold-500/10 ring-1 ring-gold-500" : "hover:border-gold-500"}`}>
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/30 to-slate-500/10 text-xl font-bold text-gold-500">0{index + 1}</span>
              <span className="block font-semibold">{name}</span><span className="block text-xs text-slate-500 dark:text-slate-400">{foreverDungeonSources.filter((item) => item.dungeon === name).length} catalogue items{dungeon === name ? " · Selected" : ""}</span>
            </button>
          ))}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">{raids.map((entry, index) => (
            <button key={entry.name} type="button" disabled={running} aria-pressed={raid === entry.name} onClick={() => { setRaid(entry.name); setSelected({}); setQuery(""); }} className={`${control} space-y-3 p-5 text-left transition-colors ${raid === entry.name ? "border-gold-500 bg-gold-500/10 ring-1 ring-gold-500" : "hover:border-gold-500"}`}>
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/30 to-slate-500/10 text-xl font-bold text-gold-500">R{index + 1}</span>
              <span className="block font-semibold">{entry.name}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{entry.lootPending ? "Loot table coming soon" : `${entry.items.length} catalogue items`}{raid === entry.name ? " · Selected" : ""}</span>
            </button>
          ))}</div>
        )}
      </section>
      {sourceType === "raid" && activeRaid?.lootPending ? (
        <section className={`${panel} space-y-3`} aria-live="polite">
          <h2 className="text-lg font-semibold">{activeRaid.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loot table coming soon. Forever-specific raid drops will be added after release and verification.</p>
        </section>
      ) : sourceType === "raid" ? (
        <section className={`${panel} space-y-5`} aria-labelledby="raid-drops-heading">
          <h2 id="raid-drops-heading" className="text-lg font-semibold">Choose drops to compare</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Raid loot is not yet available.</p>
        </section>
      ) : (
        <section className={`${panel} space-y-5`} aria-labelledby="drops-heading">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="drops-heading" className="text-lg font-semibold">Choose drops to compare</h2><label className="flex items-center gap-2 text-sm"><span>Search</span><input type="search" value={query} disabled={!dungeon || running} onChange={(event) => setQuery(event.target.value)} placeholder="Item, boss, or slot" className={`${control} min-w-0 bg-transparent`} /></label></div>
          {!dungeon ? <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">Choose a dungeon above to browse its drops.</p> : visible.length === 0 ? <p role="status" className="py-8 text-center text-sm text-slate-500">No matching items. Try another search.</p> : bosses.map((boss) => (
            <section key={boss} className="space-y-3"><h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{boss}</h3><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.filter((item) => (item.boss ?? "Dungeon drops") === boss).map((item) => <GearItemCard key={item.id} item={item} selectedSlot={selected[String(item.id)]} disabled={running} onRemove={() => remove(item.id)} onSelect={(slot) => { if (simulationSlotsForForeverSlot(item.slot).includes(slot)) setSelected((previous) => ({ ...previous, [String(item.id)]: slot })); }} />)}</div></section>
          ))}
          <details><summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400">Advanced: manual slot=itemId</summary><label className="mt-3 block text-xs">One candidate per line<textarea value={manualLines} disabled={running} onChange={(event) => setManualLines(event.target.value)} rows={3} className={`${control} mt-2 w-full bg-transparent font-mono`} /></label></details>
        </section>
      )}
      <section className={`${panel} space-y-4`} aria-label="Selected comparisons">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{count} comparison{count === 1 ? "" : "s"} selected</h2><button type="button" disabled={running || count === 0} onClick={() => { setSelected({}); setManualLines(""); }} className={control}>Clear all</button></div>
        <div className="flex flex-wrap gap-2">{picked.map((item) => <button key={item.id} type="button" disabled={running} onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`} className={`${control} border-gold-500/40 bg-gold-500/10 text-xs`}>{item.name} · {gearSlotLabel(selected[String(item.id)])} ×</button>)}</div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Each candidate replaces one equipped item. This does not test combinations. 500 iterations · 180-second Patchwerk.</p>
        <button type="button" disabled={!profile || running || count === 0} onClick={runDroptimizer} className="rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-obsidian-950 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50">{running ? "Evaluating…" : "Run Droptimizer"}</button>
        {!profile && <p className="text-xs text-slate-500">Import your character to enable comparisons.</p>}<p role="status" className="text-sm text-slate-500">{progress}</p>
        {failure && <p role="alert" className="text-sm text-rose-500">{failure}</p>}
      </section>
      {(results.length > 0 || baseline !== undefined) && <section className={`${panel} space-y-4 overflow-auto`} aria-label="Comparison results"><h2 className="text-lg font-semibold">Results</h2>{baseline !== undefined && <p className="text-sm">Equipped baseline: <strong>{baseline.toFixed(1)} DPS</strong></p>}<table className="w-full text-left text-sm"><thead><tr>{["Item", "Dungeon", "Target slot", "DPS", "Gain", "Gain %", "Status"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-2 py-3">{heading}</th>)}</tr></thead><tbody>{results.map((row) => <tr key={row.candidate.key} className="border-t border-slate-200 dark:border-slate-800"><td className="px-2 py-3"><ForeverItemLink itemId={row.candidate.item.id} name={row.candidate.item.name} /></td><td className="px-2">{row.candidate.item.dungeon}</td><td className="px-2">{gearSlotLabel(row.candidate.targetSlot)}</td><td className="px-2 font-mono">{row.dps?.toFixed(1) ?? "—"}</td><td className="px-2 font-mono">{row.delta !== undefined ? `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(1)}` : "—"}</td><td className="px-2 font-mono">{row.gainPct !== undefined ? `${row.gainPct >= 0 ? "+" : ""}${row.gainPct.toFixed(2)}%` : "—"}</td><td className={`px-2 text-xs ${row.error ? "text-rose-500" : "text-slate-500"}`}>{row.error ?? "OK"}</td></tr>)}</tbody></table></section>}
    </div>
  );
}
