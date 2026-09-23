import { and, asc, desc, eq, inArray } from "drizzle-orm";

import {
  FinancialError,
  financialDate,
  isZeroMoney,
  money,
} from "@/domain/financial";
import { getDb } from "@/db/client";
import { createId } from "@/db/ids";
import { financings, payments, type Payment } from "@/db/schema";
import {
  calculatePaymentPreview,
  paymentResultFromPersistedPayment,
  type PaymentCalculationResult,
} from "@/application/payment-calculation";
import {
  buildFinalSaleSummary,
  type FinalSaleSummary,
} from "@/application/final-sale-summary";
import { recalculatePaymentChain } from "@/application/payment-correction";
import type {
  PaymentConfirmationInput,
  PaymentCorrectionInput,
  PaymentPreviewInput,
} from "@/validation/payment";

export type RegisteredPaymentResult = Pick<
  PaymentCalculationResult,
  | "amount"
  | "amountRaw"
  | "closingBalance"
  | "closingBalanceRaw"
  | "nextPaymentDate"
> & {
  completed: boolean;
  finalSummary?: FinalSaleSummary;
};

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
      const result = paymentResultFromPersistedPayment({
        expectedPaymentDay: financing.expectedPaymentDay,
        payment: existingPayment,
      });

      return {
        ...result,
        completed: isZeroMoney(money(existingPayment.closingBalance)),
      };
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

    const completed = isZeroMoney(money(preview.closingBalanceRaw));

    await tx
      .update(financings)
      .set({
        completedAt: completed ? new Date() : null,
        currentBalance: preview.closingBalanceRaw,
        status: completed ? "COMPLETED" : "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(financings.id, financing.id));

    const result = paymentResultFromPersistedPayment({
      expectedPaymentDay: financing.expectedPaymentDay,
      payment: createdPayment,
    });

    if (!completed) {
      return {
        ...result,
        completed: false,
      };
    }

    const confirmedPayments = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.financingId, financing.id),
          eq(payments.status, "CONFIRMED"),
        ),
      )
      .orderBy(desc(payments.paymentDate), desc(payments.createdAt));

    return {
      ...result,
      completed: true,
      finalSummary: buildFinalSaleSummary({
        financing,
        payments: confirmedPayments,
      }),
    };
  });
}

export async function correctPayment(input: {
  ownerId: string;
  payment: PaymentCorrectionInput;
}): Promise<RegisteredPaymentResult> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [financing] = await tx
      .select()
      .from(financings)
      .where(
        and(
          eq(financings.id, input.payment.financingId),
          eq(financings.ownerId, input.ownerId),
        ),
      )
      .for("update")
      .limit(1);

    if (!financing) {
      throw new Error("FINANCING_NOT_FOUND");
    }

    const confirmedPayments = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.financingId, financing.id),
          eq(payments.status, "CONFIRMED"),
        ),
      )
      .orderBy(asc(payments.paymentDate), asc(payments.createdAt))
      .for("update");

    const correctionIndex = confirmedPayments.findIndex(
      (payment) => payment.id === input.payment.paymentId,
    );

    if (correctionIndex < 0) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    const previousPayment = confirmedPayments[correctionIndex - 1];
    const paymentsToReplace = confirmedPayments.slice(correctionIndex);
    const replayPayments = [
      {
        amount: input.payment.amount,
        paymentDate: input.payment.paymentDate,
      },
      ...paymentsToReplace.slice(1).map((payment) => ({
        amount: payment.amount,
        paymentDate: payment.paymentDate,
      })),
    ];

    await tx
      .update(payments)
      .set({
        status: "VOIDED",
        voidReason: "Corrección de pago",
        voidedAt: new Date(),
      })
      .where(
        inArray(
          payments.id,
          paymentsToReplace.map((payment) => payment.id),
        ),
      );

    const recalculatedPayments = recalculatePaymentChain({
      financing,
      payments: replayPayments,
      previousPayment,
    });
    let lastCreatedPayment: Payment | undefined;

    for (const recalculatedPayment of recalculatedPayments) {
      const [createdPayment] = await tx
        .insert(payments)
        .values({
          amount: recalculatedPayment.amountRaw,
          closingBalance: recalculatedPayment.closingBalanceRaw,
          daysElapsed: recalculatedPayment.daysElapsed,
          financingId: financing.id,
          id: createId("pay"),
          interestAmount: recalculatedPayment.interestRaw,
          openingBalance: recalculatedPayment.openingBalanceRaw,
          paymentDate: recalculatedPayment.paymentDate,
          previousPaymentDate: recalculatedPayment.previousPaymentDateRaw,
          principalAmount: recalculatedPayment.principalRaw,
          status: "CONFIRMED",
        })
        .returning();

      lastCreatedPayment = createdPayment;
    }

    if (!lastCreatedPayment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    const completed = isZeroMoney(money(lastCreatedPayment.closingBalance));

    await tx
      .update(financings)
      .set({
        completedAt: completed ? new Date() : null,
        currentBalance: lastCreatedPayment.closingBalance,
        status: completed ? "COMPLETED" : "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(financings.id, financing.id));

    const result = paymentResultFromPersistedPayment({
      expectedPaymentDay: financing.expectedPaymentDay,
      payment: lastCreatedPayment,
    });

    if (!completed) {
      return {
        ...result,
        completed: false,
      };
    }

    const currentConfirmedPayments = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.financingId, financing.id),
          eq(payments.status, "CONFIRMED"),
        ),
      )
      .orderBy(desc(payments.paymentDate), desc(payments.createdAt));

    return {
      ...result,
      completed: true,
      finalSummary: buildFinalSaleSummary({
        financing,
        payments: currentConfirmedPayments,
      }),
    };
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

  if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
    return "No se encontró el pago confirmado.";
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
