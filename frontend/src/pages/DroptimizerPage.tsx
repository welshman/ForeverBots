export default function DroptimizerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Droptimizer</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Evaluate potential raid and dungeon upgrades against your imported character.
      </p>
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
        WoW Forever raid/dungeon loot-source tables are not bundled in the MythicSim Forever engine
        repository. ForeverBots does not invent loot tables; supply verified candidate items manually
        once item-preparation bindings are loaded.
      </div>
    </div>
  );
}
