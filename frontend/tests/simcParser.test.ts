import { describe, expect, it } from "vitest";
import { parseSimcProfile } from "../src/lib/simcParser";

describe("parseSimcProfile", () => {
  it("parses a valid WoW Forever Frost Mage profile", () => {
    const input = `
# Sample profile
mage="Arcaneweave"
level=60
race=gnome
spec=frost
head=netherwind_crown,id=16914,enchant_id=2544
`;
    const parsed = parseSimcProfile(input);
    expect(parsed.status).toBe("supported");
    expect(parsed.className).toBe("mage");
    expect(parsed.characterName).toBe("Arcaneweave");
    expect(parsed.level).toBe(60);
    expect(parsed.gear).toHaveLength(1);
    expect(parsed.gear[0].itemId).toBe(16914);
  });

  it("flags missing class declaration as unparseable", () => {
    const parsed = parseSimcProfile("level=60\nrace=human");
    expect(parsed.status).toBe("unparseable");
    expect(parsed.issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("rejects oversized inputs", () => {
    const huge = "a".repeat(250_000);
    const parsed = parseSimcProfile(huge);
    expect(parsed.status).toBe("unparseable");
  });
});
