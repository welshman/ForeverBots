import React, { useState } from "react";
import { parseSimcProfile } from "../lib/simcParser";
import { ParsedSimcProfile } from "../types/simulation";

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

interface SimcImporterProps {
  onParsed: (profile: ParsedSimcProfile) => void;
}

export default function SimcImporter({ onParsed }: SimcImporterProps) {
  const [text, setText] = useState("");
  const [profile, setProfile] = useState<ParsedSimcProfile | null>(null);

  const handleParse = (value: string) => {
    setText(value);
    if (!value.trim()) {
      setProfile(null);
      return;
    }
    const parsed = parseSimcProfile(value);
    setProfile(parsed);
    onParsed(parsed);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(handleParse);
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Import /simc Profile</h2>
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
        placeholder="Paste your WoW Forever /simc output here..."
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-arcane-500"
      />

      {profile && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm space-y-2">
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
