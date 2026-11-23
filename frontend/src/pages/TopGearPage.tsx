import { useState } from "react";
import SimcImporter from "../components/SimcImporter";
import ForeverItemLink from "../components/ForeverItemLink";
import GearItemCard, { gearSlotLabel } from "../components/GearItemCard";
import { simulationRunner } from "../lib/engineAdapter";
import { buildForeverRequestJson } from "../lib/requestBuilder";
import { foreverDungeonSources, type ForeverDungeonItem } from "../data/foreverDungeonSources";
import { simulationSlotsForForeverSlot, type SimulationSlot } from "../data/foreverSlotMapping";
import type { ParsedSimcProfile } from "../types/simulation";

interface Candidate { key: string; item: ForeverDungeonItem; targetSlot: SimulationSlot }
interface ResultRow { candidate: Candidate; dps?: number; delta?: number; gainPct?: number; error?: string }
const baseOptions = { fightStyle: "Patchwerk" as const, durationSeconds: 180, durationVariancePct: 20, targetCount: 1, iterations: 500, latencyMs: 100, seed: 42 };
const panel = "rounded-2xl border border-slate-200 bg-white/85 p-5 dark:border-slate-800 dark:bg-obsidian-900/85";
const control = "rounded-xl border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 disabled:opacity-50 dark:border-slate-700";
const dungeons = [...new Set(foreverDungeonSources.map((item) => item.dungeon))];
const slots = [...new Set(foreverDungeonSources.map((item) => item.slot))];
const active = "border-gold-500 bg-gold-500/10 ring-1 ring-gold-500/40";

