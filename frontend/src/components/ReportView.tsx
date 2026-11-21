import { useState } from "react";
import { SimulationResult } from "../types/simulation";

const TABS = ["Overview", "Raw Input", "Raw Output", "Diagnostics"] as const;

export default function ReportView({ result }: { result: SimulationResult }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                tab === t
                  ? "bg-arcane-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">
          Engine: {result.engineVersion} • {result.durationMs}ms
        </span>
      </div>

      {tab === "Overview" && (
        <div className="space-y-4">
          {result.ok ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500">Average DPS</div>
                <div className="text-2xl font-bold text-arcane-400">
                  {result.dps !== undefined ? result.dps.toFixed(1) : "—"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500">Std Dev</div>
                <div className="text-xl font-semibold">
                  {result.statistics.stdDev?.toFixed(1) ?? "—"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500">Min DPS</div>
                <div className="text-xl font-semibold">
                  {result.statistics.min?.toFixed(1) ?? "—"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500">Max DPS</div>
                <div className="text-xl font-semibold">
                  {result.statistics.max?.toFixed(1) ?? "—"}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-rose-400">
                Simulation Refused or Failed
              </h3>
              <ul className="text-xs space-y-1 text-rose-300">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    <span className="font-mono">[{e.code}]</span> {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "Raw Input" && (
        <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-lg overflow-auto max-h-96">
          {result.rawInput}
        </pre>
      )}

      {tab === "Raw Output" && (
        <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-lg overflow-auto max-h-96">
          {result.rawOutput || "(empty)"}
        </pre>
      )}

      {tab === "Diagnostics" && (
        <div className="text-xs space-y-2">
          <div>Job ID: {result.jobId}</div>
          <div>Status: {result.ok ? "OK" : "FAILED / REFUSED"}</div>
          <div>Warnings: {result.warnings.length}</div>
          <div>Errors: {result.errors.length}</div>
        </div>
      )}
    </div>
  );
}
