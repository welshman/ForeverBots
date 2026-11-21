export default function TopGearPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Top Gear</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Select candidate gear combinations to evaluate with lock constraints, intelligent pruning,
        and statistical uncertainty reporting via the MythicSim Forever WASM worker.
      </p>
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
        Top Gear requires SimC-to-prepared_v2 character preparation in the browser.
        ForeverBots refuses to fabricate gear-combination DPS numbers until the engine prepares
        each candidate loadout faithfully.
      </div>
    </div>
  );
}
