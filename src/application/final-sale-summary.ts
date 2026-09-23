import { addMoney, zeroMoney } from "@/domain/financial";
import type { Financing, Payment } from "@/db/schema";
import { formatLongDate, formatMoney } from "@/lib/format";

export type FinalSaleSummary = {
  buyerName: string;
  capital: string;
  firstPaymentDate: string;
  lastPaymentDate: string;
  name: string;
  totalInterest: string;
  totalReceived: string;
};

export function buildFinalSaleSummary(input: {
  financing: Pick<
    Financing,
    "buyerName" | "firstPaymentDate" | "initialCapital" | "name"
  >;
  payments: Pick<Payment, "amount" | "interestAmount" | "paymentDate">[];
}): FinalSaleSummary {
  const chronologicalPayments = [...input.payments].sort((left, right) =>
    left.paymentDate.localeCompare(right.paymentDate),
  );
  const totalReceived = chronologicalPayments.reduce(
    (total, payment) => addMoney(total, { value: payment.amount }),
    zeroMoney(),
  );
  const totalInterest = chronologicalPayments.reduce(
    (total, payment) => addMoney(total, { value: payment.interestAmount }),
    zeroMoney(),
  );
  const lastPayment = chronologicalPayments.at(-1);

  return {
    buyerName: input.financing.buyerName || "Sin comprador",
    capital: formatMoney(input.financing.initialCapital),
    firstPaymentDate: formatLongDate(input.financing.firstPaymentDate),
    lastPaymentDate: lastPayment
      ? formatLongDate(lastPayment.paymentDate)
      : "Sin pagos recibidos",
    name: input.financing.name,
    totalInterest: formatMoney(totalInterest.value),
    totalReceived: formatMoney(totalReceived.value),
  };
}
