import { FinancialError } from "@/domain/financial/errors";

declare const financialDateBrand: unique symbol;

export type FinancialDate = string & {
  readonly [financialDateBrand]: true;
};

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const millisecondsPerDay = 86_400_000;

export function financialDate(value: string): FinancialDate {
  const match = datePattern.exec(value);

  if (!match) {
    throw new FinancialError(
      "INVALID_FINANCIAL_DATE",
      "Financial date must use YYYY-MM-DD format.",
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new FinancialError(
      "INVALID_FINANCIAL_DATE",
      "Financial date must be a valid calendar date.",
    );
  }

  return value as FinancialDate;
}

export function daysBetweenDates(
  startDate: FinancialDate,
  endDate: FinancialDate,
): number {
  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate);
  const diff =
    Date.UTC(end.year, end.month - 1, end.day) -
    Date.UTC(start.year, start.month - 1, start.day);
  const days = diff / millisecondsPerDay;

  if (!Number.isInteger(days) || days < 0) {
    throw new FinancialError(
      "INVALID_DATE_RANGE",
      "End date must be the same as or after start date.",
    );
  }

  return days;
}

export function getDayOfMonth(date: FinancialDate): number {
  return parseDateParts(date).day;
}

export function nextMonthlyDate(
  currentDate: FinancialDate,
  contractualDay: number,
): FinancialDate {
  return addMonths(currentDate, contractualDay, 1);
}

export function generateMonthlyDates(input: {
  firstDate: FinancialDate;
  contractualDay?: number;
  count?: number;
  untilDate?: FinancialDate;
}): FinancialDate[] {
  if (input.count === undefined && input.untilDate === undefined) {
    throw new FinancialError(
      "INVALID_DATE_RANGE",
      "Monthly date generation needs a count or an end date.",
    );
  }

  const contractualDay = input.contractualDay ?? getDayOfMonth(input.firstDate);
  const dates: FinancialDate[] = [];
  let cursor = input.firstDate;

  while (input.count === undefined || dates.length < input.count) {
    if (input.untilDate && compareFinancialDates(cursor, input.untilDate) > 0) {
      break;
    }

    dates.push(cursor);

    if (input.untilDate && cursor === input.untilDate) {
      break;
    }

    cursor = nextMonthlyDate(cursor, contractualDay);
  }

  return dates;
}

export function compareFinancialDates(
  left: FinancialDate,
  right: FinancialDate,
): number {
  return left.localeCompare(right);
}

function addMonths(
  currentDate: FinancialDate,
  contractualDay: number,
  monthsToAdd: number,
): FinancialDate {
  if (!Number.isInteger(contractualDay) || contractualDay < 1) {
    throw new FinancialError(
      "INVALID_FINANCIAL_DATE",
      "Contractual day must be a positive integer.",
    );
  }

  const current = parseDateParts(currentDate);
  const targetMonthIndex = current.month - 1 + monthsToAdd;
  const targetYear = current.year + Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const targetDay = Math.min(
    contractualDay,
    daysInMonth(targetYear, targetMonth),
  );

  return financialDate(
    `${targetYear.toString().padStart(4, "0")}-${targetMonth
      .toString()
      .padStart(2, "0")}-${targetDay.toString().padStart(2, "0")}`,
  );
}

function parseDateParts(date: FinancialDate): {
  year: number;
  month: number;
  day: number;
} {
  const match = datePattern.exec(date);

  if (!match) {
    throw new FinancialError(
      "INVALID_FINANCIAL_DATE",
      "Financial date must use YYYY-MM-DD format.",
    );
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
