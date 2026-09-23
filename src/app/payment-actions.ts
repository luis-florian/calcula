"use server";

import {
  getPaymentErrorMessage,
  previewPayment,
  registerPayment,
  type RegisteredPaymentResult,
} from "@/application/payment-registration";
import type { PaymentCalculationResult } from "@/application/payment-calculation";
import {
  paymentConfirmationSchema,
  paymentPreviewSchema,
} from "@/validation/payment";

export type PaymentPreviewActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  idempotencyKey?: string;
  preview?: PaymentCalculationResult;
  values?: Record<string, string>;
};

export type PaymentRegistrationActionState = {
  error?: string;
  result?: RegisteredPaymentResult;
};

export async function previewPaymentAction(
  _previousState: PaymentPreviewActionState,
  formData: FormData,
): Promise<PaymentPreviewActionState> {
  const raw = Object.fromEntries(formData);
  const values = stringifyFormValues(raw);
  const parsed = paymentPreviewSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Revise los datos marcados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    return {
      idempotencyKey: crypto.randomUUID(),
      preview: await previewPayment({
        ownerId: "dev_user",
        payment: parsed.data,
      }),
      values,
    };
  } catch (error) {
    return {
      error: getPaymentErrorMessage(error),
      values,
    };
  }
}

export async function registerPaymentAction(
  _previousState: PaymentRegistrationActionState,
  formData: FormData,
): Promise<PaymentRegistrationActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = paymentConfirmationSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Revise el pago antes de confirmar.",
    };
  }

  try {
    return {
      result: await registerPayment({
        ownerId: "dev_user",
        payment: parsed.data,
      }),
    };
  } catch (error) {
    return {
      error: getPaymentErrorMessage(error),
    };
  }
}

function stringifyFormValues(
  raw: Record<string, FormDataEntryValue>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([key]) => !key.startsWith("$ACTION_"))
      .map(([key, value]) => [key, String(value)]),
  );
}
