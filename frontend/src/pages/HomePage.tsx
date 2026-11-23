import { Link } from "react-router-dom";

const FAQ_ITEMS = [
  {
    question: "How does ForeverBots simulate my character?",
    answer: "ForeverBots parses your in-game /simc profile in the browser, prepares it for the MythicSim Forever engine, and runs the simulation locally in a WebAssembly Web Worker. No character data is uploaded to a server.",
  },
  {
    question: "Why do I need the SimulationCraft Addon?",
    answer: "The SimulationCraft Addon generates the /simc profile text that ForeverBots imports. Without it, ForeverBots cannot read your character's gear, talents, or stats.",
  },
  {
    question: "What does 'Partially Unsupported' mean?",
    answer: "It means your profile parsed successfully, but the engine's coverage gate flagged one or more unsupported items, talents, or mechanics. The simulation may still run, but results could be less accurate.",
  },
  {
    question: "What does 'Refused' mean?",
    answer: "It means the engine's coverage gate blocked the simulation entirely because a required mechanic, item, or spec is not yet supported. This prevents misleading numbers rather than returning inaccurate results.",
  },
  {
    question: "Why do my DPS numbers differ from other simulators?",
    answer: "ForeverBots uses the MythicSim Forever engine, which is tailored to WoW Forever's specific patch and mechanics. Results can differ from retail-focused simulators like Raidbots because the underlying engine and game data are different.",
  },
  {
    question: "Is my data stored anywhere?",
    answer: "No. Everything runs client-side in your browser. Your /simc profile, simulation results, and preferences are stored only in your browser's localStorage and never sent to a server.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gold-400">
          Simulate. Optimize. Master WoW Forever.
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-slate-500 dark:text-slate-400">
          Free, client-side combat simulation for World of Warcraft: Forever, powered by the MythicSim Forever engine running entirely in your browser.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/quick-sim"
            className="px-5 py-2.5 rounded-lg bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 transition-colors"
          >
            Run a Quick Sim
          </Link>
          <Link
            to="/top-gear"
            className="px-5 py-2.5 rounded-lg border border-gold-500/40 text-gold-400 text-sm font-semibold hover:bg-gold-500/10 transition-colors"
          >
            Explore Top Gear
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Quick Sim", desc: "Run a fast Patchwerk single-target simulation with configurable fight length and iterations.", href: "/quick-sim" },
          { title: "Top Gear", desc: "Evaluate gear combinations with lock constraints, pruning, and statistical uncertainty.", href: "/top-gear" },
          { title: "Droptimizer", desc: "Rank candidate item upgrades using verified engine item data.", href: "/droptimizer" },
          { title: "Gear Compare", desc: "Compare two profiles side-by-side with plain-language statistical verdicts.", href: "/gear-compare" },
          { title: "Advanced Sim", desc: "Run validated prepared_v2 JSON directly through the Rust/WASM coverage gate and engine.", href: "/quick-sim?advanced=1" },
          { title: "About", desc: "Learn how ForeverBots works, required addon info, and current engine limitations.", href: "/about" },
        ].map((card) => (
          <Link
            key={card.title}
            to={card.href}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-2 hover:border-gold-500/40 transition-colors"
          >
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{card.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{card.desc}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5 space-y-4">
        <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="py-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-gold-400 transition-colors">
                {item.question}
              </summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="text-center text-xs text-slate-500 dark:text-slate-400">
        ForeverBots is an unofficial community project and is not affiliated with Blizzard Entertainment, the WoW Forever team, Raidbots, or MythicSim.
      </footer>
    </div>
  );
}
