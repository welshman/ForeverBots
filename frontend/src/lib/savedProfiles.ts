import { ParsedSimcProfile } from "../types/simulation";

const SAVED_PROFILES_KEY = "foreverbots:saved_profiles:v1";

export interface SavedProfile {
  id: string;
  name: string;
  rawText: string;
  className: string;
  spec: string;
  level: number;
  savedAt: string;
}

export function loadSavedProfiles(): SavedProfile[] {
  try {
    const raw = localStorage.getItem(SAVED_PROFILES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedProfile =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as SavedProfile).id === "string" &&
        typeof (item as SavedProfile).name === "string" &&
        typeof (item as SavedProfile).rawText === "string"
    );
  } catch {
    return [];
  }
}

function persist(profiles: SavedProfile[]): void {
  localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(profiles.slice(0, 20)));
}

export function saveProfile(name: string, profile: ParsedSimcProfile): SavedProfile[] {
  const trimmed = name.trim() || profile.characterName || "Unnamed Profile";
  const next: SavedProfile = {
    id: crypto.randomUUID(),
    name: trimmed,
    rawText: profile.rawText,
    className: profile.className,
    spec: profile.spec,
    level: profile.level,
    savedAt: new Date().toISOString(),
  };
  const updated = [next, ...loadSavedProfiles()];
  persist(updated);
  return updated;
}

export function deleteSavedProfile(id: string): SavedProfile[] {
  const updated = loadSavedProfiles().filter(p => p.id !== id);
  persist(updated);
  return updated;
}

export function duplicateSavedProfile(id: string): SavedProfile[] {
  const list = loadSavedProfiles();
  const target = list.find(p => p.id === id);
  if (!target) return list;
  const copy: SavedProfile = {
    ...target,
    id: crypto.randomUUID(),
    name: `${target.name} (Copy)`,
    savedAt: new Date().toISOString(),
  };
  const updated = [copy, ...list];
  persist(updated);
  return updated;
}
