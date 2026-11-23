import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SimcImporter from "../components/SimcImporter";
import ReportView from "../components/ReportView";
import { simulationRunner } from "../lib/engineAdapter";
import {
  compareResults,
  exportResultToCsv,
  exportResultToMarkdown,
  summarizeResult,
  validateProfilePreflight,
} from "../lib/resultInsights";
import {
  deleteSavedProfile,
  duplicateSavedProfile,
  loadSavedProfiles,
  SavedProfile,
  saveProfile,
} from "../lib/savedProfiles";
import { appendHistory, loadAdvancedDraft, loadHistory, saveAdvancedDraft } from "../lib/storage";
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
const secondary = "text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-500/60 transition-colors";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [importerKey, setImporterKey] = useState(0);
  const [options, setOptions] = useState<Options>(loadOptions);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(() => new URLSearchParams(window.location.search).get("advanced") === "1");
  const [advancedJson, setAdvancedJson] = useState(() => loadAdvancedDraft());
  const [advancedRunning, setAdvancedRunning] = useState(false);
  const [advancedProgress, setAdvancedProgress] = useState<SimulationProgress | null>(null);
  const [advancedResult, setAdvancedResult] = useState<SimulationResult | null>(null);
  const [advancedMessage, setAdvancedMessage] = useState("");
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [compareBaseline, setCompareBaseline] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>(() => loadHistory());
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>(() => loadSavedProfiles());
  const [profileName, setProfileName] = useState("");
  const [running, setRunning] = useState(false);
  const busy = useRef(false);
  const [message, setMessage] = useState("");
  const validOptions = (Object.keys(DEFAULTS) as (keyof Options)[]).every(key => valid(key, options[key]));

  const toggleAdvanced = (next: boolean) => {
    setShowAdvanced(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set("advanced", "1");
    else params.delete("advanced");
    setSearchParams(params, { replace: true });
  };

  const preflightIssues = useMemo(() => validateProfilePreflight(profile), [profile]);
  const insights = useMemo(() => (result?.ok ? summarizeResult(result, options.iterations) : null), [result, options.iterations]);
  const comparison = useMemo(
    () => (result && compareBaseline && result.jobId !== compareBaseline.jobId ? compareResults(compareBaseline, result, options.iterations) : null),
    [result, compareBaseline, options.iterations]
  );

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

  const handleRunAdvanced = async () => {
    if (!advancedJson.trim() || advancedRunning) return;
    setAdvancedRunning(true);
    setAdvancedResult(null);
    setAdvancedMessage("");
    try {
      const response = await simulationRunner.run({
        jobId: crypto.randomUUID(),
        profile: {
          characterName: "Advanced",
          className: "mage",
          spec: "frost",
          level: 60,
          race: "gnome",
          gear: [],
          rawText: advancedJson,
          status: "supported",
          issues: [],
        },
        options: {
          fightStyle: "Patchwerk",
          durationSeconds: 180,
          durationVariancePct: 20,
          targetCount: 1,
          iterations: 1000,
          latencyMs: 50,
          seed: 1,
          preparedJsonOverride: advancedJson,
        },
      }, setAdvancedProgress);
      setAdvancedResult(response);
    } catch (error) {
      setAdvancedMessage(error instanceof Error ? error.message : "Advanced simulation failed. Please try again.");
    } finally {
      setAdvancedRunning(false);
      setAdvancedProgress(null);
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

  const copyText = async (label: string, text: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setMessage(`${label} copied.`);
    } catch { setMessage(`Could not copy ${label}. Your browser may block clipboard access.`); }
  };

  const downloadCsv = () => {
    if (!result) return;
    const csv = exportResultToCsv(result, options.iterations);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `foreverbots-quicksim-${result.jobId.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("CSV report downloaded.");
  };

  const handleSaveProfile = () => {
    if (!profile || !profile.rawText.trim()) return;
    try {
      setSavedProfiles(saveProfile(profileName || profile.characterName, profile));
      setProfileName("");
      setMessage("Profile saved locally.");
    } catch { setMessage("Could not save profile to browser storage."); }
  };

  const handleLoadSaved = (saved: SavedProfile) => {
    try {
      localStorage.setItem("foreverbots:last_simc:v1", saved.rawText);
      setImporterKey(k => k + 1);
      setMessage(`Loaded saved profile "${saved.name}".`);
    } catch { setMessage("Could not load saved profile."); }
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
    <div><h1 className="text-2xl font-bold">Sim</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Patchwerk single-target simulation executed in a dedicated Web Worker.</p>
    </div>

    <SimcImporter key={importerKey} onParsed={setProfile} />

    {preflightIssues.length > 0 && (
      <section className={panel} aria-label="Pre-flight profile validation">
        <h2 className="text-sm font-semibold">Profile Pre-Flight Check</h2>
        <ul className="space-y-1.5 text-xs">
          {preflightIssues.map((issue, idx) => (
            <li key={idx} className={issue.severity === "error" ? "text-rose-500" : "text-amber-500"}>
              {issue.severity === "error" ? "Error: " : "Warning: "}{issue.message}
            </li>
          ))}
        </ul>
      </section>
    )}

    <section className={panel} aria-label="Saved profiles library">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Saved Profiles</h2>
        {profile && profile.rawText.trim() && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              aria-label="Profile name"
              placeholder={profile.characterName || "Profile name"}
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/70"
            />
            <button type="button" onClick={handleSaveProfile} className={secondary}>Save Current</button>
          </div>
        )}
      </div>
      {savedProfiles.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No saved profiles yet. Paste a /simc profile above and click Save Current to store it locally.</p>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {savedProfiles.map(saved => (
            <div key={saved.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-100">{saved.name}</span>
                <span className="ml-2 text-slate-500">{saved.className} {saved.spec} (Lv {saved.level})</span>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => handleLoadSaved(saved)} className={secondary}>Load</button>
                <button type="button" onClick={() => setSavedProfiles(duplicateSavedProfile(saved.id))} className={secondary}>Duplicate</button>
                <button type="button" onClick={() => setSavedProfiles(deleteSavedProfile(saved.id))} className="text-xs px-2 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    <section className={panel} aria-label="Simulation settings">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("duration", "Fight Length (s)", [60, 180, 300])}
        {field("iterations", "Iterations", [500, 1000, 5000])}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void handleRun()}
          disabled={!profile || profile.status === "unparseable" || running || !validOptions}
          className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:opacity-50">
          {running ? "Simulating..." : "Run Quick Sim"}
        </button>
        {running ? <button type="button" onClick={() => simulationRunner.cancel()}
          className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">Cancel (Esc)</button>
          : <span className="text-xs text-slate-500">Shortcut: Ctrl/Cmd+Enter</span>}
        <button type="button" aria-expanded={showMoreOptions} aria-controls="quick-more-options"
          onClick={() => setShowMoreOptions(value => !value)} className={secondary}>{showMoreOptions ? "Hide Options" : "More Options"}</button>
      </div>
      {showMoreOptions && <div id="quick-more-options" className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
        <div className="grid gap-4 sm:grid-cols-3">
          {field("variancePct", "Duration Variance (%)")}
          {field("latencyMs", "Latency (ms)")}
          {field("seed", "RNG Seed")}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Settings are remembered in this browser. Keep the same seed and encounter settings when comparing runs.</p>
      </div>}
      {!validOptions && <p role="alert" className="text-sm text-rose-500">Use whole numbers within the field limits: fight length 1–600, iterations 1–10000, variance 0–50, latency 0–500, seed 1–2147483647.</p>}
    </section>

    <section className={panel} aria-labelledby="advanced-json-heading">
      <button type="button" aria-expanded={showAdvanced} aria-controls="advanced-json-panel" onClick={() => toggleAdvanced(!showAdvanced)} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h2 id="advanced-json-heading" className="text-base font-semibold">Advanced: Prepared JSON</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Run a MythicSim Forever prepared_v2 JSON payload directly. This is separate from the imported /simc profile.</p>
        </div>
        <span aria-hidden="true" className="text-gold-400">{showAdvanced ? "−" : "+"}</span>
      </button>

      {showAdvanced && (
        <div id="advanced-json-panel" className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <label htmlFor="advanced-json" className="block text-xs text-slate-500 dark:text-slate-400">Prepared_v2 JSON payload</label>
          <textarea id="advanced-json" rows={14} value={advancedJson} disabled={advancedRunning} onChange={(event) => { setAdvancedJson(event.target.value); saveAdvancedDraft(event.target.value); }} placeholder="Paste prepared_v2 JSON here (e.g., from mythicsim-forever-engine/fixtures/...)" className={`${inputClass} font-mono`} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={!advancedJson.trim() || advancedRunning} onClick={() => void handleRunAdvanced()} className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 disabled:opacity-50">
              {advancedRunning ? "Running Prepared JSON…" : "Run Prepared JSON in WASM"}
            </button>
            <p role="status" className="text-xs text-slate-500 dark:text-slate-400">{advancedProgress ? `${advancedProgress.phase}: ${advancedProgress.message}` : advancedMessage}</p>
          </div>
          {advancedResult && <ReportView result={advancedResult} />}
        </div>
      )}
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

      {insights && (
        <section className={panel} aria-label="Simulation result insights">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{insights.headline}</h2>
            {insights.ci && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                insights.ci.stability === "stable"
                  ? "bg-emerald-500/15 text-emerald-500"
                  : insights.ci.stability === "moderate"
                    ? "bg-amber-500/15 text-amber-500"
                    : "bg-rose-500/15 text-rose-500"
              }`}>
                {insights.ci.stability === "stable" ? "Stable" : insights.ci.stability === "moderate" ? "Moderate variance" : "High variance"}
              </span>
            )}
          </div>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {insights.notes.map((note, idx) => <li key={idx}>{note}</li>)}
            {insights.warnings.map((warn, idx) => <li key={`w-${idx}`} className="text-amber-500">{warn}</li>)}
          </ul>
        </section>
      )}

      {comparison && (
        <section className={panel} aria-label="Run comparison verdict">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Comparison vs Selected Baseline</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                comparison.verdict === "clear-upgrade"
                  ? "bg-emerald-500/15 text-emerald-500"
                  : comparison.verdict === "clear-downgrade"
                    ? "bg-rose-500/15 text-rose-500"
                    : "bg-slate-500/15 text-slate-400"
              }`}>
                {comparison.label}
              </span>
              <button type="button" onClick={() => setCompareBaseline(null)} className="text-xs text-slate-400 hover:text-slate-200">Clear</button>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{comparison.explanation}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-2" aria-label="Export and copy report data">
        <button type="button" className={secondary} onClick={() => void copyText("Markdown summary", exportResultToMarkdown(result, options.iterations))}>Copy Markdown</button>
        <button type="button" className={secondary} onClick={downloadCsv}>Export CSV</button>
        <button type="button" className={secondary} onClick={() => void copyText("Raw Input", result.rawInput)}>Copy Raw Input</button>
        <button type="button" className={secondary} onClick={() => void copyText("Raw Engine Output", result.rawOutput)}>Copy Raw Engine Output</button>
      </div>
    </>}

    {history.length > 0 && <section className={panel} aria-label="Recent simulations">
      <div className="flex justify-between items-center gap-2"><h2 className="text-sm font-semibold">Recent Simulations</h2>
        <button type="button" className="text-xs text-slate-400 hover:text-rose-400" onClick={() => {
          try { localStorage.removeItem("foreverbots:history:v1"); setHistory([]); setCompareBaseline(null); }
          catch { setMessage("Browser history could not be cleared."); }
        }}>Clear history</button>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">{history.slice(0, 8).map(item => {
        const selected = result?.jobId === item.jobId;
        const isBaseline = compareBaseline?.jobId === item.jobId;
        const delta = result?.ok && item.ok && result.dps !== undefined && item.dps !== undefined && !selected ? item.dps - result.dps : null;
        return <div key={item.jobId} className={`py-2 px-2 flex flex-wrap justify-between items-center gap-2 text-xs rounded-lg ${selected ? "bg-gold-500/10 text-gold-400" : "hover:bg-slate-100 dark:hover:bg-obsidian-950"}`}>
          <button type="button" onClick={() => setResult(item)} aria-pressed={selected} className="text-left flex-1">
            <span>{item.ok && item.dps !== undefined ? `${item.dps.toLocaleString(undefined, { maximumFractionDigits: 1 })} DPS` : "Failed / Refused"}
              {delta !== null && <span className={`ml-2 font-mono ${delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</span>}
            </span>
            <span className="ml-2 text-slate-500">{item.durationMs}ms • {item.engineVersion}</span>
          </button>
          {result && !selected && item.ok && (
            <button type="button" onClick={() => setCompareBaseline(isBaseline ? null : item)} className={`${secondary} ${isBaseline ? "border-gold-500/60 text-gold-400" : ""}`}>
              {isBaseline ? "Baseline" : "Compare"}
            </button>
          )}
        </div>;
      })}</div>
    </section>}
  </div>;
}
