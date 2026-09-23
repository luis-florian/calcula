import {
  FinancialError,
  annualInterestRate,
  applyPayment,
  financialDate,
  money,
  nextMonthlyDate,
  toMoneyDecimal,
  type FinancialDate,
} from "@/domain/financial";
import type { Financing, Payment } from "@/db/schema";
import { formatLongDate, formatMoney, formatShortDate } from "@/lib/format";

export type PaymentFinancingSnapshot = Pick<
  Financing,
  | "annualInterestRate"
  | "currentBalance"
  | "expectedPaymentDay"
  | "id"
  | "startDate"
  | "targetPayment"
>;

export type PaymentCalculationResult = {
  amount: string;
  amountRaw: string;
  closingBalance: string;
  closingBalanceRaw: string;
  daysElapsed: number;
  interest: string;
  interestRaw: string;
  isAboveExpected: boolean;
  isBelowExpected: boolean;
  nextPaymentDate: string;
  openingBalance: string;
  openingBalanceRaw: string;
  paymentDate: string;
  paymentDateLong: string;
  previousPaymentDateRaw: string;
  principal: string;
  principalRaw: string;
  targetPayment: string;
};

export function calculatePaymentPreview(input: {
  amount: string;
  financing: PaymentFinancingSnapshot;
  lastPaymentDate?: FinancialDate;
  paymentDate: string;
}): PaymentCalculationResult {
  const paymentAmount = money(input.amount);
  const openingBalance = money(input.financing.currentBalance);
  const annualRate = annualInterestRate(input.financing.annualInterestRate);
  const previousPaymentDate =
    input.lastPaymentDate ?? financialDate(input.financing.startDate);
  const paymentDate = financialDate(input.paymentDate);
  const applied = applyPayment({
    annualRate,
    openingBalance,
    paymentAmount,
    paymentDate,
    previousDate: previousPaymentDate,
  });
  const targetPayment = money(input.financing.targetPayment);
  const paymentDecimal = toMoneyDecimal(paymentAmount);
  const targetDecimal = toMoneyDecimal(targetPayment);

  if (toMoneyDecimal(applied.closingBalance).lessThan(0)) {
    throw new FinancialError(
      "INVALID_MONEY_AMOUNT",
      "Payment cannot exceed the current payoff amount.",
    );
  }

  return {
    amount: formatMoney(paymentAmount.value),
    amountRaw: paymentAmount.value,
    closingBalance: formatMoney(applied.closingBalance.value),
    closingBalanceRaw: applied.closingBalance.value,
    daysElapsed: applied.daysElapsed,
    interest: formatMoney(applied.interest.value),
    interestRaw: applied.interest.value,
    isAboveExpected: paymentDecimal.greaterThan(targetDecimal),
    isBelowExpected: paymentDecimal.lessThan(targetDecimal),
    nextPaymentDate: formatShortDate(
      nextMonthlyDate(paymentDate, input.financing.expectedPaymentDay),
    ),
    openingBalance: formatMoney(openingBalance.value),
    openingBalanceRaw: openingBalance.value,
    paymentDate: formatShortDate(paymentDate),
    paymentDateLong: formatLongDate(paymentDate),
    previousPaymentDateRaw: previousPaymentDate,
    principal: formatMoney(applied.principal.value),
    principalRaw: applied.principal.value,
    targetPayment: formatMoney(targetPayment.value),
  };
}

export function paymentResultFromPersistedPayment(input: {
  expectedPaymentDay: number;
  payment: Pick<Payment, "amount" | "closingBalance" | "paymentDate">;
}): Pick<
  PaymentCalculationResult,
  | "amount"
  | "amountRaw"
  | "closingBalance"
  | "closingBalanceRaw"
  | "nextPaymentDate"
> {
  const paymentDate = financialDate(input.payment.paymentDate);

  return {
    amount: formatMoney(input.payment.amount),
    amountRaw: input.payment.amount,
    closingBalance: formatMoney(input.payment.closingBalance),
    closingBalanceRaw: input.payment.closingBalance,
    nextPaymentDate: formatShortDate(
      nextMonthlyDate(paymentDate, input.expectedPaymentDay),
    ),
  };
}
