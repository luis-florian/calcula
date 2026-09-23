import { FinancialError } from "@/domain/financial/errors";
import { calculateInterest } from "@/domain/financial/interest";
import {
  addMoney,
  minMoney,
  money,
  positiveMoney,
  subtractMoney,
  toMoneyDecimal,
  type Balance,
  type Money,
} from "@/domain/financial/money";
import type { AnnualInterestRate } from "@/domain/financial/rates";
import { daysBetweenDates, type FinancialDate } from "@/domain/financial/dates";

export type Payment = {
  readonly paymentDate: FinancialDate;
  readonly amount: Money;
};

export type AppliedPayment = {
  readonly daysElapsed: number;
  readonly interest: Money;
  readonly principal: Money;
  readonly closingBalance: Balance;
};

export function applyPayment(input: {
  openingBalance: Balance;
  annualRate: AnnualInterestRate;
  previousDate: FinancialDate;
  paymentDate: FinancialDate;
  paymentAmount: Money;
}): AppliedPayment {
  positiveMoney(input.paymentAmount.value);

  const daysElapsed = daysBetweenDates(input.previousDate, input.paymentDate);
  const interest = calculateInterest({
    balance: input.openingBalance,
    annualRate: input.annualRate,
    startDate: input.previousDate,
    endDate: input.paymentDate,
  });

  if (toMoneyDecimal(input.paymentAmount).lessThan(toMoneyDecimal(interest))) {
    throw new FinancialError(
      "PAYMENT_BELOW_ACCRUED_INTEREST",
      "Payments below accrued interest are still pending a business rule.",
    );
  }

  const principal = subtractMoney(input.paymentAmount, interest);
  const closingBalance = subtractMoney(input.openingBalance, principal);

  return {
    daysElapsed,
    interest,
    principal,
    closingBalance,
  };
}

export function calculatePayoffAmount(input: {
  openingBalance: Balance;
  annualRate: AnnualInterestRate;
  previousDate: FinancialDate;
  paymentDate: FinancialDate;
}): Money {
  const interest = calculateInterest({
    balance: input.openingBalance,
    annualRate: input.annualRate,
    startDate: input.previousDate,
    endDate: input.paymentDate,
  });

  return addMoney(input.openingBalance, interest);
}

export function capPaymentToPayoff(input: {
  openingBalance: Balance;
  annualRate: AnnualInterestRate;
  previousDate: FinancialDate;
  paymentDate: FinancialDate;
  paymentAmount: Money;
}): Money {
  return minMoney(
    input.paymentAmount,
    calculatePayoffAmount({
      openingBalance: input.openingBalance,
      annualRate: input.annualRate,
      previousDate: input.previousDate,
      paymentDate: input.paymentDate,
    }),
  );
}

export function moneyFromDecimal(value: string): Money {
  return money(value);
}
