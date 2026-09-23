import { financialDate } from "@/domain/financial";
import { getActiveFinancingByOwner } from "@/db/queries/financings";
import { getLastConfirmedPaymentForFinancing } from "@/db/queries/payments";
import {
  toActiveSaleSummary,
  type ActiveSaleSummary,
} from "@/application/sales-summary";

export type SaleDetailResult =
  | {
      databaseUnavailable: true;
      sale: null;
    }
  | {
      databaseUnavailable: false;
      sale: ActiveSaleSummary | null;
    };

export async function getSaleDetail(input: {
  id: string;
  ownerId: string;
}): Promise<SaleDetailResult> {
  if (!process.env.DATABASE_URL) {
    return {
      databaseUnavailable: true,
      sale: null,
    };
  }

  const financing = await getActiveFinancingByOwner(input);

  if (!financing) {
    return {
      databaseUnavailable: false,
      sale: null,
    };
  }

  const lastPayment = await getLastConfirmedPaymentForFinancing(financing.id);

  return {
    databaseUnavailable: false,
    sale: toActiveSaleSummary(
      financing,
      lastPayment ? financialDate(lastPayment.paymentDate) : undefined,
    ),
  };
}
