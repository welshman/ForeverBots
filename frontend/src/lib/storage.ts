import { SimulationResult } from "../types/simulation";

const PREFS_KEY = "foreverbots:prefs:v1";
const HISTORY_KEY = "foreverbots:history:v1";
const DRAFT_KEY = "foreverbots:advanced_draft:v1";

export interface UserPreferences {
  theme: "dark" | "light";
  defaultIterations: number;
  defaultDuration: number;
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { theme: "dark", defaultIterations: 1000, defaultDuration: 180 };
    return { theme: "dark", defaultIterations: 1000, defaultDuration: 180, ...JSON.parse(raw) };
  } catch {
    return { theme: "dark", defaultIterations: 1000, defaultDuration: 180 };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function loadHistory(): SimulationResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SimulationResult[]) : [];
  } catch {
    return [];
  }
}

export function appendHistory(result: SimulationResult): void {
  const existing = loadHistory();
  const next = [result, ...existing].slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function loadAdvancedDraft(): string {
  return localStorage.getItem(DRAFT_KEY) ?? "";
}

export function saveAdvancedDraft(draft: string): void {
  localStorage.setItem(DRAFT_KEY, draft);
}

export function clearLocalData(): void {
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(DRAFT_KEY);
}
