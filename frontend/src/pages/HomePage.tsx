import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Update {
  sha: string;
  html_url: string;
  commit: { message: string; committer: { date: string } | null };
}
const historyUrl = "https://github.com/welshman/ForeverBots/commits/main/";
const panel = "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-obsidian-900/85 p-5";

export default function HomePage() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("https://api.github.com/repos/welshman/ForeverBots/commits?sha=main&per_page=6", { signal: controller.signal, headers: { Accept: "application/vnd.github+json" } });
        if (!response.ok) throw new Error("Updates unavailable");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid updates");
        const valid = data.filter((item): item is Update => item && typeof item.sha === "string" && typeof item.html_url === "string" && item.html_url.startsWith("https://github.com/welshman/ForeverBots/commit/") && typeof item.commit?.message === "string" && (item.commit.committer === null || typeof item.commit.committer?.date === "string"));
        if (!controller.signal.aborted) { setUpdates(valid); setStatus("ready"); }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gold-400">Simulate. Optimize. Master WoW Forever.</h1>
        <p className="max-w-2xl mx-auto text-sm text-slate-500 dark:text-slate-400">Free, client-side combat simulation for World of Warcraft: Forever, powered by the MythicSim Forever engine running entirely in your browser.</p>
      </section>

      <section aria-label="Site features" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Sim", desc: "Run a fast Patchwerk single-target simulation with configurable fight length and iterations.", href: "/sim" },
          { title: "Droptimizer", desc: "Rank candidate item upgrades using verified engine item data.", href: "/droptimizer" },
          { title: "About", desc: "Learn how ForeverBots works, required addon info, and current engine limitations.", href: "/about" },
        ].map(card => (
          <Link key={card.href} to={card.href} className={`${panel} space-y-2 hover:border-gold-500/40 transition-colors`}>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{card.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{card.desc}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="site-updates-heading" className={`${panel} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="site-updates-heading" className="text-lg font-semibold">Site Updates</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recent commits to ForeverBots on GitHub.</p>
          </div>
          <a href={historyUrl} target="_blank" rel="noreferrer" className="text-sm text-gold-400 hover:underline">View all updates</a>
        </div>
        {status === "loading" && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Loading recent updates…</p>}
        {status === "error" && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Recent updates could not be loaded. You can still view the full history on GitHub using the link above.</p>}
        {status === "ready" && updates.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No recent updates available.</p>}
        {status === "ready" && updates.length > 0 && <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {updates.map(update => {
            const date = update.commit.committer?.date;
            const parsed = date ? new Date(date) : null;
            return <li key={update.sha} className="py-4 first:pt-0 last:pb-0 space-y-1">
              <a href={update.html_url} target="_blank" rel="noreferrer" className="block text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-gold-400 break-words">{update.commit.message.split("\n")[0]}</a>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                {parsed && !Number.isNaN(parsed.getTime()) && <time dateTime={date}>{parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</time>}
                <span className="font-mono">{update.sha.slice(0, 7)}</span>
              </div>
            </li>;
          })}
        </ul>}
      </section>
    </div>
  );
}
