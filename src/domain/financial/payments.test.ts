import { describe, expect, it } from "vitest";

import {
  FinancialError,
  annualInterestRate,
  applyPayment,
  financialDate,
  money,
} from "@/domain/financial";

describe("applyPayment", () => {
  it("applies the documented reference payment", () => {
    const result = applyPayment({
      openingBalance: money("765000"),
      annualRate: annualInterestRate("6"),
      previousDate: financialDate("2026-09-15"),
      paymentDate: financialDate("2026-10-15"),
      paymentAmount: money("6000"),
    });

    expect(result.daysElapsed).toBe(30);
    expect(result.interest.value).toBe("3772.60");
    expect(result.principal.value).toBe("2227.40");
    expect(result.closingBalance.value).toBe("762772.60");
  });

  it("rejects payments below accrued interest because that rule is unresolved", () => {
    expect(() =>
      applyPayment({
        openingBalance: money("765000"),
        annualRate: annualInterestRate("6"),
        previousDate: financialDate("2026-09-15"),
        paymentDate: financialDate("2026-10-15"),
        paymentAmount: money("3000"),
      }),
    ).toThrowError(FinancialError);
  });
});
