import { useMemo, useState } from "react";
import { useToast } from "../hooks/useToast";
import { downloadFile } from "../lib/historyExport";

type Event = { time: number; ability: string; detail: string };
export function parseTimeline(logs: string, names: Record<number, string>): Event[] {
  return logs.split("\n").flatMap((line) => {
    const match = line.trim().match(/^\[(-?\d+(?:\.\d+)?)\]\s*\[[^\]]+\]\s+Casting\s+\{(SpellID|ItemID):\s*(\d+)[^}]*\}(.*)$/i);
    if (!match) return [];
    const id = Number(match[3]);
    const duration = match[4].match(/Cast Time\s*=\s*([\d.]+)s/i)?.[1];
    return [{ time: Number(match[1]), ability: match[2].toLowerCase() === "spellid" ? names[id] ?? `Spell #${id}` : `Item #${id}`, detail: duration === undefined ? "Cast started" : Number(duration) === 0 ? "Instant" : `${duration}s cast` }];
  });
}
export default function AbilityTimeline({ logs, names }: { logs: string; names: Record<number, string> }) {
  const { show } = useToast();
  const [raw, setRaw] = useState(false);
  const [limit, setLimit] = useState(50);
  const [filter, setFilter] = useState("");
  const events = useMemo(() => parseTimeline(logs, names), [logs, names]);
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? events.filter((e) => e.ability.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q)) : events;
  }, [events, filter]);

  const copyFiltered = () => {
    const lines = filtered.slice(0, limit).map(e => `${e.time.toFixed(2)}s | ${e.ability} | ${e.detail}`);
    navigator.clipboard?.writeText(lines.join("\n")).then(() => show("Timeline copied."));
  };

  const exportFiltered = () => {
    const csv = ["Time,Ability,Detail", ...filtered.slice(0, limit).map(e => `"${e.time.toFixed(2)}","${e.ability.replace(/"/g, '""')}","${e.detail.replace(/"/g, '""')}"`)].join("\n");
    downloadFile(csv, "foreverbots-timeline.csv", "text/csv;charset=utf-8;");
    show("Timeline CSV downloaded.");
  };

  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold">Sample Ability Log</h3>
      <div className="flex items-center gap-3">
        {!raw && events.length > 0 && (
          <input type="text" value={filter} onChange={(e) => { setFilter(e.target.value); setLimit(50); }} placeholder="Filter ability..." className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/70" />
        )}
        {!raw && filtered.length > 0 && (
          <>
            <button type="button" onClick={copyFiltered} className="text-xs text-gold-400 hover:underline">Copy</button>
            <button type="button" onClick={exportFiltered} className="text-xs text-gold-400 hover:underline">Export CSV</button>
          </>
        )}
        <button type="button" onClick={() => setRaw(!raw)} className="text-sm text-gold-400 hover:underline">{raw ? "Show timeline" : "Show raw log"}</button>
      </div>
    </div>
    <p className="text-sm text-amber-400">One simulated fight, not a recommended rotation. Times are seconds relative to the pull. Cast completions and debug messages are hidden in this view.</p>
    {raw ? <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs rounded-xl bg-obsidian-950 p-3">{logs}</pre> : filtered.length ? <><div className="max-h-96 overflow-auto">{[true, false].map((prepull) => {
      const rows = filtered.slice(0, limit).filter(e => (e.time < 0) === prepull);
      return rows.length ? <div key={String(prepull)}><h4 className="py-2 text-sm text-slate-400">{prepull ? "Before combat (PRE-PULL)" : "During combat (PULL)"}</h4><div className="hidden sm:grid grid-cols-[80px_1fr_100px] gap-3 text-xs text-slate-400"><span>Time</span><span>Ability</span><span>Cast time</span></div>{rows.map((e, i) => <div key={i} className="grid grid-cols-1 gap-1 border-b border-slate-800 py-2 sm:grid-cols-[80px_1fr_100px] sm:gap-3"><span className="font-mono text-sm text-slate-400">{e.time.toFixed(2)}s</span><span className="font-medium">{e.ability}</span><span className="text-sm text-gold-400/90">{e.detail}</span></div>)}</div> : null;
    })}</div><p className="text-xs text-slate-400">Showing {Math.min(limit, filtered.length)} of {filtered.length} cast starts{filter.trim() ? ` (filtered from ${events.length})` : ""}.</p>{limit < filtered.length && <button type="button" onClick={() => setLimit(limit + 50)} className="text-sm text-gold-400 hover:underline">Show 50 more</button>}</> : <p className="text-sm text-slate-400">{events.length ? "No casts match that filter." : "No recognized cast starts in this log. The original data remains available under Show raw log."}</p>}
  </section>;
}
