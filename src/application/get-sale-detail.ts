import { financialDate } from "@/domain/financial";
import { getFinancingByOwner } from "@/db/queries/financings";
import {
  getLastConfirmedPaymentForFinancing,
  listConfirmedPaymentsForFinancingChronological,
} from "@/db/queries/payments";
import {
  buildFinalSaleSummary,
  type FinalSaleSummary,
} from "@/application/final-sale-summary";
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
      sale:
        | {
            kind: "ACTIVE";
            summary: ActiveSaleSummary;
          }
        | {
            finalSummary: FinalSaleSummary;
            kind: "COMPLETED";
          }
        | null;
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

  const financing = await getFinancingByOwner(input);

  if (!financing) {
    return {
      databaseUnavailable: false,
      sale: null,
    };
  }

  if (financing.status === "COMPLETED") {
    const payments = await listConfirmedPaymentsForFinancingChronological(
      financing.id,
    );

    return {
      databaseUnavailable: false,
      sale: {
        finalSummary: buildFinalSaleSummary({
          financing,
          payments,
        }),
        kind: "COMPLETED",
      },
    };
  }

  const lastPayment = await getLastConfirmedPaymentForFinancing(financing.id);
  return {
    databaseUnavailable: false,
    sale: {
      kind: "ACTIVE",
      summary: toActiveSaleSummary(
        financing,
        lastPayment ? financialDate(lastPayment.paymentDate) : undefined,
      ),
    },
  };
}
