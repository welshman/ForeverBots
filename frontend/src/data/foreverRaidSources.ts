export interface ForeverRaidSource {
  readonly name: string;
  readonly lootPending: boolean;
}

// Raid placeholders only. No Forever-specific raid loot entries are included yet.
export const foreverRaidSources: readonly ForeverRaidSource[] = [
  { name: "Barrow Deeps", lootPending: true },
  { name: "Hyjal Summit", lootPending: true },
  { name: "Onyxia's Lair", lootPending: true },
];
