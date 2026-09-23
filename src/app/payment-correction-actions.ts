"use server";

import {
  correctPayment,
  getPaymentErrorMessage,
  type RegisteredPaymentResult,
} from "@/application/payment-registration";
import { requireAuthenticatedUser } from "@/lib/auth";
import { paymentCorrectionSchema } from "@/validation/payment";

export type PaymentCorrectionActionState = {
  error?: string;
  result?: RegisteredPaymentResult;
  values?: Record<string, string>;
};

export async function correctPaymentAction(
  _previousState: PaymentCorrectionActionState,
  formData: FormData,
): Promise<PaymentCorrectionActionState> {
  const raw = Object.fromEntries(formData);
  const values = stringifyFormValues(raw);
  const parsed = paymentCorrectionSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Revise los datos del pago.",
      values,
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    return {
      result: await correctPayment({
        ownerId: user.id,
        payment: parsed.data,
      }),
    };
  } catch (error) {
    return {
      error: getPaymentErrorMessage(error),
      values,
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
