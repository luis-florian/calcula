import { describe, expect, it } from "vitest";

import { financialDate } from "@/domain/financial";
import { toActiveSaleSummary } from "@/application/sales-summary";

describe("toActiveSaleSummary", () => {
  it("summarizes a sale without payments using the first payment date", () => {
    expect(
      toActiveSaleSummary({
        buyerName: "Juan Perez",
        currentBalance: "765000.00",
        expectedPaymentDay: 15,
        firstPaymentDate: "2026-10-15",
        id: "fin_1",
        name: "Casa zona 10",
        targetPayment: "6000.00",
      }),
    ).toEqual({
      buyerName: "Juan Perez",
      currentBalance: "Q765,000.00",
      id: "fin_1",
      name: "Casa zona 10",
      nextPaymentDate: "15 OCT 2026",
      targetPayment: "Q6,000.00",
    });
  });

  it("moves the next payment after the last confirmed payment", () => {
    expect(
      toActiveSaleSummary(
        {
          buyerName: null,
          currentBalance: "762772.60",
          expectedPaymentDay: 15,
          firstPaymentDate: "2026-10-15",
          id: "fin_1",
          name: "Casa zona 10",
          targetPayment: "6000.00",
        },
        financialDate("2026-10-15"),
      ),
    ).toMatchObject({
      buyerName: "Sin comprador",
      currentBalance: "Q762,772.60",
      nextPaymentDate: "15 NOV 2026",
    });
  });
});
