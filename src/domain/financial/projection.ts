import { toFinancialDecimal } from "@/domain/financial/decimal";
import {
  compareFinancialDates,
  generateMonthlyDates,
  getDayOfMonth,
  nextMonthlyDate,
  type FinancialDate,
} from "@/domain/financial/dates";
import { FinancialError } from "@/domain/financial/errors";
import {
  applyPayment,
  calculatePayoffAmount,
  capPaymentToPayoff,
} from "@/domain/financial/payments";
import {
  addMoney,
  isZeroMoney,
  money,
  positiveMoney,
  toMoneyDecimal,
  zeroMoney,
  type Balance,
  type Money,
} from "@/domain/financial/money";
import type { AnnualInterestRate } from "@/domain/financial/rates";

export type ProjectionRow = {
  readonly paymentNumber: number;
  readonly expectedDate: FinancialDate;
  readonly openingBalance: Balance;
  readonly payment: Money;
  readonly interest: Money;
  readonly principal: Money;
  readonly closingBalance: Balance;
};

export type TermCalculationResult = {
  readonly numberOfPayments: number;
  readonly estimatedEndDate: FinancialDate;
  readonly lastPayment: Money;
  readonly totalInterest: Money;
  readonly totalPaid: Money;
};

export function calculateTerm(input: {
  openingBalance: Balance;
  annualRate: AnnualInterestRate;
  startDate: FinancialDate;
  firstPaymentDate: FinancialDate;
  paymentAmount: Money;
  maxPayments?: number;
}): TermCalculationResult {
  const projection = generateProjection({
    mode: "PAYMENT",
    openingBalance: input.openingBalance,
    annualRate: input.annualRate,
    startDate: input.startDate,
    firstPaymentDate: input.firstPaymentDate,
    paymentAmount: input.paymentAmount,
    maxPayments: input.maxPayments,
  });

  const lastRow = projection.at(-1);

  if (!lastRow) {
    throw new FinancialError("PAYMENT_TOO_LOW", "No payments were generated.");
  }

  return {
    numberOfPayments: projection.length,
    estimatedEndDate: lastRow.expectedDate,
    lastPayment: lastRow.payment,
    totalInterest: projection.reduce(
      (total, row) => addMoney(total, row.interest),
      zeroMoney(),
    ),
    totalPaid: projection.reduce(
      (total, row) => addMoney(total, row.payment),
      zeroMoney(),
    ),
  };
}

export function calculatePaymentForTerm(input: {
  openingBalance: Balance;
  annualRate: AnnualInterestRate;
  startDate: FinancialDate;
  firstPaymentDate: FinancialDate;
  targetEndDate: FinancialDate;
}): Money {
  const paymentDates = generateMonthlyDates({
    firstDate: input.firstPaymentDate,
    contractualDay: getDayOfMonth(input.firstPaymentDate),
    untilDate: input.targetEndDate,
  });

  if (paymentDates.length === 0) {
    throw new FinancialError(
      "INVALID_DATE_RANGE",
      "Target end date must be on or after first payment date.",
    );
  }

  let low = toFinancialDecimal(0);
  let high = toMoneyDecimal(input.openingBalance);

  while (
    simulateFixedPaymentClosingBalance({
      ...input,
      paymentDates,
      paymentAmount: money(high),
    }).greaterThan(0)
  ) {
    high = high.times(2);
  }

  for (let index = 0; index < 80; index += 1) {
    const midpoint = low.plus(high).dividedBy(2);
    const closingBalance = simulateFixedPaymentClosingBalance({
      ...input,
      paymentDates,
      paymentAmount: money(midpoint),
    });

    if (closingBalance.greaterThan(0)) {
      low = midpoint;
    } else {
      high = midpoint;
    }
  }

  return money(high);
}

export function generateProjection(
  input:
    | {
        mode: "PAYMENT";
        openingBalance: Balance;
        annualRate: AnnualInterestRate;
        startDate: FinancialDate;
        firstPaymentDate: FinancialDate;
        paymentAmount: Money;
        maxPayments?: number;
      }
    | {
        mode: "TERM";
        openingBalance: Balance;
        annualRate: AnnualInterestRate;
        startDate: FinancialDate;
        firstPaymentDate: FinancialDate;
        targetEndDate: FinancialDate;
      },
): ProjectionRow[] {
  if (input.mode === "TERM") {
    const paymentAmount = calculatePaymentForTerm(input);

    return generateProjection({
      mode: "PAYMENT",
      openingBalance: input.openingBalance,
      annualRate: input.annualRate,
      startDate: input.startDate,
      firstPaymentDate: input.firstPaymentDate,
      paymentAmount,
      maxPayments: generateMonthlyDates({
        firstDate: input.firstPaymentDate,
        contractualDay: getDayOfMonth(input.firstPaymentDate),
        untilDate: input.targetEndDate,
      }).length,
    });
  }

  positiveMoney(input.paymentAmount.value);

  const maxPayments = input.maxPayments ?? 600;
  const contractualDay = getDayOfMonth(input.firstPaymentDate);
  const rows: ProjectionRow[] = [];
  let openingBalance = input.openingBalance;
  let previousDate = input.startDate;
  let expectedDate = input.firstPaymentDate;

  for (
    let paymentNumber = 1;
    paymentNumber <= maxPayments;
    paymentNumber += 1
  ) {
    const payment = capPaymentToPayoff({
      openingBalance,
      annualRate: input.annualRate,
      previousDate,
      paymentDate: expectedDate,
      paymentAmount: input.paymentAmount,
    });
    const applied = applyPayment({
      openingBalance,
      annualRate: input.annualRate,
      previousDate,
      paymentDate: expectedDate,
      paymentAmount: payment,
    });
    const closingBalance = isZeroMoney(applied.closingBalance)
      ? zeroMoney()
      : applied.closingBalance;

    rows.push({
      paymentNumber,
      expectedDate,
      openingBalance,
      payment,
      interest: applied.interest,
      principal: applied.principal,
      closingBalance,
    });

    if (isZeroMoney(closingBalance)) {
      return rows;
    }

    openingBalance = closingBalance;
    previousDate = expectedDate;
    expectedDate = nextMonthlyDate(expectedDate, contractualDay);
  }

  throw new FinancialError(
    "PAYMENT_TOO_LOW",
    "Payment did not pay off the balance within the configured limit.",
  );
}

function simulateFixedPaymentClosingBalance(input: {
  openingBalance: Balance;
  annualRate: AnnualInterestRate;
  startDate: FinancialDate;
  paymentDates: FinancialDate[];
  paymentAmount: Money;
}): ReturnType<typeof toFinancialDecimal> {
  let balance = input.openingBalance;
  let previousDate = input.startDate;

  for (const paymentDate of input.paymentDates) {
    if (compareFinancialDates(paymentDate, previousDate) < 0) {
      throw new FinancialError(
        "INVALID_DATE_RANGE",
        "Payment dates must not go backwards.",
      );
    }

    const payoff = calculatePayoffAmount({
      openingBalance: balance,
      annualRate: input.annualRate,
      previousDate,
      paymentDate,
    });
    const payment = money(input.paymentAmount.value);
    const applied = applyPayment({
      openingBalance: balance,
      annualRate: input.annualRate,
      previousDate,
      paymentDate,
      paymentAmount: payment,
    });

    balance = toMoneyDecimal(payment).greaterThanOrEqualTo(
      toMoneyDecimal(payoff),
    )
      ? zeroMoney()
      : applied.closingBalance;
    previousDate = paymentDate;
  }

  return toMoneyDecimal(balance);
}
