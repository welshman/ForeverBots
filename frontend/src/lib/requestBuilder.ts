import { ParsedSimcProfile, SimulationOptions } from "../types/simulation";

const CLASS_ENUM: Record<string, string> = {
  druid: "ClassDruid",
  hunter: "ClassHunter",
  mage: "ClassMage",
  paladin: "ClassPaladin",
  priest: "ClassPriest",
  rogue: "ClassRogue",
  shaman: "ClassShaman",
  warlock: "ClassWarlock",
  warrior: "ClassWarrior",
};

const RACE_ENUM: Record<string, string> = {
  human: "RaceHuman",
  orc: "RaceOrc",
  dwarf: "RaceDwarf",
  night_elf: "RaceNightElf",
  nightelf: "RaceNightElf",
  undead: "RaceUndead",
  scourge: "RaceUndead",
  tauren: "RaceTauren",
  gnome: "RaceGnome",
  troll: "RaceTroll",
};

const SLOT_ORDER = [
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

const DEFAULT_SPELL_BY_CLASS: Record<string, number> = {
  mage: 25304,      // Frostbolt
  warlock: 25307,   // Shadow Bolt
  priest: 10947,    // Mind Blast
  druid: 25298,     // Starfire
  shaman: 15208,    // Lightning Bolt
  hunter: 20904,    // Aimed Shot
  paladin: 20271,   // Judgement
  rogue: 11294,     // Sinister Strike
  warrior: 23894,   // Bloodthirst
};

export interface GearOverride {
  slot: string;
  itemId: number;
  enchantId?: number;
}

export function buildForeverRequestJson(
  profile: ParsedSimcProfile,
  options: SimulationOptions,
  overrides: GearOverride[] = []
): string {
  const classEnum = CLASS_ENUM[profile.className.toLowerCase()] ?? "ClassMage";
  const raceEnum = RACE_ENUM[profile.race.toLowerCase()] ?? "RaceHuman";

  const slotMap = new Map<string, { id?: number; enchant?: number }>();
  for (const item of profile.gear) {
    const normalizedSlot =
      item.slot === "shoulders"
        ? "shoulder"
        : item.slot === "wrists"
        ? "wrist"
        : item.slot;
    if (item.itemId) {
      slotMap.set(normalizedSlot, {
        id: item.itemId,
        enchant: item.enchantId,
      });
    }
  }
  for (const ov of overrides) {
    slotMap.set(ov.slot, { id: ov.itemId, enchant: ov.enchantId });
  }

  const items = SLOT_ORDER.map((slot) => {
    const entry = slotMap.get(slot);
    if (!entry?.id) return {};
    return entry.enchant ? { id: entry.id, enchant: entry.enchant } : { id: entry.id };
  });

  const defaultSpellId = DEFAULT_SPELL_BY_CLASS[profile.className.toLowerCase()] ?? 25304;
  const durationVariation = Math.max(
    0,
    Math.min(120, Math.round((options.durationSeconds * options.durationVariancePct) / 100))
  );

  const player: Record<string, unknown> = {
    name: profile.characterName || "ForeverPlayer",
    class: classEnum,
    race: raceEnum,
    level: profile.level || 60,
    reactionTimeMs: Math.max(10, Math.min(1000, options.latencyMs || 100)),
    distanceFromTarget: ["rogue", "warrior", "paladin"].includes(profile.className.toLowerCase())
      ? 0
      : 20,
    equipment: { items },
    rotation: {
      type: "TypeAPL",
      priorityList: [
        { action: { autocastOtherCooldowns: {} } },
        { action: { castSpell: { spellId: { spellId: defaultSpellId } } } },
      ],
    },
  };

  if (profile.talents && profile.talents.includes("-")) {
    player.talentsString = profile.talents;
  }

  const request = {
    encounter: {
      duration: options.durationSeconds,
      durationVariation,
      executeProportion20: 0.2,
      executeProportion25: 0.25,
      executeProportion35: 0.35,
      executeProportion45: 0.45,
      executeProportion90: 0.9,
      targets: Array.from({ length: Math.max(1, Math.min(5, options.targetCount)) }, (_, i) => ({
        id: 213336 + i,
        name: `Target ${i + 1}`,
        level: 63,
        canCrush: true,
        parryHaste: true,
        minBaseDamage: 3000,
        damageSpread: 0.3333,
        swingSpeed: 2,
        stats: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 805, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3731, 0, 127393, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      })),
    },
    raid: {
      parties: [{ players: [player] }],
    },
    simOptions: {
      debugFirstIteration: true,
      iterations: Math.max(1, Math.min(10_000, options.iterations)),
      randomSeed: String(options.seed || 42),
    },
  };

  return JSON.stringify(request, null, 2);
}
