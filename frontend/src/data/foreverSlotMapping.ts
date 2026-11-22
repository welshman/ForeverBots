export const simulationSlots = [
  "head",
  "neck",
  "shoulder",
  "back",
  "chest",
  "wrist",
  "hands",
  "waist",
  "legs",
  "feet",
  "finger1",
  "finger2",
  "trinket1",
  "trinket2",
  "main_hand",
  "off_hand",
  "ranged",
] as const;

export type SimulationSlot = (typeof simulationSlots)[number];

const armorSlots: Readonly<
  Record<string, readonly SimulationSlot[]>
> = {
  head: ["head"],
  neck: ["neck"],
  shoulder: ["shoulder"],
  back: ["back"],
  chest: ["chest"],
  robe: ["chest"],
  wrist: ["wrist"],
  hands: ["hands"],
  waist: ["waist"],
  legs: ["legs"],
  feet: ["feet"],
  finger: ["finger1", "finger2"],
  trinket: ["trinket1", "trinket2"],
};

export function simulationSlotsForForeverSlot(
  slot: string,
): readonly SimulationSlot[] {
  return armorSlots[slot] ?? [];
}
