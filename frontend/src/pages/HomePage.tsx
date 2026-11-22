import { Link } from "react-router-dom";

const TOOLS = [
  {
    to: "/quick-sim",
    title: "Quick Sim",
    desc: "Import your /simc profile and run Patchwerk single-target simulations with full breakdowns.",
  },
  {
    to: "/top-gear",
    title: "Top Gear",
    desc: "Evaluate gear combinations with lock constraints, pruning, and statistical uncertainty.",
  },
  {
    to: "/droptimizer",
    title: "Droptimizer",
    desc: "Rank candidate upgrades transparently using verified engine item data.",
  },
  {
    to: "/gear-compare",
    title: "Gear Compare",
    desc: "Compare two profiles side-by-side with plain-language statistical verdicts.",
  },
  {
    to: "/advanced-sim",
    title: "Advanced Sim",
    desc: "Run validated prepared_v2 JSON directly through the Rust/WASM coverage gate and engine.",
  },
  {
    to: "/about",
    title: "About ForeverBots",
    desc: "Learn how the simulator works, which addon to use, and current engine capabilities.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 py-8 px-4 rounded-2xl border border-slate-200 dark:border-gold-500/20 bg-white/70 dark:bg-obsidian-900/70">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-gold-500/15 text-gold-500 border border-gold-500/30">
          World of Warcraft Forever Simulator
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gold-400">
          Simulate. Optimize. Master WoW Forever.
        </h1>
        <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-300 text-sm sm:text-base">
          ForeverBots compiles the Rust MythicSim Forever engine to WebAssembly and runs
          coverage-gated combat simulations directly in your browser.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Requires the <strong className="text-gold-500">SimulationCraft Addon (/simc)</strong> for
          character imports.{" "}
          <Link to="/about" className="text-gold-400 hover:underline">
            Read more on the About page
          </Link>
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white/80 dark:bg-obsidian-900/80 p-6 hover:border-gold-500/60 hover:shadow-lg hover:shadow-gold-500/5 transition-all space-y-2"
          >
            <h2 className="text-lg font-semibold group-hover:text-gold-400 transition-colors">
              {tool.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {tool.desc}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
