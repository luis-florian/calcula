import { toFinancialDecimal } from "@/domain/financial/decimal";
import { daysBetweenDates, type FinancialDate } from "@/domain/financial/dates";
import { money, type Money } from "@/domain/financial/money";
import {
  toAnnualRateFactor,
  type AnnualInterestRate,
} from "@/domain/financial/rates";

export function calculateInterest(input: {
  balance: Money;
  annualRate: AnnualInterestRate;
  startDate: FinancialDate;
  endDate: FinancialDate;
}): Money {
  const days = daysBetweenDates(input.startDate, input.endDate);

  return money(
    toFinancialDecimal(input.balance.value)
      .times(toAnnualRateFactor(input.annualRate))
      .times(days)
      .dividedBy(365),
  );
}
