const PRESETS_KEY = "foreverbots:sim_presets:v1";

export interface SimPreset {
  id: string;
  name: string;
  duration: number;
  iterations: number;
  variancePct: number;
  latencyMs: number;
  seed: number;
}

export function loadPresets(): SimPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((p): p is SimPreset => Boolean(p) && typeof (p as SimPreset).id === "string" && typeof (p as SimPreset).name === "string") : [];
  } catch { return []; }
}

function persist(presets: SimPreset[]): void {
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.slice(0, 20))); } catch { /* storage unavailable */ }
}

export function savePreset(name: string, options: Omit<SimPreset, "id" | "name">): SimPreset[] {
  const preset: SimPreset = { id: crypto.randomUUID(), name: name.trim() || "Preset", ...options };
  const next = [preset, ...loadPresets()];
  persist(next);
  return next;
}

export function deletePreset(id: string): SimPreset[] {
  const next = loadPresets().filter(p => p.id !== id);
  persist(next);
  return next;
}
