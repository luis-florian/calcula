import { describe, expect, it } from "vitest";

import { financialDate } from "@/domain/financial";
import { calculatePaymentPreview } from "@/application/payment-calculation";

const financing = {
  annualInterestRate: "6.0000",
  currentBalance: "765000.00",
  expectedPaymentDay: 15,
  id: "fin_1",
  startDate: "2026-09-15",
  targetPayment: "6000.00",
};

describe("calculatePaymentPreview", () => {
  it("previews the documented first payment without persisting it", () => {
    const preview = calculatePaymentPreview({
      amount: "6000",
      financing,
      paymentDate: "2026-10-15",
    });

    expect(preview).toMatchObject({
      amount: "Q6,000.00",
      closingBalance: "Q762,772.60",
      closingBalanceRaw: "762772.60",
      daysElapsed: 30,
      interest: "Q3,772.60",
      openingBalance: "Q765,000.00",
      principal: "Q2,227.40",
    });
  });

  it("uses the last confirmed payment date for later payments", () => {
    const preview = calculatePaymentPreview({
      amount: "6000",
      financing: {
        ...financing,
        currentBalance: "762772.60",
      },
      lastPaymentDate: financialDate("2026-10-15"),
      paymentDate: "2026-11-15",
    });

    expect(preview.daysElapsed).toBe(31);
    expect(preview.openingBalance).toBe("Q762,772.60");
    expect(preview.nextPaymentDate).toBe("15 DIC 2026");
  });
});
