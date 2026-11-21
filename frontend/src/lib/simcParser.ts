import { GearItem, ParsedSimcProfile, ParseIssue } from "../types/simulation";

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

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

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
    rawText: input,
    status: hasErrors
      ? "unparseable"
      : hasWarnings
      ? "partially-unsupported"
      : "supported",
    issues,
  };
}
