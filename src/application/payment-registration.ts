import { and, desc, eq } from "drizzle-orm";

import { FinancialError, financialDate } from "@/domain/financial";
import { getDb } from "@/db/client";
import { financings, payments } from "@/db/schema";
import {
  calculatePaymentPreview,
  paymentResultFromPersistedPayment,
  type PaymentCalculationResult,
} from "@/application/payment-calculation";
import type {
  PaymentConfirmationInput,
  PaymentPreviewInput,
} from "@/validation/payment";

export type RegisteredPaymentResult = Pick<
  PaymentCalculationResult,
  | "amount"
  | "amountRaw"
  | "closingBalance"
  | "closingBalanceRaw"
  | "nextPaymentDate"
>;

export async function previewPayment(input: {
  ownerId: string;
  payment: PaymentPreviewInput;
}): Promise<PaymentCalculationResult> {
  const db = getDb();
  const [financing] = await db
    .select()
    .from(financings)
    .where(
      and(
        eq(financings.id, input.payment.financingId),
        eq(financings.ownerId, input.ownerId),
        eq(financings.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!financing) {
    throw new Error("FINANCING_NOT_FOUND");
  }

  const [lastPayment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.financingId, financing.id),
        eq(payments.status, "CONFIRMED"),
      ),
    )
    .orderBy(desc(payments.paymentDate), desc(payments.createdAt))
    .limit(1);

  return calculatePaymentPreview({
    amount: input.payment.amount,
    financing,
    lastPaymentDate: lastPayment
      ? financialDate(lastPayment.paymentDate)
      : undefined,
    paymentDate: input.payment.paymentDate,
  });
}

export async function registerPayment(input: {
  ownerId: string;
  payment: PaymentConfirmationInput;
}): Promise<RegisteredPaymentResult> {
  const db = getDb();
  const paymentId = `pay_${input.payment.idempotencyKey}`;

  return db.transaction(async (tx) => {
    const [financing] = await tx
      .select()
      .from(financings)
      .where(
        and(
          eq(financings.id, input.payment.financingId),
          eq(financings.ownerId, input.ownerId),
          eq(financings.status, "ACTIVE"),
        ),
      )
      .for("update")
      .limit(1);

    if (!financing) {
      throw new Error("FINANCING_NOT_FOUND");
    }

    const [existingPayment] = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.financingId, financing.id),
          eq(payments.status, "CONFIRMED"),
        ),
      )
      .limit(1);

    if (existingPayment) {
      return paymentResultFromPersistedPayment({
        expectedPaymentDay: financing.expectedPaymentDay,
        payment: existingPayment,
      });
    }

    const [lastPayment] = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.financingId, financing.id),
          eq(payments.status, "CONFIRMED"),
        ),
      )
      .orderBy(desc(payments.paymentDate), desc(payments.createdAt))
      .limit(1);

    const preview = calculatePaymentPreview({
      amount: input.payment.amount,
      financing,
      lastPaymentDate: lastPayment
        ? financialDate(lastPayment.paymentDate)
        : undefined,
      paymentDate: input.payment.paymentDate,
    });

    const [createdPayment] = await tx
      .insert(payments)
      .values({
        amount: preview.amountRaw,
        closingBalance: preview.closingBalanceRaw,
        daysElapsed: preview.daysElapsed,
        financingId: financing.id,
        id: paymentId,
        interestAmount: preview.interestRaw,
        openingBalance: preview.openingBalanceRaw,
        paymentDate: input.payment.paymentDate,
        previousPaymentDate: preview.previousPaymentDateRaw,
        principalAmount: preview.principalRaw,
        status: "CONFIRMED",
      })
      .returning();

    await tx
      .update(financings)
      .set({
        currentBalance: preview.closingBalanceRaw,
        updatedAt: new Date(),
      })
      .where(eq(financings.id, financing.id));

    return paymentResultFromPersistedPayment({
      expectedPaymentDay: financing.expectedPaymentDay,
      payment: createdPayment,
    });
  });
}

export function getPaymentErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.includes("DATABASE_URL is required")
  ) {
    return "Configure DATABASE_URL con la base de datos de desarrollo antes de registrar pagos.";
  }

  if (error instanceof Error && error.message === "FINANCING_NOT_FOUND") {
    return "No se encontró la venta activa.";
  }

  if (error instanceof FinancialError) {
    if (error.code === "PAYMENT_BELOW_ACCRUED_INTEREST") {
      return "Con ese pago la deuda no bajaría. Pruebe con una cantidad mayor.";
    }

    if (error.code === "INVALID_DATE_RANGE") {
      return "La fecha del pago debe ser posterior al pago anterior.";
    }

    if (error.code === "INVALID_MONEY_AMOUNT") {
      return "Revise la cantidad recibida.";
    }
  }

  return "No se pudo registrar el pago. Intente nuevamente.";
}
