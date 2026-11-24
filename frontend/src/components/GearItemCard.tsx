import ForeverItemLink from "./ForeverItemLink";
import Tooltip from "./Tooltip";
import type { ForeverDungeonItem } from "../data/foreverDungeonSources";
import { simulationSlotsForForeverSlot, type SimulationSlot } from "../data/foreverSlotMapping";

interface Props {
  item: ForeverDungeonItem;
  selectedSlot?: SimulationSlot;
  disabled?: boolean;
  onSelect: (slot: SimulationSlot) => void;
  onRemove: () => void;
}

export function gearSlotLabel(slot: string): string {
  const labels: Record<string, string> = { finger1: "Ring 1", finger2: "Ring 2", trinket1: "Trinket 1", trinket2: "Trinket 2", finger: "Ring", robe: "Chest" };
  return labels[slot] ?? slot.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function SlotArtwork({ slot }: { slot: string }) {
  return (
    <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-gradient-to-br from-gold-500/20 to-slate-500/10 text-gold-500">
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
        {slot === "finger" ? (
          <><circle cx="16" cy="19" r="9" /><path d="m11 7 5-4 5 4-5 6-5-6Z" /></>
        ) : slot === "trinket" || slot === "neck" ? (
          <><path d="M8 4c0 12 16 12 16 0M16 14v5" /><path d="m16 18 7 5-7 6-7-6 7-5Z" /></>
        ) : (
          <><path d="m11 5-7 5 4 8 4-2v12h12V16l4 2 2-8-9-5c-2 5-8 5-10 0Z" /><path d="M15 14h6M18 11v10" /></>
        )}
      </svg>
    </span>
  );
}

export default function GearItemCard({ item, selectedSlot, disabled = false, onSelect, onRemove }: Props) {
  const choices = simulationSlotsForForeverSlot(item.slot);
  const supported = choices.length > 0;
  const selected = selectedSlot !== undefined;

  return (
    <article className={`flex h-full flex-col gap-4 rounded-2xl border p-4 transition-colors ${selected ? "border-gold-500 bg-gold-500/10 ring-1 ring-gold-500/30" : "border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-obsidian-900/80"}`}>
      <div className="flex items-start gap-3">
        <SlotArtwork slot={item.slot} />
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-semibold leading-snug"><ForeverItemLink itemId={item.id} name={item.name} /></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{gearSlotLabel(item.slot)} · #{item.id}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{item.boss ?? "Dungeon drop"}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{item.dungeon}</p>
      <div className="mt-auto space-y-2">
        {!supported ? (
          <p className="rounded-lg bg-slate-500/10 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">This slot is not supported for automatic comparison.</p>
        ) : choices.length === 1 ? (
          <Tooltip label={selected ? "Click to remove this item from comparison" : "Click to select this item for comparison"}>
            <button type="button" disabled={disabled} aria-pressed={selected} aria-label={`${selected ? "Remove" : "Select"} ${item.name}`} onClick={() => selected ? onRemove() : onSelect(choices[0])} className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-gold-500 bg-gold-500 text-obsidian-950" : "border-slate-300 hover:border-gold-500 dark:border-slate-700"}`}>
              {selected ? "Selected · Remove" : "Select item"}
            </button>
          </Tooltip>
        ) : (
          <>
            <Tooltip label="Choose which equipped slot this item replaces for the comparison"><p className="text-xs text-slate-500 dark:text-slate-400">Choose the equipped slot to compare:</p></Tooltip>
            <div role="group" aria-label={`Target slot for ${item.name}`} className="flex gap-2">
              {choices.map((slot) => (
                <button key={slot} type="button" disabled={disabled} aria-pressed={selectedSlot === slot} onClick={() => selectedSlot === slot ? onRemove() : onSelect(slot)} className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-50 ${selectedSlot === slot ? "border-gold-500 bg-gold-500 text-obsidian-950" : "border-slate-300 hover:border-gold-500 dark:border-slate-700"}`}>
                  {gearSlotLabel(slot)}{selectedSlot === slot ? " ✓" : ""}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
