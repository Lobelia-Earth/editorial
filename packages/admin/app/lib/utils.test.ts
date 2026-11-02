import { describe, expect, it } from "vitest";
import { formatSizeChange } from "./utils";

describe("formatSizeChange", () => {
  it.each([
    [2_400_000, 184_000, "−92%"],
    [1000, 1150, "+15%"],
    [1000, 1002, "same size"],
    [0, 1000, ""],
  ])("formats %d → %d as %s", (original, edited, expected) => {
    expect(formatSizeChange(original, edited)).toBe(expected);
  });
});
