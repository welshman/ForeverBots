import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="rounded-2xl border border-gold-500/30 bg-white/80 dark:bg-obsidian-900/80 p-6 sm:p-8 space-y-3">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gold-500">
          About ForeverBots
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Browser-Based Simulation for World of Warcraft Forever
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          ForeverBots is a free, client-side combat simulator built for World of Warcraft Forever.
          It compiles the Rust MythicSim Forever engine to WebAssembly and runs simulations
          directly inside your browser using a Web Worker—no account, queue, or external server
          required.
        </p>
      </section>

      <section className="rounded-2xl border border-gold-500/40 bg-gold-500/10 p-6 space-y-2">
        <h2 className="text-lg font-semibold text-gold-400">Required In-Game Addon</h2>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          ForeverBots uses exports from the <strong>SimulationCraft Addon</strong> (type{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-obsidian-950 font-mono text-xs">
            /simc
          </code>{" "}
          in-game and copy the output). Exports from other addons—such as WoWSims Exporter, Pawn,
          or SeventyUpgrades—use different formats and will not work on this site.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-obsidian-900/80 p-6 space-y-3">
          <h2 className="text-lg font-semibold">Available Tools</h2>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>
              <Link to="/quick-sim" className="text-gold-500 hover:underline font-medium">
                Quick Sim
              </Link>{" "}
              — Single-target Patchwerk simulation with DPS, damage breakdown, aura uptime, and a
              readable sample ability log.
            </li>
            <li>
              <Link to="/top-gear" className="text-gold-500 hover:underline font-medium">
                Top Gear
              </Link>{" "}
              — Evaluate gear combinations with lock constraints and statistical uncertainty.
            </li>
            <li>
              <Link to="/droptimizer" className="text-gold-500 hover:underline font-medium">
                Droptimizer
              </Link>{" "}
              — Rank candidate item upgrades using engine item data.
            </li>
            <li>
              <Link to="/gear-compare" className="text-gold-500 hover:underline font-medium">
                Gear Compare
              </Link>{" "}
              — Compare two profiles side-by-side with plain-language statistical verdicts.
            </li>
            <li>
              <Link to="/advanced-sim" className="text-gold-500 hover:underline font-medium">
                Advanced Sim
              </Link>{" "}
              — Run validated prepared_v2 JSON directly through the coverage gate and engine.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-obsidian-900/80 p-6 space-y-3">
          <h2 className="text-lg font-semibold">Current Limitations</h2>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>Simulations currently focus on Patchwerk single-target encounters.</li>
            <li>
              Characters below Level 60 require manual Character Sheet calibration fields in the
              importer.
            </li>
            <li>
              Coverage-gated engine rules may refuse unsupported specs, items, or mechanics rather
              than returning misleading numbers.
            </li>
            <li>
              Some less common spell IDs in reports may still appear as{" "}
              <code className="font-mono text-xs">Spell #ID</code> until added to the spell-name
              map.
            </li>
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-obsidian-900/80 p-6 space-y-2 text-xs text-slate-500 dark:text-slate-400">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Disclaimer</h2>
        <p>
          ForeverBots is an unofficial community project and is not affiliated with Blizzard
          Entertainment, the WoW Forever team, Raidbots, or MythicSim.
        </p>
      </section>
    </div>
  );
}
