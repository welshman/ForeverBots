import { useEffect, useRef, useState } from "react";
import SimcImporter from "../components/SimcImporter";
import ReportView from "../components/ReportView";
import { simulationRunner } from "../lib/engineAdapter";
import { appendHistory, loadHistory } from "../lib/storage";
import { ParsedSimcProfile, SimulationProgress, SimulationResult } from "../types/simulation";

const OPTS_KEY = "foreverbots:quicksim_opts:v1";
const DEFAULTS = { duration: 180, iterations: 1000, variancePct: 20, latencyMs: 50, seed: 1 };
type Options = typeof DEFAULTS;
const PHASE_WIDTH: Record<SimulationProgress["phase"], string> = {
  parsing: "15%", "loading-assets": "30%", preparing: "45%", checking: "60%",
  simulating: "80%", complete: "100%", failed: "100%", cancelled: "100%",
};
const panel = "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-4";
const inputClass = "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/70";
const secondary = "text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-gold-500/60 transition-colors";
const limits: Record<keyof Options, [number, number]> = {
  duration: [1, 600], iterations: [1, 10000], variancePct: [0, 50], latencyMs: [0, 500], seed: [1, 2147483647],
};
function valid(key: keyof Options, value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= limits[key][0] && value <= limits[key][1];
}
function loadOptions(): Options {
  const next = { ...DEFAULTS };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(OPTS_KEY) ?? "{}");
    if (saved && typeof saved === "object") {
      const values = saved as Record<string, unknown>;
      for (const key of Object.keys(DEFAULTS) as (keyof Options)[]) {
        const value = values[key];
        if (valid(key, value)) next[key] = value;
      }
    }
  } catch { /* Storage may be unavailable. */ }
  return next;
}

