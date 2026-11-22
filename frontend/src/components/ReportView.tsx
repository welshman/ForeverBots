import { useMemo, useState } from "react";
import { SimulationResult } from "../types/simulation";

interface ReportViewProps {
  result: SimulationResult;
}

interface ActionRow {
  label: string;
  schoolColor: string;
  damage: number;
  dps: number;
  pct: number;
  casts: number;
  hits: number;
  crits: number;
  critPct: number;
}

interface AuraRow {
  label: string;
  uptimePct: number;
  procs: number;
  kind: "Buff" | "Debuff";
}

const SPELL_NAMES: Record<number, string> = {
  116: "Frostbolt",
  25304: "Frostbolt",
  25306: "Fireball",
  25307: "Shadow Bolt",
  25309: "Corruption",
  25311: "Immolate",
  25345: "Arcane Missiles",
  25346: "Arcane Missiles (Tick)",
  1239700: "Arcane Blast",
  10947: "Mind Blast",
  25298: "Starfire",
  15208: "Lightning Bolt",
  20904: "Aimed Shot",
  20271: "Judgement",
  11294: "Sinister Strike",
  23894: "Bloodthirst",
  12042: "Arcane Power",
  12043: "Presence of Mind",
  12051: "Evocation",
  1311680: "Curse of Elements",
};

function schoolBarColor(school?: number): string {
  switch (school) {
    case 1:
      return "bg-amber-400"; // Physical
    case 2:
      return "bg-yellow-300"; // Holy
    case 4:
      return "bg-orange-500"; // Fire
    case 8:
      return "bg-emerald-400"; // Nature
    case 16:
      return "bg-sky-400"; // Frost
    case 32:
      return "bg-purple-500"; // Shadow
    case 64:
      return "bg-cyan-400"; // Arcane
    default:
      return "bg-indigo-400";
  }
}

function formatActionKey(rawKey: string): string {
  try {
    const k = JSON.parse(rawKey) as {
      spellId?: number;
      itemId?: number;
      otherId?: string;
    };
    if (k.spellId) return SPELL_NAMES[k.spellId] ?? `Spell #${k.spellId}`;
    if (k.itemId) return `Item #${k.itemId}`;
    if (k.otherId) return k.otherId.replace(/^OtherAction/, "");
  } catch {
    // fall through
  }
  return rawKey;
}

