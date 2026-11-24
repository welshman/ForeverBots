import {
  CharacterSheetData,
  GearItem,
  ParsedSimcProfile,
  ParseIssue,
} from "../types/simulation";

const MAX_SIMC_BYTES = 200_000;

const KNOWN_CLASSES = new Set([
  "druid", "hunter", "mage", "paladin", "priest", "rogue", "shaman", "warlock", "warrior",
]);

const GEAR_SLOTS = new Set([
  "head", "neck", "shoulder", "shoulders", "back", "chest", "shirt", "tabard", "wrist", "wrists",
  "hands", "waist", "legs", "feet", "finger1", "finger2", "trinket1", "trinket2",
  "main_hand", "off_hand", "ranged",
]);

function parseColonPairs(raw: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of raw.split("/")) {
    const [k, v] = part.split(":");
    if (k && v !== undefined) {
      const n = Number(v);
      if (Number.isFinite(n)) out[k.trim().toLowerCase()] = n;
    }
  }
  return out;
}

export function parseSimcProfile(input: string): ParsedSimcProfile {
  const issues: ParseIssue[] = [];
  if (input.length > MAX_SIMC_BYTES) {
    return {
      characterName: "", className: "", spec: "", level: 60, race: "", gear: [],
      rawText: input.slice(0, 1000), status: "unparseable",
      issues: [{ line: 1, severity: "error", message: `Profile exceeds maximum allowed size (${MAX_SIMC_BYTES} bytes).` }],
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
        if (ck === "character_stats") {
          const map = parseColonPairs(cv);
          if (map.health !== undefined) sheetHealth = map.health;
          if (map.mana !== undefined) sheetMana = map.mana;
          if (map.strength !== undefined && map.agility !== undefined && map.stamina !== undefined && map.intellect !== undefined && map.spirit !== undefined) {
            sheetAttr = [map.strength, map.agility, map.stamina, map.intellect, map.spirit];
          }
        } else if (ck === "character_stats_base") {
          const map = parseColonPairs(cv);
          if (map.strength !== undefined && map.agility !== undefined && map.stamina !== undefined && map.intellect !== undefined && map.spirit !== undefined) {
            sheetBase = [map.strength, map.agility, map.stamina, map.intellect, map.spirit];
          }
        } else if (ck === "crit") {
          const map = parseColonPairs(cv);
          if (map.melee !== undefined) sheetMeleeCrit = map.melee;
          if (map.spell !== undefined) sheetSpellCrit = map.spell;
        }
      }
      return;
    }

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {
      issues.push({ line: lineNum, severity: "warning", message: `Ignored line without key=value syntax: "${trimmed.slice(0, 48)}"` });
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
          if (!itemName && k) itemName = k;
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

      if (!itemId) {
        issues.push({ line: lineNum, severity: "warning", message: `Gear line for "${key}" is missing a valid item id.` });
      }

      gear.push({
        slot: key, name: itemName, itemId, enchantId,
        gemIds: gemIds.length ? gemIds : undefined,
        raw: value, line: lineNum,
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
          issues.push({ line: lineNum, severity: "warning", message: `Level "${value}" is outside WoW Forever bounds (1-60).` });
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
    issues.push({ line: 1, severity: "error", message: 'Missing character class declaration (e.g., mage="Frosty").' });
  }

  let characterSheet: CharacterSheetData | undefined;
  if (sheetBase && sheetAttr && sheetHealth !== undefined) {
    characterSheet = {
      base: sheetBase, attributes: sheetAttr, health: sheetHealth,
      mana: sheetMana ?? 0, meleeCrit: sheetMeleeCrit ?? 5, spellCrit: sheetSpellCrit ?? 5,
    };
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  const hasWarnings = issues.some((i) => i.severity === "warning");

  return {
    characterName, className, spec, level, race, realm, region, talents, glyphs, professions,
    gear, characterSheet, rawText: input,
    status: hasErrors ? "unparseable" : hasWarnings ? "partially-unsupported" : "supported",
    issues,
  };
}
