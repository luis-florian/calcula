import { and, asc, desc, eq, inArray } from "drizzle-orm";

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

export async function getLastConfirmedPaymentForFinancing(
  financingId: string,
): Promise<LastConfirmedPayment | null> {
  const db = getDb();
  const [payment] = await db
    .select({
      financingId: payments.financingId,
      paymentDate: payments.paymentDate,
    })
    .from(payments)
    .where(
      and(
        eq(payments.financingId, financingId),
        eq(payments.status, "CONFIRMED"),
      ),
    )
    .orderBy(desc(payments.paymentDate), desc(payments.createdAt))
    .limit(1);

  return payment ?? null;
}

export async function listConfirmedPaymentsForFinancing(
  financingId: string,
): Promise<Payment[]> {
  const db = getDb();

  return db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.financingId, financingId),
        eq(payments.status, "CONFIRMED"),
      ),
    )
    .orderBy(desc(payments.paymentDate), desc(payments.createdAt));
}

export async function listConfirmedPaymentsForFinancingChronological(
  financingId: string,
): Promise<Payment[]> {
  const db = getDb();

  return db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.financingId, financingId),
        eq(payments.status, "CONFIRMED"),
      ),
    )
    .orderBy(asc(payments.paymentDate), asc(payments.createdAt));
}

export async function getConfirmedPaymentByFinancing(input: {
  financingId: string;
  paymentId: string;
}): Promise<Payment | null> {
  const db = getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.financingId, input.financingId),
        eq(payments.id, input.paymentId),
        eq(payments.status, "CONFIRMED"),
      ),
    )
    .limit(1);

  return payment ?? null;
}
