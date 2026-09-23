import Decimal from "decimal.js";

export const FinancialDecimal = Decimal.clone({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export function toFinancialDecimal(value: Decimal.Value): Decimal {
  return new FinancialDecimal(value);
}
