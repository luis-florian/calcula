import {
  FinancialError,
  annualInterestRate,
  calculateTerm,
  financialDate,
  generateMonthlyDates,
  generateProjection,
  getDayOfMonth,
  addMoney,
  money,
  zeroMoney,
} from "@/domain/financial";
import type { ProjectionRow } from "@/domain/financial";
import type { SimulationFormInput } from "@/validation/simulation";

export type SimulationResult = {
  mode: "PAYMENT" | "TERM";
  capital: string;
  annualRate: string;
  approximatePayment: string;
  approximateTime: string;
  numberOfPayments: number;
  totalInterest: string;
  totalPaid: string;
  firstPaymentDate: string;
  estimatedEndDate: string;
  projection: SimulationProjectionRow[];
};

export type SimulationProjectionRow = {
  paymentNumber: number;
  expectedDate: string;
  openingBalance: string;
  payment: string;
  interest: string;
  principal: string;
  closingBalance: string;
};

export function simulateFinancing(
  input: SimulationFormInput,
): SimulationResult {
  const capital = money(input.capital);
  const annualRate = annualInterestRate(input.annualRate);
  const startDate = financialDate(input.startDate);
  const firstPaymentDate = financialDate(input.firstPaymentDate);

  if (input.mode === "PAYMENT") {
    const paymentAmount = money(input.paymentAmount);
    const term = calculateTerm({
      openingBalance: capital,
      annualRate,
      startDate,
      firstPaymentDate,
      paymentAmount,
    });
    const projection = generateProjection({
      mode: "PAYMENT",
      openingBalance: capital,
      annualRate,
      startDate,
      firstPaymentDate,
      paymentAmount,
    });

    return {
      mode: "PAYMENT",
      capital: formatMoney(input.capital),
      annualRate: `${annualRate.value}% anual`,
      approximatePayment: formatMoney(paymentAmount.value),
      approximateTime: formatPaymentCount(term.numberOfPayments),
      numberOfPayments: term.numberOfPayments,
      totalInterest: formatMoney(term.totalInterest.value),
      totalPaid: formatMoney(term.totalPaid.value),
      firstPaymentDate: formatDate(firstPaymentDate),
      estimatedEndDate: formatDate(term.estimatedEndDate),
      projection: projection.map(toProjectionRow),
    };
  }

  const paymentDates = generateMonthlyDates({
    firstDate: firstPaymentDate,
    contractualDay: getDayOfMonth(firstPaymentDate),
    count: input.termYears * 12,
  });
  const targetEndDate = paymentDates.at(-1);

  if (!targetEndDate) {
    throw new FinancialError(
      "INVALID_DATE_RANGE",
      "No se pudo generar el plazo indicado.",
    );
  }

  const projection = generateProjection({
    mode: "TERM",
    openingBalance: capital,
    annualRate,
    startDate,
    firstPaymentDate,
    targetEndDate,
  });
  const totalInterest = projection.reduce(
    (total, row) => addMoney(total, row.interest),
    zeroMoney(),
  );
  const totalPaid = projection.reduce(
    (total, row) => addMoney(total, row.payment),
    zeroMoney(),
  );

  return {
    mode: "TERM",
    capital: formatMoney(input.capital),
    annualRate: `${annualRate.value}% anual`,
    approximatePayment: formatMoney(projection[0]?.payment.value ?? "0"),
    approximateTime: formatPaymentCount(projection.length),
    numberOfPayments: projection.length,
    totalInterest: formatMoney(totalInterest.value),
    totalPaid: formatMoney(totalPaid.value),
    firstPaymentDate: formatDate(firstPaymentDate),
    estimatedEndDate: formatDate(targetEndDate),
    projection: projection.map(toProjectionRow),
  };
}

function toProjectionRow(row: ProjectionRow): SimulationProjectionRow {
  return {
    paymentNumber: row.paymentNumber,
    expectedDate: formatDate(row.expectedDate),
    openingBalance: formatMoney(row.openingBalance.value),
    payment: formatMoney(row.payment.value),
    interest: formatMoney(row.interest.value),
    principal: formatMoney(row.principal.value),
    closingBalance: formatMoney(row.closingBalance.value),
  };
}

function formatMoney(value: string): string {
  const [whole = "0", cents = "00"] = value.split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `Q${formattedWhole}.${cents.padEnd(2, "0").slice(0, 2)}`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatPaymentCount(numberOfPayments: number): string {
  const years = Math.floor(numberOfPayments / 12);
  const months = numberOfPayments % 12;

  if (years === 0) {
    return `${months} ${months === 1 ? "mes" : "meses"}`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? "año" : "años"}`;
  }

  return `${years} ${years === 1 ? "año" : "años"} y ${months} ${
    months === 1 ? "mes" : "meses"
  }`;
}
