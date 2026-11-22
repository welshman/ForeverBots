import React, { useState } from "react";
import { parseSimcProfile } from "../lib/simcParser";
import { CharacterSheetData, ParsedSimcProfile } from "../types/simulation";

const SAMPLE_PROFILE = `# WoW Forever Sample Frost Mage
mage="Arcaneweave"
level=60
race=gnome
spec=frost
role=spell
talents=2300050310030000000000000000000000020535023102351301
head=netherwind_crown,id=16914,enchant_id=2544
neck=choker_of_the_fire_lord,id=18814
main_hand=staff_of_the_shadow_flame,id=19356,enchant_id=2504`;

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
    <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Import /simc Profile (SimulationCraft Addon)</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleParse(SAMPLE_PROFILE)}
            className="text-xs px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Load Frost Mage Sample
          </button>
          <label className="text-xs px-3 py-1.5 rounded-md bg-arcane-600 text-white cursor-pointer hover:bg-arcane-500">
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
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-arcane-500"
      />

      {profile && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {profile.characterName || "Unnamed"} — Level {profile.level} {profile.race}{" "}
              {profile.spec} {profile.className}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                profile.status === "supported"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : profile.status === "partially-unsupported"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {profile.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Parsed gear slots: {profile.gear.length}
          </p>

          {profile.level < 60 && (
            <div className="rounded-lg border border-arcane-500/40 bg-arcane-500/10 p-3 space-y-3">
              <div className="text-xs text-arcane-300">
                <strong>Level {profile.level} Character Sheet Calibration:</strong> The SimulationCraft
                addon works directly for Level 60 characters. For characters below Level 60, enter your
                in-game Character Sheet numbers below so the MythicSim Forever engine can calibrate your
                level without needing a different addon.
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="space-y-1">
                  <span className="block text-slate-400">Health</span>
                  <input
                    type="number"
                    value={sheet.health}
                    onChange={(e) =>
                      handleSheetChange({ ...sheet, health: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-slate-400">Mana</span>
                  <input
                    type="number"
                    value={sheet.mana}
                    onChange={(e) =>
                      handleSheetChange({ ...sheet, mana: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-slate-400">Melee Crit %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={sheet.meleeCrit}
                    onChange={(e) =>
                      handleSheetChange({ ...sheet, meleeCrit: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-slate-400">Spell Crit %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={sheet.spellCrit}
                    onChange={(e) =>
                      handleSheetChange({ ...sheet, spellCrit: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </label>
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {STAT_LABELS.map((label, i) => (
                  <label key={label} className="space-y-1">
                    <span className="block text-slate-400">Total {label}</span>
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
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
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
