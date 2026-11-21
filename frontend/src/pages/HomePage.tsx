import { Link } from "react-router-dom";

const TOOLS = [
  {
    to: "/quick-sim",
    title: "Quick Sim",
    desc: "Import your /simc profile and configure Patchwerk single-target simulations.",
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
    to: "/stat-weights",
    title: "Stat Weights",
    desc: "Compute normalized stat weights with confidence intervals and accuracy caveats.",
  },
  {
    to: "/gear-compare",
    title: "Gear Compare",
    desc: "Compare two or more profiles side-by-side with plain-language statistical verdicts.",
  },
  {
    to: "/advanced-sim",
    title: "Advanced Sim",
    desc: "Run validated prepared_v2 JSON directly through the Rust/WASM coverage gate and engine.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-3 py-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Simulate. Optimize. Master WoW Forever.
        </h1>
        <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
          ForeverBots compiles the Rust MythicSim Forever engine to WebAssembly and runs
          trustworthy, coverage-gated simulations directly in your browser.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-arcane-500 transition-colors space-y-2"
          >
            <h2 className="text-lg font-semibold">{tool.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{tool.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
