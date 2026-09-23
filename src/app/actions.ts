"use server";

import { FinancialError } from "@/domain/financial";
import { createFinancingInputFromSimulation } from "@/application/create-financing-from-simulation";
import {
  simulateFinancing,
  type SimulationResult,
} from "@/application/simulate-financing";
import { simulationFormSchema } from "@/validation/simulation";
import { z } from "zod";

export type SimulationActionState = {
  result?: SimulationResult;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export type SaveSaleActionState = {
  error?: string;
  financingId?: string;
  success?: string;
};

const saleIdentitySchema = z.object({
  buyerName: z.string().trim().optional(),
  saleName: z.string().trim().min(1, "Ingrese el nombre de la venta."),
});

export async function calculateSimulation(
  _previousState: SimulationActionState,
  formData: FormData,
): Promise<SimulationActionState> {
  const raw = Object.fromEntries(formData);
  const values = stringifyFormValues(raw);
  const parsed = simulationFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Revise los datos marcados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    return {
      result: simulateFinancing(parsed.data),
      values,
    };
  } catch (error) {
    if (error instanceof FinancialError) {
      return {
        error: getFinancialErrorMessage(error),
        values,
      };
    }

    return {
      error:
        "No se pudo calcular la venta. Revise los datos e intente nuevamente.",
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

function getFinancialErrorMessage(error: FinancialError): string {
  if (
    error.code === "PAYMENT_TOO_LOW" ||
    error.code === "PAYMENT_BELOW_ACCRUED_INTEREST"
  ) {
    return "Con ese pago la deuda no bajaría. Pruebe con una cantidad mayor.";
  }

  if (error.code === "INVALID_DATE_RANGE") {
    return "Revise las fechas. La primera fecha de pago debe ser posterior a la fecha inicial.";
  }

  return "Revise los datos de la simulación.";
}

export async function saveSimulationAsSale(
  _previousState: SaveSaleActionState,
  formData: FormData,
): Promise<SaveSaleActionState> {
  const raw = Object.fromEntries(formData);
  const simulation = simulationFormSchema.safeParse(raw);
  const saleIdentity = saleIdentitySchema.safeParse(raw);

  if (!simulation.success || !saleIdentity.success) {
    return {
      error: "Revise el nombre de la venta antes de guardar.",
    };
  }

  try {
    const { createFinancing } = await import("@/db/queries/financings");
    const financing = await createFinancing(
      createFinancingInputFromSimulation({
        buyerName: saleIdentity.data.buyerName,
        name: saleIdentity.data.saleName,
        ownerId: "dev_user",
        simulation: simulation.data,
      }),
    );

    return {
      financingId: financing.id,
      success: "Venta guardada.",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("DATABASE_URL is required")
    ) {
      return {
        error:
          "Configure DATABASE_URL con la base de datos de desarrollo antes de guardar ventas.",
      };
    }

    return {
      error: "No se pudo guardar la venta. Intente nuevamente.",
    };
  }
}
