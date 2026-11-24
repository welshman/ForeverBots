import { ParsedSimcProfile, SimulationResult } from "../types/simulation";

export interface ConfidenceInterval {
  mean: number;
  low: number;
  high: number;
  margin: number;
  relativeHalfWidthPct: number;
  stability: "very-stable" | "stable" | "moderate" | "high-variance" | "very-high-variance";
}

export interface ResultInsights {
  headline: string;
  ci: ConfidenceInterval | null;
  notes: string[];
  warnings: string[];
}

export interface ComparisonVerdict {
  deltaDps: number;
  deltaPct: number;
  verdict: "clear-upgrade" | "clear-downgrade" | "within-noise" | "inconclusive";
  label: string;
  explanation: string;
}

export interface PreflightIssue {
  severity: "error" | "warning";
  message: string;
}

export function formatDps(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value) || value < 0) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function computeConfidenceInterval(mean: number, stdDev: number | undefined, iterations: number): ConfidenceInterval | null {
  if (!Number.isFinite(mean) || mean <= 0 || stdDev === undefined || !Number.isFinite(stdDev) || stdDev < 0 || iterations < 2) return null;
  const se = stdDev / Math.sqrt(iterations);
  const margin = 1.96 * se;
  const relativeHalfWidthPct = (margin / mean) * 100;
  let stability: ConfidenceInterval["stability"] = "stable";
  if (relativeHalfWidthPct > 5) stability = "very-high-variance";
  else if (relativeHalfWidthPct > 1.5) stability = "high-variance";
  else if (relativeHalfWidthPct > 0.5) stability = "moderate";
  else if (relativeHalfWidthPct < 0.25) stability = "very-stable";
  return { mean, low: Math.max(0, mean - margin), high: mean + margin, margin, relativeHalfWidthPct, stability };
}

export function summarizeResult(result: SimulationResult, iterations: number): ResultInsights {
  const mean = result.dps ?? result.statistics.mean;
  const stdDev = result.statistics.stdDev;
  const ci = computeConfidenceInterval(mean, stdDev, iterations);
  const notes: string[] = [];
  const warnings: string[] = [];
  const headline = Number.isFinite(mean) ? `Mean DPS is ${formatDps(mean)}` : "Simulation completed without a numeric DPS headline";
  if (ci) {
    notes.push(`95% confidence interval: ${formatDps(ci.low)} – ${formatDps(ci.high)} DPS (±${formatDps(ci.margin)} DPS, ±${ci.relativeHalfWidthPct.toFixed(2)}%).`);
    if (ci.stability === "very-stable") notes.push("Results are extremely stable for comparing even very small changes.");
    else if (ci.stability === "stable") notes.push("Results are statistically stable for comparing small gear or talent changes.");
    else if (ci.stability === "moderate") notes.push("Moderate variance: consider increasing iterations to 2,500–5,000 for tight upgrades.");
    else if (ci.stability === "high-variance") warnings.push("High variance detected: increase iterations before trusting small DPS differences.");
    else warnings.push("Very high variance detected: results are unreliable for comparisons. Increase iterations substantially.");
  } else if (iterations < 100) {
    warnings.push("Low iteration count: run at least 500–1,000 iterations for reliable averages.");
  }
  if (result.statistics.min !== undefined && result.statistics.max !== undefined) {
    notes.push(`Observed range across iterations: ${formatDps(result.statistics.min)} to ${formatDps(result.statistics.max)} DPS.`);
  }
  return { headline, ci, notes, warnings };
}

