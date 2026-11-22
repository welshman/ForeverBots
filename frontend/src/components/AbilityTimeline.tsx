import { useMemo, useState } from "react";

type Event = { time: number; actor: string; ability: string; detail: string };
export function parseTimeline(logs: string, names: Record<number, string>): Event[] {
  return logs.split("\n").flatMap((line) => {
    const match = line.trim().match(/^\[(-?\d+(?:\.\d+)?)\]\s*\[([^\]]+)\]\s+Casting\s+\{(SpellID|ItemID):\s*(\d+)[^}]*\}(.*)$/i);
    if (!match) return [];
    const id = Number(match[4]);
    const duration = match[5].match(/Cast Time\s*=\s*([\d.]+)s/i)?.[1];
    return [{ time: Number(match[1]), actor: match[2], ability: match[3].toLowerCase() === "spellid" ? names[id] ?? `Spell #${id}` : `Item #${id}`, detail: duration === undefined ? "Cast started" : Number(duration) === 0 ? "Instant" : `${duration}s cast` }];
  });
}
export default function AbilityTimeline({ logs, names }: { logs: string; names: Record<number, string> }) {
  const [raw, setRaw] = useState(false);
  const [limit, setLimit] = useState(50);
  const events = useMemo(() => parseTimeline(logs, names), [logs, names]);
  return <section className="rounded-xl border border-slate-700 p-5 space-y-3">
    <div className="flex justify-between gap-3"><h3 className="font-semibold">Sample Ability Log</h3><button type="button" onClick={() => setRaw(!raw)} className="text-sm text-sky-400">{raw ? "Show timeline" : "Show raw log"}</button></div>
    <p className="text-sm text-amber-400">One simulated fight, not a recommended rotation. Times are seconds relative to the pull. Cast completions and debug messages are hidden in this view.</p>
    {raw ? <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{logs}</pre> : events.length ? <><div className="max-h-96 overflow-auto">{[true, false].map((prepull) => {
      const rows = events.slice(0, limit).filter(e => (e.time < 0) === prepull);
      return rows.length ? <div key={String(prepull)}><h4 className="py-2 text-sm text-slate-400">{prepull ? "Before combat (PRE-PULL)" : "During combat (PULL)"}</h4><div className="hidden sm:grid grid-cols-[80px_1fr_1fr_100px] gap-3 text-xs text-slate-400"><span>Time</span><span>Ability</span><span>Caster</span><span>Cast time</span></div>{rows.map((e, i) => <div key={i} className="grid grid-cols-1 gap-1 border-b border-slate-800 py-2 sm:grid-cols-[80px_1fr_1fr_100px] sm:gap-3"><span className="font-mono text-sm text-slate-400">{e.time.toFixed(2)}s</span><span className="font-medium">{e.ability}</span><span className="text-sm text-slate-400">{e.actor}</span><span className="text-sm text-sky-400">{e.detail}</span></div>)}</div> : null;
    })}</div><p className="text-xs text-slate-400">Showing {Math.min(limit, events.length)} of {events.length} cast starts.</p>{limit < events.length && <button type="button" onClick={() => setLimit(limit + 50)} className="text-sm text-sky-400">Show 50 more</button>}</> : <p className="text-sm text-slate-400">No recognized cast starts in this log. The original data remains available under Show raw log.</p>}
  </section>;
}
