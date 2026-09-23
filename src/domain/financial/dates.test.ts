import { describe, expect, it } from "vitest";

import {
  daysBetweenDates,
  financialDate,
  generateMonthlyDates,
} from "@/domain/financial";

describe("financial dates", () => {
  it("counts calendar days without time zones", () => {
    expect(
      daysBetweenDates(
        financialDate("2026-12-31"),
        financialDate("2027-01-01"),
      ),
    ).toBe(1);
  });

  it("generates monthly dates for ordinary days", () => {
    expect(
      generateMonthlyDates({
        firstDate: financialDate("2026-01-15"),
        count: 3,
      }),
    ).toEqual(["2026-01-15", "2026-02-15", "2026-03-15"]);
  });

  it("preserves the contractual day when a month is shorter", () => {
    expect(
      generateMonthlyDates({
        firstDate: financialDate("2026-01-31"),
        count: 5,
      }),
    ).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
    ]);
  });
});