export function compareResults(baseline: SimulationResult, candidate: SimulationResult, iterations: number): ComparisonVerdict {
  const baseDps = baseline.dps ?? baseline.statistics.mean;
  const candDps = candidate.dps ?? candidate.statistics.mean;
  if (!baseline.ok || !candidate.ok || !Number.isFinite(baseDps) || !Number.isFinite(candDps) || baseDps <= 0) {
    return { deltaDps: 0, deltaPct: 0, verdict: "inconclusive", label: "Inconclusive", explanation: "Both runs must succeed with valid DPS values to compare." };
  }
  const deltaDps = candDps - baseDps;
  const deltaPct = (deltaDps / baseDps) * 100;
  const baseSd = baseline.statistics.stdDev;
  const candSd = candidate.statistics.stdDev;
  if (baseSd !== undefined && candSd !== undefined && iterations >= 2) {
    const combinedSe = Math.sqrt((baseSd * baseSd + candSd * candSd) / iterations);
    const threshold = 1.96 * combinedSe;
    if (Math.abs(deltaDps) <= threshold) {
      return { deltaDps, deltaPct, verdict: "within-noise", label: "Within simulation noise", explanation: `The ${deltaDps >= 0 ? "+" : ""}${formatDps(deltaDps)} DPS (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(2)}%) difference is smaller than the 95% combined margin of error (±${formatDps(threshold)} DPS).` };
    }
  }
  const significanceNote = baseSd === undefined || candSd === undefined ? " Statistical significance could not be assessed because one or both runs lack standard deviation data." : "";
  if (deltaDps > 0) {
    return { deltaDps, deltaPct, verdict: "clear-upgrade", label: "Clear upgrade", explanation: `Current run is +${formatDps(deltaDps)} DPS (+${deltaPct.toFixed(2)}%) higher than the baseline run.${significanceNote}` };
  }
  return { deltaDps, deltaPct, verdict: "clear-downgrade", label: "Clear downgrade", explanation: `Current run is ${formatDps(deltaDps)} DPS (${deltaPct.toFixed(2)}%) lower than the baseline run.${significanceNote}` };
}

export function compareMultipleBaselines(baseline: SimulationResult, candidates: SimulationResult[], iterations: number): ComparisonVerdict[] {
  return candidates.map(c => compareResults(baseline, c, iterations));
}

export function validateProfilePreflight(profile: ParsedSimcProfile | null): PreflightIssue[] {
  if (!profile) return [];
  const issues: PreflightIssue[] = [];
  if (profile.status === "unparseable") issues.push({ severity: "error", message: "Profile could not be parsed. Paste the full output from the in-game /simc addon." });
  if (!profile.className || !profile.spec) issues.push({ severity: "error", message: "Missing class or specialization. Ensure the top lines of your /simc export are included." });
  if (profile.gear.length === 0) issues.push({ severity: "warning", message: "No equipped gear lines were detected in this profile." });
  if (profile.level > 0 && profile.level < 60 && !profile.characterSheet) issues.push({ severity: "warning", message: `Character is Level ${profile.level}. Fill in the Character Sheet Calibration fields for accurate scaling.` });
  if (profile.status === "partially-unsupported") issues.push({ severity: "warning", message: "Some items, talents, or mechanics in this profile are flagged as partially unsupported." });
  return issues;
}

export function exportResultToMarkdown(result: SimulationResult, iterations: number): string {
  const mean = result.dps ?? result.statistics.mean;
  const ci = computeConfidenceInterval(mean, result.statistics.stdDev, iterations);
  const rows = [
    "| Metric | Value |",
    "|---|---|",
    `| Mean DPS | ${formatDps(mean)} |`,
    ...(ci ? [`| 95% CI | ${formatDps(ci.low)} – ${formatDps(ci.high)} (±${formatDps(ci.margin)}) |`] : []),
    ...(result.statistics.min !== undefined ? [`| Min DPS | ${formatDps(result.statistics.min)} |`] : []),
    ...(result.statistics.max !== undefined ? [`| Max DPS | ${formatDps(result.statistics.max)} |`] : []),
    ...(result.statistics.stdDev !== undefined ? [`| Std Dev | ${formatDps(result.statistics.stdDev)} |`] : []),
    `| Engine | ${result.engineVersion} |`,
    `| Runtime | ${result.durationMs} ms |`,
  ];
  return `### ForeverBots Quick Sim Result\n\n${rows.join("\n")}\n`;
}

export function exportResultToCsv(result: SimulationResult, iterations: number): string {
  const mean = result.dps ?? result.statistics.mean;
  const ci = computeConfidenceInterval(mean, result.statistics.stdDev, iterations);
  const headers = ["jobId", "ok", "meanDps", "ciLow", "ciHigh", "minDps", "maxDps", "stdDev", "iterations", "durationMs", "engineVersion"];
  const values = [
    result.jobId, String(result.ok), mean.toFixed(2),
    ci ? ci.low.toFixed(2) : "", ci ? ci.high.toFixed(2) : "",
    result.statistics.min !== undefined ? result.statistics.min.toFixed(2) : "",
    result.statistics.max !== undefined ? result.statistics.max.toFixed(2) : "",
    result.statistics.stdDev !== undefined ? result.statistics.stdDev.toFixed(2) : "",
    String(iterations), String(result.durationMs), result.engineVersion,
  ];
  return `${headers.join(",")}\n${values.map(v => `"${v.replace(/"/g, '""')}"`).join(",")}\n`;
}
