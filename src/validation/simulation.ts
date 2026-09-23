import { z } from "zod";

const moneyInput = z
  .string()
  .trim()
  .min(1, "Ingrese una cantidad.")
  .transform((value) => value.replaceAll(",", ""))
  .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/, "Ingrese una cantidad válida."));

const rateInput = z
  .string()
  .trim()
  .min(1, "Ingrese el interés anual.")
  .transform((value) => value.replaceAll(",", ""))
  .pipe(z.string().regex(/^\d+(\.\d{1,4})?$/, "Ingrese un porcentaje válido."));

const dateInput = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingrese una fecha válida.");

export const simulationFormSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("PAYMENT"),
    capital: moneyInput,
    annualRate: rateInput,
    paymentAmount: moneyInput,
    startDate: dateInput,
    firstPaymentDate: dateInput,
  }),
  z.object({
    mode: z.literal("TERM"),
    capital: moneyInput,
    annualRate: rateInput,
    termYears: z.coerce
      .number({ error: "Ingrese el plazo en años." })
      .int("Use años completos.")
      .positive("El plazo debe ser mayor que cero.")
      .max(60, "Use un plazo de 60 años o menos."),
    startDate: dateInput,
    firstPaymentDate: dateInput,
  }),
]);

export type SimulationFormInput = z.infer<typeof simulationFormSchema>;
