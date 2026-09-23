import { getFinancingByOwner } from "@/db/queries/financings";
import {
  getConfirmedPaymentByFinancing,
  listConfirmedPaymentsForFinancing,
} from "@/db/queries/payments";
import {
  buildPaymentPlanSummary,
  toPaymentHistoryItem,
  type PaymentHistoryItem,
  type PaymentPlanSummary,
} from "@/application/payment-plan-summary";

export type PaymentPlanResult =
  | {
      databaseUnavailable: true;
      plan: null;
    }
  | {
      databaseUnavailable: false;
      plan: PaymentPlanSummary | null;
    };

export type PaymentDetailResult =
  | {
      databaseUnavailable: true;
      payment: null;
      saleName: null;
    }
  | {
      databaseUnavailable: false;
      payment: PaymentHistoryItem | null;
      saleName: string | null;
    };

export async function getPaymentPlan(input: {
  financingId: string;
  ownerId: string;
}): Promise<PaymentPlanResult> {
  if (!process.env.DATABASE_URL) {
    return {
      databaseUnavailable: true,
      plan: null,
    };
  }

  const financing = await getFinancingByOwner({
    id: input.financingId,
    ownerId: input.ownerId,
  });

  if (!financing) {
    return {
      databaseUnavailable: false,
      plan: null,
    };
  }

  const payments = await listConfirmedPaymentsForFinancing(financing.id);

  return {
    databaseUnavailable: false,
    plan: buildPaymentPlanSummary({
      financing,
      payments,
    }),
  };
}

export async function getPaymentDetail(input: {
  financingId: string;
  ownerId: string;
  paymentId: string;
}): Promise<PaymentDetailResult> {
  if (!process.env.DATABASE_URL) {
    return {
      databaseUnavailable: true,
      payment: null,
      saleName: null,
    };
  }

  const financing = await getFinancingByOwner({
    id: input.financingId,
    ownerId: input.ownerId,
  });

  if (!financing) {
    return {
      databaseUnavailable: false,
      payment: null,
      saleName: null,
    };
  }

  const payment = await getConfirmedPaymentByFinancing({
    financingId: financing.id,
    paymentId: input.paymentId,
  });

  return {
    databaseUnavailable: false,
    payment: payment ? toPaymentHistoryItem(payment) : null,
    saleName: financing.name,
  };
}
