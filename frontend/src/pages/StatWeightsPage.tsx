export default function StatWeightsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stat Weights</h1>
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
        Caution: Stat weights are a local linear approximation and can be outdated or misleading
        compared with direct gear simulations (Top Gear / Gear Compare).
      </div>
    </div>
  );
}
