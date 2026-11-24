import { describe, expect, it } from "vitest";
import { computeConfidenceInterval, formatDps, validateProfilePreflight } from "../resultInsights";
import type { ParsedSimcProfile } from "../../types/simulation";

describe("formatDps", () => {
  it("returns dash for invalid values", () => {
    expect(formatDps(undefined)).toBe("—");
    expect(formatDps(-1)).toBe("—");
  });
  it("formats valid numbers", () => {
    expect(formatDps(1234.567)).toContain("1,234");
  });
});

describe("computeConfidenceInterval", () => {
  it("returns null for invalid input", () => {
    expect(computeConfidenceInterval(0, 10, 100)).toBeNull();
    expect(computeConfidenceInterval(100, 10, 1)).toBeNull();
  });
  it("computes CI for valid input", () => {
    const ci = computeConfidenceInterval(1000, 50, 100);
    expect(ci).not.toBeNull();
    expect(ci!.mean).toBe(1000);
    expect(ci!.low).toBeLessThan(1000);
    expect(ci!.high).toBeGreaterThan(1000);
  });
});

describe("validateProfilePreflight", () => {
  it("returns empty for null profile", () => {
    expect(validateProfilePreflight(null)).toEqual([]);
  });
  it("flags unparseable profile", () => {
    const profile = { status: "unparseable", className: "", spec: "", gear: [], level: 60 } as unknown as ParsedSimcProfile;
    const issues = validateProfilePreflight(profile);
    expect(issues.some(i => i.severity === "error")).toBe(true);
  });
});
