import React, { useEffect, useState } from "react";
import { parseSimcProfile } from "../lib/simcParser";
import { CharacterSheetData, ParsedSimcProfile } from "../types/simulation";

const LAST_SIMC_KEY = "foreverbots:last_simc:v1";

const DEFAULT_SHEET: CharacterSheetData = {
  base: [35, 35, 45, 55, 55],
  attributes: [40, 40, 80, 95, 85],
  health: 1200,
  mana: 1800,
  meleeCrit: 5,
  spellCrit: 6,
};

const STAT_LABELS = ["Str", "Agi", "Sta", "Int", "Spi"] as const;

interface SimcImporterProps {
  onParsed: (profile: ParsedSimcProfile) => void;
}

export default function SimcImporter({ onParsed }: SimcImporterProps) {
  const [text, setText] = useState("");
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);
  const [sheet, setSheet] = useState<CharacterSheetData>(DEFAULT_SHEET);

  const emitProfile = (baseProfile: ParsedSimcProfile, currentSheet: CharacterSheetData) => {
    const next: ParsedSimcProfile =
      baseProfile.level < 60
        ? { ...baseProfile, characterSheet: baseProfile.characterSheet ?? currentSheet }
        : baseProfile;
    setProfile(next);
    onParsed(next);
  };

  const handleParse = (value: string) => {
    setText(value);
    try {
      if (value.trim()) {
        localStorage.setItem(LAST_SIMC_KEY, value);
      } else {
        localStorage.removeItem(LAST_SIMC_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
    if (!value.trim()) {
      setProfile(null);
      return;
    }
    const parsed = parseSimcProfile(value);
    if (parsed.characterSheet) {
      setSheet(parsed.characterSheet);
    }
    emitProfile(parsed, parsed.characterSheet ?? sheet);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_SIMC_KEY);
      if (saved && saved.trim()) {
        handleParse(saved);
      }
    } catch {
      /* ignore storage errors */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSheetChange = (updated: CharacterSheetData) => {
    setSheet(updated);
    if (profile) {
      emitProfile({ ...profile, characterSheet: updated }, updated);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(handleParse);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5">
      <div className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-3.5 py-2.5 text-xs text-slate-700 dark:text-gold-300">
        <strong>Required Addon:</strong> Use the <strong>SimulationCraft Addon</strong> in-game and
        type{" "}
        <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-obsidian-950 font-mono">
          /simc
        </code>{" "}
        to copy your profile.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Import /simc Profile (SimulationCraft Addon)</h2>
        <div className="flex items-center gap-2">
          {text && (
            <button
              type="button"
              onClick={() => handleParse("")}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-500/50 hover:text-rose-400 transition-colors"
            >
              Clear
            </button>
          )}
          <label className="text-xs px-3 py-1.5 rounded-lg bg-gold-500 text-obsidian-950 font-semibold cursor-pointer hover:bg-gold-400 transition-colors">
            Upload .simc
            <input type="file" accept=".simc,.txt" onChange={handleFile} className="hidden" />
          </label>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => handleParse(e.target.value)}
        rows={8}
        placeholder="Paste your WoW Forever /simc output from the SimulationCraft addon here..."
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/70"
      />

      {profile && (
        <div className="rounded-2xl border border-slate-200 dark:border-gold-500/20 bg-slate-50/70 dark:bg-obsidian-950/70 p-4 text-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {profile.characterName || "Unnamed"} — Level {profile.level} {profile.race}{" "}
              {profile.spec} {profile.className}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                profile.status === "supported"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : profile.status === "partially-unsupported"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {profile.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Parsed gear slots: {profile.gear.length}
          </p>

          {profile.level < 60 && (
            <div className="rounded-xl border border-gold-500/35 bg-gold-500/10 p-4 space-y-3">
              <div className="text-xs text-slate-700 dark:text-gold-300 leading-relaxed">
                <strong>Level {profile.level} Character Sheet Calibration:</strong> The SimulationCraft
                addon works directly for Level 60 characters. For characters below Level 60, enter your
                in-game Character Sheet numbers below so the MythicSim Forever engine can calibrate your
                level without needing a different addon.
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <label className="space-y-1">
                  <span className="block text-slate-500 dark:text-slate-400">Health</span>
                  <input
                    type="number"
                    value={sheet.health}
                    onChange={(e) =>
                      handleSheetChange({ ...sheet, health: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/70"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-slate-500 dark:text-slate-400">Mana</span>
                  <input
                    type="number"
                    value={sheet.mana}
                    onChange={(e) =>
                      handleSheetChange({ ...sheet, mana: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/70"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-slate-500 dark:text-slate-400">Melee Crit %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={sheet.meleeCrit}
                    onChange={(e) =>
                      handleSheetChange({ ...sheet, meleeCrit: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/70"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-slate-500 dark:text-slate-400">Spell Crit %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={sheet.spellCrit}
                    onChange={(e) =>
                      handleSheetChange({ ...sheet, spellCrit: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/70"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {STAT_LABELS.map((label, i) => (
                  <label key={label} className="space-y-1">
                    <span className="block text-slate-500 dark:text-slate-400">Total {label}</span>
                    <input
                      type="number"
                      value={sheet.attributes[i]}
                      onChange={(e) => {
                        const nextAttr = [...sheet.attributes] as [
                          number,
                          number,
                          number,
                          number,
                          number
                        ];
                        nextAttr[i] = Number(e.target.value) || 0;
                        handleSheetChange({ ...sheet, attributes: nextAttr });
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-obsidian-950 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/70"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {profile.issues.length > 0 && (
            <ul className="text-xs space-y-1 text-amber-500">
              {profile.issues.map((issue, idx) => (
                <li key={idx}>
                  Line {issue.line} ({issue.severity}): {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
