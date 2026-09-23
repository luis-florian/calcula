import type { Financing, Payment } from "@/db/schema";
import { financialDate, money } from "@/domain/financial";
import { calculatePaymentPreview } from "@/application/payment-calculation";

export type ReplayPaymentInput = {
  amount: string;
  paymentDate: string;
};

export type RecalculatedPayment = {
  amountRaw: string;
  closingBalanceRaw: string;
  daysElapsed: number;
  interestRaw: string;
  openingBalanceRaw: string;
  paymentDate: string;
  previousPaymentDateRaw: string;
  principalRaw: string;
};

type CorrectionFinancing = Pick<
  Financing,
  | "annualInterestRate"
  | "expectedPaymentDay"
  | "id"
  | "initialCapital"
  | "startDate"
  | "targetPayment"
>;

export function recalculatePaymentChain(input: {
  financing: CorrectionFinancing;
  payments: ReplayPaymentInput[];
  previousPayment?: Pick<Payment, "closingBalance" | "paymentDate">;
}): RecalculatedPayment[] {
  let openingBalance = money(
    input.previousPayment?.closingBalance ?? input.financing.initialCapital,
  );
  let previousDate = financialDate(
    input.previousPayment?.paymentDate ?? input.financing.startDate,
  );
  const recalculatedPayments: RecalculatedPayment[] = [];

  for (const payment of input.payments) {
    const preview = calculatePaymentPreview({
      amount: payment.amount,
      financing: {
        ...input.financing,
        currentBalance: openingBalance.value,
        startDate: previousDate,
      },
      paymentDate: payment.paymentDate,
    });

    recalculatedPayments.push({
      amountRaw: preview.amountRaw,
      closingBalanceRaw: preview.closingBalanceRaw,
      daysElapsed: preview.daysElapsed,
      interestRaw: preview.interestRaw,
      openingBalanceRaw: preview.openingBalanceRaw,
      paymentDate: payment.paymentDate,
      previousPaymentDateRaw: preview.previousPaymentDateRaw,
      principalRaw: preview.principalRaw,
    });

    openingBalance = money(preview.closingBalanceRaw);
    previousDate = financialDate(payment.paymentDate);
  }

  return recalculatedPayments;
}
