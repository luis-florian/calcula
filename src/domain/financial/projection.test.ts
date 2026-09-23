import { describe, expect, it } from "vitest";

import {
  annualInterestRate,
  calculatePaymentForTerm,
  calculateTerm,
  financialDate,
  generateProjection,
  money,
} from "@/domain/financial";

describe("projection calculations", () => {
  it("calculates a term for a fixed payment", () => {
    const result = calculateTerm({
      openingBalance: money("10000"),
      annualRate: annualInterestRate("6"),
      startDate: financialDate("2026-01-01"),
      firstPaymentDate: financialDate("2026-02-01"),
      paymentAmount: money("1000"),
    });

    expect(result.numberOfPayments).toBeGreaterThan(10);
    expect(result.estimatedEndDate).toBe("2026-12-01");
    expect(result.lastPayment.value).toBe("283.28");
    expect(result.totalPaid.value).toBe("10283.28");
  });

  it("calculates a payment amount for a target term using the same engine", () => {
    const payment = calculatePaymentForTerm({
      openingBalance: money("10000"),
      annualRate: annualInterestRate("6"),
      startDate: financialDate("2026-01-01"),
      firstPaymentDate: financialDate("2026-02-01"),
      targetEndDate: financialDate("2026-12-01"),
    });

    expect(payment.value).toBe("936.46");
  });

  it("generates projection rows until payoff for payment mode", () => {
    const projection = generateProjection({
      mode: "PAYMENT",
      openingBalance: money("10000"),
      annualRate: annualInterestRate("6"),
      startDate: financialDate("2026-01-01"),
      firstPaymentDate: financialDate("2026-02-01"),
      paymentAmount: money("1000"),
    });

    expect(projection.at(0)).toMatchObject({
      paymentNumber: 1,
      expectedDate: "2026-02-01",
      openingBalance: { value: "10000.00" },
      payment: { value: "1000.00" },
      interest: { value: "50.96" },
      principal: { value: "949.04" },
      closingBalance: { value: "9050.96" },
    });
    expect(projection.at(-1)?.closingBalance.value).toBe("0.00");
  });

  it("generates projection rows for term mode", () => {
    const projection = generateProjection({
      mode: "TERM",
      openingBalance: money("10000"),
      annualRate: annualInterestRate("6"),
      startDate: financialDate("2026-01-01"),
      firstPaymentDate: financialDate("2026-02-01"),
      targetEndDate: financialDate("2026-12-01"),
    });

    expect(projection).toHaveLength(11);
    expect(projection.at(-1)?.closingBalance.value).toBe("0.00");
  });
});
