import {
  financialDate,
  nextMonthlyDate,
  type FinancialDate,
} from "@/domain/financial";
import type { Financing } from "@/db/schema";
import { formatMoney, formatShortDate } from "@/lib/format";

export type ActiveSaleSummary = {
  buyerName: string;
  id: string;
  name: string;
  nextPaymentDate: string;
  targetPayment: string;
  currentBalance: string;
};

export type CompletedSaleSummary = {
  buyerName: string;
  currentBalance: string;
  id: string;
  name: string;
  statusLabel: string;
};

export function toActiveSaleSummary(
  financing: Pick<
    Financing,
    | "buyerName"
    | "currentBalance"
    | "expectedPaymentDay"
    | "firstPaymentDate"
    | "id"
    | "name"
    | "targetPayment"
  >,
  lastPaymentDate?: FinancialDate,
): ActiveSaleSummary {
  const nextPaymentDate = lastPaymentDate
    ? nextMonthlyDate(lastPaymentDate, financing.expectedPaymentDay)
    : financialDate(financing.firstPaymentDate);

  return {
    buyerName: financing.buyerName || "Sin comprador",
    currentBalance: formatMoney(financing.currentBalance),
    id: financing.id,
    name: financing.name,
    nextPaymentDate: formatShortDate(nextPaymentDate),
    targetPayment: formatMoney(financing.targetPayment),
  };
}

export function toCompletedSaleSummary(
  financing: Pick<Financing, "buyerName" | "currentBalance" | "id" | "name">,
): CompletedSaleSummary {
  return {
    buyerName: financing.buyerName || "Sin comprador",
    currentBalance: formatMoney(financing.currentBalance),
    id: financing.id,
    name: financing.name,
    statusLabel: "Finalizada",
  };
}
