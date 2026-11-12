import { describe, expect, it } from "vitest";
import { mergeRanges, monthsBetween } from "./overlap";

describe("experiencia neta", () => {
  it("no duplica periodos superpuestos", () => {
    const merged = mergeRanges(
      [
        { start: "2016-01-01", end: "2019-12-31" },
        { start: "2018-06-01", end: "2021-12-31" },
      ],
      "2026-10-26",
    );
    expect(merged.months).toBe(72);
  });

  it("suma periodos disjuntos", () => {
    const merged = mergeRanges(
      [
        { start: "2016-01-01", end: "2016-12-31" },
        { start: "2018-01-01", end: "2018-12-31" },
      ],
      "2026-01-01",
    );
    expect(merged.months).toBe(24);
  });

  it("monthsBetween es inclusivo por mes", () => {
    expect(monthsBetween("2020-01-01", "2020-01-31")).toBe(1);
    expect(monthsBetween("2020-01-01", "2020-12-31")).toBe(12);
  });
});
