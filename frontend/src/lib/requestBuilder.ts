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

function dotRefreshAction(spellId: number) {
  return {
    action: {
      castSpell: { spellId: { spellId } },
      condition: {
        not: { val: { dotIsActive: { spellId: { spellId } } } },
      },
    },
  };
}

function buildDefaultRotation(lowerClass: string): Array<Record<string, unknown>> {
  const base: Array<Record<string, unknown>> = [
    { action: { autocastOtherCooldowns: {} } },
  ];

  switch (lowerClass) {
    case "warlock":
      return [
        ...base,
        {
          action: {
            castSpell: { spellId: { spellId: 11689 } }, // Life Tap
            condition: {
              cmp: {
                lhs: { currentManaPercent: {} },
                op: "OpLt",
                rhs: { const: { val: "20%" } },
              },
            },
          },
        },
        dotRefreshAction(11713), // Curse of Agony
        dotRefreshAction(25311), // Corruption
        dotRefreshAction(25309), // Immolate
        { action: { castSpell: { spellId: { spellId: 25307 } } } }, // Shadow Bolt
      ];
    case "mage":
      return [
        ...base,
        {
          action: {
            castSpell: { spellId: { spellId: 12051 } }, // Evocation
            condition: {
              cmp: {
                lhs: { currentManaPercent: {} },
                op: "OpLt",
                rhs: { const: { val: "15%" } },
              },
            },
          },
        },
        { action: { castSpell: { spellId: { spellId: 10199 } } } }, // Fire Blast
        { action: { castSpell: { spellId: { spellId: 25304 } } } }, // Frostbolt
      ];
    case "priest":
      return [
        ...base,
        dotRefreshAction(10942), // Shadow Word: Pain
        { action: { castSpell: { spellId: { spellId: 10947 } } } }, // Mind Blast
      ];
    case "druid":
      return [
        ...base,
        dotRefreshAction(9835), // Moonfire
        { action: { castSpell: { spellId: { spellId: 25298 } } } }, // Starfire
      ];
    case "shaman":
      return [
        ...base,
        { action: { castSpell: { spellId: { spellId: 15208 } } } }, // Lightning Bolt
      ];
    case "hunter":
      return [
        ...base,
        { action: { castSpell: { spellId: { spellId: 20904 } } } }, // Aimed Shot
        { action: { castSpell: { spellId: { spellId: 14290 } } } }, // Multi-Shot
      ];
    case "paladin":
      return [
        ...base,
        { action: { castSpell: { spellId: { spellId: 20271 } } } }, // Judgement
      ];
    case "rogue":
      return [
        ...base,
        { action: { castSpell: { spellId: { spellId: 11294 } } } }, // Sinister Strike
      ];
    case "warrior":
      return [
        ...base,
        { action: { castSpell: { spellId: { spellId: 23894 } } } }, // Bloodthirst
        { action: { castSpell: { spellId: { spellId: 1680 } } } }, // Whirlwind
        { action: { castSpell: { spellId: { spellId: 25286 } } } }, // Heroic Strike
      ];
    default:
      return [
        ...base,
        { action: { castSpell: { spellId: { spellId: 25304 } } } },
      ];
  }
}

const DEFAULT_CLASS_OPTIONS: Record<string, Record<string, unknown>> = {
  mage: {
    mage: { options: { classOptions: { defaultMageArmor: "MageArmorMageArmor" } } },
  },
  warlock: {
    warlock: { options: { classOptions: { armor: "DemonArmor", summon: "Imp" } } },
  },
  warrior: {
    warrior: { options: { classOptions: { startingRage: 0 } } },
  },
  rogue: {
    rogue: { options: { classOptions: {} } },
  },
  hunter: {
    hunter: {
      options: {
        classOptions: { ammo: "ThoriumHeadedArrow", petType: "Cat", petUptime: 1 },
      },
    },
  },
  priest: {
    priest: { options: { classOptions: {} } },
  },
  paladin: {
    paladin: { options: { classOptions: {} } },
  },
  druid: {
    druid: { options: { classOptions: {} } },
  },
  shaman: {
    shaman: { options: { classOptions: {} } },
  },
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
  const lowerClass = profile.className.toLowerCase();
  const classEnum = CLASS_ENUM[lowerClass] ?? "ClassMage";
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

  const durationVariation = Math.max(
    0,
    Math.min(120, Math.round((options.durationSeconds * options.durationVariancePct) / 100))
  );
  const playerLevel = profile.level || 60;
  const targetLevel = playerLevel === 60 ? 63 : Math.min(63, playerLevel + 3);

  const player: Record<string, unknown> = {
    name: profile.characterName || "ForeverPlayer",
    class: classEnum,
    race: raceEnum,
    level: playerLevel,
    reactionTimeMs: Math.max(10, Math.min(1000, options.latencyMs || 100)),
    distanceFromTarget: ["rogue", "warrior", "paladin"].includes(lowerClass) ? 0 : 20,
    equipment: { items },
    rotation: {
      type: "TypeAPL",
      priorityList: buildDefaultRotation(lowerClass),
    },
    ...(DEFAULT_CLASS_OPTIONS[lowerClass] ?? {}),
  };

  if (profile.talents && profile.talents.includes("-")) {
    player.talentsString = profile.talents;
  }

  if (playerLevel < 60 && profile.characterSheet) {
    player.characterSheet = {
      base: profile.characterSheet.base,
      attributes: profile.characterSheet.attributes,
      health: profile.characterSheet.health,
      mana: profile.characterSheet.mana,
      meleeCrit: profile.characterSheet.meleeCrit,
      spellCrit: [
        profile.characterSheet.spellCrit,
        profile.characterSheet.spellCrit,
        profile.characterSheet.spellCrit,
        profile.characterSheet.spellCrit,
        profile.characterSheet.spellCrit,
        profile.characterSheet.spellCrit,
      ],
    };
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
        level: targetLevel,
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
