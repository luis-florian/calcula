import type Decimal from "decimal.js";

import { toFinancialDecimal } from "@/domain/financial/decimal";
import { FinancialError } from "@/domain/financial/errors";

export type Money = {
  readonly __type?: "Money";
  readonly value: string;
};

export type Balance = Money;

export function money(value: Decimal.Value): Money {
  const decimal = toFinancialDecimal(value);

  if (!decimal.isFinite()) {
    throw new FinancialError(
      "INVALID_MONEY_AMOUNT",
      "Money amount must be finite.",
    );
  }

  return {
    value: decimal.toDecimalPlaces(2).toFixed(2),
  };
}

export function positiveMoney(value: Decimal.Value): Money {
  const parsed = money(value);

  if (toMoneyDecimal(parsed).lessThanOrEqualTo(0)) {
    throw new FinancialError(
      "INVALID_MONEY_AMOUNT",
      "Money amount must be greater than zero.",
    );
  }

  return parsed;
}

export function zeroMoney(): Money {
  return money("0");
}

export function toMoneyDecimal(value: Money): Decimal {
  return toFinancialDecimal(value.value);
}

export function addMoney(left: Money, right: Money): Money {
  return money(toMoneyDecimal(left).plus(toMoneyDecimal(right)));
}

export function subtractMoney(left: Money, right: Money): Money {
  return money(toMoneyDecimal(left).minus(toMoneyDecimal(right)));
}

export function minMoney(left: Money, right: Money): Money {
  return toMoneyDecimal(left).lessThanOrEqualTo(toMoneyDecimal(right))
    ? left
    : right;
}

export function isZeroMoney(value: Money): boolean {
  return toMoneyDecimal(value).equals(0);
}
