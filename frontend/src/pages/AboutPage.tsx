import { useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../hooks/useToast";
import { clearLocalData } from "../lib/storage";

const FAQ_ITEMS = [
  { question: "How does ForeverBots simulate my character?", answer: "ForeverBots parses your in-game /simc profile in the browser, prepares it for the MythicSim Forever engine, and runs the simulation locally in a WebAssembly Web Worker. No character data is uploaded to a server." },
  { question: "Why do I need the SimulationCraft Addon?", answer: "The SimulationCraft Addon generates the /simc profile text that ForeverBots imports. Without it, ForeverBots cannot read your character's gear, talents, or stats." },
  { question: "What does 'Partially Unsupported' mean?", answer: "It means your profile parsed successfully, but the engine's coverage gate flagged one or more unsupported items, talents, or mechanics. The simulation may still run, but results could be less accurate." },
  { question: "What does 'Refused' mean?", answer: "It means the engine's coverage gate blocked the simulation entirely because a required mechanic, item, or spec is not yet supported. This prevents misleading numbers rather than returning inaccurate results." },
  { question: "Why do my DPS numbers differ from other simulators?", answer: "ForeverBots uses the MythicSim Forever engine, which is tailored to WoW Forever's specific patch and mechanics. Results can differ from retail-focused simulators like Raidbots because the underlying engine and game data are different." },
  { question: "Is my data stored anywhere?", answer: "No. Everything runs client-side in your browser. Your /simc profile, simulation results, and preferences are stored only in your browser's localStorage and never sent to a server." },
];

export default function AboutPage() {
  const { show } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">About ForeverBots</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Free, client-side combat simulation for World of Warcraft: Forever.</p>
      </div>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-3">
        <h2 className="text-lg font-semibold">How It Works</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">ForeverBots runs the MythicSim Forever engine (a Rust-based combat simulator compiled to WebAssembly) entirely in your browser. Paste your /simc profile, and the engine simulates combat locally in a dedicated Web Worker — no backend, no account, no data upload.</p>
      </section>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-3">
        <h2 className="text-lg font-semibold">Required In-Game Addon</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Install the <strong>SimulationCraft Addon</strong> in-game, type <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-obsidian-950 font-mono text-xs">/simc</code>, and paste the output into the importer on the Sim page. For characters below Level 60, use the Character Sheet Calibration fields to help the engine calibrate your level.</p>
      </section>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-4">
        <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="py-3 group">
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-gold-400 transition-colors">{item.question}</summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-3">
        <h2 className="text-lg font-semibold">Current Limitations</h2>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
          <li>Simulations currently focus on Patchwerk single-target encounters.</li>
          <li>Characters below Level 60 require manual Character Sheet calibration fields.</li>
          <li>Coverage-gated engine rules intentionally refuse unsupported specs, items, or mechanics rather than returning misleading numbers.</li>
          <li>Some less common spell IDs in reports may still appear as Spell #ID until added to the spell-name map.</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-3">
        <h2 className="text-lg font-semibold">Local Data</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">All preferences, saved profiles, simulation history, and drafts are stored only in this browser. You can clear everything at any time.</p>
        <button type="button" onClick={() => setConfirmClear(true)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500">Clear All Local Data</button>
      </section>
      <ConfirmModal open={confirmClear} title="Clear all local data?" message="This will permanently remove your saved profiles, simulation history, preferences, and drafts from this browser. This cannot be undone." confirmLabel="Clear everything" onConfirm={() => { clearLocalData(); setConfirmClear(false); show("All local data cleared."); }} onCancel={() => setConfirmClear(false)} />
    </div>
  );
}
