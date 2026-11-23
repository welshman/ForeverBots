import { describe, expect, it } from "vitest";
import { foreverDungeonSources } from "../foreverDungeonSources";
import { simulationSlotsForForeverSlot } from "../foreverSlotMapping";

describe("Forever dungeon foundation", () => {
  it("contains unique directly tagged items and expected dungeon counts", () => {
    expect(foreverDungeonSources).toHaveLength(56);
    expect(new Set(foreverDungeonSources.map((item) => item.id)).size).toBe(56);

    const expectedCounts = [
      ["City of Dalaran", 24],
      ["The Drowned City", 16],
      ["Krol'dok Stronghold", 16],
    ] as const;

    for (const [dungeon, count] of expectedCounts) {
      expect(
        foreverDungeonSources.filter((item) => item.dungeon === dungeon),
      ).toHaveLength(count);
    }

    expect(
      foreverDungeonSources.some((item) =>
        [279857, 279863].includes(item.id),
      ),
    ).toBe(false);
  });

  it("retains item-specific catalogue references", () => {
    for (const item of foreverDungeonSources) {
      expect(Number.isSafeInteger(item.id) && item.id > 0).toBe(true);
      expect(item.name.trim().length).toBeGreaterThan(0);

      const slug = item.name
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      expect(item.sourceUrl).toBe(
        `https://everlookdb.com/item/${item.id}/${slug}`,
      );
    }
  });

  it("requires explicit ring and trinket targets and maps robes", () => {
    expect(simulationSlotsForForeverSlot("finger")).toEqual([
      "finger1",
      "finger2",
    ]);
    expect(simulationSlotsForForeverSlot("trinket")).toEqual([
      "trinket1",
      "trinket2",
    ]);
    expect(simulationSlotsForForeverSlot("robe")).toEqual(["chest"]);
  });

  it("fails closed for unsupported weapons and unknown slots", () => {
    for (const slot of [
      "onehand",
      "twohand",
      "shield",
      "holdable",
      "wand",
      "unknown",
    ]) {
      expect(simulationSlotsForForeverSlot(slot)).toEqual([]);
    }
  });
});
