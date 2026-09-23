import { and, desc, inArray, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { payments, type Payment } from "@/db/schema";

export type LastConfirmedPayment = Pick<Payment, "financingId" | "paymentDate">;

export async function listConfirmedPaymentsForFinancings(
  financingIds: string[],
): Promise<LastConfirmedPayment[]> {
  if (financingIds.length === 0) {
    return [];
  }

  const db = getDb();

  return db
    .select({
      financingId: payments.financingId,
      paymentDate: payments.paymentDate,
    })
    .from(payments)
    .where(
      and(
        inArray(payments.financingId, financingIds),
        eq(payments.status, "CONFIRMED"),
      ),
    )
    .orderBy(desc(payments.paymentDate), desc(payments.createdAt));
}
