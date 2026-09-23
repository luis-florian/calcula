import {
  annualInterestRate,
  calculateTerm,
  financialDate,
  generateMonthlyDates,
  generateProjection,
  getDayOfMonth,
  money,
} from "@/domain/financial";
import type { CreateFinancingInput } from "@/db/queries/financings";
import type { SimulationFormInput } from "@/validation/simulation";

export function createFinancingInputFromSimulation(input: {
  buyerName?: string;
  name: string;
  ownerId: string;
  simulation: SimulationFormInput;
}): CreateFinancingInput {
  const capital = money(input.simulation.capital);
  const annualRate = annualInterestRate(input.simulation.annualRate);
  const startDate = financialDate(input.simulation.startDate);
  const firstPaymentDate = financialDate(input.simulation.firstPaymentDate);
  const expectedPaymentDay = getDayOfMonth(firstPaymentDate);

  if (input.simulation.mode === "PAYMENT") {
    const paymentAmount = money(input.simulation.paymentAmount);
    const term = calculateTerm({
      openingBalance: capital,
      annualRate,
      startDate,
      firstPaymentDate,
      paymentAmount,
    });

    return {
      annualInterestRate: annualRate.value,
      buyerName: input.buyerName || null,
      calculationMode: "PAYMENT",
      currentBalance: capital.value,
      expectedPaymentDay,
      firstPaymentDate,
      initialCapital: capital.value,
      name: input.name,
      ownerId: input.ownerId,
      startDate,
      status: "ACTIVE",
      targetEndDate: term.estimatedEndDate,
      targetPayment: paymentAmount.value,
    };
  }

  const paymentDates = generateMonthlyDates({
    firstDate: firstPaymentDate,
    contractualDay: expectedPaymentDay,
    count: input.simulation.termYears * 12,
  });
  const targetEndDate = paymentDates.at(-1);

  if (!targetEndDate) {
    throw new Error("Could not generate financing term.");
  }

  const projection = generateProjection({
    mode: "TERM",
    openingBalance: capital,
    annualRate,
    startDate,
    firstPaymentDate,
    targetEndDate,
  });

  return {
    annualInterestRate: annualRate.value,
    buyerName: input.buyerName || null,
    calculationMode: "TERM",
    currentBalance: capital.value,
    expectedPaymentDay,
    firstPaymentDate,
    initialCapital: capital.value,
    name: input.name,
    ownerId: input.ownerId,
    startDate,
    status: "ACTIVE",
    targetEndDate,
    targetPayment: projection[0]?.payment.value ?? "0.00",
  };
}