export default function QuickSimPage() {
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [options, setOptions] = useState<Options>(loadOptions);
  const [advanced, setAdvanced] = useState(false);
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>(() => loadHistory());
  const [running, setRunning] = useState(false);
  const busy = useRef(false);
  const [message, setMessage] = useState("");
  const validOptions = (Object.keys(DEFAULTS) as (keyof Options)[]).every(key => valid(key, options[key]));

  useEffect(() => {
    if (!validOptions) return;
    try { localStorage.setItem(OPTS_KEY, JSON.stringify(options)); } catch { /* Storage may be unavailable. */ }
  }, [options, validOptions]);

  const handleRun = async () => {
    if (!profile || profile.status === "unparseable" || busy.current || !validOptions) return;
    busy.current = true;
    setRunning(true);
    setMessage("");
    setResult(null);
    try {
      const response = await simulationRunner.run({
        jobId: crypto.randomUUID(), profile,
        options: { fightStyle: "Patchwerk", durationSeconds: options.duration,
          durationVariancePct: options.variancePct, targetCount: 1,
          iterations: options.iterations, latencyMs: options.latencyMs, seed: options.seed },
      }, setProgress);
      setResult(response);
      try { appendHistory(response); setHistory(loadHistory()); }
      catch { setMessage("Simulation completed, but browser history could not be saved."); }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Simulation failed. Please try again.");
    } finally {
      busy.current = false;
      setRunning(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void handleRun();
      } else if (event.key === "Escape" && running) {
        event.preventDefault();
        simulationRunner.cancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const copyRaw = async (label: string, text: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setMessage(`${label} copied.`);
    } catch { setMessage("Copy failed. Select and copy the text in the raw report section manually."); }
  };

  const field = (key: keyof Options, label: string, presets: readonly number[] = []) => (
    <div className="space-y-1.5">
      <label htmlFor={`quick-${key}`} className="text-xs block text-slate-500 dark:text-slate-400">{label}</label>
      <input id={`quick-${key}`} type="number" min={limits[key][0]} max={limits[key][1]} step={1}
        value={Number.isNaN(options[key]) ? "" : options[key]} aria-invalid={!valid(key, options[key])}
        onChange={event => setOptions(current => ({ ...current, [key]: event.target.valueAsNumber }))}
        className={inputClass} />
      {!!presets.length && <div className="flex gap-1">{presets.map(preset => (
        <button key={preset} type="button" aria-pressed={options[key] === preset}
          onClick={() => setOptions(current => ({ ...current, [key]: preset }))}
          className={`${secondary} ${options[key] === preset ? "border-gold-500/60 bg-gold-500/15 text-gold-400" : ""}`}>
          {preset}{key === "duration" ? "s" : ""}
        </button>
      ))}</div>}
    </div>
  );

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Quick Sim</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Patchwerk single-target simulation executed in a dedicated Web Worker.</p>
    </div>
    <SimcImporter onParsed={setProfile} />
    <section className={panel} aria-label="Simulation settings">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("duration", "Fight Length (s)", [60, 180, 300])}
        {field("iterations", "Iterations", [500, 1000, 5000])}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void handleRun()}
          disabled={!profile || profile.status === "unparseable" || running || !validOptions}
          className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-50">
          {running ? "Simulating..." : "Run Quick Sim"}
        </button>
        {running ? <button type="button" onClick={() => simulationRunner.cancel()}
          className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm">Cancel (Esc)</button>
          : <span className="text-xs text-slate-500">Ctrl/Cmd+Enter</span>}
        <button type="button" aria-expanded={advanced} aria-controls="quick-more-options"
          onClick={() => setAdvanced(value => !value)} className={secondary}>{advanced ? "Hide Options" : "More Options"}</button>
      </div>
      {advanced && <div id="quick-more-options" className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
        <div className="grid gap-4 sm:grid-cols-3">
          {field("variancePct", "Duration Variance (%)")}
          {field("latencyMs", "Latency (ms)")}
          {field("seed", "RNG Seed")}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Settings are remembered in this browser. Keep the same seed and encounter settings when comparing runs.</p>
      </div>}
      {!validOptions && <p role="alert" className="text-sm text-rose-500">Use whole numbers within the field limits: fight length 1–600, iterations 1–10000, variance 0–50, latency 0–500, seed 1–2147483647.</p>}
    </section>
    {progress && <div className={panel} role="status">
      <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="uppercase text-gold-400">{progress.phase}</span><span>{progress.message}</span></div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-obsidian-950 overflow-hidden">
        <div className={`h-2 transition-all ${progress.phase === "failed" || progress.phase === "cancelled" ? "bg-rose-500" : "bg-gold-500"}`} style={{ width: PHASE_WIDTH[progress.phase] }} />
      </div>
    </div>}
    <p role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    {result && <>
      <ReportView result={result} />
      <div className="flex flex-wrap gap-2" aria-label="Copy raw report data">
        <button type="button" className={secondary} onClick={() => void copyRaw("Raw Input", result.rawInput)}>Copy Raw Input</button>
        <button type="button" className={secondary} onClick={() => void copyRaw("Raw Engine Output", result.rawOutput)}>Copy Raw Engine Output</button>
      </div>
    </>}
    {history.length > 0 && <section className={panel}>
      <div className="flex justify-between items-center gap-2"><h2 className="text-sm font-semibold">Recent Simulations</h2>
        <button type="button" className="text-xs text-slate-400 hover:text-rose-400" onClick={() => {
          try { localStorage.removeItem("foreverbots:history:v1"); setHistory([]); }
          catch { setMessage("Browser history could not be cleared."); }
        }}>Clear history</button>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">{history.slice(0, 8).map(item => {
        const selected = result?.jobId === item.jobId;
        const delta = result?.ok && item.ok && result.dps !== undefined && item.dps !== undefined && !selected ? item.dps - result.dps : null;
        return <button key={item.jobId} type="button" onClick={() => setResult(item)} aria-pressed={selected}
          className={`w-full py-2.5 px-2 flex flex-wrap justify-between items-center gap-2 text-left text-xs rounded-lg ${selected ? "bg-gold-500/10 text-gold-400" : "hover:bg-slate-100 dark:hover:bg-obsidian-950"}`}>
          <span>{item.ok && item.dps !== undefined ? `${item.dps.toLocaleString(undefined, { maximumFractionDigits: 1 })} DPS` : "Failed / Refused"}
            {delta !== null && <span className={`ml-2 font-mono ${delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</span>}
          </span>
          <span className="text-slate-500">{item.durationMs}ms • {item.engineVersion}</span>
        </button>;
      })}</div>
    </section>}
  </div>;
}
