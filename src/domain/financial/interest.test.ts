import { describe, expect, it } from "vitest";

import {
  annualInterestRate,
  calculateInterest,
  financialDate,
  money,
} from "@/domain/financial";

describe("calculateInterest", () => {
  it.each([
    ["30 days", "2026-09-15", "2026-10-15", "3772.60"],
    ["31 days", "2026-10-15", "2026-11-15", "3898.36"],
    ["28 days", "2026-02-01", "2026-03-01", "3521.10"],
    ["29 days", "2028-02-01", "2028-03-01", "3646.85"],
    ["year boundary", "2026-12-15", "2027-01-15", "3898.36"],
  ])("calculates interest for %s", (_, startDate, endDate, expected) => {
    const interest = calculateInterest({
      balance: money("765000"),
      annualRate: annualInterestRate("6"),
      startDate: financialDate(startDate),
      endDate: financialDate(endDate),
    });

    expect(interest.value).toBe(expected);
  });

  it("supports zero interest", () => {
    const interest = calculateInterest({
      balance: money("765000"),
      annualRate: annualInterestRate("0"),
      startDate: financialDate("2026-09-15"),
      endDate: financialDate("2026-10-15"),
    });

    expect(interest.value).toBe("0.00");
  });

  it("rounds money with ROUND_HALF_UP", () => {
    const interest = calculateInterest({
      balance: money("1000"),
      annualRate: annualInterestRate("1.825"),
      startDate: financialDate("2026-01-01"),
      endDate: financialDate("2026-01-02"),
    });

    expect(interest.value).toBe("0.05");
  });

  it("handles large balances without floating point arithmetic", () => {
    const interest = calculateInterest({
      balance: money("9876543210.99"),
      annualRate: annualInterestRate("6"),
      startDate: financialDate("2026-01-01"),
      endDate: financialDate("2026-02-01"),
    });

    expect(interest.value).toBe("50329781.84");
  });
});
