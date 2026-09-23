import { describe, expect, it } from "vitest";

import {
  buildPaymentPlanSummary,
  toPaymentHistoryItem,
} from "@/application/payment-plan-summary";
import type { Financing, Payment } from "@/db/schema";

const financing = {
  annualInterestRate: "6.0000",
  currentBalance: "762772.60",
  expectedPaymentDay: 15,
  name: "Casa zona 10",
  startDate: "2026-09-15",
  targetEndDate: "2027-03-15",
} satisfies Pick<
  Financing,
  | "annualInterestRate"
  | "currentBalance"
  | "expectedPaymentDay"
  | "name"
  | "startDate"
  | "targetEndDate"
>;

const payment = {
  amount: "6000.00",
  closingBalance: "762772.60",
  createdAt: new Date("2026-10-15T00:00:00.000Z"),
  daysElapsed: 30,
  financingId: "fin_1",
  id: "pay_1",
  interestAmount: "3772.60",
  openingBalance: "765000.00",
  paymentDate: "2026-10-15",
  previousPaymentDate: "2026-09-15",
  principalAmount: "2227.40",
  status: "CONFIRMED",
  voidReason: null,
  voidedAt: null,
} satisfies Payment;

describe("payment plan summaries", () => {
  it("formats a confirmed payment for history", () => {
    expect(toPaymentHistoryItem(payment)).toMatchObject({
      amount: "Q6,000.00",
      closingBalance: "Q762,772.60",
      interest: "Q3,772.60",
      openingBalance: "Q765,000.00",
      paymentDate: "15 OCT 2026",
      principal: "Q2,227.40",
    });
  });

  it("builds past payments and recalculates future payments to the target end date", () => {
    const summary = buildPaymentPlanSummary({
      financing,
      payments: [payment],
    });

    expect(summary.history).toHaveLength(1);
    expect(summary.futurePayments.length).toBeGreaterThan(0);
    expect(summary.futurePayments[0]).toMatchObject({
      expectedDate: "15 NOV 2026",
      paymentNumber: 1,
    });
    expect(summary.projectedPayment).toBe(summary.futurePayments[0]?.payment);
  });
});
