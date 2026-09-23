import type Decimal from "decimal.js";

import { toFinancialDecimal } from "@/domain/financial/decimal";
import { FinancialError } from "@/domain/financial/errors";

export type AnnualInterestRate = {
  readonly __type?: "AnnualInterestRate";
  readonly value: string;
};

export function annualInterestRate(value: Decimal.Value): AnnualInterestRate {
  const decimal = toFinancialDecimal(value);

  if (!decimal.isFinite() || decimal.lessThan(0)) {
    throw new FinancialError(
      "INVALID_ANNUAL_INTEREST_RATE",
      "Annual interest rate must be zero or greater.",
    );
  }

  return {
    value: decimal.toDecimalPlaces(4).toFixed(4),
  };
}

export function toAnnualRateDecimal(value: AnnualInterestRate): Decimal {
  return toFinancialDecimal(value.value);
}

export function toAnnualRateFactor(value: AnnualInterestRate): Decimal {
  return toAnnualRateDecimal(value).dividedBy(100);
}