export default function ReportView({ result }: ReportViewProps) {
  const [showRawInput, setShowRawInput] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const parsedDetails = useMemo(() => {
    if (!result.ok || !result.rawOutput) return null;
    try {
      const outer = JSON.parse(result.rawOutput);
      const rep = outer.report?.result ?? outer.report ?? outer;
      const iterations = Number(rep.iterationsDone) || 1;
      const avgDuration = Number(rep.avgIterationDuration) || 1;
      const player = rep.raidMetrics?.parties?.[0]?.players?.[0];
      const target = rep.encounterMetrics?.targets?.[0];

      const actionRows: ActionRow[] = [];
      let totalDamage = 0;

      if (player?.actions && typeof player.actions === "object") {
        for (const [key, metric] of Object.entries<Record<string, unknown>>(player.actions)) {
          const targets = Array.isArray(metric.targets) ? metric.targets : [];
          let dmg = 0;
          let casts = 0;
          let hits = 0;
          let crits = 0;
          for (const t of targets as Record<string, number>[]) {
            dmg += Number(t.damage ?? 0);
            casts += Number(t.casts ?? 0);
            hits += Number(t.hits ?? 0);
            crits += Number(t.crits ?? 0);
          }
          if (dmg > 0) {
            const avgDmg = dmg / iterations;
            totalDamage += avgDmg;
            const totalLanded = hits + crits;
            actionRows.push({
              label: formatActionKey(key),
              schoolColor: schoolBarColor(Number(metric.spellSchool)),
              damage: avgDmg,
              dps: avgDmg / avgDuration,
              pct: 0,
              casts: casts / iterations,
              hits: totalLanded / iterations,
              crits: crits / iterations,
              critPct: totalLanded > 0 ? (crits / totalLanded) * 100 : 0,
            });
          }
        }
      }

      for (const row of actionRows) {
        row.pct = totalDamage > 0 ? (row.damage / totalDamage) * 100 : 0;
      }
      actionRows.sort((a, b) => b.damage - a.damage);

      const auraRows: AuraRow[] = [];
      const collectAuras = (
        source: Record<string, Record<string, unknown>> | undefined,
        kind: "Buff" | "Debuff"
      ) => {
        if (!source || typeof source !== "object") return;
        for (const [key, metric] of Object.entries(source)) {
          const uptime = Number(metric.uptimeSecondsAvg ?? 0);
          if (uptime <= 0) continue;
          auraRows.push({
            label: formatActionKey(key),
            uptimePct: Math.min(100, (uptime / avgDuration) * 100),
            procs: Number(metric.procsAvg ?? 0),
            kind,
          });
        }
      };

      collectAuras(player?.auras, "Buff");
      collectAuras(target?.auras, "Debuff");
      auraRows.sort((a, b) => b.uptimePct - a.uptimePct);

      const logLines =
        typeof rep.logs === "string"
          ? rep.logs
              .split("\n")
              .map((l: string) => l.trim())
              .filter(Boolean)
              .slice(0, 40)
          : [];

      return {
        playerName: player?.name ?? "Character",
        iterations,
        avgDuration,
        actionRows,
        auraRows: auraRows.slice(0, 20),
        logLines,
      };
    } catch {
      return null;
    }
  }, [result]);

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Simulation Refused or Failed</div>
          <div className="text-xs text-slate-400">
            Engine: {result.engineVersion} • {result.durationMs}ms
          </div>
        </div>
        {result.errors.map((e, i) => (
          <div key={i}>
            [{e.code}] {e.message}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner + Simulation Details Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Quick Sim Result</div>
              <div className="text-xl font-bold mt-0.5">
                {parsedDetails?.playerName ?? "Character"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-extrabold tracking-tight text-arcane-400">
                {result.dps !== undefined
                  ? `${Math.round(result.dps).toLocaleString()} DPS`
                  : "—"}
              </div>
              {result.statistics.stdDev !== undefined && (
                <div className="text-xs text-slate-400 mt-1">
                  ±{result.statistics.stdDev.toFixed(1)} σ • Min{" "}
                  {result.statistics.min?.toFixed(0) ?? "—"} • Max{" "}
                  {result.statistics.max?.toFixed(0) ?? "—"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-xs space-y-2">
          <div className="font-semibold text-sm text-slate-200 border-b border-slate-800 pb-2">
            Simulation Details
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Fight Style</span>
            <span className="font-medium">Patchwerk</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Avg Duration</span>
            <span className="font-mono">
              {parsedDetails ? `${parsedDetails.avgDuration.toFixed(1)}s` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Iterations</span>
            <span className="font-mono">
              {parsedDetails?.iterations.toLocaleString() ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Processing Time</span>
            <span className="font-mono">{result.durationMs}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Engine</span>
            <span className="font-mono">{result.engineVersion}</span>
          </div>
        </div>
      </div>

      {/* Damage Breakdown */}
      {parsedDetails && parsedDetails.actionRows.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-sm">
            Damage Breakdown
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">Ability</th>
                  <th className="py-2 px-2 text-right">%</th>
                  <th className="py-2 px-3 w-1/3">Amount</th>
                  <th className="py-2 px-2 text-right">Avg Damage</th>
                  <th className="py-2 px-2 text-right">DPS</th>
                  <th className="py-2 px-2 text-right">Casts</th>
                  <th className="py-2 pl-2 text-right">Crit %</th>
                </tr>
              </thead>
              <tbody>
                {parsedDetails.actionRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50">
                    <td className="py-2 pr-3 font-medium text-slate-200">{row.label}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-300">
                      {row.pct.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-slate-800 rounded h-2.5 overflow-hidden">
                        <div
                          className={`h-full ${row.schoolColor}`}
                          style={{ width: `${Math.max(1, Math.min(100, row.pct))}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      {Math.round(row.damage).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">{row.dps.toFixed(1)}</td>
                    <td className="py-2 px-2 text-right font-mono">{row.casts.toFixed(1)}</td>
                    <td className="py-2 pl-2 text-right font-mono">{row.critPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Buff & Debuff Uptime */}
      {parsedDetails && parsedDetails.auraRows.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-sm">
            Buff &amp; Debuff Uptime
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">Aura</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2 text-right">Uptime</th>
                  <th className="py-2 px-3 w-1/3">Bar</th>
                  <th className="py-2 pl-2 text-right">Procs / Count</th>
                </tr>
              </thead>
              <tbody>
                {parsedDetails.auraRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50">
                    <td className="py-2 pr-3 font-medium text-slate-200">{row.label}</td>
                    <td className="py-2 px-2 text-slate-400">{row.kind}</td>
                    <td className="py-2 px-2 text-right font-mono">{row.uptimePct.toFixed(1)}%</td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-slate-800 rounded h-2.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            row.kind === "Buff" ? "bg-indigo-400" : "bg-rose-400"
                          }`}
                          style={{ width: `${Math.max(1, row.uptimePct)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2 pl-2 text-right font-mono">{row.procs.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sample Ability Log */}
      {parsedDetails && parsedDetails.logLines.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-sm">
            Sample Ability Log
          </div>
          <div className="p-5 space-y-3">
            <div className="rounded-md bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-xs text-amber-200 font-medium">
              This is a sample of 1 iteration, it is not a guide on how to play your character.
              Analyze with care.
            </div>
            <pre className="text-[11px] font-mono bg-slate-950 text-slate-300 p-3 rounded-lg overflow-auto max-h-72">
              {parsedDetails.logLines.join("\n")}
            </pre>
          </div>
        </div>
      )}

      {/* Collapsible Raw Input & Output Drawers */}
      <div className="space-y-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRawInput((v) => !v)}
            className="w-full px-5 py-3 text-left text-sm font-medium flex justify-between items-center"
          >
            <span>Raw Input</span>
            <span className="text-xs text-slate-400">{showRawInput ? "▲" : "▼"}</span>
          </button>
          {showRawInput && (
            <pre className="p-4 text-xs bg-slate-950 text-slate-300 overflow-auto max-h-96 border-t border-slate-800">
              {result.rawInput}
            </pre>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRawOutput((v) => !v)}
            className="w-full px-5 py-3 text-left text-sm font-medium flex justify-between items-center"
          >
            <span>Raw Engine Output</span>
            <span className="text-xs text-slate-400">{showRawOutput ? "▲" : "▼"}</span>
          </button>
          {showRawOutput && (
            <pre className="p-4 text-xs bg-slate-950 text-slate-300 overflow-auto max-h-96 border-t border-slate-800">
              {result.rawOutput}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