export default function TopGearPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [dungeon, setDungeon] = useState("");
  const [slotFilter, setSlotFilter] = useState("");
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selected, setSelected] = useState<Record<string, SimulationSlot>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [failure, setFailure] = useState("");
  const [baseline, setBaseline] = useState<number | undefined>();
  const picked = foreverDungeonSources.filter((item) => selected[String(item.id)]);
  const items = foreverDungeonSources.filter((item) => (!dungeon || item.dungeon === dungeon) && (!slotFilter || item.slot === slotFilter) && (!selectedOnly || Boolean(selected[String(item.id)])) && `${item.name} ${item.boss ?? ""} ${item.id}`.toLowerCase().includes(query.toLowerCase().trim()));
  const remove = (id: number) => setSelected((previous) => { const next = { ...previous }; delete next[String(id)]; return next; });

  const runTopGear = async () => {
    if (!profile || running || picked.length === 0) return;
    const candidates: Candidate[] = picked.map((item) => ({ key: String(item.id), item, targetSlot: selected[String(item.id)] }));
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

  const exportCsv = () => {
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = ["Item ID,Item,Dungeon,Target Slot,DPS,Gain,Gain %,Status", ...results.map((row) => [row.candidate.item.id, row.candidate.item.name, row.candidate.item.dungeon, row.candidate.targetSlot, row.dps?.toFixed(1) ?? "", row.delta?.toFixed(1) ?? "", row.gainPct?.toFixed(2) ?? "", row.error ?? "OK"].map(escape).join(","))];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = "foreverbots-top-gear.csv"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-widest text-gold-500">Build your comparison list</p><h1 className="text-3xl font-bold">Top Gear</h1><p className="text-sm text-slate-500 dark:text-slate-400">Browse verified Forever dungeon gear and compare individual upgrades with your equipped character.</p></header>
      <SimcImporter onParsed={setProfile} />
      <section className={`${panel} space-y-5`} aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="text-lg font-semibold">Browse by dungeon</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{["", ...dungeons].map((name, index) => <button key={name || "all"} type="button" disabled={running} aria-pressed={dungeon === name} onClick={() => setDungeon(name)} className={`${control} space-y-3 p-4 text-left transition-colors ${dungeon === name ? active : "hover:border-gold-500"}`}><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/30 to-slate-500/10 font-bold text-gold-500">{index === 0 ? "All" : `0${index}`}</span><span className="block font-semibold">{name || "All dungeons"}</span><span className="block text-xs text-slate-500 dark:text-slate-400">{foreverDungeonSources.filter((item) => !name || item.dungeon === name).length} catalogue items</span></button>)}</div>
        <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Equipment slot</legend><div className="flex flex-wrap gap-2">{["", ...slots].map((slot) => <button key={slot || "all"} type="button" disabled={running} aria-pressed={slotFilter === slot} onClick={() => setSlotFilter(slot)} className={`${control} text-xs ${slotFilter === slot ? active : "hover:border-gold-500"}`}>{slot ? gearSlotLabel(slot) : "All slots"}</button>)}</div></fieldset>
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-3">
        <section className={`${panel} space-y-5 xl:col-span-2`} aria-labelledby="items-heading">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="items-heading" className="text-lg font-semibold">Choose items <span className="text-sm font-normal text-slate-500">({items.length})</span></h2><label className="flex min-w-0 items-center gap-2 text-sm"><span>Search</span><input type="search" value={query} disabled={running} onChange={(event) => setQuery(event.target.value)} placeholder="Item, boss, or ID" className={`${control} min-w-0 w-full bg-transparent sm:w-48`} /></label></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedOnly} disabled={running} onChange={(event) => setSelectedOnly(event.target.checked)} />Show selected items only</label>
          {items.length === 0 ? <div role="status" className="space-y-3 rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700"><p className="text-sm text-slate-500">No items match these filters.</p><button type="button" disabled={running} onClick={() => { setDungeon(""); setSlotFilter(""); setQuery(""); setSelectedOnly(false); }} className={control}>Reset filters</button></div> : <div className="grid gap-3 md:grid-cols-2">{items.map((item) => <GearItemCard key={item.id} item={item} selectedSlot={selected[String(item.id)]} disabled={running} onRemove={() => remove(item.id)} onSelect={(slot) => { if (simulationSlotsForForeverSlot(item.slot).includes(slot)) setSelected((previous) => ({ ...previous, [String(item.id)]: slot })); }} />)}</div>}
        </section>
        <aside className={`${panel} space-y-4 xl:sticky xl:top-6`} aria-label="Selected comparisons">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{picked.length} selected</h2><button type="button" disabled={running || picked.length === 0} onClick={() => setSelected({})} className={`${control} text-xs`}>Clear all</button></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Selections stay in your list when you change filters. Every selected item is included in the run.</p>
          {picked.length === 0 ? <p className="rounded-xl bg-slate-500/10 p-4 text-sm text-slate-500">Select gear cards to build your comparison list.</p> : <ul className="max-h-80 space-y-2 overflow-auto">{picked.map((item) => <li key={item.id} className="flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/5 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{gearSlotLabel(selected[String(item.id)])}</p></div><button type="button" disabled={running} onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`} className={control}>×</button></li>)}</ul>}
          <p className="text-xs text-slate-500 dark:text-slate-400">Tests individual item swaps, not full gear combinations. 500 iterations · 180-second Patchwerk.</p>
          <button type="button" disabled={!profile || running || picked.length === 0} onClick={runTopGear} className="w-full rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-obsidian-950 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50">{running ? "Comparing…" : "Run Top Gear"}</button>
          {!profile && <p className="text-xs text-slate-500">Import your character to enable comparisons.</p>}<p role="status" className="text-sm text-slate-500">{progress}</p>{failure && <p role="alert" className="text-sm text-rose-500">{failure}</p>}
        </aside>
      </div>
      {(results.length > 0 || baseline !== undefined) && <section className={`${panel} space-y-4 overflow-auto`} aria-label="Comparison results"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Results</h2><button type="button" disabled={running || results.length === 0} onClick={exportCsv} className={control}>Export CSV</button></div>{baseline !== undefined && <p className="text-sm">Equipped baseline: <strong>{baseline.toFixed(1)} DPS</strong></p>}<table className="w-full text-left text-sm"><thead><tr>{["Item", "Dungeon", "Target slot", "DPS", "Gain", "Gain %", "Status"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-2 py-3">{heading}</th>)}</tr></thead><tbody>{results.map((row) => <tr key={row.candidate.key} className="border-t border-slate-200 dark:border-slate-800"><td className="px-2 py-3"><ForeverItemLink itemId={row.candidate.item.id} name={row.candidate.item.name} /></td><td className="px-2">{row.candidate.item.dungeon}</td><td className="px-2">{gearSlotLabel(row.candidate.targetSlot)}</td><td className="px-2 font-mono">{row.dps?.toFixed(1) ?? "—"}</td><td className="px-2 font-mono">{row.delta !== undefined ? `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(1)}` : "—"}</td><td className="px-2 font-mono">{row.gainPct !== undefined ? `${row.gainPct >= 0 ? "+" : ""}${row.gainPct.toFixed(2)}%` : "—"}</td><td className={`px-2 text-xs ${row.error ? "text-rose-500" : "text-slate-500"}`}>{row.error ?? "OK"}</td></tr>)}</tbody></table></section>}
    </div>
  );
}
