import {
  CharacterSheetData,
  GearItem,
  ParsedSimcProfile,
  ParseIssue,
} from "../types/simulation";

const MAX_SIMC_BYTES = 200_000;

const KNOWN_CLASSES = new Set([
  "druid",
  "hunter",
  "mage",
  "paladin",
  "priest",
  "rogue",
  "shaman",
  "warlock",
  "warrior",
]);

const GEAR_SLOTS = new Set([
  "head",
  "neck",
  "shoulder",
  "shoulders",
  "back",
  "chest",
  "shirt",
  "tabard",
  "wrist",
  "wrists",
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
]);

export function parseSimcProfile(input: string): ParsedSimcProfile {
  const issues: ParseIssue[] = [];
  if (input.length > MAX_SIMC_BYTES) {
    return {
      characterName: "",
      className: "",
      spec: "",
      level: 60,
      race: "",
      gear: [],
      rawText: input.slice(0, 1000),
      status: "unparseable",
      issues: [
        {
          line: 1,
          severity: "error",
          message: `Profile exceeds maximum allowed size (${MAX_SIMC_BYTES} bytes).`,
        },
      ],
    };
  }

  const lines = input.replace(/\r\n/g, "\n").split("\n");
  let characterName = "";
  let className = "";
  let spec = "";
  let level = 60;
  let race = "";
  let realm: string | undefined;
  let region: string | undefined;
  let talents: string | undefined;
  let glyphs: string | undefined;
  let professions: string | undefined;
  const gear: GearItem[] = [];

  // Optional commented stats exported by SimulationCraft addon
  let sheetBase: [number, number, number, number, number] | undefined;
  let sheetAttr: [number, number, number, number, number] | undefined;
  let sheetHealth: number | undefined;
  let sheetMana: number | undefined;
  let sheetMeleeCrit: number | undefined;
  let sheetSpellCrit: number | undefined;

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("#")) {
      const commentBody = trimmed.replace(/^#+\s*/, "");
      const eq = commentBody.indexOf("=");
      if (eq !== -1) {
        const ck = commentBody.slice(0, eq).trim().toLowerCase();
        const cv = commentBody.slice(eq + 1).trim();
        if (ck === "health") {
          const n = Number(cv);
          if (Number.isFinite(n) && n > 0) sheetHealth = n;
        } else if (ck === "mana") {
          const n = Number(cv);
          if (Number.isFinite(n) && n >= 0) sheetMana = n;
        } else if (ck === "melee_crit") {
          const n = Number(cv);
          if (Number.isFinite(n)) sheetMeleeCrit = n;
        } else if (ck === "spell_crit") {
          const n = Number(cv.split("/")[0]);
          if (Number.isFinite(n)) sheetSpellCrit = n;
        } else if (ck === "base_stats" || ck === "attributes") {
          const nums = cv.split(/[/:,]/).map(Number).filter(Number.isFinite);
          if (nums.length >= 5) {
            const tuple: [number, number, number, number, number] = [
              nums[0],
              nums[1],
              nums[2],
              nums[3],
              nums[4],
            ];
            if (ck === "base_stats") sheetBase = tuple;
            else sheetAttr = tuple;
          }
        }
      }
      return;
    }

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {
      issues.push({
        line: lineNum,
        severity: "warning",
        message: `Ignored line without key=value syntax: "${trimmed.slice(0, 48)}"`,
      });
      return;
    }

    const key = trimmed.slice(0, eqIdx).trim().toLowerCase();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");

    if (KNOWN_CLASSES.has(key)) {
      className = key;
      characterName = value || "Unknown";
      return;
    }

    if (GEAR_SLOTS.has(key)) {
      const parts = value.split(",");
      let itemId: number | undefined;
      let enchantId: number | undefined;
      const gemIds: number[] = [];
      let itemName: string | undefined;

      for (const part of parts) {
        const [k, v] = part.split("=");
        if (!v) {
          if (!itemName) itemName = k;
        } else if (k === "id") {
          const parsedId = Number(v);
          if (Number.isFinite(parsedId)) itemId = parsedId;
        } else if (k === "enchant_id") {
          const parsedEnchant = Number(v);
          if (Number.isFinite(parsedEnchant)) enchantId = parsedEnchant;
        } else if (k === "gem_id") {
          v.split("/").forEach((g) => {
            const parsedGem = Number(g);
            if (Number.isFinite(parsedGem)) gemIds.push(parsedGem);
          });
        }
      }

      gear.push({
        slot: key,
        name: itemName,
        itemId,
        enchantId,
        gemIds: gemIds.length ? gemIds : undefined,
        raw: value,
        line: lineNum,
      });
      return;
    }

    switch (key) {
      case "spec":
        spec = value.toLowerCase();
        break;
      case "level": {
        const parsedLevel = Number(value);
        if (!Number.isInteger(parsedLevel) || parsedLevel < 1 || parsedLevel > 60) {
          issues.push({
            line: lineNum,
            severity: "warning",
            message: `Level "${value}" is outside WoW Forever bounds (1-60).`,
          });
        } else {
          level = parsedLevel;
        }
        break;
      }
      case "race":
        race = value.toLowerCase();
        break;
      case "server":
      case "realm":
        realm = value;
        break;
      case "region":
        region = value;
        break;
      case "talents":
        talents = value;
        break;
      case "glyphs":
        glyphs = value;
        break;
      case "professions":
        professions = value;
        break;
      default:
        break;
    }
  });

  if (!className) {
    issues.push({
      line: 1,
      severity: "error",
      message: 'Missing character class declaration (e.g., mage="Frosty").',
    });
  }

  let characterSheet: CharacterSheetData | undefined;
  if (sheetBase && sheetAttr && sheetHealth !== undefined) {
    characterSheet = {
      base: sheetBase,
      attributes: sheetAttr,
      health: sheetHealth,
      mana: sheetMana ?? 0,
      meleeCrit: sheetMeleeCrit ?? 5,
      spellCrit: sheetSpellCrit ?? 5,
    };
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  const hasWarnings = issues.some((i) => i.severity === "warning");

  return {
    characterName,
    className,
    spec,
    level,
    race,
    realm,
    region,
    talents,
    glyphs,
    professions,
    gear,
    characterSheet,
    rawText: input,
    status: hasErrors
      ? "unparseable"
      : hasWarnings
      ? "partially-unsupported"
      : "supported",
    issues,
  };
}
