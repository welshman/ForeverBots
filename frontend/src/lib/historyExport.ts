import type { SimulationResult } from "../types/simulation";

export function exportHistoryToCsv(history: SimulationResult[]): string {
  const headers = ["jobId", "ok", "dps", "mean", "min", "max", "stdDev", "durationMs", "engineVersion"];
  const rows = history.map(r => [
    r.jobId, String(r.ok),
    r.dps !== undefined ? r.dps.toFixed(2) : "",
    r.statistics.mean.toFixed(2),
    r.statistics.min !== undefined ? r.statistics.min.toFixed(2) : "",
    r.statistics.max !== undefined ? r.statistics.max.toFixed(2) : "",
    r.statistics.stdDev !== undefined ? r.statistics.stdDev.toFixed(2) : "",
    String(r.durationMs), r.engineVersion,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function exportHistoryToJson(history: SimulationResult[]): string {
  return JSON.stringify(history, null, 2);
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
