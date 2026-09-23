import { z } from "zod";

const moneyInput = z
  .string()
  .trim()
  .min(1, "Ingrese la cantidad recibida.")
  .transform((value) => value.replaceAll(",", ""))
  .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/, "Ingrese una cantidad válida."));

const dateInput = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingrese una fecha válida.");

export const paymentPreviewSchema = z.object({
  amount: moneyInput,
  financingId: z.string().trim().min(1, "No se encontró la venta."),
  paymentDate: dateInput,
});

export const paymentConfirmationSchema = paymentPreviewSchema.extend({
  idempotencyKey: z
    .string()
    .trim()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "No se pudo confirmar el pago. Vuelva a revisar el pago.",
    ),
});

export const paymentCorrectionSchema = paymentPreviewSchema.extend({
  paymentId: z.string().trim().min(1, "No se encontró el pago."),
});

export type PaymentPreviewInput = z.infer<typeof paymentPreviewSchema>;
export type PaymentConfirmationInput = z.infer<
  typeof paymentConfirmationSchema
>;
export type PaymentCorrectionInput = z.infer<typeof paymentCorrectionSchema>;
