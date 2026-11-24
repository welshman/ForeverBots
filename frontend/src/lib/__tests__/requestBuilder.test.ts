import { describe, expect, it } from "vitest";
import { buildForeverRequestJson } from "../requestBuilder";
import type { ParsedSimcProfile, SimulationOptions } from "../../types/simulation";

const profile: ParsedSimcProfile = {
  characterName: "Test", className: "mage", spec: "frost", level: 60, race: "gnome",
  gear: [], rawText: "", status: "supported", issues: [],
};

const options: SimulationOptions = {
  fightStyle: "Patchwerk", durationSeconds: 180, durationVariancePct: 20,
  targetCount: 1, iterations: 1000, latencyMs: 50, seed: 1,
};

describe("buildForeverRequestJson", () => {
  it("throws without profile", () => {
    expect(() => buildForeverRequestJson(null as unknown as ParsedSimcProfile, options)).toThrow();
  });
  it("produces valid JSON", () => {
    const parsed = JSON.parse(buildForeverRequestJson(profile, options));
    expect(parsed.raid.parties[0].players[0].class).toBe("ClassMage");
    expect(parsed.simOptions.iterations).toBe(1000);
  });
  it("clamps out-of-range values", () => {
    const parsed = JSON.parse(buildForeverRequestJson(profile, { ...options, durationSeconds: 9999, iterations: -5 }));
    expect(parsed.encounter.duration).toBe(600);
    expect(parsed.simOptions.iterations).toBe(1);
  });
});
