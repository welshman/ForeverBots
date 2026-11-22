import { useMemo, useState } from "react";
import { SimulationResult } from "../types/simulation";
import AbilityTimeline from "./AbilityTimeline";

const SPELL_NAMES: Record<number, string> = {
  686:"Shadow Bolt",695:"Shadow Bolt",705:"Shadow Bolt",1088:"Shadow Bolt",1106:"Shadow Bolt",7641:"Shadow Bolt",11659:"Shadow Bolt",11660:"Shadow Bolt",11661:"Shadow Bolt",25307:"Shadow Bolt",
  172:"Corruption",6222:"Corruption",6223:"Corruption",7648:"Corruption",11671:"Corruption",11672:"Corruption",25311:"Corruption",
  348:"Immolate",707:"Immolate",1094:"Immolate",2941:"Immolate",11665:"Immolate",11667:"Immolate",11668:"Immolate",25309:"Immolate",
  980:"Curse of Agony",1014:"Curse of Agony",6217:"Curse of Agony",11711:"Curse of Agony",11712:"Curse of Agony",11713:"Curse of Agony",
  1454:"Life Tap",1455:"Life Tap",1456:"Life Tap",11687:"Life Tap",11688:"Life Tap",11689:"Life Tap",
  687:"Demon Skin",696:"Demon Skin",706:"Demon Armor",1086:"Demon Armor",11733:"Demon Armor",11734:"Demon Armor",11735:"Demon Armor",
  3110:"Firebolt (Imp)",7799:"Firebolt (Imp)",7800:"Firebolt (Imp)",7801:"Firebolt (Imp)",7802:"Firebolt (Imp)",11762:"Firebolt (Imp)",11763:"Firebolt (Imp)",1311680:"Curse of Elements",
  116:"Frostbolt",25304:"Frostbolt",133:"Fireball",25306:"Fireball",2136:"Fire Blast",10199:"Fire Blast",2948:"Scorch",10207:"Scorch",25345:"Arcane Missiles",25346:"Arcane Missiles (Tick)",1239700:"Arcane Blast",12042:"Arcane Power",12043:"Presence of Mind",12051:"Evocation",11129:"Combustion",12536:"Clearcasting",
  10947:"Mind Blast",10942:"Shadow Word: Pain",15473:"Shadowform",10060:"Power Infusion",
  25298:"Starfire",9835:"Moonfire",29166:"Innervate",
  15208:"Lightning Bolt",16166:"Elemental Mastery",16188:"Nature's Swiftness",
  20904:"Aimed Shot",14290:"Multi-Shot",3045:"Rapid Fire",19574:"Bestial Wrath",
  20271:"Judgement",20217:"Blessing of Kings",25898:"Greater Blessing of Kings",25918:"Greater Blessing of Wisdom",25782:"Greater Blessing of Might",
  11294:"Sinister Strike",31016:"Eviscerate",13750:"Adrenaline Rush",13877:"Blade Flurry",
  23894:"Bloodthirst",1680:"Whirlwind",25286:"Heroic Strike",12292:"Death Wish",1719:"Recklessness",
  20572:"Blood Fury",26297:"Berserking",23028:"Arcane Brilliance",21850:"Gift of the Wild",27681:"Prayer of Spirit",24907:"Moonkin Aura"
};
type Obj = Record<string, unknown>;
type ActionSort = "damage" | "dps" | "casts" | "crit";
type AuraFilter = "All" | "Buff" | "Debuff";
const obj = (v: unknown): Obj => v && typeof v === "object" && !Array.isArray(v) ? v as Obj : {};
const arr = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const num = (v: unknown): number => typeof v === "number" && Number.isFinite(v) ? v : 0;
function entries(v: unknown): [string, Obj][] { return Object.entries(v && typeof v === "object" ? v : {}).map(([k,m]) => [k,obj(m)]); }
function label(metric: Obj, key: string): string {
  if (typeof metric.name === "string" && metric.name) return metric.name;
  let id = obj(metric.id ?? metric.actionId ?? metric.auraId);
  if (!Object.keys(id).length) { try { id = obj(JSON.parse(key)); } catch { /* keep fallback */ } }
  const spell = num(id.spellId ?? id.spell_id);
  if (spell) return SPELL_NAMES[spell] ?? `Spell #${spell}`;
  const item = num(id.itemId ?? id.item_id);
  if (item) return `Item #${item}`;
  if (id.otherId ?? id.other_id) return String(id.otherId ?? id.other_id).replace(/^OtherAction/, "");
  return `Unidentified action (${key})`;
}
const colors: Record<number,string> = {1:"bg-amber-400",2:"bg-yellow-300",4:"bg-orange-500",8:"bg-emerald-400",16:"bg-sky-400",32:"bg-purple-500",64:"bg-cyan-400"};
const panel = "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-3 overflow-x-auto";
const cell = "py-2 px-2 text-left";
export default function ReportView({ result }: { result: SimulationResult }) {
  const [copied, setCopied] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [sortBy, setSortBy] = useState<ActionSort>("damage");
  const [sortDesc, setSortDesc] = useState(true);
  const [auraFilter, setAuraFilter] = useState<AuraFilter>("All");

  const details = useMemo(() => {
    try {
      const outer = obj(JSON.parse(result.rawOutput));
      const report = obj(outer.report);
      const rep = obj(report.result ?? outer.report ?? outer);
      const raid = obj(rep.raidMetrics);
      const party = obj(arr(raid.parties)[0]);
      const player = obj(arr(party.players)[0]);
      const target = obj(arr(obj(rep.encounterMetrics).targets)[0]);
      const iterations = num(rep.iterationsDone);
      const duration = num(rep.avgIterationDuration);
      const units = [player, ...arr(player.pets).map(obj)];
      const actions = units.flatMap((unit, index) => entries(unit.actions).flatMap(([key,metric]) => {
        const targets = arr(metric.targets).map(obj);
        const sum = (field: string) => targets.reduce((total,t) => total + num(t[field]),0);
        if (sum("damage") <= 0 || iterations <= 0) return [];
        const damage = sum("damage") / iterations;
        const landed = sum("hits") + sum("crits");
        return [{name:(index ? `${String(unit.name ?? "Pet")}: ` : "") + label(metric,key),damage,dps:duration > 0 ? damage/duration : undefined,casts:sum("casts")/iterations,crit:landed > 0 ? 100*sum("crits")/landed : undefined,color:colors[num(metric.spellSchool)] ?? "bg-indigo-400"}];
      })).sort((a,b) => b.damage-a.damage);
      const total = actions.reduce((sum,a) => sum+a.damage,0);
      const auras = [{unit:player,kind:"Buff" as const},{unit:target,kind:"Debuff" as const}].flatMap(({unit,kind}) => entries(unit.auras).flatMap(([key,m]) => {
        const seconds = num(m.uptimeSecondsAvg);
        return seconds > 0 && duration > 0 ? [{name:label(m,key),kind,pct:Math.min(100,100*seconds/duration),count:num(m.procsAvg)}] : [];
      })).sort((a,b) => b.pct-a.pct);
      return {name:String(player.name ?? "Character"),iterations,duration,actions,total,auras,logs:typeof rep.logs === "string" ? rep.logs : ""};
    } catch { return null; }
  }, [result.rawOutput]);

  const sortedActions = useMemo(() => {
    if (!details) return [];
    const dir = sortDesc ? -1 : 1;
    return [...details.actions].sort((a, b) => {
      const av = (sortBy === "damage" ? a.damage : sortBy === "dps" ? a.dps : sortBy === "casts" ? a.casts : a.crit) ?? -1;
      const bv = (sortBy === "damage" ? b.damage : sortBy === "dps" ? b.dps : sortBy === "casts" ? b.casts : b.crit) ?? -1;
      return (av - bv) * dir;
    });
  }, [details, sortBy, sortDesc]);

  const filteredAuras = useMemo(() => {
    if (!details) return [];
    return auraFilter === "All" ? details.auras : details.auras.filter((a) => a.kind === auraFilter);
  }, [details, auraFilter]);

  const toggleSort = (col: ActionSort) => {
    if (sortBy === col) {
      setSortDesc((d) => !d);
    } else {
      setSortBy(col);
      setSortDesc(true);
    }
  };

  const sortArrow = (col: ActionSort) => (sortBy === col ? (sortDesc ? " ↓" : " ↑") : "");

  const copySummary = () => {
    const top = details?.actions.slice(0, 3).map((a) => `${a.name} (${(100 * a.damage / (details.total || 1)).toFixed(1)}%)`).join(", ");
    const text = [
      `ForeverBots Quick Sim — ${details?.name ?? "Character"}`,
      `DPS: ${result.dps?.toFixed(1) ?? "Unavailable"} (σ ${result.statistics.stdDev?.toFixed(1) ?? "—"})`,
      `Fight: ${details?.duration ? `${details.duration.toFixed(1)}s` : "—"} | Iterations: ${details?.iterations || "—"}`,
      top ? `Top Abilities: ${top}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadJson = () => {
    const safeName = (details?.name ?? "character").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const dpsTag = result.dps ? `${Math.round(result.dps)}dps` : "report";
    const blob = new Blob([result.rawOutput || JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `foreverbots-${safeName}-${dpsTag}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!details) return;
    const header = "Ability,Share %,Avg Damage,DPS,Casts/Fight,Crit %";
    const rows = sortedActions.map((a) => [
      `"${a.name.replace(/"/g, '""')}"`,
      (100 * a.damage / (details.total || 1)).toFixed(2),
      a.damage.toFixed(1),
      a.dps !== undefined ? a.dps.toFixed(1) : "",
      a.casts.toFixed(2),
      a.crit !== undefined ? a.crit.toFixed(1) : "",
    ].join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `foreverbots-${details.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-breakdown.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMarkdownTable = () => {
    if (!details) return;
    const lines = [
      "| Ability | Share | DPS | Casts | Crit % |",
      "| --- | ---: | ---: | ---: | ---: |",
      ...sortedActions.map(
        (a) =>
          `| ${a.name} | ${(100 * a.damage / (details.total || 1)).toFixed(1)}% | ${a.dps?.toFixed(1) ?? "—"} | ${a.casts.toFixed(1)} | ${a.crit !== undefined ? `${a.crit.toFixed(1)}%` : "—"} |`
      ),
    ];
    navigator.clipboard?.writeText(lines.join("\n")).then(() => {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    });
  };

  const minDps = result.statistics.min;
  const maxDps = result.statistics.max;
  const meanPos =
    minDps !== undefined && maxDps !== undefined && result.dps !== undefined && maxDps > minDps
      ? Math.max(0, Math.min(100, ((result.dps - minDps) / (maxDps - minDps)) * 100))
      : null;

  return <div className="space-y-6">
    {!result.ok ? <section className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-rose-400"><h3>Simulation Refused or Failed</h3>{result.errors.map((e,i) => <p key={i}>[{e.code}] {e.message}</p>)}</section> : <>
      <section className={panel}>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-bold">{details?.name ?? "Character"}</h2>
            <p className="text-xs uppercase tracking-wider text-slate-400">Quick Sim Result</p>
          </div>
          <div className="text-4xl font-bold text-gold-400">{result.dps?.toLocaleString(undefined,{maximumFractionDigits:1}) ?? "Unavailable"} DPS</div>
        </div>
        <p className="text-sm text-slate-400">Standard deviation: {result.statistics.stdDev?.toFixed(1) ?? "Unavailable"} | Minimum: {result.statistics.min?.toFixed(1) ?? "Unavailable"} | Maximum: {result.statistics.max?.toFixed(1) ?? "Unavailable"}</p>
        {meanPos !== null && minDps !== undefined && maxDps !== undefined && (
          <div className="space-y-1">
            <div className="relative h-2 rounded-full bg-slate-200 dark:bg-obsidian-950 overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-gold-500/35" style={{ width: `${meanPos}%` }} />
              <div className="absolute top-0 bottom-0 w-1 bg-gold-400" style={{ left: `calc(${meanPos}% - 2px)` }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>Min {minDps.toFixed(1)}</span>
              <span>Mean {result.dps?.toFixed(1)}</span>
              <span>Max {maxDps.toFixed(1)}</span>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold">Simulation Details</h3>
            <p className="text-sm text-slate-300">Iterations: {details?.iterations || "Unavailable"} | Average duration: {details?.duration ? `${details.duration.toFixed(1)}s` : "Unavailable"} | Processing time: {result.durationMs}ms | Engine: {result.engineVersion}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={downloadJson}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-gold-500/40 hover:text-gold-400 transition-colors"
            >
              Download JSON
            </button>
            <button
              type="button"
              onClick={copySummary}
              className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-colors"
            >
              {copied ? "Copied!" : "Copy Summary"}
            </button>
          </div>
        </div>
      </section>
      {!details && <p className="text-amber-400">Detailed output could not be parsed. Raw data is available below.</p>}
      {!!sortedActions.length && details && <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Damage Breakdown</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyMarkdownTable}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-gold-500/40 hover:text-gold-400 transition-colors"
            >
              {copiedMd ? "Copied MD!" : "Copy Markdown"}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-gold-500/40 hover:text-gold-400 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
        <table className="w-full text-sm"><thead><tr className="text-slate-400">
          <th className={cell}>Ability</th>
          <th className={cell}><button type="button" onClick={() => toggleSort("damage")} className="hover:text-gold-400 transition-colors">%{sortArrow("damage")}</button></th>
          <th className={cell}>Amount</th>
          <th className={cell}><button type="button" onClick={() => toggleSort("damage")} className="hover:text-gold-400 transition-colors">Avg damage per fight{sortArrow("damage")}</button></th>
          <th className={cell}><button type="button" onClick={() => toggleSort("dps")} className="hover:text-gold-400 transition-colors">DPS{sortArrow("dps")}</button></th>
          <th className={cell}><button type="button" onClick={() => toggleSort("casts")} className="hover:text-gold-400 transition-colors">Casts / fight{sortArrow("casts")}</button></th>
          <th className={cell}><button type="button" onClick={() => toggleSort("crit")} className="hover:text-gold-400 transition-colors">Crit %{sortArrow("crit")}</button></th>
        </tr></thead><tbody>{sortedActions.map((a,i) => <tr key={i} className="border-t border-slate-800"><td className={cell}>{a.name}</td><td className={cell}>{(100*a.damage/details.total).toFixed(1)}%</td><td className={`${cell} min-w-32`}><div className="h-2 rounded bg-slate-800 overflow-hidden"><div className={`h-2 ${a.color}`} style={{width:`${100*a.damage/details.total}%`}} /></div></td><td className={cell}>{a.damage.toFixed(1)}</td><td className={cell}>{a.dps?.toFixed(1) ?? "Unavailable"}</td><td className={cell}>{a.casts.toFixed(1)}</td><td className={cell}>{a.crit?.toFixed(1) ?? "Unavailable"}</td></tr>)}</tbody></table>
      </section>}
      {!!details?.auras.length && <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Buff &amp; Debuff Uptime</h3>
          <div className="flex items-center gap-1">
            {(["All", "Buff", "Debuff"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAuraFilter(tab)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  auraFilter === tab
                    ? "border-gold-500/60 bg-gold-500/15 text-gold-400"
                    : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-gold-500/40"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-sm"><thead><tr className="text-slate-400">{["Aura","Type","Uptime","Bar","Procs / Count"].map(h => <th key={h} className={cell}>{h}</th>)}</tr></thead><tbody>{filteredAuras.map((a,i) => <tr key={i} className="border-t border-slate-800"><td className={cell}>{a.name}</td><td className={cell}>{a.kind}</td><td className={cell}>{a.pct.toFixed(1)}%</td><td className={`${cell} min-w-32`}><div className="h-2 rounded bg-slate-800 overflow-hidden"><div className="h-2 bg-gold-500" style={{width:`${a.pct}%`}} /></div></td><td className={cell}>{a.count.toFixed(1)}</td></tr>)}</tbody></table>
      </section>}
      {details?.logs ? <AbilityTimeline key={result.jobId} logs={details.logs} names={SPELL_NAMES} /> : <p className="text-sm text-slate-400">No sample combat log was returned by the engine.</p>}
    </>}
    {!!result.warnings.length && <section className={panel}><h3>Warnings</h3>{result.warnings.map((w,i) => <p key={i} className="text-amber-400">[{w.code}] {w.message}</p>)}</section>}
    {[{title:"Raw Input",text:result.rawInput},{title:"Raw Engine Output",text:result.rawOutput}].map(v => <details key={v.title} className={panel}><summary className="cursor-pointer font-medium">{v.title}</summary><pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs rounded-xl bg-obsidian-950 p-3">{v.text}</pre></details>)}
  </div>;
}
