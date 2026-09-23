import {
  annualInterestRate,
  compareFinancialDates,
  financialDate,
  generateProjection,
  isZeroMoney,
  money,
  nextMonthlyDate,
  type FinancialDate,
} from "@/domain/financial";
import type { Financing, Payment } from "@/db/schema";
import { formatLongDate, formatMoney, formatShortDate } from "@/lib/format";

export type PaymentHistoryItem = {
  amount: string;
  amountRaw: string;
  closingBalance: string;
  daysElapsed: number;
  id: string;
  interest: string;
  openingBalance: string;
  paymentDate: string;
  paymentDateLong: string;
  paymentDateRaw: string;
  principal: string;
};

export type FutureProjectionItem = {
  closingBalance: string;
  expectedDate: string;
  interest: string;
  payment: string;
  paymentNumber: number;
  principal: string;
};

export type PaymentPlanSummary = {
  futurePayments: FutureProjectionItem[];
  history: PaymentHistoryItem[];
  projectedPayment: string | null;
  saleName: string;
};

type PaymentPlanFinancing = Pick<
  Financing,
  | "annualInterestRate"
  | "currentBalance"
  | "expectedPaymentDay"
  | "name"
  | "startDate"
  | "targetEndDate"
>;

export function buildPaymentPlanSummary(input: {
  financing: PaymentPlanFinancing;
  payments: Payment[];
}): PaymentPlanSummary {
  const chronologicalPayments = [...input.payments].sort((left, right) =>
    left.paymentDate.localeCompare(right.paymentDate),
  );
  const lastPayment = chronologicalPayments.at(-1);
  const history = chronologicalPayments.map(toPaymentHistoryItem);
  const futurePayments = buildFutureProjection({
    financing: input.financing,
    lastPaymentDate: lastPayment
      ? financialDate(lastPayment.paymentDate)
      : undefined,
  });

  return {
    futurePayments,
    history,
    projectedPayment: futurePayments[0]?.payment ?? null,
    saleName: input.financing.name,
  };
}

export function toPaymentHistoryItem(payment: Payment): PaymentHistoryItem {
  return {
    amount: formatMoney(payment.amount),
    amountRaw: payment.amount,
    closingBalance: formatMoney(payment.closingBalance),
    daysElapsed: payment.daysElapsed,
    id: payment.id,
    interest: formatMoney(payment.interestAmount),
    openingBalance: formatMoney(payment.openingBalance),
    paymentDate: formatShortDate(payment.paymentDate),
    paymentDateLong: formatLongDate(payment.paymentDate),
    paymentDateRaw: payment.paymentDate,
    principal: formatMoney(payment.principalAmount),
  };
}

function buildFutureProjection(input: {
  financing: PaymentPlanFinancing;
  lastPaymentDate?: FinancialDate;
}): FutureProjectionItem[] {
  const currentBalance = money(input.financing.currentBalance);

  if (isZeroMoney(currentBalance)) {
    return [];
  }

  const startDate =
    input.lastPaymentDate ?? financialDate(input.financing.startDate);
  const firstPaymentDate = nextMonthlyDate(
    startDate,
    input.financing.expectedPaymentDay,
  );
  const targetEndDate = financialDate(input.financing.targetEndDate);

  if (compareFinancialDates(firstPaymentDate, targetEndDate) > 0) {
    return [];
  }

  const projection = generateProjection({
    annualRate: annualInterestRate(input.financing.annualInterestRate),
    firstPaymentDate,
    mode: "TERM",
    openingBalance: currentBalance,
    startDate,
    targetEndDate,
  });

  return projection.map((row) => ({
    closingBalance: formatMoney(row.closingBalance.value),
    expectedDate: formatShortDate(row.expectedDate),
    interest: formatMoney(row.interest.value),
    payment: formatMoney(row.payment.value),
    paymentNumber: row.paymentNumber,
    principal: formatMoney(row.principal.value),
  }));
}
