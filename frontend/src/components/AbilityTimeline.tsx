import { useMemo, useState } from "react";

export default function AbilityTimeline({ logs }: { logs: string }) {
  const [raw, setRaw] = useState(false);
  const events = useMemo(() => logs.split("\n").flatMap((line) => {
    const match = line.trim().match(/^\[(-?\d+(?::\d+)?(?:\.\d+)?)\]\s*(.*)$/);
    if (!match) return [];
    const cast = match[2].match(/^(.*?)\b(Casting|Completed cast|Cast)\s+(.+)$/i);
    if (!cast) return [];
    return [{ time: match[1], actor: cast[1].trim(), action: cast[2], ability: cast[3], prepull: match[1].startsWith("-") }];
  }), [logs]);
  return <section className="space-y-3">
    <div className="flex justify-between gap-3"><h3 className="font-semibold">Sample Ability Log</h3><button type="button" onClick={() => setRaw(!raw)} className="text-sm text-sky-400">{raw ? "Show timeline" : "Show raw log"}</button></div>
    <p className="text-sm text-amber-300">One simulated fight, not a recommended rotation. Times are relative to the pull.</p>
    {raw ? <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{logs}</pre> : events.length ? <div className="max-h-96 overflow-auto">{[true, false].map((prepull) => { const rows = events.filter(e => e.prepull === prepull); return rows.length ? <div key={String(prepull)}><h4 className="py-2 text-sm text-slate-400">{prepull ? "Before combat" : "During combat"}</h4>{rows.map((e, i) => <div key={i} className="grid grid-cols-1 gap-1 border-b border-slate-800 py-2 sm:grid-cols-[90px_1fr]"><span className="font-mono text-sm text-slate-400">{e.time}s</span><div><span className="font-medium">{e.ability}</span><p className="text-xs text-slate-400">{e.actor} {e.action}</p></div></div>)}</div> : null; })}</div> : <p className="text-sm text-slate-400">No cast events could be identified in this log format. Use the raw log to inspect the original data.</p>}
  </section>;
}
