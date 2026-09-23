import { financialDate, type FinancialDate } from "@/domain/financial";
import {
  listActiveFinancingsByOwner,
  listCompletedFinancingsByOwner,
} from "@/db/queries/financings";
import { listConfirmedPaymentsForFinancings } from "@/db/queries/payments";
import {
  toActiveSaleSummary,
  toCompletedSaleSummary,
  type ActiveSaleSummary,
  type CompletedSaleSummary,
} from "@/application/sales-summary";

export type ActiveSalesResult = {
  completedSales: CompletedSaleSummary[];
  databaseUnavailable: boolean;
  sales: ActiveSaleSummary[];
};

export async function listActiveSales(
  ownerId: string,
): Promise<ActiveSalesResult> {
  if (!process.env.DATABASE_URL) {
    return {
      completedSales: [],
      databaseUnavailable: true,
      sales: [],
    };
  }

  const financings = await listActiveFinancingsByOwner(ownerId);
  const completedFinancings = await listCompletedFinancingsByOwner(ownerId);
  const payments = await listConfirmedPaymentsForFinancings(
    financings.map((financing) => financing.id),
  );
  const lastPaymentByFinancingId = new Map<string, FinancialDate>();

  for (const payment of payments) {
    if (!lastPaymentByFinancingId.has(payment.financingId)) {
      lastPaymentByFinancingId.set(
        payment.financingId,
        financialDate(payment.paymentDate),
      );
    }
  }

  return {
    completedSales: completedFinancings.map(toCompletedSaleSummary),
    databaseUnavailable: false,
    sales: financings.map((financing) =>
      toActiveSaleSummary(
        financing,
        lastPaymentByFinancingId.get(financing.id),
      ),
    ),
  };
}
