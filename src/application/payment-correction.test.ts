import { describe, expect, it } from "vitest";

import { recalculatePaymentChain } from "@/application/payment-correction";

describe("recalculatePaymentChain", () => {
  it("recalculates later payments after correcting an old payment", () => {
    const [corrected, later] = recalculatePaymentChain({
      financing: {
        annualInterestRate: "6.0000",
        expectedPaymentDay: 15,
        id: "fin_1",
        initialCapital: "765000.00",
        startDate: "2026-09-15",
        targetPayment: "6000.00",
      },
      payments: [
        {
          amount: "7000.00",
          paymentDate: "2026-10-15",
        },
        {
          amount: "6000.00",
          paymentDate: "2026-11-15",
        },
      ],
    });

    expect(corrected).toMatchObject({
      closingBalanceRaw: "761772.60",
      interestRaw: "3772.60",
      openingBalanceRaw: "765000.00",
      principalRaw: "3227.40",
    });
    expect(later).toMatchObject({
      daysElapsed: 31,
      openingBalanceRaw: "761772.60",
      previousPaymentDateRaw: "2026-10-15",
    });
  });
});
