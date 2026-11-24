const VERSION_KEY = "foreverbots:storage_version";
const CURRENT_VERSION = 2;

export function migrateStorage(): void {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    const version = raw ? Number(raw) : 0;
    if (version >= CURRENT_VERSION) return;
    if (version < 2) {
      const oldHistory = localStorage.getItem("foreverbots:history");
      if (oldHistory && !localStorage.getItem("foreverbots:history:v1")) {
        localStorage.setItem("foreverbots:history:v1", oldHistory);
        localStorage.removeItem("foreverbots:history");
      }
    }
    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
  } catch { /* storage unavailable */ }
}

export function getStorageVersion(): number {
  try { return Number(localStorage.getItem(VERSION_KEY) ?? "0"); } catch { return 0; }
}
