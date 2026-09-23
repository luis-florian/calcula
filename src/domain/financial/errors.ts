export type FinancialErrorCode =
  | "INVALID_ANNUAL_INTEREST_RATE"
  | "INVALID_DATE_RANGE"
  | "INVALID_FINANCIAL_DATE"
  | "INVALID_MONEY_AMOUNT"
  | "PAYMENT_BELOW_ACCRUED_INTEREST"
  | "PAYMENT_TOO_LOW";

export class FinancialError extends Error {
  constructor(
    readonly code: FinancialErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "FinancialError";
  }
}
