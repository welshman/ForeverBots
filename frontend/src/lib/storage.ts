import { SimulationResult } from "../types/simulation";
import { migrateStorage } from "./storageVersioning";

const PREFS_KEY = "foreverbots:prefs:v1";
const HISTORY_KEY = "foreverbots:history:v1";
const DRAFT_KEY = "foreverbots:advanced_draft:v1";

export const HISTORY_CAP = 50;

export interface UserPreferences {
  theme: "dark" | "light";
  defaultIterations: number;
  defaultDuration: number;
}

export function loadPreferences(): UserPreferences {
  migrateStorage();
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { theme: "dark", defaultIterations: 1000, defaultDuration: 180 };
    return { theme: "dark", defaultIterations: 1000, defaultDuration: 180, ...JSON.parse(raw) };
  } catch {
    return { theme: "dark", defaultIterations: 1000, defaultDuration: 180 };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
}

export function loadHistory(): SimulationResult[] {
  migrateStorage();
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SimulationResult[]) : [];
  } catch { return []; }
}

export function appendHistory(result: SimulationResult): void {
  const existing = loadHistory();
  const next = [result, ...existing].slice(0, HISTORY_CAP);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
}

export function loadAdvancedDraft(): string {
  migrateStorage();
  try { return localStorage.getItem(DRAFT_KEY) ?? ""; } catch { return ""; }
}

export function saveAdvancedDraft(draft: string): void {
  try { localStorage.setItem(DRAFT_KEY, draft); } catch { /* storage unavailable */ }
}

export function clearLocalData(): void {
  try {
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem("foreverbots:saved_profiles:v1");
    localStorage.removeItem("foreverbots:sim_presets:v1");
    localStorage.removeItem("foreverbots:storage_version");
  } catch { /* storage unavailable */ }
}
